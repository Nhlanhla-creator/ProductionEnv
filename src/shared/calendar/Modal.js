import React, { useEffect } from "react";
import styled from "styled-components";
import { X } from "lucide-react";

const Overlay = styled.div`
  position: fixed;

  inset: 0;

  z-index: 5000;

  display: flex;

  align-items: center;
  justify-content: center;

  padding: clamp(10px, 2vw, 24px);

  background: rgba(35, 25, 21, 0.48);

  backdrop-filter: blur(3px);

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
    background: rgba(
      141,
      110,
      99,
      0.45
    );

    border-radius: 10px;
  }
`;

const CloseButton = styled.button`
  position: absolute;

  top: 12px;
  right: 12px;

  z-index: 20;

  width: 36px;
  height: 36px;

  display: flex;

  align-items: center;
  justify-content: center;

  border: none;

  border-radius: 50%;

  color: #5d4037;

  background: rgba(
    255,
    255,
    255,
    0.9
  );

  box-shadow:
    0 4px 15px
    rgba(62, 39, 35, 0.12);

  cursor: pointer;

  transition:
    background 0.2s ease,
    transform 0.2s ease;

  &:hover {
    background: #ffffff;

    transform: scale(1.04);
  }
`;

const Modal = ({
  children,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [onClose]);

  return (
    <Overlay
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <ModalShell>
        <CloseButton
          type="button"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={19} />
        </CloseButton>

        {children}
      </ModalShell>
    </Overlay>
  );
};

export default Modal;