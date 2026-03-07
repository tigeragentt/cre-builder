import { Modal } from "./Modal";
import { CronModal } from "./CronModal";
import { EvmLogModal } from "./EvmLogModal";
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

      {modal.type === "cap.http" && (
        <Modal title="Add HTTP Capability" onClose={closeModal}>
          <div className="form">
            <div className="form__hint">
              Attaches after the selected Trigger/Capability (or the only Trigger). The capability
              name will be the <b>Website name</b>.
            </div>

            <div className="form__field">
              <label className="label">Website name</label>
              <input className="input" onChange={(e) => up("websiteName", e.target.value)} />
            </div>

            <div className="form__field">
              <label className="label">API URL</label>
              <input className="input" onChange={(e) => up("apiUrl", e.target.value)} />
            </div>

            <div className="form__field">
              <label className="label">Description</label>
              <textarea className="textarea" rows={3} onChange={(e) => up("description", e.target.value)} />
            </div>

            <div className="form__actions">
              <button className="btn" onClick={submitModal}>Add</button>
              <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
            </div>

            <div className="form__hint">
              This will auto-create (or reuse) a <b>Website</b> block and add the API URL inside it.
            </div>
          </div>
        </Modal>
      )}

      {(modal.type === "cap.evmRead" || modal.type === "cap.evmWrite") && (
        <Modal
          title={modal.type === "cap.evmRead" ? "Add EVM Read Capability" : "Add EVM Write Capability"}
          onClose={closeModal}
        >
          <div className="form">
            <div className="form__hint">
              Attaches after the selected Trigger/Capability (or the only Trigger). The capability
              name will be the <b>Function name</b>.
            </div>

            <div className="form__field">
              <label className="label">Smart Contract Name</label>
              <input className="input" onChange={(e) => up("smartContractName", e.target.value)} />
            </div>

            <div className="form__field">
              <label className="label">Function name</label>
              <input className="input" onChange={(e) => up("functionName", e.target.value)} />
            </div>

            <div className="form__field">
              <label className="label">Description</label>
              <textarea className="textarea" rows={3} onChange={(e) => up("description", e.target.value)} />
            </div>

            <div className="form__actions">
              <button className="btn" onClick={submitModal}>Add</button>
              <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
            </div>

            <div className="form__hint">
              This will auto-create (or reuse) a <b>Smart Contract</b> block and add the function
              name inside it.
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
