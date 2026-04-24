import { useState } from "react";
import { Modal } from "./Modal";
import type { KnownWebsite } from "./WebsiteApiPicker";
import { WebsiteApiPicker } from "./WebsiteApiPicker";

type HttpTriggerModalProps = {
  up: (k: string, v: any) => void;
  onSubmit: () => void;
  onClose: () => void;
  knownWebsites?: KnownWebsite[];
};

export function HttpTriggerModal({ up, onSubmit, onClose, knownWebsites = [] }: HttpTriggerModalProps) {
  const [websiteName, setWebsiteName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit() {
    if (!websiteName.trim()) return;
    up("websiteName", websiteName.trim());
    up("apiUrl", apiUrl.trim());
    up("description", description.trim());
    onSubmit();
  }

  return (
    <Modal title="Create HTTP Trigger" onClose={onClose}>
      <div className="form">
        <div className="form__hint">
          This trigger fires when an external system sends a signed HTTP POST to the CRE gateway.
          A <b>Website API</b> block will be auto-created to represent the caller.
        </div>

        <WebsiteApiPicker
          websiteName={websiteName}
          apiUrl={apiUrl}
          knownWebsites={knownWebsites}
          onWebsiteNameChange={(v) => { setWebsiteName(v); up("websiteName", v.trim()); }}
          onApiUrlChange={(v) => { setApiUrl(v); up("apiUrl", v.trim()); }}
          apiUrlRequired={false}
        />

        <div className="form__field">
          <label className="label">Authorized public keys <span className="muted">(one per line)</span></label>
          <textarea
            className="textarea"
            rows={4}
            placeholder={"Leave empty for simulation.\nPaste ECDSA public keys for production deployment."}
            onChange={(e) =>
              up(
                "authorizedKeys",
                e.target.value.split("\n").map((k) => k.trim()).filter(Boolean)
              )
            }
          />
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
          <button className="btn" onClick={handleSubmit} disabled={!websiteName.trim()}>Create</button>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
