import React from "react";
import chainlinkLogo from "../assets/chainlink.svg";
import type { Workflow } from "../types";

type HeaderProps = {
  workflow: Workflow;
  setWorkflow: React.Dispatch<React.SetStateAction<Workflow>>;
  onExport: () => void;
  onExportTs?: () => void;
  onCreateOnGit?: () => void;
  onImportClick: () => void;
  fileInputRef: { readonly current: HTMLInputElement | null };
  onImportFilePicked: (file: File | null) => void;
  ioError: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

export function Header({
  workflow,
  setWorkflow,
  onExport,
  onExportTs,
  onCreateOnGit,
  onImportClick,
  fileInputRef,
  onImportFilePicked,
  ioError,
  theme,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header__left">
        <div className="header__brand">
          <img src={chainlinkLogo} alt="Chainlink" className="header__logo" />
          <div className="header__title">Scaffold CRE</div>
        </div>
        <div className="header__hint">
          One workflow at a time. Add at least one Trigger, then Capabilities as Callback to the trigger.
        </div>

        <div className="header__io" style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button
            className="btn btn--ghost"
            onClick={onExport}
            disabled={!workflow.created}
            title={!workflow.created ? "Create a workflow first" : "Download workflow JSON"}
          >
            Export JSON
          </button>

          {onExportTs && (
            <button
              className="btn btn--ghost"
              onClick={onExportTs}
              title="Export as a TypeScript CRE project"
            >
              Export TS Project
            </button>
          )}

          {onCreateOnGit && (
            <button
              className="btn"
              onClick={onCreateOnGit}
              title="Create a branch in cre-scaffold-templates on GitHub"
            >
              🚀 Create on Git
            </button>
          )}

          <button
            className="btn btn--ghost"
            onClick={onImportClick}
            title="Import workflow JSON"
          >
            Import JSON
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={(e) => onImportFilePicked(e.target.files?.[0] ?? null)}
          />

          {ioError && (
            <span className="pill" style={{ background: "#3b1d1d", borderColor: "#7a2d2d" }}>
              Import error: {ioError}
            </span>
          )}
        </div>
      </div>

      <div className="header__right">
        <div className="wf">
          <div className="wf__field">
            <label className="label">Workflow name</label>
            <input
              className="input"
              value={workflow.name}
              onChange={(e) => setWorkflow((w) => ({ ...w, name: e.target.value }))}
              placeholder="e.g. TokenShop Monitor"
            />
          </div>

          <div className="wf__field wf__field--wide">
            <label className="label">Workflow description</label>
            <textarea
              className="textarea"
              value={workflow.description}
              onChange={(e) => setWorkflow((w) => ({ ...w, description: e.target.value }))}
              placeholder="What does this workflow do?"
              rows={2}
            />
          </div>

          <div className="wf__actions">
            <button
              className="btn"
              onClick={() => setWorkflow((w) => ({ ...w, created: true }))}
              disabled={workflow.created || workflow.name.trim().length === 0}
              title={
                workflow.name.trim().length === 0
                  ? "Set a workflow name first"
                  : workflow.created
                  ? "Workflow already created"
                  : "Create workflow"
              }
            >
              {workflow.created ? "Workflow Created" : "Create Workflow"}
            </button>
          </div>
        </div>
      </div>

      <div className="header__theme">
        <button
          className={`theme-toggle theme-toggle--${theme}`}
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="theme-toggle__thumb">
            {theme === "light" ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </span>
        </button>
      </div>
    </header>
  );
}

