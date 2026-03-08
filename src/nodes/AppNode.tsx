import { Handle, Position } from "reactflow";
import type {
  NodeKind,
  AnyNodeData,
  TriggerCronData,
  TriggerEvmLogData,
  TriggerHttpData,
  CapHttpData,
  CapEvmReadData,
  CapEvmWriteData,
  SmartContractData,
  WebsiteData,
} from "../types";
import { cronSummary } from "../utils/cronUtils";

export function kindLabel(k: NodeKind): string {
  switch (k) {
    case "trigger.cron":    return "Cron Trigger";
    case "trigger.evmLog":  return "EVM Log Trigger";
    case "trigger.http":    return "HTTP Trigger";
    case "cap.http":        return "HTTP";
    case "cap.evmRead":     return "EVM Read";
    case "cap.evmWrite":    return "EVM Write";
    case "smartContract":   return "Smart Contract";
    case "website":         return "Website";
    default:                return k;
  }
}

export function kindClass(k: NodeKind): string {
  switch (k) {
    case "trigger.cron":
    case "trigger.evmLog":
    case "trigger.http":
      return "node node--trigger";
    case "cap.http":
    case "cap.evmRead":
    case "cap.evmWrite":
      return "node node--cap";
    case "smartContract":
    case "website":
      return "node node--ref";
    default:
      return "node";
  }
}

type AppNodeProps = { data: AnyNodeData };

export function AppNode({ data }: AppNodeProps) {
  const title = data.description?.trim() ? data.description : "";

  return (
    <div className={kindClass(data.kind)} title={title}>
      {/* REF TARGET (TOP) for SmartContract/Website */}
      {(data.kind === "smartContract" || data.kind === "website") && (
        <Handle
          id="refTarget"
          className="handle handle--ref"
          type="target"
          position={Position.Top}
        />
      )}

      {/* Callback target (LEFT) for capabilities */}
      {(data.kind === "cap.http" ||
        data.kind === "cap.evmRead" ||
        data.kind === "cap.evmWrite") && (
        <Handle className="handle" type="target" position={Position.Left} />
      )}

      {/* Callback source (RIGHT) for triggers */}
      {(data.kind === "trigger.cron" ||
        data.kind === "trigger.evmLog" ||
        data.kind === "trigger.http") && (
        <Handle className="handle" type="source" position={Position.Right} />
      )}

      {/* Callback source (RIGHT) for capabilities */}
      {(data.kind === "cap.http" ||
        data.kind === "cap.evmRead" ||
        data.kind === "cap.evmWrite") && (
        <Handle className="handle" type="source" position={Position.Right} />
      )}

      {/* REF SOURCE (BOTTOM) for triggers + capabilities */}
      {(data.kind === "trigger.cron" ||
        data.kind === "trigger.evmLog" ||
        data.kind === "trigger.http" ||
        data.kind === "cap.http" ||
        data.kind === "cap.evmRead" ||
        data.kind === "cap.evmWrite") && (
        <Handle
          id="refSource"
          className="handle handle--ref"
          type="source"
          position={Position.Bottom}
        />
      )}

      <div className="node__top">
        <div className="node__title">{data.name || "(Unnamed)"}</div>
        <div className="node__badge">{kindLabel(data.kind)}</div>
      </div>

      <div className="node__body">
        {data.kind === "trigger.cron" && (
          <>
            <div className="node__row">
              <b>{cronSummary(data as TriggerCronData)}</b>
            </div>
            <div className="node__row node__mono muted">
              {(data as TriggerCronData).cronExpression}
            </div>
          </>
        )}

        {data.kind === "trigger.evmLog" && (
          <>
            <div className="node__row">
              <span className="muted">Contract:</span>{" "}
              <b>{(data as TriggerEvmLogData).smartContractName}</b>
            </div>
            <div className="node__row">
              <span className="muted">Event:</span>{" "}
              <b>{(data as TriggerEvmLogData).eventName}</b>
            </div>
            <div className="node__row">
              <span className="muted">Network:</span>{" "}
              <b>{(data as TriggerEvmLogData).chainSelector || <span className="muted">—</span>}</b>
            </div>
            <div className="node__row">
              <span className="muted">Confidence:</span>{" "}
              <b>
                {(data as TriggerEvmLogData).confidenceLevel === "Custom"
                  ? `${(data as TriggerEvmLogData).confirmationBlocks} blocks`
                  : (data as TriggerEvmLogData).confidenceLevel || "Finalized"}
              </b>
            </div>
            {(data as TriggerEvmLogData).contractAddress && (
              <div className="node__row node__mono muted">
                {(data as TriggerEvmLogData).contractAddress!.slice(0, 10)}…
              </div>
            )}
          </>
        )}

        {data.kind === "trigger.http" && (
          <>
            <div className="node__row">
              <span className="muted">Website caller:</span>{" "}
              <b>{(data as TriggerHttpData).websiteName}</b>
            </div>
            <div className="node__row">
              <span className="muted">Auth keys:</span>{" "}
              <b>
                {(data as TriggerHttpData).authorizedKeys?.length
                  ? `${(data as TriggerHttpData).authorizedKeys.length} key(s)`
                  : <span className="muted">none (simulation only)</span>}
              </b>
            </div>
          </>
        )}

        {data.kind === "cap.http" && (
          <>
            <div className="node__row">
              <span className="muted">Website:</span>{" "}
              <b>{(data as CapHttpData).websiteName}</b>
            </div>
            <div className="node__row node__mono">{(data as CapHttpData).apiUrl}</div>
          </>
        )}

        {data.kind === "cap.evmRead" && (
          <>
            <div className="node__row">
              <span className="muted">Contract:</span>{" "}
              <b>{(data as CapEvmReadData).smartContractName}</b>
            </div>
            <div className="node__row">
              <span className="muted">Fn:</span>{" "}
              <b>{(data as CapEvmReadData).functionName}</b>
            </div>
            <div className="node__row">
              <span className="muted">Network:</span>{" "}
              <b>{(data as CapEvmReadData).chainSelector || <span className="muted">—</span>}</b>
            </div>
            <div className="node__row">
              <span className="muted">Block:</span>{" "}
              <b>
                {(data as CapEvmReadData).blockSelection === "Custom"
                  ? `${(data as CapEvmReadData).customBlockDepth} back`
                  : (data as CapEvmReadData).blockSelection || "—"}
              </b>
            </div>
            {(data as CapEvmReadData).contractAddress && (
              <div className="node__row node__mono muted">
                {(data as CapEvmReadData).contractAddress!.slice(0, 10)}…
              </div>
            )}
          </>
        )}

        {data.kind === "cap.evmWrite" && (
          <>
            <div className="node__row">
              <span className="muted">Contract:</span>{" "}
              <b>{(data as CapEvmWriteData).smartContractName}</b>
            </div>
            <div className="node__row">
              <span className="muted">Fn:</span>{" "}
              <b>{(data as CapEvmWriteData).functionName}</b>
            </div>
            <div className="node__row">
              <span className="muted">Network:</span>{" "}
              <b>{(data as CapEvmWriteData).chainSelector || <span className="muted">—</span>}</b>
            </div>
            {(data as CapEvmWriteData).contractAddress && (
              <div className="node__row node__mono muted">
                {(data as CapEvmWriteData).contractAddress!.slice(0, 10)}…
              </div>
            )}
          </>
        )}

        {data.kind === "smartContract" && (
          <>
            <div className="node__row">
              <span className="muted">Name:</span>{" "}
              <b>{(data as SmartContractData).contractName}</b>
            </div>
            <div className="node__row">
              <span className="muted">Events:</span>{" "}
              <b>{(data as SmartContractData).events.length}</b>
            </div>
            <div className="node__row">
              <span className="muted">Functions:</span>{" "}
              <b>{(data as SmartContractData).functions.length}</b>
            </div>
          </>
        )}

        {data.kind === "website" && (
          <>
            <div className="node__row">
              <span className="muted">Name:</span>{" "}
              <b>{(data as WebsiteData).websiteName}</b>
            </div>
            <div className="node__row">
              <span className="muted">APIs:</span>{" "}
              <b>{(data as WebsiteData).apiUrls.length}</b>
            </div>
            {(data as WebsiteData).apiUrls.slice(0, 3).map((u, i) => (
              <div key={i} className="node__row node__mono">
                {u}
              </div>
            ))}
            {(data as WebsiteData).apiUrls.length > 3 && (
              <div className="node__row muted">
                +{(data as WebsiteData).apiUrls.length - 3} more…
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
