import type { Node, Edge } from "reactflow";

export type NodeKind =
  | "trigger.cron"
  | "trigger.evmLog"
  | "trigger.http"
  | "cap.http.get"
  | "cap.http.post"
  | "cap.evmRead"
  | "cap.evmWrite"
  | "smartContract"
  | "website";

/** @deprecated use CronScheduleType + full cron fields */
export type CronFrequencyUnit = "minutes" | "hours" | "days";

export type CronScheduleType = "interval" | "daily" | "weekly" | "monthly";
export type CronIntervalUnit = "seconds" | "minutes" | "hours";

export type BaseNodeData = {
  kind: NodeKind;
  name: string;
  description?: string;
  meta?: Record<string, unknown>;
};

export type EdgeKind = "callback" | "ref";

export type SmartContractData = BaseNodeData & {
  kind: "smartContract";
  contractName: string;
  events: string[];
  functions: string[];
  /** Optional ABI JSON string */
  abi?: string;
};

export type WebsiteData = BaseNodeData & {
  kind: "website";
  websiteName: string;
  apiUrls: string[];
};

export type TriggerCronData = BaseNodeData & {
  kind: "trigger.cron";
  scheduleType: CronScheduleType;
  /** For "interval" schedule */
  intervalValue: number;
  intervalUnit: CronIntervalUnit;
  /** Hour of day 0-23 (daily / weekly / monthly) */
  atHour: number;
  /** Minute of hour 0-59 (daily / weekly / monthly) */
  atMinute: number;
  /** Days of week 0=Sun…6=Sat (weekly) */
  daysOfWeek: number[];
  /** Day of month 1-31 (monthly) */
  dayOfMonth: number;
  /** IANA timezone string, e.g. "America/New_York" */
  timezone: string;
  /** Computed CRE-compatible cron expression (read-only, derived from above) */
  cronExpression: string;
};

export type EvmConfidenceLevel = "Finalized" | "Safe" | "Custom";

export type TriggerEvmLogData = BaseNodeData & {
  kind: "trigger.evmLog";
  smartContractName: string;
  eventName: string;
  /** Deployed contract address (0x...). Optional if not deployed yet. */
  contractAddress?: string;
  /** Chain/network to monitor, e.g. "ethereum-testnet-sepolia" */
  chainSelector: string;
  /** Block confirmation level before the trigger fires */
  confidenceLevel: EvmConfidenceLevel;
  /** Number of block confirmations when confidenceLevel is "Custom" */
  confirmationBlocks?: number;
};

export type TriggerHttpData = BaseNodeData & {
  kind: "trigger.http";
  websiteName: string;
  apiUrl: string;
  /**
   * ECDSA public keys authorized to trigger this workflow.
   * Leave empty for simulation. Required for production deployment.
   */
  authorizedKeys: string[];
};

export type CapHttpGetData = BaseNodeData & {
  kind: "cap.http.get";
  websiteName: string;
  apiUrl: string;
};

export type CapHttpPostData = BaseNodeData & {
  kind: "cap.http.post";
  websiteName: string;
  apiUrl: string;
  /** Whether to use CacheSettings to prevent duplicate POST submissions across DON nodes */
  cacheEnabled: boolean;
  /** Max age in milliseconds for cached responses (max 600000 = 10 min). Used when cacheEnabled is true. */
  cacheMaxAgeMs?: number;
};

export type EvmBlockSelection = "LatestFinalized" | "Latest" | "Custom";

export type CapEvmReadData = BaseNodeData & {
  kind: "cap.evmRead";
  smartContractName: string;
  functionName: string;
  /** Deployed contract address (0x...). Optional if not deployed yet. */
  contractAddress?: string;
  /** Chain/network to read from, e.g. "ethereum-testnet-sepolia" */
  chainSelector: string;
  /** Which block to read state from */
  blockSelection: EvmBlockSelection;
  /** Block depth when blockSelection is "Custom" */
  customBlockDepth?: number;
};

export type CapEvmWriteData = BaseNodeData & {
  kind: "cap.evmWrite";
  smartContractName: string;
  functionName: string;
  /** Deployed contract address (0x...). Optional if not deployed yet. */
  contractAddress?: string;
  /** Chain/network to write to, e.g. "ethereum-testnet-sepolia" */
  chainSelector: string;
};

export type AnyNodeData =
  | SmartContractData
  | WebsiteData
  | TriggerCronData
  | TriggerEvmLogData
  | TriggerHttpData
  | CapHttpGetData
  | CapHttpPostData
  | CapEvmReadData
  | CapEvmWriteData;

export type Workflow = {
  name: string;
  description: string;
  created: boolean;
};

export type WorkflowExportV1 = {
  version: 1;
  workflow: Workflow;
  nodes: Array<Node<AnyNodeData>>;
  edges: Array<Edge>;
  selectedId: string | null;
  idCounter: number;
};
