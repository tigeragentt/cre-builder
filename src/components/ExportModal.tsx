import { useState } from "react";
import type { Node, Edge } from "reactflow";
import { Modal } from "./Modal";
import { generateProject } from "../utils/projectGenerator";
import { downloadProjectZip } from "../utils/downloadZip";
import { sendToRemixDesktop, type BridgeStatus } from "../utils/remixDesktopBridge";
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
  const nameSlug = workflowName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "my-workflow";
  const wfSlug = "workflow-" + nameSlug;
  const zipName = "CRE-" + nameSlug;
  const [activeFile, setActiveFile] = useState(`${wfSlug}/workflow.ts`);
  const [downloading, setDownloading] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>("idle");
  const [bridgeError, setBridgeError] = useState<string>("");
  const [bridgeWorkspace, setBridgeWorkspace] = useState<string>("");

  const files = generateProject(workflowName, workflowDescription, nodes, edges);
  const fileNames = Object.keys(files);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadProjectZip(files, zipName);
    } finally {
      setDownloading(false);
    }
  }

  async function handleSendToDesktop() {
    setBridgeStatus("connecting");
    setBridgeError("");
    setBridgeWorkspace("");
    try {
      const result = await sendToRemixDesktop(nameSlug, files);
      setBridgeWorkspace(result.workspace ?? nameSlug);
      setBridgeStatus("success");
    } catch (err) {
      setBridgeError(err instanceof Error ? err.message : String(err));
      setBridgeStatus("error");
    }
  }

  const isBridgeBusy = bridgeStatus === "connecting" || bridgeStatus === "sending";

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

        {/* Bridge status messages */}
        {bridgeStatus === "error" && (
          <div className="export-modal__status export-modal__status--error">
            ❌ {bridgeError}
          </div>
        )}
        {bridgeStatus === "success" && (
          <div className="export-modal__status export-modal__status--success">
            ✅ Exported to RemixDesktop — project opened in workspace <strong>{bridgeWorkspace}</strong>
          </div>
        )}

        <div className="form__actions" style={{ marginTop: 12 }}>
          {/* Send to RemixDesktop via WebSocket */}
          <button
            className="btn btn--primary"
            onClick={handleSendToDesktop}
            disabled={isBridgeBusy}
            title="Export project files directly to RemixDesktop (must be open)"
          >
            {isBridgeBusy ? "Connecting…" : "🖥️ Export to RemixDesktop"}
          </button>

          {/* Classic zip download */}
          <button
            className="btn"
            onClick={async () => { await handleDownload(); onClose(); }}
            disabled={downloading}
          >
            {downloading ? "Preparing…" : `⬇️ Download ${zipName}.zip`}
          </button>

          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
