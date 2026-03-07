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

export type CronFrequencyUnit = "minutes" | "hours" | "days";

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
  frequencyValue: number;
  frequencyUnit: CronFrequencyUnit;
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
