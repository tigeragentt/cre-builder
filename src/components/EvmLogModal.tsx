import { useState } from "react";
import { Modal } from "./Modal";
import { EVM_CHAIN_OPTIONS } from "./evmChainOptions";
import type { EvmConfidenceLevel } from "../types";
import type { KnownContract } from "./ModalsPanel";

type EvmLogModalProps = {
  up: (k: string, v: any) => void;
  onSubmit: () => void;
  onClose: () => void;
  knownContracts?: KnownContract[];
};

export function EvmLogModal({ up, onSubmit, onClose, knownContracts = [] }: EvmLogModalProps) {
  const [pickedContract, setPickedContract] = useState<KnownContract | null>(null);
  const [smartContractName, setSmartContractName] = useState("");
  const [eventName, setEventName] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [chainPreset, setChainPreset] = useState("");
  const [chainCustom, setChainCustom] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState<EvmConfidenceLevel | "">("");
  const [confirmationBlocks, setConfirmationBlocks] = useState(1);
  const [description, setDescription] = useState("");
  const [addingNewEvent, setAddingNewEvent] = useState(false);

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
      setEventName("");
      setAddingNewEvent(false);
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
      setEventName("");
      setAddingNewEvent(false);
      up("eventName", "");
    }
  }

  const canSubmit =
    smartContractName.trim() !== "" &&
    eventName.trim() !== "" &&
    chainSelector.trim() !== "" &&
    confidenceLevel !== "";

  function handleSubmit() {
    if (!canSubmit) return;
    up("smartContractName", smartContractName.trim());
    up("eventName", eventName.trim());
    up("contractAddress", contractAddress.trim() || undefined);
    up("chainSelector", chainSelector.trim());
    up("confidenceLevel", confidenceLevel);
    up("confirmationBlocks", confirmationBlocks);
    up("description", description.trim());
    onSubmit();
  }

  const eventOptions = pickedContract?.events ?? [];

  return (
    <Modal title="Create EVM Log Trigger" onClose={onClose}>
      <div className="form">
        <div className="form__hint">
          Fires when the specified event is emitted by the contract.
          A <b>Smart Contract</b> block will be auto-created or reused.
        </div>

        {/* Contract picker */}
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

        {/* Smart Contract Name — hidden when a known contract is picked */}
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

        {/* Event Name */}
        <div className="form__field">
          <label className="label">Event name <span className="req">*</span></label>
          {eventOptions.length > 0 ? (
            <>
              <select
                className="select"
                value={addingNewEvent ? "__new__" : eventName}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setAddingNewEvent(true);
                    setEventName("");
                    up("eventName", "");
                  } else {
                    setAddingNewEvent(false);
                    setEventName(e.target.value);
                    up("eventName", e.target.value);
                  }
                }}
              >
                <option value="" disabled>Select event</option>
                {eventOptions.map((ev) => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
                <option value="__new__">— Add new event —</option>
              </select>
              {addingNewEvent && (
                <input
                  className="input"
                  style={{ marginTop: 6 }}
                  placeholder="e.g. PriceUpdated"
                  autoFocus
                  value={eventName}
                  onChange={(e) => { setEventName(e.target.value); up("eventName", e.target.value.trim()); }}
                />
              )}
            </>
          ) : (
            <input
              className="input"
              placeholder="e.g. PriceUpdated"
              value={eventName}
              onChange={(e) => { setEventName(e.target.value); up("eventName", e.target.value.trim()); }}
            />
          )}
        </div>

        {/* Contract Address */}
        <div className="form__field">
          <label className="label">
            Contract address <span className="muted">(optional — leave empty if not deployed yet)</span>
          </label>
          <input
            className="input"
            placeholder="0x..."
            value={contractAddress}
            onChange={(e) => { setContractAddress(e.target.value); up("contractAddress", e.target.value.trim() || undefined); }}
          />
        </div>

        {/* Network */}
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

        {/* Confidence Level */}
        <div className="form__field">
          <label className="label">Confidence level <span className="req">*</span></label>
          <select
            className="select"
            value={confidenceLevel}
            onChange={(e) => { setConfidenceLevel(e.target.value as EvmConfidenceLevel); up("confidenceLevel", e.target.value); }}
          >
            <option value="" disabled>Select confidence level</option>
            <option value="Finalized">Finalized (safest — waits for block finality)</option>
            <option value="Safe">Safe (fewer confirmations than Finalized)</option>
            <option value="Custom">Custom (specify block count)</option>
          </select>
          {confidenceLevel === "Custom" && (
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <input
                className="input"
                type="number"
                min={1}
                style={{ width: 100 }}
                value={confirmationBlocks}
                onChange={(e) => { setConfirmationBlocks(Number(e.target.value)); up("confirmationBlocks", Number(e.target.value)); }}
              />
              <span className="muted" style={{ fontSize: 12 }}>block confirmations</span>
            </div>
          )}
        </div>

        {/* Description */}
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
          <button className="btn" onClick={handleSubmit} disabled={!canSubmit}>
            Create
          </button>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
