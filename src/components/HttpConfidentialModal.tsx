import { useState } from "react";
import { Modal } from "./Modal";
import type { KnownWebsite } from "./WebsiteApiPicker";
import { WebsiteApiPicker } from "./WebsiteApiPicker";
import type { HttpMethod } from "../types";

type HttpConfidentialModalProps = {
  up: (k: string, v: any) => void;
  onSubmit: () => void;
  onClose: () => void;
  knownWebsites?: KnownWebsite[];
};

export function HttpConfidentialModal({ up, onSubmit, onClose, knownWebsites = [] }: HttpConfidentialModalProps) {
  const [method, setMethod] = useState<HttpMethod>("POST");
  const [websiteName, setWebsiteName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [secretKeysText, setSecretKeysText] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [encryptOutput, setEncryptOutput] = useState(false);
  const [description, setDescription] = useState("");

  const canSubmit = websiteName.trim() !== "" && apiUrl.trim() !== "";

  function parseKeys(text: string): string[] {
    return text.split("\n").map((k) => k.trim()).filter(Boolean);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    up("method", method);
    up("websiteName", websiteName.trim());
    up("apiUrl", apiUrl.trim());
    up("secretKeys", parseKeys(secretKeysText));
    up("ownerAddress", ownerAddress.trim() || undefined);
    up("encryptOutput", encryptOutput);
    up("description", description.trim());
    onSubmit();
  }

  return (
    <Modal title="Add HTTP Request Confidential Capability" onClose={onClose}>
      <div className="form">
        <div className="form__hint">
          Privacy-preserving HTTP request executed inside an <b>enclave</b>. Secrets are injected from the
          Vault DON via <code>{"{{.SECRET_NAME}}"}</code> templates and never exposed to DON nodes.
          A <b>Website API</b> block will be auto-created or reused.
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
          <label className="label">Vault DON secret keys <span className="muted">(one per line)</span></label>
          <div className="form__hint">
            Each key must match a secret stored in the Vault DON. Reference it in headers/body as
            <code>{" {{.KEY}}"}</code>.
          </div>
          <textarea
            className="textarea"
            rows={3}
            placeholder={"ANTHROPIC_API_KEY\nMY_API_TOKEN"}
            value={secretKeysText}
            onChange={(e) => { setSecretKeysText(e.target.value); up("secretKeys", parseKeys(e.target.value)); }}
          />
        </div>

        <div className="form__field">
          <label className="label">Secret owner address <span className="muted">(optional)</span></label>
          <input
            className="input"
            placeholder="0x... (address that created the Vault DON secrets)"
            value={ownerAddress}
            onChange={(e) => { setOwnerAddress(e.target.value); up("ownerAddress", e.target.value.trim() || undefined); }}
          />
        </div>

        <div className="form__field">
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={encryptOutput}
              onChange={(e) => { setEncryptOutput(e.target.checked); up("encryptOutput", e.target.checked); }}
            />
            Encrypt enclave response (encryptOutput)
          </label>
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
