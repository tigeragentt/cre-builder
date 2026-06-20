import type { Node, Edge } from "reactflow";
import { Modal } from "./Modal";
import { NodeInspector } from "./NodeInspector";
import { kindLabel } from "../nodes/AppNode";
import type { ModalType } from "./LeftPanel";
import type { AnyNodeData } from "../types";

type NodeModalProps = {
  selectedNode: Node<AnyNodeData>;
  patchSelected: (patch: Partial<AnyNodeData>) => void;
  canDelete: boolean;
  onDelete: () => void;
  nodes: Node<AnyNodeData>[];
  edges: Edge[];
  onUnlinkEdge: (edgeId: string) => void;
  openModal: (type: ModalType, initialData?: Record<string, any>) => void;
  onClose: () => void;
};

export function NodeModal({
  selectedNode,
  patchSelected,
  canDelete,
  onDelete,
  nodes,
  edges,
  onUnlinkEdge,
  openModal,
  onClose,
}: NodeModalProps) {
  const title = `${selectedNode.data.name || "(Unnamed)"} · ${kindLabel(selectedNode.data.kind)}`;
  return (
    <Modal title={title} onClose={onClose}>
      <NodeInspector
        selectedNode={selectedNode}
        patchSelected={patchSelected}
        canDelete={canDelete}
        onDelete={onDelete}
        nodes={nodes}
        edges={edges}
        onUnlinkEdge={onUnlinkEdge}
        openModal={openModal}
      />
    </Modal>
  );
}
