import { Modal } from "./Modal";
import type { ModalType } from "./LeftPanel";

type ModalsPanelProps = {
  modal: { type: ModalType } | null;
  up: (k: string, v: any) => void;
  submitModal: () => void;
  closeModal: () => void;
};

export function ModalsPanel({ modal, up, submitModal, closeModal }: ModalsPanelProps) {
  if (!modal) return null;

  return (
    <>
      {modal.type === "trigger.cron" && (
        <Modal title="Create Cron Trigger" onClose={closeModal}>
          <div className="form">
            <div className="form__field">
              <label className="label">Name</label>
              <input className="input" onChange={(e) => up("name", e.target.value)} />
            </div>

            <div className="form__field">
              <label className="label">Description</label>
              <textarea className="textarea" rows={3} onChange={(e) => up("description", e.target.value)} />
            </div>

            <div className="form__grid">
              <div className="form__field">
                <label className="label">Frequency value</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  defaultValue={1}
                  onChange={(e) => up("frequencyValue", Number(e.target.value))}
                />
              </div>

              <div className="form__field">
                <label className="label">Unit</label>
                <select
                  className="select"
                  defaultValue="minutes"
                  onChange={(e) => up("frequencyUnit", e.target.value)}
                >
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                </select>
              </div>
            </div>

            <div className="form__actions">
              <button className="btn" onClick={submitModal}>Create</button>
              <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {modal.type === "trigger.evmLog" && (
        <Modal title="Create EVM Log Trigger" onClose={closeModal}>
          <div className="form">
            <div className="form__field">
              <label className="label">Smart Contract Name</label>
              <input className="input" onChange={(e) => up("smartContractName", e.target.value)} />
            </div>

            <div className="form__field">
              <label className="label">Event Name</label>
              <input className="input" onChange={(e) => up("eventName", e.target.value)} />
            </div>

            <div className="form__field">
              <label className="label">Description</label>
              <textarea className="textarea" rows={3} onChange={(e) => up("description", e.target.value)} />
            </div>

            <div className="form__actions">
              <button className="btn" onClick={submitModal}>Create</button>
              <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
            </div>

            <div className="form__hint">
              This will auto-create (or reuse) a <b>Smart Contract</b> block and add the event name
              inside it. The trigger block name will be the <b>Event Name</b>.
            </div>
          </div>
        </Modal>
      )}

      {modal.type === "trigger.http" && (
        <Modal title="Create HTTP Trigger" onClose={closeModal}>
          <div className="form">
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
              <button className="btn" onClick={submitModal}>Create</button>
              <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
            </div>

            <div className="form__hint">
              This trigger fires when the HTTP endpoint is invoked. A <b>Website</b> block
              will be auto-created or reused.
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
