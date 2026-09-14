import React, { useEffect } from "react";
import styled from "styled-components";
import { X } from "lucide-react";
import "./Modal.css";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(10px, 2vw, 24px);
  background: rgba(35, 25, 21, 0.52);
  backdrop-filter: blur(4px);
  overflow: hidden;
`;

const ModalShell = styled.div`
  position: relative;
  width: min(1280px, 100%);
  max-width: 100%;
  max-height: calc(100dvh - 24px);
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 20px;
  overscroll-behavior: contain;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(141, 110, 99, 0.45);
    border-radius: 10px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 20;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(93, 64, 55, 0.15);
  border-radius: 50%;
  color: #5d4037;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 4px 15px rgba(62, 39, 35, 0.12);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #ffffff;
    color: #3e2723;
    transform: scale(1.05);
  }
`;

const Modal = ({ children, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <Overlay
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <ModalShell>
        <CloseButton type="button" onClick={onClose} aria-label="Close modal">
          <X size={19} />
        </CloseButton>
        {children}
      </ModalShell>
    </Overlay>
  );
};

export default Modal;
