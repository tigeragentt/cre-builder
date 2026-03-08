import { useState } from "react";
import type { Node, Edge } from "reactflow";
import { Modal } from "./Modal";
import { generateProject } from "../utils/projectGenerator";
import { publishToGitHub } from "../utils/githubPublish";
import type { AnyNodeData } from "../types";

const TOKEN_KEY = "scaffold-cre:gh-token";

type GitPublishModalProps = {
  workflowName: string;
  workflowDescription: string;
  nodes: Node<AnyNodeData>[];
  edges: Edge[];
  onClose: () => void;
};

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; url: string; branchName: string }
  | { kind: "error"; message: string };

export function GitPublishModal({
  workflowName,
  workflowDescription,
  nodes,
  edges,
  onClose,
}: GitPublishModalProps) {
  const slug = workflowName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "my-workflow";
  const defaultBranch = `scaffold/${slug}`;

  const [token, setToken] = useState<string>(
    () => localStorage.getItem(TOKEN_KEY) ?? ""
  );
  const [branchName, setBranchName] = useState(defaultBranch);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handlePublish() {
    if (!token.trim()) {
      setStatus({ kind: "error", message: "GitHub token is required." });
      return;
    }
    if (!branchName.trim()) {
      setStatus({ kind: "error", message: "Branch name is required." });
      return;
    }

    setStatus({ kind: "loading" });
    try {
      localStorage.setItem(TOKEN_KEY, token.trim());
      const files = generateProject(workflowName, workflowDescription, nodes, edges);
      const result = await publishToGitHub(files, branchName.trim(), token.trim());
      setStatus({ kind: "done", url: result.branchUrl, branchName: result.branchName });
    } catch (err: any) {
      setStatus({ kind: "error", message: err.message ?? "Unknown error." });
    }
  }

  const isDone = status.kind === "done";

  return (
    <Modal title="Create on GitHub" onClose={onClose}>
      <div className="export-modal">
        <div className="export-modal__hint">
          A new branch will be created in{" "}
          <a
            href="https://github.com/tigeragentt/cre-scaffold-templates"
            target="_blank"
            rel="noreferrer"
          >
            cre-scaffold-templates
          </a>{" "}
          with your workflow scaffold. Search for <code>TODO</code> in the files to complete the implementation.
        </div>

        <div className="form" style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="form__field">
            <label className="label">GitHub Token</label>
            <input
              className="input"
              type="password"
              placeholder="ghp_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isDone}
            />
            <div style={{ fontSize: 11, color: "var(--color-muted, #888)", marginTop: 4 }}>
              Needs <code>repo</code> scope.{" "}
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=scaffold-cre"
                target="_blank"
                rel="noreferrer"
              >
                Create one
              </a>
              . Stored in localStorage only.
            </div>
          </div>

          <div className="form__field">
            <label className="label">Branch name</label>
            <input
              className="input"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              disabled={isDone}
            />
          </div>
        </div>

        {status.kind === "error" && (
          <div
            style={{
              marginTop: 12,
              padding: "8px 12px",
              borderRadius: 6,
              background: "#3b1d1d",
              border: "1px solid #7a2d2d",
              color: "#f87171",
              fontSize: 13,
            }}
          >
            ❌ {status.message}
          </div>
        )}

        {status.kind === "done" && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 6,
              background: "#1a3324",
              border: "1px solid #2d7a4f",
              color: "#4ade80",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            ✅ Branch created!{" "}
            <a href={status.url} target="_blank" rel="noreferrer" style={{ color: "#4ade80", fontWeight: 600 }}>
              {status.branchName}
            </a>
            <br />
            <span style={{ color: "var(--color-muted, #aaa)", fontSize: 12 }}>
              Search for <code>TODO</code> in the files to complete your implementation.
            </span>
          </div>
        )}

        <div className="form__actions" style={{ marginTop: 16 }}>
          {!isDone && (
            <button
              className="btn"
              onClick={handlePublish}
              disabled={status.kind === "loading"}
            >
              {status.kind === "loading" ? "Creating branch…" : "🚀 Create on Git"}
            </button>
          )}
          <button className="btn btn--ghost" onClick={onClose}>
            {isDone ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
