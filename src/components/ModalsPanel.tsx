import { Modal } from "./Modal";
import { CronModal } from "./CronModal";
import { EvmLogModal } from "./EvmLogModal";
import { EvmReadModal } from "./EvmReadModal";
import { EvmWriteModal } from "./EvmWriteModal";
import { HttpPostModal } from "./HttpPostModal";
import type { ModalType } from "./LeftPanel";

type ModalsPanelProps = {
  modal: { type: ModalType; initialData?: Record<string, any> } | null;
  up: (k: string, v: any) => void;
  submitModal: () => void;
  closeModal: () => void;
};

export function ModalsPanel({ modal, up, submitModal, closeModal }: ModalsPanelProps) {
  if (!modal) return null;

  return (
    <>
      {modal.type === "trigger.cron" && (
        <CronModal up={up} onSubmit={submitModal} onClose={closeModal} />
      )}

      {modal.type === "edit.trigger.cron" && (
        <CronModal
          up={up}
          onSubmit={submitModal}
          onClose={closeModal}
          initialData={modal.initialData}
          mode="edit"
        />
      )}

      {modal.type === "trigger.evmLog" && (
        <EvmLogModal up={up} onSubmit={submitModal} onClose={closeModal} />
      )}

      {modal.type === "trigger.http" && (
        <Modal title="Create HTTP Trigger" onClose={closeModal}>
          <div className="form">
            <div className="form__hint">
              This trigger fires when an external system sends a signed HTTP POST to the CRE gateway.
              A <b>Website</b> block will be auto-created to represent the caller.
            </div>

            <div className="form__field">
              <label className="label">Website caller</label>
              <input className="input" placeholder="e.g. Price Feed Service" onChange={(e) => up("websiteName", e.target.value)} />
            </div>

            <div className="form__field">
              <label className="label">Caller URL <span className="muted">(optional, for reference)</span></label>
              <input className="input" placeholder="e.g. https://api.example.com" onChange={(e) => up("apiUrl", e.target.value)} />
            </div>

            <div className="form__field">
              <label className="label">Authorized public keys <span className="muted">(one per line)</span></label>
              <textarea
                className="textarea"
                rows={4}
                placeholder={"Leave empty for simulation.\nPaste ECDSA public keys for production deployment."}
                onChange={(e) =>
                  up(
                    "authorizedKeys",
                    e.target.value
                      .split("\n")
                      .map((k) => k.trim())
                      .filter(Boolean)
                  )
                }
              />
            </div>

            <div className="form__field">
              <label className="label">Description</label>
              <textarea className="textarea" rows={2} onChange={(e) => up("description", e.target.value)} />
            </div>

            <div className="form__actions">
              <button className="btn" onClick={submitModal}>Create</button>
              <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {modal.type === "cap.http.get" && (
        <Modal title="Add HTTP GET Capability" onClose={closeModal}>
          <div className="form">
            <div className="form__hint">
              Fetches data from an external API. A <b>Website</b> block will be auto-created or reused.
            </div>
            <div className="form__field">
              <label className="label">Website name</label>
              <input className="input" placeholder="e.g. CoinGecko" onChange={(e) => up("websiteName", e.target.value)} />
            </div>
            <div className="form__field">
              <label className="label">API URL</label>
              <input className="input" placeholder="https://api.example.com/data" onChange={(e) => up("apiUrl", e.target.value)} />
            </div>
            <div className="form__field">
              <label className="label">Description</label>
              <textarea className="textarea" rows={2} onChange={(e) => up("description", e.target.value)} />
            </div>
            <div className="form__actions">
              <button className="btn" onClick={submitModal}>Add</button>
              <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {modal.type === "cap.http.post" && (
        <HttpPostModal up={up} onSubmit={submitModal} onClose={closeModal} />
      )}

      {modal.type === "cap.evmRead" && (
        <EvmReadModal up={up} onSubmit={submitModal} onClose={closeModal} />
      )}

      {modal.type === "cap.evmWrite" && (
        <EvmWriteModal up={up} onSubmit={submitModal} onClose={closeModal} />
      )}
    </>
  );
}
