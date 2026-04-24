import { useState } from "react";
import { Modal } from "./Modal";
import { EVM_CHAIN_OPTIONS } from "./evmChainOptions";
import type { KnownContract } from "./ModalsPanel";

type EvmWriteModalProps = {
  up: (k: string, v: any) => void;
  onSubmit: () => void;
  onClose: () => void;
  knownContracts?: KnownContract[];
};

export function EvmWriteModal({ up, onSubmit, onClose, knownContracts = [] }: EvmWriteModalProps) {
  const [pickedContract, setPickedContract] = useState<KnownContract | null>(null);
  const [smartContractName, setSmartContractName] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [chainPreset, setChainPreset] = useState("");
  const [chainCustom, setChainCustom] = useState("");
  const [description, setDescription] = useState("");
  const [addingNewFn, setAddingNewFn] = useState(false);

  const chainSelector = chainPreset === "other" ? chainCustom : chainPreset;

  function applyChain(selector: string) {
    const isKnown = EVM_CHAIN_OPTIONS.some(
      (o) => o.value === selector && o.value !== "" && o.value !== "other"
    );
    if (isKnown) {
      setChainPreset(selector);
      setChainCustom("");
    } else {
      setChainPreset("other");
      setChainCustom(selector);
    }
    up("chainSelector", selector);
  }

  function pickContract(name: string) {
    if (!name) {
      setPickedContract(null);
      setSmartContractName("");
      setContractAddress("");
      setChainPreset("");
      setChainCustom("");
      setFunctionName("");
      setAddingNewFn(false);
      up("smartContractName", "");
      up("contractAddress", undefined);
      up("chainSelector", "");
      return;
    }
    const c = knownContracts.find((k) => k.contractName === name) ?? null;
    setPickedContract(c);
    if (c) {
      setSmartContractName(c.contractName);
      up("smartContractName", c.contractName);
      setContractAddress(c.contractAddress ?? "");
      up("contractAddress", c.contractAddress || undefined);
      if (c.chainSelector) applyChain(c.chainSelector);
      setFunctionName("");
      setAddingNewFn(false);
      up("functionName", "");
    }
  }

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

  const fnOptions = pickedContract?.functions ?? [];

  return (
    <Modal title="Add EVM Write Capability" onClose={onClose}>
      <div className="form">
        <div className="form__hint">
          Writes data to a smart contract state-changing function.
          A <b>Smart Contract</b> block will be auto-created or reused.
        </div>

        {knownContracts.length > 0 && (
          <div className="form__field">
            <label className="label">Smart contract</label>
            <select
              className="select"
              value={pickedContract?.contractName ?? ""}
              onChange={(e) => pickContract(e.target.value)}
            >
              <option value="">— New smart contract —</option>
              {knownContracts.map((c) => (
                <option key={c.contractName} value={c.contractName}>
                  {c.contractName}
                  {c.contractAddress ? ` (${c.contractAddress.slice(0, 10)}…)` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {!pickedContract && (
          <div className="form__field">
            <label className="label">Smart contract name <span className="req">*</span></label>
            <input
              className="input"
              placeholder="e.g. PriceFeed"
              value={smartContractName}
              onChange={(e) => { setSmartContractName(e.target.value); up("smartContractName", e.target.value.trim()); }}
            />
          </div>
        )}

        <div className="form__field">
          <label className="label">Function name <span className="req">*</span></label>
          {fnOptions.length > 0 ? (
            <>
              <select
                className="select"
                value={addingNewFn ? "__new__" : functionName}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setAddingNewFn(true);
                    setFunctionName("");
                    up("functionName", "");
                  } else {
                    setAddingNewFn(false);
                    setFunctionName(e.target.value);
                    up("functionName", e.target.value);
                  }
                }}
              >
                <option value="" disabled>Select function</option>
                {fnOptions.map((fn) => (
                  <option key={fn} value={fn}>{fn}</option>
                ))}
                <option value="__new__">— Add new function —</option>
              </select>
              {addingNewFn && (
                <input
                  className="input"
                  style={{ marginTop: 6 }}
                  placeholder="e.g. updatePrice"
                  autoFocus
                  value={functionName}
                  onChange={(e) => { setFunctionName(e.target.value); up("functionName", e.target.value.trim()); }}
                />
              )}
            </>
          ) : (
            <input
              className="input"
              placeholder="e.g. updatePrice"
              value={functionName}
              onChange={(e) => { setFunctionName(e.target.value); up("functionName", e.target.value.trim()); }}
            />
          )}
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
