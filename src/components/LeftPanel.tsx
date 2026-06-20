import { useState } from "react";
import type { Node } from "reactflow";
import type { AnyNodeData } from "../types";
import { kindLabel } from "../nodes/AppNode";

export type ModalType =
  | "trigger.cron"
  | "trigger.evmLog"
  | "trigger.http"
  | "cap.http.request"
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
};

export function LeftPanel({
  workflowCreated,
  canAddCaps,
  isOpen,
  setIsOpen,
  openModal,
  selectedNode,
}: LeftPanelProps) {
  const [triggersOpen, setTriggersOpen] = useState(true);
  const [capsOpen, setCapsOpen] = useState(true);

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
                  onClick={() => openModal("cap.http.request")}
                  title={!canAddCaps ? "Select a Trigger/Capability (or add exactly one Trigger)" : ""}
                >
                  + HTTP Request
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
              Click a node on the canvas to open it in a popup, then click <b>Edit</b> to modify.
            </div>
            {selectedNode ? (
              <div className="section__note">
                Selected: <b>{selectedNode.data.name || "(Unnamed)"}</b>{" "}
                <span className="muted">({kindLabel(selectedNode.data.kind)})</span>
              </div>
            ) : (
              <div className="empty">No node selected.</div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
