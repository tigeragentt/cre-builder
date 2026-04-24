import type { Node } from "reactflow";
import { Modal } from "./Modal";
import { CronModal } from "./CronModal";
import { EvmLogModal } from "./EvmLogModal";
import { EvmReadModal } from "./EvmReadModal";
import { EvmWriteModal } from "./EvmWriteModal";
import { HttpPostModal } from "./HttpPostModal";
import { HttpTriggerModal } from "./HttpTriggerModal";
import { HttpGetModal } from "./HttpGetModal";
import type { ModalType } from "./LeftPanel";
import type { AnyNodeData, WebsiteData } from "../types";
import type { KnownWebsite } from "./WebsiteApiPicker";

export type KnownContract = {
  contractName: string;
  contractAddress?: string;
  chainSelector?: string;
  events: string[];
  functions: string[];
};

type ModalsPanelProps = {
  modal: { type: ModalType; initialData?: Record<string, any> } | null;
  up: (k: string, v: any) => void;
  submitModal: () => void;
  closeModal: () => void;
  nodes: Node<AnyNodeData>[];
};

function deriveKnownContracts(nodes: Node<AnyNodeData>[]): KnownContract[] {
  const scMap = new Map<string, { events: string[]; functions: string[] }>();
  for (const n of nodes) {
    if (n.data.kind === "smartContract") {
      const d = n.data as import("../types").SmartContractData;
      scMap.set(d.contractName, { events: d.events, functions: d.functions });
    }
  }
  const addrMap = new Map<string, { contractAddress?: string; chainSelector?: string }>();
  for (const n of nodes) {
    const d = n.data as any;
    if (d.smartContractName && !addrMap.has(d.smartContractName)) {
      addrMap.set(d.smartContractName, {
        contractAddress: d.contractAddress,
        chainSelector: d.chainSelector,
      });
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

export function ModalsPanel({ modal, up, submitModal, closeModal, nodes }: ModalsPanelProps) {
  if (!modal) return null;

  const knownContracts = deriveKnownContracts(nodes);
  const knownWebsites = deriveKnownWebsites(nodes);

  return (
    <>
      {modal.type === "trigger.cron" && (
        <CronModal up={up} onSubmit={submitModal} onClose={closeModal} />
      )}

      {modal.type === "edit.trigger.cron" && (
        <CronModal
          up={up}
          onSubmit={submitModal}
          onClose={closeModal}
          initialData={modal.initialData}
          mode="edit"
        />
      )}

      {modal.type === "trigger.evmLog" && (
        <EvmLogModal up={up} onSubmit={submitModal} onClose={closeModal} knownContracts={knownContracts} />
      )}

      {modal.type === "trigger.http" && (
        <HttpTriggerModal up={up} onSubmit={submitModal} onClose={closeModal} knownWebsites={knownWebsites} />
      )}

      {modal.type === "cap.http.get" && (
        <HttpGetModal up={up} onSubmit={submitModal} onClose={closeModal} knownWebsites={knownWebsites} />
      )}

      {modal.type === "cap.http.post" && (
        <HttpPostModal up={up} onSubmit={submitModal} onClose={closeModal} knownWebsites={knownWebsites} />
      )}

      {modal.type === "cap.evmRead" && (
        <EvmReadModal up={up} onSubmit={submitModal} onClose={closeModal} knownContracts={knownContracts} />
      )}

      {modal.type === "cap.evmWrite" && (
        <EvmWriteModal up={up} onSubmit={submitModal} onClose={closeModal} knownContracts={knownContracts} />
      )}

      {modal.type === "cap.localExecution" && (
        <Modal title="Add Local Execution" onClose={closeModal}>
          <div className="form">
            <div className="form__hint">
              Represents business logic that runs <b>locally</b> on the CRE node — no external calls or on-chain reads.
              Use this for computation, data transformation, validation, or any custom logic between capabilities.
            </div>

            <div className="form__field">
              <label className="label">Name <span className="req">*</span></label>
              <input
                className="input"
                placeholder="e.g. Compute Price Average"
                onChange={(e) => up("name", e.target.value)}
              />
            </div>

            <div className="form__field">
              <label className="label">Logic / Behavior <span className="muted">(what does this step do?)</span></label>
              <textarea
                className="textarea"
                rows={4}
                placeholder={"e.g. Read the HTTP response, compute a weighted average of all prices,\nreject values outside the 2σ band, return the final price as a bigint."}
                onChange={(e) => up("logic", e.target.value)}
              />
            </div>

            <div className="form__field">
              <label className="label">Description <span className="muted">(optional, shown on hover)</span></label>
              <textarea
                className="textarea"
                rows={2}
                onChange={(e) => up("description", e.target.value)}
              />
            </div>

            <div className="form__actions">
              <button className="btn" onClick={submitModal}>Add</button>
              <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
