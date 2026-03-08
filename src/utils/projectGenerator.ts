import type { Node, Edge } from "reactflow";
import type {
  AnyNodeData,
  TriggerCronData,
  TriggerHttpData,
  TriggerEvmLogData,
  CapHttpGetData,
  CapHttpPostData,
  CapEvmReadData,
  CapEvmWriteData,
  SmartContractData,
} from "../types";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ProjectFiles = Record<string, string>;

type WorkflowGraph = {
  workflowName: string;
  workflowDescription: string;
  nodes: Node<AnyNodeData>[];
  edges: Edge[];
};

// ─── Graph helpers ──────────────────────────────────────────────────────────

function isTrigger(kind: string) {
  return kind.startsWith("trigger.");
}

function isCapability(kind: string) {
  return kind.startsWith("cap.");
}

function getCallbackChain(startId: string, nodes: Node<AnyNodeData>[], edges: Edge[]) {
  const chain: Node<AnyNodeData>[] = [];
  let current = startId;
  for (let i = 0; i < 20; i++) {
    const edge = edges.find(
      (e) => e.source === current && (e.data as any)?.kind === "callback"
    );
    if (!edge) break;
    const next = nodes.find((n) => n.id === edge.target);
    if (!next || !isCapability(next.data.kind)) break;
    chain.push(next);
    current = edge.target;
  }
  return chain;
}

function getRefNodes(nodeId: string, nodes: Node<AnyNodeData>[], edges: Edge[]) {
  return edges
    .filter((e) => e.source === nodeId && (e.data as any)?.kind === "ref")
    .map((e) => nodes.find((n) => n.id === e.target))
    .filter(Boolean) as Node<AnyNodeData>[];
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "my-workflow";
}

function camelCase(name: string) {
  return name
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

function hasEvmNode(nodes: Node<AnyNodeData>[]) {
  return nodes.some(
    (n) =>
      n.data.kind === "trigger.evmLog" ||
      n.data.kind === "cap.evmRead" ||
      n.data.kind === "cap.evmWrite"
  );
}


function isTestnet(chainSelector: string) {
  return chainSelector.includes("testnet") || chainSelector.includes("sepolia") ||
    chainSelector.includes("fuji") || chainSelector.includes("amoy");
}

// ─── Config builder ─────────────────────────────────────────────────────────

function buildConfig(g: WorkflowGraph): Record<string, unknown> {
  const cfg: Record<string, unknown> = {};
  const triggers = g.nodes.filter((n) => isTrigger(n.data.kind));
  const caps = g.nodes.filter((n) => isCapability(n.data.kind));

  // Cron schedule
  const cron = triggers.find((n) => n.data.kind === "trigger.cron");
  if (cron) {
    cfg.schedule = (cron.data as TriggerCronData).cronExpression || "*/5 * * * *";
  }

  // Chain selector (first EVM node found)
  const evmNode = g.nodes.find(
    (n) =>
      n.data.kind === "trigger.evmLog" ||
      n.data.kind === "cap.evmRead" ||
      n.data.kind === "cap.evmWrite"
  );
  if (evmNode) {
    const d = evmNode.data as TriggerEvmLogData | CapEvmReadData | CapEvmWriteData;
    cfg.chainSelectorName = d.chainSelector || "TODO_CHAIN_SELECTOR_NAME";
  }

  // HTTP caps
  caps.forEach((n, i) => {
    if (n.data.kind === "cap.http.get" || n.data.kind === "cap.http.post") {
      const d = n.data as CapHttpGetData | CapHttpPostData;
      const key = caps.filter((c) => c.data.kind === n.data.kind).length > 1
        ? `apiUrl_${i}`
        : "apiUrl";
      cfg[key] = d.apiUrl || "TODO_API_URL";
    }
  });

  // EVM contract addresses
  g.nodes
    .filter((n) => n.data.kind === "cap.evmRead" || n.data.kind === "cap.evmWrite")
    .forEach((n) => {
      const d = n.data as CapEvmReadData | CapEvmWriteData;
      const key = camelCase((d.smartContractName || "contract") + "Address");
      cfg[key] = d.contractAddress || `TODO_${(d.smartContractName || "CONTRACT").toUpperCase()}_ADDRESS`;
    });

  // Consumer contract address for writes
  const hasWrite = caps.some((n) => n.data.kind === "cap.evmWrite");
  if (hasWrite) {
    cfg.consumerAddress = "TODO_CONSUMER_CONTRACT_ADDRESS";
    cfg.gasLimit = "500000";
  }

  return cfg;
}

// ─── Capability code generator ──────────────────────────────────────────────

function generateCapabilityCode(
  cap: Node<AnyNodeData>,
  g: WorkflowGraph,
  _handlerName: string
): string {
  const refs = getRefNodes(cap.id, g.nodes, g.edges);
  const sc = refs.find((r) => r.data.kind === "smartContract")?.data as SmartContractData | undefined;

  if (cap.data.kind === "cap.http.get") {
    const d = cap.data as CapHttpGetData;
    return `
    // ── HTTP GET: ${d.websiteName} ──────────────────────────────
    runtime.log('Fetching ${d.websiteName}')
    const httpClient = new cre.capabilities.HTTPClient()
    const ${camelCase(d.websiteName || "httpGet")}Response = httpClient
      .sendRequest(
        runtime,
        (sendRequester) => {
          const res = sendRequester.sendRequest({
            method: 'GET',
            url: runtime.config.apiUrl,
          }).result()
          if (res.statusCode !== 200) throw new Error(\`HTTP GET failed: \${res.statusCode}\`)
          // TODO: parse and return response
          return JSON.parse(Buffer.from(res.body).toString('utf-8'))
        },
        // TODO: define consensus aggregation for your response type
        // ConsensusAggregationByFields<YourType>({ field: median })
        (a: any) => a,
      )(runtime.config)
      .result()
    runtime.log(\`${d.websiteName} response: \${JSON.stringify(${camelCase(d.websiteName || "httpGet")}Response)}\`)`;
  }

  if (cap.data.kind === "cap.http.post") {
    const d = cap.data as CapHttpPostData;
    const cacheStr = d.cacheEnabled
      ? `\n      cacheSettings: { readFromCache: true, maxAgeMs: ${d.cacheMaxAgeMs ?? 60000} },`
      : "";
    return `
    // ── HTTP POST: ${d.websiteName} ─────────────────────────────
    runtime.log('Posting to ${d.websiteName}')
    const httpClient = new cre.capabilities.HTTPClient()
    const ${camelCase(d.websiteName || "httpPost")}Response = httpClient
      .sendRequest(
        runtime,
        (sendRequester) => {
          const res = sendRequester.sendRequest({
            method: 'POST',
            url: runtime.config.apiUrl,
            // TODO: fill request body
            body: JSON.stringify({ /* TODO */ }),${cacheStr}
          }).result()
          if (res.statusCode !== 200 && res.statusCode !== 201)
            throw new Error(\`HTTP POST failed: \${res.statusCode}\`)
          return JSON.parse(Buffer.from(res.body).toString('utf-8'))
        },
        (a: any) => a,
      )(runtime.config)
      .result()`;
  }

  if (cap.data.kind === "cap.evmRead") {
    const d = cap.data as CapEvmReadData;
    const contractVar = camelCase(d.smartContractName || "contract");
    const blockNum = d.blockSelection === "LatestFinalized"
      ? "LAST_FINALIZED_BLOCK_NUMBER"
      : d.blockSelection === "Latest"
      ? "LATEST_BLOCK_NUMBER"
      : `${d.customBlockDepth ?? 10}n // custom block depth`;

    if (sc?.abi) {
      return `
    // ── EVM READ: ${d.smartContractName}.${d.functionName} ──────
    const ${contractVar}Client = new cre.capabilities.EVMClient(network.chainSelector.selector)
    const ${contractVar}ReadResult = ${contractVar}Client.callContract(runtime, {
      to: runtime.config.${camelCase((d.smartContractName || "contract") + "Address")} as \`0x\${string}\`,
      data: encodeFunctionData({
        abi: ${contractVar}Abi,
        functionName: '${d.functionName}',
        args: [], // TODO: fill arguments if required
      }),
      blockNumber: ${blockNum},
    }).result()
    const ${contractVar}Decoded = decodeFunctionResult({
      abi: ${contractVar}Abi,
      functionName: '${d.functionName}',
      data: ${contractVar}ReadResult.returnValue,
    })
    runtime.log(\`${d.smartContractName}.${d.functionName} = \${${contractVar}Decoded}\`)`;
    }

    return `
    // ── EVM READ: ${d.smartContractName}.${d.functionName} ──────
    // TODO: If you have the ABI, add it to the Smart Contract block to get typed code.
    //       For now, using manual encoding — replace types/args as needed.
    const ${contractVar}Client = new cre.capabilities.EVMClient(network.chainSelector.selector)
    const ${contractVar}ReadResult = ${contractVar}Client.callContract(runtime, {
      to: runtime.config.${camelCase((d.smartContractName || "contract") + "Address")} as \`0x\${string}\`,
      data: encodeFunctionData({
        abi: parseAbi(['function ${d.functionName}() view returns (uint256)']), // TODO: fix signature
        functionName: '${d.functionName}',
        args: [], // TODO: fill arguments if required
      }),
      blockNumber: ${blockNum},
    }).result()
    // TODO: decode with decodeFunctionResult({ abi, functionName: '${d.functionName}', data: result.returnValue })
    runtime.log('${d.smartContractName}.${d.functionName} called')`;
  }

  if (cap.data.kind === "cap.evmWrite") {
    const d = cap.data as CapEvmWriteData;
    return `
    // ── EVM WRITE: ${d.smartContractName}.${d.functionName} ─────
    const reportPayload = encodeAbiParameters(
      parseAbiParameters('uint256 value'), // TODO: match your contract's onReport param types
      [0n],                                // TODO: fill actual report data
    )
    const report = runtime.report({
      encodedPayload: hexToBase64(reportPayload),
      encoderName: 'evm',
      signingAlgo: 'ecdsa',
      hashingAlgo: 'keccak256',
    }).result()
    const writeResult = network && new cre.capabilities.EVMClient(network.chainSelector.selector)
      .writeReport(runtime, {
        receiver: runtime.config.consumerAddress,
        report,
        gasConfig: { gasLimit: runtime.config.gasLimit },
      })
      .result()
    if (writeResult?.txStatus !== TxStatus.SUCCESS) {
      throw new Error(\`EVM write failed: \${writeResult?.errorMessage}\`)
    }
    runtime.log(\`${d.smartContractName}.${d.functionName} tx: \${bytesToHex(writeResult.txHash || new Uint8Array(32))}\`)`;
  }

  return `    // TODO: implement capability "${cap.data.kind}"`;
}

// ─── Handler generator ───────────────────────────────────────────────────────

function generateHandler(
  trigger: Node<AnyNodeData>,
  g: WorkflowGraph
): { handlerFn: string; handlerName: string; triggerSetup: string; triggerVar: string } {
  const caps = getCallbackChain(trigger.id, g.nodes, g.edges);
  const hn = camelCase("on_" + (trigger.data.name || trigger.data.kind));

  const capCode = caps.map((c) => generateCapabilityCode(c, g, hn)).join("\n");

  if (trigger.data.kind === "trigger.cron") {
    return {
      handlerName: hn,
      triggerVar: "cronTrigger",
      triggerSetup: `  const cronTrigger = new cre.capabilities.CronCapability()`,
      handlerFn: `
export function ${hn}(runtime: Runtime<Config>, payload: CronPayload): string {
  if (!payload.scheduledExecutionTime) throw new Error('Missing scheduledExecutionTime')
  runtime.log('${trigger.data.name || "Cron"} triggered at ' + payload.scheduledExecutionTime)
${capCode}
  // TODO: return a result string
  return 'ok'
}`,
    };
  }

  if (trigger.data.kind === "trigger.http") {
    const d = trigger.data as TriggerHttpData;
    return {
      handlerName: hn,
      triggerVar: "httpTrigger",
      triggerSetup: `  const httpTrigger = new cre.capabilities.HTTPCapability()`,
      handlerFn: `
export function ${hn}(runtime: Runtime<Config>, payload: HTTPPayload): string {
  runtime.log('HTTP trigger received from ${d.websiteName || "caller"}')
  if (!payload.input || payload.input.length === 0) throw new Error('Empty HTTP payload')
  // TODO: parse payload
  const body = JSON.parse(payload.input.toString())
  runtime.log(\`Payload: \${JSON.stringify(body)}\`)
${capCode}
  // TODO: return a result string
  return JSON.stringify(body)
}`,
    };
  }

  if (trigger.data.kind === "trigger.evmLog") {
    const d = trigger.data as TriggerEvmLogData;
    return {
      handlerName: hn,
      triggerVar: "evmLogTrigger",
      triggerSetup: `
  // EVM Log Trigger — ${d.smartContractName} :: ${d.eventName}
  // TODO: If you have generated bindings, replace this with:
  //   const contract = new ${d.smartContractName}(evmClient, runtime.config.${camelCase((d.smartContractName || "contract") + "Address")})
  //   const evmLogTrigger = contract.logTrigger${d.eventName}()
  //
  // Manual trigger (requires base64-encoded address and topic hash):
  const evmLogTrigger = evmClient.logTrigger({
    filter: {
      address: btoa('${d.contractAddress || "TODO_CONTRACT_ADDRESS_BYTES"}'), // TODO: base64-encode the raw address bytes
      eventSignature: '${d.eventName}()', // TODO: full event signature e.g. "Transfer(address,address,uint256)"
    },
    confidenceLevel: 'CONFIDENCE_LEVEL_${(d.confidenceLevel || "FINALIZED").toUpperCase()}',
  })`,
      handlerFn: `
export function ${hn}(runtime: Runtime<Config>, log: any): string {
  runtime.log('EVM Log: ${d.eventName} emitted')
  runtime.log(\`Block: \${log.blockNumber}, TxHash: \${log.txHash}\`)
  // TODO: decode log data using the event ABI
  // const decoded = decodeEventLog({ abi, data: log.data, topics: log.topics })
${capCode}
  // TODO: return a result string
  return JSON.stringify(log)
}`,
    };
  }

  return {
    handlerName: hn,
    triggerVar: "trigger",
    triggerSetup: `  // TODO: unknown trigger type "${trigger.data.kind}"`,
    handlerFn: `export function ${hn}(runtime: Runtime<Config>, payload: any): string {\n  // TODO\n  return 'ok'\n}`,
  };
}

// ─── ABI helper ──────────────────────────────────────────────────────────────

function generateAbiConst(sc: SmartContractData): string {
  if (sc.abi) {
    return `const ${camelCase(sc.contractName)}Abi = ${sc.abi} as const\n`;
  }
  return `// TODO: paste the ABI for ${sc.contractName} here\n// const ${camelCase(sc.contractName)}Abi = [...] as const\n`;
}

// ─── workflow.ts ─────────────────────────────────────────────────────────────

function generateWorkflowTs(g: WorkflowGraph): string {
  const triggers = g.nodes.filter((n) => isTrigger(n.data.kind));
  const handlers = triggers.map((t) => generateHandler(t, g));
  const hasEvm = hasEvmNode(g.nodes);
  const hasWrite = g.nodes.some((n) => n.data.kind === "cap.evmWrite");
  const smartContracts = g.nodes
    .filter((n) => n.data.kind === "smartContract")
    .map((n) => n.data as SmartContractData);

  const cfg = buildConfig(g);

  // Build zod schema fields
  const schemaFields = Object.entries(cfg)
    .map(([k, v]) => {
      if (typeof v === "number") return `  ${k}: z.number(),`;
      return `  ${k}: z.string(),`;
    })
    .join("\n");

  // Build imports
  const sdkImports = [
    "cre",
    "getNetwork",
    "type Runtime",
    hasEvm ? "TxStatus" : null,
    triggers.some((t) => t.data.kind === "trigger.cron") ? "type CronPayload" : null,
    triggers.some((t) => t.data.kind === "trigger.http") ? "type HTTPPayload" : null,
    hasWrite ? "hexToBase64" : null,
    hasWrite ? "bytesToHex" : null,
  ].filter(Boolean).join(",\n  ");

  const viemImports = [
    "type Address",
    hasEvm ? "encodeFunctionData" : null,
    hasEvm ? "parseAbi" : null,
    hasEvm ? "parseAbiParameters" : null,
    hasEvm ? "encodeAbiParameters" : null,
    hasEvm ? "decodeFunctionResult" : null,
  ].filter(Boolean).join(", ");

  // EVM network setup (only if EVM is used)
  const evmChain = (g.nodes.find((n) =>
    ["trigger.evmLog", "cap.evmRead", "cap.evmWrite"].includes(n.data.kind)
  )?.data as TriggerEvmLogData | CapEvmReadData | CapEvmWriteData | undefined)?.chainSelector;

  const evmNetworkSetup = hasEvm
    ? `
  const network = getNetwork({
    chainFamily: 'evm',
    chainSelectorName: config.chainSelectorName,
    isTestnet: ${isTestnet(evmChain || "")},
  })
  if (!network) throw new Error(\`Network not found: \${config.chainSelectorName}\`)
  const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector)`
    : "";

  const abiConsts = smartContracts.map(generateAbiConst).join("\n");

  const handlerFunctions = handlers.map((h) => h.handlerFn).join("\n");

  const triggerSetups = handlers.map((h) => h.triggerSetup).join("\n");

  const handlerRegistrations = handlers
    .map((h) => `    cre.handler(${h.triggerVar}.trigger${h.triggerVar === "cronTrigger" ? `({ schedule: config.schedule })` : h.triggerVar === "httpTrigger" ? `({ authorizedKeys: [] })` : `({})`}, ${h.handlerName}),`)
    .join("\n");

  return `/**
 * CRE Workflow: ${g.workflowName}
 * ${g.workflowDescription}
 *
 * Generated by Scaffold CRE — https://github.com/tigeragentt/scaffold-cre
 *
 * TODOs in this file:
 * - Fill in function arguments for EVM read/write calls
 * - Define request/response types for HTTP capabilities
 * - Add your consensus aggregation strategy
 * - Replace placeholder contract addresses in config.json
 */
import {
  ${sdkImports}
} from '@chainlink/cre-sdk'
import { ${viemImports} } from 'viem'
import { z } from 'zod'

// ─── Config ────────────────────────────────────────────────────────────────
// Values come from config.json — edit that file, not here.

export const configSchema = z.object({
${schemaFields}
})

type Config = z.infer<typeof configSchema>

// ─── ABIs ──────────────────────────────────────────────────────────────────

${abiConsts}
// ─── Handlers ──────────────────────────────────────────────────────────────
${handlerFunctions}

// ─── Init ──────────────────────────────────────────────────────────────────

export function initWorkflow(config: Config) {
${evmNetworkSetup}
${triggerSetups}

  return [
${handlerRegistrations}
  ]
}
`;
}

// ─── main.ts ─────────────────────────────────────────────────────────────────

function generateMainTs(): string {
  return `import { Runner } from '@chainlink/cre-sdk'
import { configSchema, initWorkflow } from './workflow'

export async function main() {
  const runner = await Runner.newRunner({ configSchema })
  await runner.run(initWorkflow)
}

main()
`;
}

// ─── package.json ─────────────────────────────────────────────────────────────

function generatePackageJson(name: string): string {
  return JSON.stringify(
    {
      name,
      version: "1.0.0",
      main: "dist/main.js",
      private: true,
      scripts: {
        postinstall: "bun x cre-setup",
      },
      license: "UNLICENSED",
      dependencies: {
        "@chainlink/cre-sdk": "^1.1.2",
        viem: "2.34.0",
        zod: "3.25.76",
      },
      devDependencies: {
        "@types/bun": "1.2.21",
      },
    },
    null,
    2
  );
}

// ─── tsconfig.json ────────────────────────────────────────────────────────────

function generateTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "bundler",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
    },
    null,
    2
  );
}

// ─── workflow.yaml ────────────────────────────────────────────────────────────

function generateWorkflowYaml(name: string, _description: string): string {
  const s = slug(name);
  return `# CRE Workflow Settings
# Generated by Scaffold CRE

staging-settings:
  user-workflow:
    workflow-name: "${s}-staging"
  workflow-artifacts:
    workflow-path: "./main.ts"
    config-path: "./config.json"
    secrets-path: ""

production-settings:
  user-workflow:
    workflow-name: "${s}-production"
  workflow-artifacts:
    workflow-path: "./main.ts"
    config-path: "./config.json"
    secrets-path: ""
`;
}

// ─── config.json ─────────────────────────────────────────────────────────────

function generateConfigJson(g: WorkflowGraph): string {
  return JSON.stringify(buildConfig(g), null, 2);
}

// ─── secrets.yaml ─────────────────────────────────────────────────────────────

function generateSecretsYaml(): string {
  return `# Secrets template — do NOT commit real secrets
# Reference: https://docs.chain.link/cre/guides/workflow/secrets
#
# secretsNames:
#   MY_API_KEY: "your-api-key-here"
#
# Access in workflow: runtime.getSecret("MY_API_KEY")

secretsNames: {}
`;
}

// ─── README.md ────────────────────────────────────────────────────────────────

function generateGitignore(): string {
  return `node_modules/
dist/
.bun/
*.local
secrets.yaml
.env
.env.*
`;
}

function generateReadme(name: string, description: string, todos: string[]): string {
  const todoList = todos.map((t) => `- [ ] ${t}`).join("\n");
  return `# ${name}

${description}

Generated by [Scaffold CRE](https://github.com/tigeragentt/scaffold-cre).

## Prerequisites

- [Bun](https://bun.sh) >= 1.2.21
- [Chainlink CRE CLI](https://docs.chain.link/cre/reference/cli)

## Getting started

\`\`\`bash
bun install
\`\`\`

## ✅ TODOs before this workflow will run

Search for \`TODO\` in the source files to find every placeholder.

${todoList}

## Simulating locally

\`\`\`bash
cre workflow simulate . --target staging-settings
\`\`\`

## Deploying

\`\`\`bash
cre workflow deploy . --target production-settings
\`\`\`

## Push to GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial scaffold"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
\`\`\`

## References

- [CRE SDK docs](https://docs.chain.link/cre)
- [Chainlink Agent Skills](https://github.com/smartcontractkit/chainlink-agent-skills)
- [CRE Templates](https://github.com/smartcontractkit/cre-templates)
`;
}

// ─── TODO collector ───────────────────────────────────────────────────────────

function collectTodos(g: WorkflowGraph): string[] {
  const todos: string[] = [];
  const cfg = buildConfig(g);

  Object.entries(cfg).forEach(([k, v]) => {
    if (String(v).startsWith("TODO_")) {
      todos.push(`Set \`${k}\` in \`config.json\` (currently "${v}")`);
    }
  });

  if (g.nodes.some((n) => n.data.kind === "cap.evmRead" || n.data.kind === "cap.evmWrite")) {
    todos.push("Fill in EVM function argument types and values in `workflow.ts`");
    todos.push("Add ABI JSON to the Smart Contract block in Scaffold CRE to get typed code");
  }

  if (g.nodes.some((n) => n.data.kind === "cap.http.get" || n.data.kind === "cap.http.post")) {
    todos.push("Define HTTP response types and consensus aggregation in `workflow.ts`");
  }

  if (g.nodes.some((n) => n.data.kind === "cap.http.post")) {
    todos.push("Fill in HTTP POST request body in `workflow.ts`");
  }

  if (g.nodes.some((n) => n.data.kind === "cap.evmWrite")) {
    todos.push("Update `encodeAbiParameters` to match your consumer contract's `onReport` param types");
  }

  if (g.nodes.some((n) => n.data.kind === "trigger.evmLog")) {
    todos.push("Encode the contract address as base64 bytes in the EVM Log Trigger config");
    todos.push("Replace the event signature placeholder with the full ABI-encoded signature");
  }

  if (g.nodes.some((n) => n.data.kind === "trigger.http")) {
    const d = g.nodes.find((n) => n.data.kind === "trigger.http")?.data as TriggerHttpData;
    if (!d?.authorizedKeys?.length) {
      todos.push("Add authorized public keys to the HTTP Trigger for production deployment");
    }
  }

  todos.push("Run `bun install` to install dependencies");
  todos.push("Run `cre workflow simulate . --target staging-settings` to test locally");

  return todos;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateProject(
  workflowName: string,
  workflowDescription: string,
  nodes: Node<AnyNodeData>[],
  edges: Edge[]
): ProjectFiles {
  const g: WorkflowGraph = { workflowName, workflowDescription, nodes, edges };
  const name = slug(workflowName);
  const todos = collectTodos(g);

  return {
    "package.json": generatePackageJson(name),
    "tsconfig.json": generateTsConfig(),
    "workflow.yaml": generateWorkflowYaml(workflowName, workflowDescription),
    "config.json": generateConfigJson(g),
    "secrets.yaml": generateSecretsYaml(),
    "src/workflow.ts": generateWorkflowTs(g),
    "src/main.ts": generateMainTs(),
    ".gitignore": generateGitignore(),
    "README.md": generateReadme(workflowName, workflowDescription, todos),
  };
}
