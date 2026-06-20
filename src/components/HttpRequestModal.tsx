import { useState } from "react";
import { Modal } from "./Modal";
import type { KnownWebsite } from "./WebsiteApiPicker";
import { WebsiteApiPicker } from "./WebsiteApiPicker";
import type { HttpMethod } from "../types";

type HttpRequestModalProps = {
  up: (k: string, v: any) => void;
  onSubmit: () => void;
  onClose: () => void;
  knownWebsites?: KnownWebsite[];
};

export function HttpRequestModal({ up, onSubmit, onClose, knownWebsites = [] }: HttpRequestModalProps) {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [websiteName, setWebsiteName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [cacheEnabled, setCacheEnabled] = useState(false);
  const [cacheMaxAgeMs, setCacheMaxAgeMs] = useState(60000);
  const [description, setDescription] = useState("");

  const canSubmit = websiteName.trim() !== "" && apiUrl.trim() !== "";

  function handleSubmit() {
    if (!canSubmit) return;
    up("method", method);
    up("websiteName", websiteName.trim());
    up("apiUrl", apiUrl.trim());
    up("cacheEnabled", cacheEnabled);
    up("cacheMaxAgeMs", cacheEnabled ? cacheMaxAgeMs : undefined);
    up("description", description.trim());
    onSubmit();
  }

  return (
    <Modal title="Add HTTP Request Capability" onClose={onClose}>
      <div className="form">
        <div className="form__hint">
          Calls an external API. A <b>Website API</b> block will be auto-created or reused.
        </div>

        <div className="form__field">
          <label className="label">Method</label>
          <select
            className="select"
            value={method}
            onChange={(e) => { setMethod(e.target.value as HttpMethod); up("method", e.target.value); }}
          >
            <option value="GET">GET — fetch data</option>
            <option value="POST">POST — send data</option>
          </select>
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
            CRE nodes run in parallel — without cache, a request can be sent multiple times.
            Enable cache to prevent duplicate requests (recommended for non-idempotent POST).
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={cacheEnabled}
              onChange={(e) => { setCacheEnabled(e.target.checked); up("cacheEnabled", e.target.checked); }}
            />
            Enable cache
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
