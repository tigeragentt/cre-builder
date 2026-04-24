import { useEffect, useState } from "react";
import type { KnownContract } from "./ModalsPanel";
import type { KnownWebsite } from "./WebsiteApiPicker";
import { WebsiteApiPicker } from "./WebsiteApiPicker";
import { EVM_CHAIN_OPTIONS } from "./evmChainOptions";
import type { Node, Edge } from "reactflow";
import type {
  AnyNodeData,
  TriggerCronData,
  TriggerEvmLogData,
  TriggerHttpData,
  CapHttpGetData,
  CapHttpPostData,
  CapEvmReadData,
  CapEvmWriteData,
  CapLocalExecutionData,
  SmartContractData,
  WebsiteData,
  EvmConfidenceLevel,
  EvmBlockSelection,
} from "../types";
import { kindLabel } from "../nodes/AppNode";

function deriveKnownContracts(nodes: Node<AnyNodeData>[]): KnownContract[] {
  const scMap = new Map<string, { events: string[]; functions: string[] }>();
  for (const n of nodes) {
    if (n.data.kind === "smartContract") {
      const d = n.data as SmartContractData;
      scMap.set(d.contractName, { events: d.events, functions: d.functions });
    }
  }
  const addrMap = new Map<string, { contractAddress?: string; chainSelector?: string }>();
  for (const n of nodes) {
    const d = n.data as any;
    if (d.smartContractName && !addrMap.has(d.smartContractName)) {
      addrMap.set(d.smartContractName, { contractAddress: d.contractAddress, chainSelector: d.chainSelector });
    }
  }
  const allNames = new Set([...scMap.keys(), ...addrMap.keys()]);
  const result: KnownContract[] = [];
  for (const name of allNames) {
    result.push({
      contractName: name,
      contractAddress: addrMap.get(name)?.contractAddress,
      chainSelector: addrMap.get(name)?.chainSelector,
      events: scMap.get(name)?.events ?? [],
      functions: scMap.get(name)?.functions ?? [],
    });
  }
  return result;
}

function deriveKnownWebsites(nodes: Node<AnyNodeData>[]): KnownWebsite[] {
  const result: KnownWebsite[] = [];
  for (const n of nodes) {
    if (n.data.kind === "website") {
      const d = n.data as WebsiteData;
      result.push({ websiteName: d.websiteName, apiUrls: d.apiUrls });
    }
  }
  return result;
}

type EvmContractPickerProps = {
  smartContractName: string;
  contractAddress?: string;
  chainSelector: string;
  valueKey: "eventName" | "functionName";
  valueLabel: string;
  valueName: string;
  optionSource: "events" | "functions";
  knownContracts: KnownContract[];
  patchSelected: (patch: Record<string, any>) => void;
};

function EvmContractPicker({
  smartContractName,
  contractAddress,
  chainSelector,
  valueKey,
  valueLabel,
  valueName,
  optionSource,
  knownContracts,
  patchSelected,
}: EvmContractPickerProps) {
  const pickedContract = knownContracts.find((c) => c.contractName === smartContractName) ?? null;
  const availableOptions = pickedContract ? pickedContract[optionSource] : [];
  const [addingNew, setAddingNew] = useState(false);
  const [chainPreset, setChainPreset] = useState(() => {
    const isKnown = EVM_CHAIN_OPTIONS.some(
      (o) => o.value === chainSelector && o.value !== "" && o.value !== "other"
    );
    return isKnown ? chainSelector : chainSelector ? "other" : "";
  });

  function pickContract(name: string) {
    if (!name) {
      patchSelected({ smartContractName: "", contractAddress: undefined, chainSelector: "", [valueKey]: "" });
      setChainPreset("");
    } else {
      const c = knownContracts.find((k) => k.contractName === name);
      if (c) {
        const newChain = c.chainSelector || chainSelector;
        patchSelected({
          smartContractName: c.contractName,
          contractAddress: c.contractAddress || undefined,
          chainSelector: newChain,
          [valueKey]: "",
        });
        setAddingNew(false);
        const isKnown = EVM_CHAIN_OPTIONS.some(
          (o) => o.value === newChain && o.value !== "" && o.value !== "other"
        );
        setChainPreset(isKnown ? newChain : newChain ? "other" : "");
      }
    }
  }

  return (
    <>
      {knownContracts.length > 0 && (
        <div className="inspector__field">
          <label className="label">Smart contract</label>
          <select
            className="select"
            value={pickedContract ? smartContractName : ""}
            onChange={(e) => pickContract(e.target.value)}
          >
            <option value="">— New smart contract —</option>
            {knownContracts.map((c) => (
              <option key={c.contractName} value={c.contractName}>
                {c.contractName}
                {c.contractAddress ? ` (${c.contractAddress.slice(0, 10)}…)` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {!pickedContract && (
        <div className="inspector__field">
          <label className="label">Smart contract name</label>
          <input
            className="input"
            value={smartContractName}
            onChange={(e) => patchSelected({ smartContractName: e.target.value })}
          />
        </div>
      )}

      <div className="inspector__field">
        <label className="label">{valueLabel}</label>
        {availableOptions.length > 0 ? (
          <>
            <select
              className="select"
              value={addingNew ? "__new__" : valueName}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setAddingNew(true);
                  patchSelected({ [valueKey]: "" });
                } else {
                  setAddingNew(false);
                  patchSelected({ [valueKey]: e.target.value });
                }
              }}
            >
              <option value="" disabled>Select</option>
              {availableOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
              <option value="__new__">— Add new —</option>
            </select>
            {addingNew && (
              <input
                className="input"
                style={{ marginTop: 6 }}
                autoFocus
                value={valueName}
                onChange={(e) => patchSelected({ [valueKey]: e.target.value })}
              />
            )}
          </>
        ) : (
          <input
            className="input"
            value={valueName}
            onChange={(e) => patchSelected({ [valueKey]: e.target.value })}
          />
        )}
      </div>

      <div className="inspector__field">
        <label className="label">Contract address <span className="muted">(optional)</span></label>
        <input
          className="input"
          placeholder="0x..."
          value={contractAddress ?? ""}
          onChange={(e) => patchSelected({ contractAddress: e.target.value.trim() || undefined })}
        />
      </div>

      <div className="inspector__field">
        <label className="label">Network</label>
        <select
          className="select"
          value={chainPreset}
          onChange={(e) => {
            setChainPreset(e.target.value);
            if (e.target.value !== "other") {
              patchSelected({ chainSelector: e.target.value });
            }
          }}
        >
          {EVM_CHAIN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {chainPreset === "other" && (
          <input
            className="input"
            style={{ marginTop: 6 }}
            placeholder="Enter chain selector"
            value={chainSelector}
            onChange={(e) => patchSelected({ chainSelector: e.target.value })}
          />
        )}
      </div>
    </>
  );
}

type WebsiteUrlsEditorProps = {
  apiUrls: string[];
  onUrlsChange: (urls: string[]) => void;
};

function WebsiteUrlsEditor({ apiUrls, onUrlsChange }: WebsiteUrlsEditorProps) {
  const [newUrl, setNewUrl] = useState("");

  function updateUrl(i: number, value: string) {
    const next = [...apiUrls];
    next[i] = value;
    onUrlsChange(next);
  }

  function removeUrl(i: number) {
    onUrlsChange(apiUrls.filter((_, idx) => idx !== i));
  }

  function addUrl() {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    if (apiUrls.includes(trimmed)) return;
    onUrlsChange([...apiUrls, trimmed]);
    setNewUrl("");
  }

  return (
    <div className="inspector__field">
      <label className="label">API URLs</label>
      {apiUrls.length === 0 && (
        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
          No URLs defined yet.
        </div>
      )}
      {apiUrls.map((url, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          <input
            className="input"
            value={url}
            onChange={(e) => updateUrl(i, e.target.value)}
          />
          <button
            className="btn btn--ghost"
            onClick={() => removeUrl(i)}
            title="Remove this URL"
            style={{ flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input
          className="input"
          placeholder="https://api.example.com/endpoint"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }}
        />
        <button
          className="btn"
          onClick={addUrl}
          disabled={!newUrl.trim()}
          style={{ flexShrink: 0 }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}

export type ModalType =
  | "trigger.cron"
  | "trigger.evmLog"
  | "trigger.http"
  | "cap.http.get"
  | "cap.http.post"
  | "cap.evmRead"
  | "cap.evmWrite"
  | "cap.localExecution"
  | "edit.trigger.cron";

type LeftPanelProps = {
  workflowCreated: boolean;
  canAddCaps: boolean;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  openModal: (type: ModalType, initialData?: Record<string, any>) => void;
  selectedNode: Node<AnyNodeData> | null;
  patchSelected: (patch: Partial<AnyNodeData>) => void;
  canDelete: boolean;
  onDelete: () => void;
  nodes: Node<AnyNodeData>[];
  edges: Edge[];
  onUnlinkEdge: (edgeId: string) => void;
};

export function LeftPanel({
  workflowCreated,
  canAddCaps,
  isOpen,
  setIsOpen,
  openModal,
  selectedNode,
  patchSelected,
  canDelete,
  onDelete,
  nodes,
  edges,
  onUnlinkEdge,
}: LeftPanelProps) {
  const linkedItems = selectedNode
    ? edges
        .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
        .map((e) => {
          const isOutgoing = e.source === selectedNode.id;
          const otherId = isOutgoing ? e.target : e.source;
          const otherNode = nodes.find((n) => n.id === otherId) ?? null;
          const edgeKind = (e.data as any)?.kind ?? "callback";
          return { edgeId: e.id, otherNode, isOutgoing, edgeKind };
        })
    : [];

  const [triggersOpen, setTriggersOpen] = useState(true);
  const [capsOpen, setCapsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState<AnyNodeData | null>(null);
  const knownContracts = deriveKnownContracts(nodes);
  const knownWebsites = deriveKnownWebsites(nodes);

  useEffect(() => {
    setIsEditing(false);
    setOriginalData(null);
  }, [selectedNode?.id]);

  function startEdit() {
    if (!selectedNode) return;
    setOriginalData({ ...(selectedNode.data as AnyNodeData) });
    setIsEditing(true);
  }

  function saveEdit() {
    setIsEditing(false);
    setOriginalData(null);
  }

  function cancelEdit() {
    if (originalData) patchSelected(originalData);
    setIsEditing(false);
    setOriginalData(null);
  }

  return (
    <aside className={isOpen ? "left left--open" : "left left--closed"}>
      <div className="left__top">
        <button
          className="btn btn--ghost left__toggle"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? "Collapse panel" : "Expand panel"}
        >
          ☰
        </button>

        {isOpen && (
          <div className="left__topTitle">
            Blocks
            {!workflowCreated && <span className="pill">Create workflow first</span>}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="left__content">
          <div className="section">
            <div className="section__title section__title--toggle" onClick={() => setTriggersOpen((o) => !o)}>
              Triggers <span className="section__chevron">{triggersOpen ? "▾" : "▸"}</span>
            </div>
            {triggersOpen && (
              <>
                <div className="section__desc">
                  Each Trigger has one callback chain (Capabilities).
                </div>

                <button
                  className="btn btn--block"
                  disabled={!workflowCreated}
                  onClick={() => openModal("trigger.cron")}
                >
                  + Cron Trigger
                </button>

                <button
                  className="btn btn--block"
                  disabled={!workflowCreated}
                  onClick={() => openModal("trigger.evmLog")}
                >
                  + EVM Log Trigger
                </button>

                <button
                  className="btn btn--block"
                  disabled={!workflowCreated}
                  onClick={() => openModal("trigger.http")}
                >
                  + HTTP Trigger
                </button>
              </>
            )}
          </div>

          <div className="section">
            <div className="section__title section__title--toggle" onClick={() => setCapsOpen((o) => !o)}>
              Callback Capabilities <span className="section__chevron">{capsOpen ? "▾" : "▸"}</span>
            </div>
            {capsOpen && (
              <>
                <div className="section__desc">
                  Append capabilities one after another, unlimited.
                </div>

                <button
                  className="btn btn--block"
                  disabled={!canAddCaps}
                  onClick={() => openModal("cap.http.get")}
                  title={!canAddCaps ? "Select a Trigger/Capability (or add exactly one Trigger)" : ""}
                >
                  + HTTP GET
                </button>

                <button
                  className="btn btn--block"
                  disabled={!canAddCaps}
                  onClick={() => openModal("cap.http.post")}
                  title={!canAddCaps ? "Select a Trigger/Capability (or add exactly one Trigger)" : ""}
                >
                  + HTTP POST
                </button>

                <button
                  className="btn btn--block"
                  disabled={!canAddCaps}
                  onClick={() => openModal("cap.evmRead")}
                  title={!canAddCaps ? "Select a Trigger/Capability (or add exactly one Trigger)" : ""}
                >
                  + EVM Read
                </button>

                <button
                  className="btn btn--block"
                  disabled={!canAddCaps}
                  onClick={() => openModal("cap.evmWrite")}
                  title={!canAddCaps ? "Select a Trigger/Capability (or add exactly one Trigger)" : ""}
                >
                  + EVM Write
                </button>

                <button
                  className="btn btn--block btn--local"
                  disabled={!canAddCaps}
                  onClick={() => openModal("cap.localExecution")}
                  title={!canAddCaps ? "Select a Trigger/Capability (or add exactly one Trigger)" : ""}
                >
                  + Local Execution
                </button>

                <div className="section__note">
                  Tip: click a Trigger (or a Capability) to choose where new Capabilities attach.
                </div>
              </>
            )}
          </div>

          <div className="section">
            <div className="section__title">View and Edit</div>
            <div className="section__desc">
              Click a node to view details. Click <b>Edit</b> to modify.
            </div>

            {!selectedNode ? (
              <div className="empty">No node selected.</div>
            ) : (
              <div className={`inspector${isEditing ? "" : " inspector--readonly"}`} key={selectedNode.id}>
                <div className="inspector__row" style={{ gap: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {!isEditing ? (
                      <button
                        className="btn btn--ghost"
                        onClick={startEdit}
                        style={{ padding: "4px 10px", fontSize: 12 }}
                      >
                        ✏️ Edit
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn"
                          onClick={saveEdit}
                          style={{ padding: "4px 10px", fontSize: 12 }}
                        >
                          💾 Save
                        </button>
                        <button
                          className="btn btn--ghost"
                          onClick={cancelEdit}
                          style={{ padding: "4px 10px", fontSize: 12 }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="inspector__label">Kind</div>
                    <span className="inspector__value">{kindLabel(selectedNode.data.kind)}</span>
                  </div>
                </div>

                <fieldset disabled={!isEditing} style={{ border: "none", padding: 0, margin: 0 }}>
                <div className="inspector__field">
                  <label className="label">Name</label>
                  <input
                    className="input"
                    value={selectedNode.data.name}
                    onChange={(e) => patchSelected({ name: e.target.value })}
                  />
                </div>

                <div className="inspector__field">
                  <label className="label">Description</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={selectedNode.data.description ?? ""}
                    onChange={(e) => patchSelected({ description: e.target.value })}
                  />
                </div>

                {/* ---- trigger.cron ---- */}
                {selectedNode.data.kind === "trigger.cron" && (
                  <div className="inspector__field">
                    <label className="label">Schedule</label>
                    <div className="cron-preview cron-preview--sm">
                      {(selectedNode.data as TriggerCronData).cronExpression || "—"}
                    </div>
                    <button
                      className="btn btn--block"
                      style={{ marginTop: 6 }}
                      onClick={() =>
                        openModal("edit.trigger.cron", selectedNode.data as Record<string, any>)
                      }
                    >
                      ✏️ Edit schedule
                    </button>
                  </div>
                )}

                {/* ---- trigger.evmLog ---- */}
                {selectedNode.data.kind === "trigger.evmLog" && (() => {
                  const d = selectedNode.data as TriggerEvmLogData;
                  return (
                    <>
                      <EvmContractPicker
                        smartContractName={d.smartContractName}
                        contractAddress={d.contractAddress}
                        chainSelector={d.chainSelector}
                        valueKey="eventName"
                        valueLabel="Event name"
                        valueName={d.eventName}
                        optionSource="events"
                        knownContracts={knownContracts}
                        patchSelected={(patch) => patchSelected(patch as any)}
                      />
                      <div className="inspector__field">
                        <label className="label">Confidence level</label>
                        <select className="select" value={d.confidenceLevel} onChange={(e) => patchSelected({ confidenceLevel: e.target.value as EvmConfidenceLevel } as any)}>
                          <option value="Finalized">Finalized (safest)</option>
                          <option value="Safe">Safe</option>
                          <option value="Custom">Custom</option>
                        </select>
                        {d.confidenceLevel === "Custom" && (
                          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                            <input className="input" type="number" min={1} style={{ width: 100 }} value={d.confirmationBlocks ?? 1} onChange={(e) => patchSelected({ confirmationBlocks: Number(e.target.value) } as any)} />
                            <span className="muted" style={{ fontSize: 12 }}>block confirmations</span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

                {/* ---- trigger.http ---- */}
                {selectedNode.data.kind === "trigger.http" && (() => {
                  const d = selectedNode.data as TriggerHttpData;
                  return (
                    <>
                      <WebsiteApiPicker
                        websiteName={d.websiteName}
                        apiUrl={d.apiUrl}
                        knownWebsites={knownWebsites}
                        fieldClass="inspector__field"
                        onWebsiteNameChange={(v) => patchSelected({ websiteName: v } as any)}
                        onApiUrlChange={(v) => patchSelected({ apiUrl: v } as any)}
                        apiUrlRequired={false}
                      />
                      <div className="inspector__field">
                        <label className="label">Authorized public keys <span className="muted">(one per line)</span></label>
                        <textarea
                          className="textarea"
                          rows={4}
                          placeholder={"Leave empty for simulation.\nPaste ECDSA public keys for production."}
                          value={(d.authorizedKeys ?? []).join("\n")}
                          onChange={(e) => patchSelected({ authorizedKeys: e.target.value.split("\n").map((k) => k.trim()).filter(Boolean) } as any)}
                        />
                      </div>
                    </>
                  );
                })()}

                {/* ---- cap.http.get ---- */}
                {selectedNode.data.kind === "cap.http.get" && (() => {
                  const d = selectedNode.data as CapHttpGetData;
                  return (
                    <WebsiteApiPicker
                      websiteName={d.websiteName}
                      apiUrl={d.apiUrl}
                      knownWebsites={knownWebsites}
                      fieldClass="inspector__field"
                      onWebsiteNameChange={(v) => patchSelected({ websiteName: v } as any)}
                      onApiUrlChange={(v) => patchSelected({ apiUrl: v } as any)}
                    />
                  );
                })()}

                {/* ---- cap.http.post ---- */}
                {selectedNode.data.kind === "cap.http.post" && (() => {
                  const d = selectedNode.data as CapHttpPostData;
                  return (
                    <>
                      <WebsiteApiPicker
                        websiteName={d.websiteName}
                        apiUrl={d.apiUrl}
                        knownWebsites={knownWebsites}
                        fieldClass="inspector__field"
                        onWebsiteNameChange={(v) => patchSelected({ websiteName: v } as any)}
                        onApiUrlChange={(v) => patchSelected({ apiUrl: v } as any)}
                      />
                      <div className="inspector__field">
                        <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input
                            type="checkbox"
                            checked={d.cacheEnabled}
                            onChange={(e) => patchSelected({ cacheEnabled: e.target.checked } as any)}
                          />
                          Cache responses
                        </label>
                        {d.cacheEnabled && (
                          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                            <input className="input" type="number" min={1} max={600000} style={{ width: 120 }} value={d.cacheMaxAgeMs ?? 60000} onChange={(e) => patchSelected({ cacheMaxAgeMs: Number(e.target.value) } as any)} />
                            <span className="muted" style={{ fontSize: 12 }}>ms max age</span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

                {/* ---- cap.evmRead ---- */}
                {selectedNode.data.kind === "cap.evmRead" && (() => {
                  const d = selectedNode.data as CapEvmReadData;
                  return (
                    <>
                      <EvmContractPicker
                        smartContractName={d.smartContractName}
                        contractAddress={d.contractAddress}
                        chainSelector={d.chainSelector}
                        valueKey="functionName"
                        valueLabel="Function name"
                        valueName={d.functionName}
                        optionSource="functions"
                        knownContracts={knownContracts}
                        patchSelected={(patch) => patchSelected(patch as any)}
                      />
                      <div className="inspector__field">
                        <label className="label">Block to read</label>
                        <select className="select" value={d.blockSelection} onChange={(e) => patchSelected({ blockSelection: e.target.value as EvmBlockSelection } as any)}>
                          <option value="LatestFinalized">Latest Finalized (recommended)</option>
                          <option value="Latest">Latest</option>
                          <option value="Custom">Custom block depth</option>
                        </select>
                        {d.blockSelection === "Custom" && (
                          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                            <input className="input" type="number" min={1} style={{ width: 100 }} value={d.customBlockDepth ?? 1} onChange={(e) => patchSelected({ customBlockDepth: Number(e.target.value) } as any)} />
                            <span className="muted" style={{ fontSize: 12 }}>blocks from latest</span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

                {/* ---- cap.evmWrite ---- */}
                {selectedNode.data.kind === "cap.evmWrite" && (() => {
                  const d = selectedNode.data as CapEvmWriteData;
                  return (
                    <EvmContractPicker
                      smartContractName={d.smartContractName}
                      contractAddress={d.contractAddress}
                      chainSelector={d.chainSelector}
                      valueKey="functionName"
                      valueLabel="Function name"
                      valueName={d.functionName}
                      optionSource="functions"
                      knownContracts={knownContracts}
                      patchSelected={(patch) => patchSelected(patch as any)}
                    />
                  );
                })()}

                {/* ---- cap.localExecution ---- */}
                {selectedNode.data.kind === "cap.localExecution" && (
                  <div className="inspector__field">
                    <label className="label">Logic / Behavior</label>
                    <textarea
                      className="textarea"
                      rows={5}
                      placeholder="Describe what this local execution step does..."
                      value={(selectedNode.data as CapLocalExecutionData).logic ?? ""}
                      onChange={(e) => patchSelected({ logic: e.target.value } as any)}
                    />
                  </div>
                )}

                {/* ---- smartContract ---- */}
                {selectedNode.data.kind === "smartContract" && (() => {
                  const d = selectedNode.data as SmartContractData;
                  return (
                    <>
                      <div className="inspector__field">
                        <label className="label">Contract name</label>
                        <input className="input" value={d.contractName} onChange={(e) => patchSelected({ contractName: e.target.value } as any)} />
                      </div>
                      <div className="inspector__field">
                        <label className="label">Events <span className="muted">(one per line)</span></label>
                        <textarea
                          className="textarea"
                          rows={3}
                          placeholder={"e.g. PriceUpdated\nSettlementRequested"}
                          value={(d.events ?? []).join("\n")}
                          onChange={(e) => patchSelected({ events: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) } as any)}
                        />
                      </div>
                      <div className="inspector__field">
                        <label className="label">Functions <span className="muted">(one per line)</span></label>
                        <textarea
                          className="textarea"
                          rows={3}
                          placeholder={"e.g. createMarket\ngetMarket"}
                          value={(d.functions ?? []).join("\n")}
                          onChange={(e) => patchSelected({ functions: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) } as any)}
                        />
                      </div>
                    </>
                  );
                })()}

                {/* ---- website ---- */}
                {selectedNode.data.kind === "website" && (() => {
                  const d = selectedNode.data as WebsiteData;
                  return (
                    <>
                      <div className="inspector__field">
                        <label className="label">Website name</label>
                        <input className="input" value={d.websiteName} onChange={(e) => patchSelected({ websiteName: e.target.value } as any)} />
                      </div>
                      <WebsiteUrlsEditor
                        apiUrls={d.apiUrls ?? []}
                        onUrlsChange={(urls) => patchSelected({ apiUrls: urls } as any)}
                      />
                    </>
                  );
                })()}
                </fieldset>

                {linkedItems.length > 0 && (
                  <div className="inspector__field">
                    <label className="label">Linked ({linkedItems.length})</label>
                    <div className="linked-list">
                      {linkedItems.map(({ edgeId, otherNode, isOutgoing, edgeKind }) => (
                        <div key={edgeId} className="linked-item">
                          <div className="linked-item__left">
                            <span className="linked-item__dir">{isOutgoing ? "→" : "←"}</span>
                            <span className="linked-item__name">
                              {otherNode?.data.name || "(Unnamed)"}
                            </span>
                            <span className="linked-item__badge">
                              {otherNode ? kindLabel(otherNode.data.kind) : ""}
                            </span>
                            <span className="linked-item__edge-kind">{edgeKind}</span>
                          </div>
                          <button
                            className="btn btn--ghost linked-item__unlink"
                            onClick={() => onUnlinkEdge(edgeId)}
                            title="Remove this connection"
                          >
                            Unlink
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  className="btn btn--danger btn--block"
                  disabled={!canDelete}
                  onClick={onDelete}
                  title={!canDelete ? "Disconnect all edges first before deleting" : "Delete this node"}
                >
                  Delete node
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
