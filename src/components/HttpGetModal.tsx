import { useState } from "react";
import { Modal } from "./Modal";
import type { KnownWebsite } from "./WebsiteApiPicker";
import { WebsiteApiPicker } from "./WebsiteApiPicker";

type HttpGetModalProps = {
  up: (k: string, v: any) => void;
  onSubmit: () => void;
  onClose: () => void;
  knownWebsites?: KnownWebsite[];
};

export function HttpGetModal({ up, onSubmit, onClose, knownWebsites = [] }: HttpGetModalProps) {
  const [websiteName, setWebsiteName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [description, setDescription] = useState("");

  const canSubmit = websiteName.trim() !== "" && apiUrl.trim() !== "";

  function handleSubmit() {
    if (!canSubmit) return;
    up("websiteName", websiteName.trim());
    up("apiUrl", apiUrl.trim());
    up("description", description.trim());
    onSubmit();
  }

  return (
    <Modal title="Add HTTP GET Capability" onClose={onClose}>
      <div className="form">
        <div className="form__hint">
          Fetches data from an external API. A <b>Website API</b> block will be auto-created or reused.
        </div>

        <WebsiteApiPicker
          websiteName={websiteName}
          apiUrl={apiUrl}
          knownWebsites={knownWebsites}
          onWebsiteNameChange={(v) => { setWebsiteName(v); up("websiteName", v.trim()); }}
          onApiUrlChange={(v) => { setApiUrl(v); up("apiUrl", v.trim()); }}
        />

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
