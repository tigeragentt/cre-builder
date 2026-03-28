import type { Node, Edge } from "reactflow";
import type { AnyNodeData } from "../types";
import { kindLabel } from "../nodes/AppNode";

export type ModalType =
  | "trigger.cron"
  | "trigger.evmLog"
  | "trigger.http"
  | "cap.http"
  | "cap.evmRead"
  | "cap.evmWrite";

type LeftPanelProps = {
  workflowCreated: boolean;
  canAddCaps: boolean;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  openModal: (type: ModalType) => void;
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
            <div className="section__title">Triggers</div>
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
          </div>

          <div className="section">
            <div className="section__title">Callback Capabilities</div>
            <div className="section__desc">
              Append capabilities one after another, unlimited.
            </div>

            <button
              className="btn btn--block"
              disabled={!canAddCaps}
              onClick={() => openModal("cap.http")}
              title={!canAddCaps ? "Select a Trigger/Capability (or add exactly one Trigger)" : ""}
            >
              + HTTP
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

            <div className="section__note">
              Tip: click a Trigger (or a Capability) to choose where new Capabilities attach.
            </div>
          </div>

          <div className="section">
            <div className="section__title">View and Edit</div>
            <div className="section__desc">
              Click a node to edit its name/description. Description also appears on hover.
            </div>

            {!selectedNode ? (
              <div className="empty">No node selected.</div>
            ) : (
              <div className="inspector">
                <div className="inspector__row">
                  <div className="inspector__label">Kind</div>
                  <div className="inspector__value">{kindLabel(selectedNode.data.kind)}</div>
                </div>

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
