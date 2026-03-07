import React from "react";

export type ModalProps = {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

export function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="modal__backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button className="btn btn--ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
