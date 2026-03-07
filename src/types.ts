import type { Node, Edge } from "reactflow";

export type NodeKind =
  | "trigger.cron"
  | "trigger.evmLog"
  | "trigger.http"
  | "cap.http"
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

export type TriggerEvmLogData = BaseNodeData & {
  kind: "trigger.evmLog";
  smartContractName: string;
  eventName: string;
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

export type CapHttpData = BaseNodeData & {
  kind: "cap.http";
  websiteName: string;
  apiUrl: string;
};

export type CapEvmReadWriteData = BaseNodeData & {
  kind: "cap.evmRead" | "cap.evmWrite";
  smartContractName: string;
  functionName: string;
};

export type AnyNodeData =
  | SmartContractData
  | WebsiteData
  | TriggerCronData
  | TriggerEvmLogData
  | TriggerHttpData
  | CapHttpData
  | CapEvmReadWriteData;

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
