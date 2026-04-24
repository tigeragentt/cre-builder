import { useState } from "react";
import { Modal } from "./Modal";
import type { KnownWebsite } from "./WebsiteApiPicker";
import { WebsiteApiPicker } from "./WebsiteApiPicker";

type HttpPostModalProps = {
  up: (k: string, v: any) => void;
  onSubmit: () => void;
  onClose: () => void;
  knownWebsites?: KnownWebsite[];
};

export function HttpPostModal({ up, onSubmit, onClose, knownWebsites = [] }: HttpPostModalProps) {
  const [websiteName, setWebsiteName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [cacheEnabled, setCacheEnabled] = useState(false);
  const [cacheMaxAgeMs, setCacheMaxAgeMs] = useState(60000);
  const [description, setDescription] = useState("");

  const canSubmit = websiteName.trim() !== "" && apiUrl.trim() !== "";

  function handleSubmit() {
    if (!canSubmit) return;
    up("websiteName", websiteName.trim());
    up("apiUrl", apiUrl.trim());
    up("cacheEnabled", cacheEnabled);
    up("cacheMaxAgeMs", cacheEnabled ? cacheMaxAgeMs : undefined);
    up("description", description.trim());
    onSubmit();
  }

  return (
    <Modal title="Add HTTP POST Capability" onClose={onClose}>
      <div className="form">
        <div className="form__hint">
          Sends data to an external API. A <b>Website API</b> block will be auto-created or reused.
        </div>

        <WebsiteApiPicker
          websiteName={websiteName}
          apiUrl={apiUrl}
          knownWebsites={knownWebsites}
          onWebsiteNameChange={(v) => { setWebsiteName(v); up("websiteName", v.trim()); }}
          onApiUrlChange={(v) => { setApiUrl(v); up("apiUrl", v.trim()); }}
        />

        <div className="form__field">
          <label className="label">Cache settings</label>
          <div className="form__hint">
            CRE nodes run in parallel — without cache, a POST can be submitted multiple times.
            Enable cache to prevent duplicate requests.
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={cacheEnabled}
              onChange={(e) => { setCacheEnabled(e.target.checked); up("cacheEnabled", e.target.checked); }}
            />
            Enable cache (recommended for non-idempotent POST)
          </label>
          {cacheEnabled && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <input
                className="input"
                type="number"
                min={1000}
                max={600000}
                style={{ width: 120 }}
                value={cacheMaxAgeMs}
                onChange={(e) => { setCacheMaxAgeMs(Number(e.target.value)); up("cacheMaxAgeMs", Number(e.target.value)); }}
              />
              <span className="muted" style={{ fontSize: 12 }}>ms (max 600,000 = 10 min)</span>
            </div>
          )}
        </div>

        <div className="form__field">
          <label className="label">Description</label>
          <textarea
            className="textarea"
            rows={2}
            value={description}
            onChange={(e) => { setDescription(e.target.value); up("description", e.target.value.trim()); }}
          />
        </div>

        <div className="form__actions">
          <button className="btn" onClick={handleSubmit} disabled={!canSubmit}>Add</button>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
