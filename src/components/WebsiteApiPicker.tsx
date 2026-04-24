import { useState } from "react";

export type KnownWebsite = {
  websiteName: string;
  apiUrls: string[];
};

type WebsiteApiPickerProps = {
  websiteName: string;
  apiUrl: string;
  knownWebsites: KnownWebsite[];
  onWebsiteNameChange: (name: string) => void;
  onApiUrlChange: (url: string) => void;
  fieldClass?: string;
  websiteNameRequired?: boolean;
  apiUrlRequired?: boolean;
};

export function WebsiteApiPicker({
  websiteName,
  apiUrl,
  knownWebsites,
  onWebsiteNameChange,
  onApiUrlChange,
  fieldClass = "form__field",
  websiteNameRequired = true,
  apiUrlRequired = true,
}: WebsiteApiPickerProps) {
  const pickedWebsite = knownWebsites.find((w) => w.websiteName === websiteName) ?? null;
  const [addingNewUrl, setAddingNewUrl] = useState(false);
  const apiUrls = pickedWebsite?.apiUrls ?? [];

  function pickWebsite(name: string) {
    if (!name) {
      onWebsiteNameChange("");
      onApiUrlChange("");
      setAddingNewUrl(false);
    } else {
      const w = knownWebsites.find((k) => k.websiteName === name);
      if (w) {
        onWebsiteNameChange(w.websiteName);
        onApiUrlChange("");
        setAddingNewUrl(false);
      }
    }
  }

  return (
    <>
      {knownWebsites.length > 0 && (
        <div className={fieldClass}>
          <label className="label">Website API</label>
          <select
            className="select"
            value={pickedWebsite ? websiteName : ""}
            onChange={(e) => pickWebsite(e.target.value)}
          >
            <option value="">— New Website API —</option>
            {knownWebsites.map((w) => (
              <option key={w.websiteName} value={w.websiteName}>
                {w.websiteName}
              </option>
            ))}
          </select>
        </div>
      )}

      {!pickedWebsite && (
        <div className={fieldClass}>
          <label className="label">
            Website name{websiteNameRequired && <span className="req"> *</span>}
          </label>
          <input
            className="input"
            placeholder="e.g. CoinGecko"
            value={websiteName}
            onChange={(e) => onWebsiteNameChange(e.target.value)}
          />
        </div>
      )}

      <div className={fieldClass}>
        <label className="label">
          API URL{apiUrlRequired && <span className="req"> *</span>}
        </label>
        <select
          className="select"
          value={addingNewUrl || apiUrls.length === 0 ? "__new__" : apiUrl}
          onChange={(e) => {
            if (e.target.value === "__new__") {
              setAddingNewUrl(true);
              onApiUrlChange("");
            } else {
              setAddingNewUrl(false);
              onApiUrlChange(e.target.value);
            }
          }}
        >
          {apiUrls.length > 0 && !addingNewUrl && apiUrl === "" && (
            <option value="" disabled>Select API URL</option>
          )}
          {apiUrls.map((url) => (
            <option key={url} value={url}>{url}</option>
          ))}
          <option value="__new__">— Add new API URL —</option>
        </select>
        {(addingNewUrl || apiUrls.length === 0) && (
          <input
            className="input"
            style={{ marginTop: 6 }}
            placeholder="https://api.example.com/endpoint"
            autoFocus={addingNewUrl}
            value={apiUrl}
            onChange={(e) => onApiUrlChange(e.target.value)}
          />
        )}
      </div>
    </>
  );
}
