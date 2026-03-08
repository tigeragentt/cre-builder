import type { Node, Edge } from "reactflow";
import type { AnyNodeData, NodeKind, WorkflowExportV1 } from "../types";

export function safeJsonParse<T>(raw: string): { ok: true; value: T } | { ok: false; error: string } {
  try {
    const v = JSON.parse(raw);
    return { ok: true, value: v as T };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Invalid JSON" };
  }
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function isKnownNodeKind(k: any): k is NodeKind {
  return (
    k === "trigger.cron" ||
    k === "trigger.evmLog" ||
    k === "trigger.http" ||
    k === "cap.http.get" ||
    k === "cap.http.post" ||
    k === "cap.evmRead" ||
    k === "cap.evmWrite" ||
    k === "cap.localExecution" ||
    k === "smartContract" ||
    k === "website"
  );
}

export function validateAndNormalizeImport(
  obj: any
): { ok: true; value: WorkflowExportV1 } | { ok: false; error: string } {
  if (!obj || typeof obj !== "object") return { ok: false, error: "JSON root must be an object." };
  if (obj.version !== 1) return { ok: false, error: "Unsupported workflow JSON version (expected version: 1)." };
  if (!obj.workflow || typeof obj.workflow !== "object") return { ok: false, error: "Missing workflow object." };
  if (!Array.isArray(obj.nodes)) return { ok: false, error: "Missing nodes array." };
  if (!Array.isArray(obj.edges)) return { ok: false, error: "Missing edges array." };

  for (const n of obj.nodes) {
    if (!n || typeof n !== "object") return { ok: false, error: "Invalid node entry." };
    if (typeof n.id !== "string") return { ok: false, error: "Node missing string id." };
    if (!n.position || typeof n.position.x !== "number" || typeof n.position.y !== "number")
      return { ok: false, error: `Node ${n.id} missing numeric position.` };
    if (!n.data || typeof n.data !== "object") return { ok: false, error: `Node ${n.id} missing data.` };
    if (!isKnownNodeKind((n.data as any).kind)) return { ok: false, error: `Node ${n.id} has unknown kind.` };
    if (typeof (n.data as any).name !== "string") return { ok: false, error: `Node ${n.id} missing data.name.` };
  }

  for (const e of obj.edges) {
    if (!e || typeof e !== "object") return { ok: false, error: "Invalid edge entry." };
    if (typeof e.id !== "string") return { ok: false, error: "Edge missing string id." };
    if (typeof e.source !== "string" || typeof e.target !== "string")
      return { ok: false, error: `Edge ${e.id} missing source/target.` };
  }

  const normalized: WorkflowExportV1 = {
    version: 1,
    workflow: {
      name: String(obj.workflow.name ?? ""),
      description: String(obj.workflow.description ?? ""),
      created: Boolean(obj.workflow.created),
    },
    nodes: obj.nodes as Array<Node<AnyNodeData>>,
    edges: obj.edges as Array<Edge>,
    selectedId: obj.selectedId === null || typeof obj.selectedId === "string" ? obj.selectedId : null,
    idCounter: typeof obj.idCounter === "number" && Number.isFinite(obj.idCounter) ? obj.idCounter : 0,
  };

  return { ok: true, value: normalized };
}
