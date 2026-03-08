import { useState } from "react";
import type { Node, Edge } from "reactflow";
import { Modal } from "./Modal";
import { generateProject } from "../utils/projectGenerator";
import { downloadProjectZip } from "../utils/downloadZip";
import type { AnyNodeData } from "../types";

type ExportModalProps = {
  workflowName: string;
  workflowDescription: string;
  nodes: Node<AnyNodeData>[];
  edges: Edge[];
  onClose: () => void;
};

export function ExportModal({
  workflowName,
  workflowDescription,
  nodes,
  edges,
  onClose,
}: ExportModalProps) {
  const wfSlug = workflowName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "my-workflow";
  const [activeFile, setActiveFile] = useState(`${wfSlug}/workflow.ts`);
  const [downloading, setDownloading] = useState(false);

  const files = generateProject(workflowName, workflowDescription, nodes, edges);
  const fileNames = Object.keys(files);
  const zipName = "CRE-" + wfSlug;

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadProjectZip(files, zipName);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal title="Export TypeScript Project" onClose={onClose}>
      <div className="export-modal">
        <div className="export-modal__hint">
          A CRE TypeScript project scaffold based on your workflow.
          Search for <code>TODO</code> in the generated files to complete the implementation.
        </div>

        <div className="export-modal__layout">
          {/* File tree */}
          <div className="export-modal__tree">
            {fileNames.map((f) => (
              <button
                key={f}
                className={`export-modal__file ${activeFile === f ? "export-modal__file--active" : ""}`}
                onClick={() => setActiveFile(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* File preview */}
          <pre className="export-modal__preview">
            <code>{files[activeFile]}</code>
          </pre>
        </div>

        <div className="form__actions" style={{ marginTop: 12 }}>
          <button className="btn" onClick={handleDownload} disabled={downloading}>
            {downloading ? "Preparing…" : `⬇️ Download ${zipName}.zip`}
          </button>
          <button className="btn btn--ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
}
