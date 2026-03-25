import { NextRequest, NextResponse } from 'next/server';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3333/mcp/changeme';

/**
 * Parse SSE response from MCP Streamable HTTP transport.
 * The response may be SSE (text/event-stream) or plain JSON.
 */
async function parseMcpResponse(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/event-stream')) {
    const text = await response.text();
    // Find JSON-RPC result in SSE data lines
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.result?.content) {
            // Extract text from content array
            const textContent = data.result.content.find(
              (c: { type: string; text?: string }) => c.type === 'text'
            );
            if (textContent?.text) return textContent.text;
          }
          if (data.error) {
            throw new Error(data.error.message || 'MCP error');
          }
        } catch {
          // Not valid JSON, skip
        }
      }
    }
    throw new Error('No result found in SSE response');
  }

  // Plain JSON response
  const data = await response.json();
  if (data.result?.content) {
    const textContent = data.result.content.find(
      (c: { type: string; text?: string }) => c.type === 'text'
    );
    if (textContent?.text) return textContent.text;
  }
  if (data.error) {
    throw new Error(data.error.message || 'MCP error');
  }
  return JSON.stringify(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool, args = {} } = body;

    if (!tool) {
      return NextResponse.json(
        { success: false, error: 'Missing tool name' },
        { status: 400 }
      );
    }

    // Special case: direct Fast API call (bypasses MCP)
    if (tool === 'fast_execute_direct') {
      return handleFastExecute(args);
    }

    // Initialize session with MCP server
    // First, we need to send an initialize request, then the tool call
    const initResponse = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'seda-oracle-builder', version: '1.0.0' },
        },
      }),
    });

    if (!initResponse.ok) {
      return NextResponse.json(
        { success: false, error: `MCP server returned ${initResponse.status}` },
        { status: 502 }
      );
    }

    // Extract session ID from response headers
    const sessionId = initResponse.headers.get('mcp-session-id');

    // Send initialized notification
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    };
    if (sessionId) {
      headers['mcp-session-id'] = sessionId;
    }

    await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      }),
    });

    // Now send the actual tool call
    const toolResponse = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: tool,
          arguments: args,
        },
      }),
      signal: AbortSignal.timeout(180000), // 3 minute timeout for builds
    });

    if (!toolResponse.ok) {
      const errText = await toolResponse.text();
      return NextResponse.json(
        { success: false, error: `MCP tool call failed: ${toolResponse.status} ${errText}` },
        { status: 502 }
      );
    }

    const result = await parseMcpResponse(toolResponse);

    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

async function handleFastExecute(args: Record<string, unknown>) {
  const { programId, apiKey, execInputs = {}, network = 'testnet' } = args;

  if (!programId || !apiKey) {
    return NextResponse.json(
      { success: false, error: 'Missing programId or apiKey' },
      { status: 400 }
    );
  }

  const baseUrl = network === 'mainnet'
    ? 'https://fast-api.seda.xyz'
    : 'https://fast-api.testnet.seda.xyz';

  try {
    const response = await fetch(
      `${baseUrl}/execute?encoding=json&includeDebugInfo=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          execProgramId: programId,
          execInputs,
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: data.message || data.error || `HTTP ${response.status}`,
      });
    }

    return NextResponse.json({
      success: true,
      result: JSON.stringify(data, null, 2),
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Fast API call failed',
    });
  }
}
