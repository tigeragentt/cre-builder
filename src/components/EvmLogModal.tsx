import { useState } from "react";
import { Modal } from "./Modal";
import type { EvmConfidenceLevel } from "../types";

// Common CRE-supported networks
const CHAIN_OPTIONS = [
  { label: "Select network", value: "" },
  { label: "Ethereum Sepolia (testnet)", value: "ethereum-testnet-sepolia" },
  { label: "Ethereum Mainnet", value: "ethereum-mainnet" },
  { label: "Avalanche Fuji (testnet)", value: "avalanche-testnet-fuji" },
  { label: "Polygon Amoy (testnet)", value: "polygon-testnet-amoy" },
  { label: "Base Sepolia (testnet)", value: "base-testnet-sepolia" },
  { label: "Arbitrum Sepolia (testnet)", value: "arbitrum-testnet-sepolia" },
  { label: "Other (type below)", value: "other" },
];

type EvmLogModalProps = {
  up: (k: string, v: any) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function EvmLogModal({ up, onSubmit, onClose }: EvmLogModalProps) {
  const [smartContractName, setSmartContractName] = useState("");
  const [eventName, setEventName] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [chainPreset, setChainPreset] = useState("");
  const [chainCustom, setChainCustom] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState<EvmConfidenceLevel | "">("");
  const [confirmationBlocks, setConfirmationBlocks] = useState(1);
  const [description, setDescription] = useState("");

  const chainSelector = chainPreset === "other" ? chainCustom : chainPreset;

  function sync() {
    up("smartContractName", smartContractName.trim());
    up("eventName", eventName.trim());
    up("contractAddress", contractAddress.trim() || undefined);
    up("chainSelector", chainSelector.trim());
    up("confidenceLevel", confidenceLevel);
    up("confirmationBlocks", confirmationBlocks);
    up("description", description.trim());
  }

  function handleSubmit() {
    if (!smartContractName.trim() || !eventName.trim() || !chainSelector.trim()) return;
    sync();
    onSubmit();
  }

  const canSubmit =
    smartContractName.trim() !== "" &&
    eventName.trim() !== "" &&
    chainSelector.trim() !== "" &&
    confidenceLevel !== "";

  return (
    <Modal title="Create EVM Log Trigger" onClose={onClose}>
      <div className="form">
        <div className="form__hint">
          Fires when the specified event is emitted by the contract.
          A <b>Smart Contract</b> block will be auto-created or reused.
        </div>

        {/* Smart Contract Name */}
        <div className="form__field">
          <label className="label">Smart contract name <span className="req">*</span></label>
          <input
            className="input"
            placeholder="e.g. PriceFeed"
            value={smartContractName}
            onChange={(e) => { setSmartContractName(e.target.value); up("smartContractName", e.target.value.trim()); }}
          />
        </div>

        {/* Event Name */}
        <div className="form__field">
          <label className="label">Event name <span className="req">*</span></label>
          <input
            className="input"
            placeholder="e.g. PriceUpdated"
            value={eventName}
            onChange={(e) => { setEventName(e.target.value); up("eventName", e.target.value.trim()); }}
          />
        </div>

        {/* Contract Address (optional) */}
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

        {/* Chain / Network */}
        <div className="form__field">
          <label className="label">Network <span className="req">*</span></label>
          <select
            className="select"
            value={chainPreset}
            onChange={(e) => { setChainPreset(e.target.value); up("chainSelector", e.target.value !== "other" ? e.target.value : chainCustom); }}
          >
            {CHAIN_OPTIONS.map((o) => (
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
