import { LogicTemplate } from './types';

export interface DataSourceConfig {
  provider: string;
  feedType: string;
  feedBase: string;
  feedQuote: string;
  endpointUrl: string;
  identifier: string;
  assetName: string;
}

export function generateExecCode(
  template: LogicTemplate,
  config: DataSourceConfig
): string {
  const { feedBase, feedQuote, endpointUrl, provider } = config;

  if (template === 'simple-price') {
    return `use seda_sdk::oracle_program;
use seda_sdk::http::http_fetch;
use seda_sdk::types::Bytes;
use serde_json::Value;

/// Execution Phase — Simple Price Feed
/// Fetches ${feedBase}/${feedQuote} price from ${provider}
fn execution_phase() -> Result<(), Box<dyn std::error::Error>> {
    // Build the request URL
    let url = "${endpointUrl}";

    // Fetch price data from the data source
    let response = http_fetch(url, None)?;
    let body: Value = serde_json::from_slice(&response.bytes)?;

    // Extract the price value
    let price = body["price"]
        .as_f64()
        .ok_or("Could not parse price from response")?;

    // Scale to 6 decimal places for precision
    let scaled_price = (price * 1_000_000.0) as u128;

    // Report the result
    seda_sdk::oracle_program::exit_with_result(
        Bytes::from(scaled_price.to_be_bytes().to_vec())
    );

    Ok(())
}`;
  }

  if (template === 'ema-smoothing') {
    return `use seda_sdk::oracle_program;
use seda_sdk::http::http_fetch;
use seda_sdk::types::Bytes;
use serde_json::Value;

/// Execution Phase — EMA Smoothed Price Feed
/// Fetches ${feedBase}/${feedQuote} with Exponential Moving Average
fn execution_phase() -> Result<(), Box<dyn std::error::Error>> {
    let url = "${endpointUrl}";

    let response = http_fetch(url, None)?;
    let body: Value = serde_json::from_slice(&response.bytes)?;

    let price = body["price"]
        .as_f64()
        .ok_or("Could not parse price from response")?;

    // Apply EMA smoothing
    // The EMA factor (alpha) controls responsiveness
    // alpha = 2 / (window + 1)
    let window: f64 = 14.0; // configurable EMA window
    let alpha = 2.0 / (window + 1.0);

    // In a real implementation, you would store and retrieve
    // the previous EMA value from state. For the initial value,
    // we use the raw price.
    let previous_ema = price; // placeholder for stored state
    let ema = alpha * price + (1.0 - alpha) * previous_ema;

    let scaled_price = (ema * 1_000_000.0) as u128;

    seda_sdk::oracle_program::exit_with_result(
        Bytes::from(scaled_price.to_be_bytes().to_vec())
    );

    Ok(())
}`;
  }

  if (template === 'multi-source') {
    return `use seda_sdk::oracle_program;
use seda_sdk::http::http_fetch;
use seda_sdk::types::Bytes;
use serde_json::Value;

/// Execution Phase — Multi-Source Blended Price Feed
/// Fetches ${feedBase}/${feedQuote} from multiple sources and computes median
fn execution_phase() -> Result<(), Box<dyn std::error::Error>> {
    let sources = vec![
        "${endpointUrl}",
        // Add additional source endpoints here
    ];

    let mut prices: Vec<f64> = Vec::new();

    for url in sources {
        match http_fetch(url, None) {
            Ok(response) => {
                if let Ok(body) = serde_json::from_slice::<Value>(&response.bytes) {
                    if let Some(price) = body["price"].as_f64() {
                        prices.push(price);
                    }
                }
            }
            Err(_) => continue, // skip failed sources
        }
    }

    if prices.is_empty() {
        return Err("No prices fetched from any source".into());
    }

    // Compute median
    prices.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let median = if prices.len() % 2 == 0 {
        (prices[prices.len() / 2 - 1] + prices[prices.len() / 2]) / 2.0
    } else {
        prices[prices.len() / 2]
    };

    let scaled_price = (median * 1_000_000.0) as u128;

    seda_sdk::oracle_program::exit_with_result(
        Bytes::from(scaled_price.to_be_bytes().to_vec())
    );

    Ok(())
}`;
  }

  // custom
  return `use seda_sdk::oracle_program;
use seda_sdk::http::http_fetch;
use seda_sdk::types::Bytes;
use serde_json::Value;

/// Execution Phase — Custom Logic
/// Modify this code to implement your own data fetching and processing
fn execution_phase() -> Result<(), Box<dyn std::error::Error>> {
    let url = "${endpointUrl}";

    let response = http_fetch(url, None)?;
    let body: Value = serde_json::from_slice(&response.bytes)?;

    // TODO: Add your custom logic here
    let result = body.to_string();

    seda_sdk::oracle_program::exit_with_result(
        Bytes::from(result.into_bytes())
    );

    Ok(())
}`;
}

export function generateTallyCode(): string {
  return `use seda_sdk::oracle_program;
use seda_sdk::types::Bytes;

/// Tally Phase — SEDA Fast
/// Forwards the single execution result directly
fn tally_phase() -> Result<(), Box<dyn std::error::Error>> {
    let reveals = seda_sdk::oracle_program::get_reveals()?;

    // SEDA Fast uses a single executor — take the first reveal
    let result = reveals
        .into_iter()
        .next()
        .ok_or("No reveals available")?;

    seda_sdk::oracle_program::exit_with_result(result.body);

    Ok(())
}`;
}

export function generateMainCode(
  template: LogicTemplate,
  config: DataSourceConfig
): string {
  const execCode = generateExecCode(template, config);
  const tallyCode = generateTallyCode();

  return `${execCode}

${tallyCode}

// ---- Entry Point ----

#[oracle_program]
impl PriceFeed {
    fn execute() {
        execution_phase().unwrap();
    }

    fn tally() {
        tally_phase().unwrap();
    }
}`;
}

export function generateCurlExample(programId: string, execInputs: string = ''): string {
  return `curl -L -X POST \\
  'https://fast-api.testnet.seda.xyz/execute?encoding=json&includeDebugInfo=true' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  --data-raw '{
    "execProgramId": "${programId}",
    "execInputs": "${execInputs}"
  }'`;
}

export function generateJsExample(programId: string, execInputs: string = ''): string {
  return `const response = await fetch(
  'https://fast-api.testnet.seda.xyz/execute?encoding=json',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      execProgramId: '${programId}',
      execInputs: '${execInputs}',
    }),
  }
);

const data = await response.json();
console.log('Result:', data);`;
}

export function generatePythonExample(programId: string, execInputs: string = ''): string {
  return `import requests

response = requests.post(
    "https://fast-api.testnet.seda.xyz/execute",
    params={"encoding": "json"},
    headers={
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json",
    },
    json={
        "execProgramId": "${programId}",
        "execInputs": "${execInputs}",
    },
)

data = response.json()
print("Result:", data)`;
}
