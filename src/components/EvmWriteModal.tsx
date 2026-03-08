import { useState } from "react";
import { Modal } from "./Modal";
import { EVM_CHAIN_OPTIONS } from "./evmChainOptions";

type EvmWriteModalProps = {
  up: (k: string, v: any) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function EvmWriteModal({ up, onSubmit, onClose }: EvmWriteModalProps) {
  const [smartContractName, setSmartContractName] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [chainPreset, setChainPreset] = useState("");
  const [chainCustom, setChainCustom] = useState("");
  const [description, setDescription] = useState("");

  const chainSelector = chainPreset === "other" ? chainCustom : chainPreset;

  const canSubmit =
    smartContractName.trim() !== "" &&
    functionName.trim() !== "" &&
    chainSelector.trim() !== "";

  function handleSubmit() {
    if (!canSubmit) return;
    up("smartContractName", smartContractName.trim());
    up("functionName", functionName.trim());
    up("contractAddress", contractAddress.trim() || undefined);
    up("chainSelector", chainSelector.trim());
    up("description", description.trim());
    onSubmit();
  }

  return (
    <Modal title="Add EVM Write Capability" onClose={onClose}>
      <div className="form">
        <div className="form__hint">
          Writes data to a smart contract state-changing function.
          A <b>Smart Contract</b> block will be auto-created or reused.
        </div>

        <div className="form__field">
          <label className="label">Smart contract name <span className="req">*</span></label>
          <input
            className="input"
            placeholder="e.g. PriceFeed"
            value={smartContractName}
            onChange={(e) => { setSmartContractName(e.target.value); up("smartContractName", e.target.value.trim()); }}
          />
        </div>

        <div className="form__field">
          <label className="label">Function name <span className="req">*</span></label>
          <input
            className="input"
            placeholder="e.g. updatePrice"
            value={functionName}
            onChange={(e) => { setFunctionName(e.target.value); up("functionName", e.target.value.trim()); }}
          />
        </div>

        <div className="form__field">
          <label className="label">Contract address <span className="muted">(optional — leave empty if not deployed yet)</span></label>
          <input
            className="input"
            placeholder="0x..."
            value={contractAddress}
            onChange={(e) => { setContractAddress(e.target.value); up("contractAddress", e.target.value.trim() || undefined); }}
          />
        </div>

        <div className="form__field">
          <label className="label">Network <span className="req">*</span></label>
          <select
            className="select"
            value={chainPreset}
            onChange={(e) => { setChainPreset(e.target.value); up("chainSelector", e.target.value !== "other" ? e.target.value : chainCustom); }}
          >
            {EVM_CHAIN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {chainPreset === "other" && (
            <input
              className="input"
              style={{ marginTop: 6 }}
              placeholder="Enter chain selector"
              value={chainCustom}
              onChange={(e) => { setChainCustom(e.target.value); up("chainSelector", e.target.value.trim()); }}
            />
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
