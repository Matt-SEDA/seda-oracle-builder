import { McpResponse } from './types';

export async function callMcp(
  tool: string,
  args: Record<string, unknown> = {}
): Promise<McpResponse> {
  try {
    const res = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, args }),
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const data = await res.json();
    return data as McpResponse;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function callFastApi(
  programId: string,
  apiKey: string,
  execInputs: Record<string, unknown> = {},
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<McpResponse> {
  try {
    const res = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'fast_execute_direct',
        args: { programId, apiKey, execInputs, network },
      }),
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const data = await res.json();
    return data as McpResponse;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
