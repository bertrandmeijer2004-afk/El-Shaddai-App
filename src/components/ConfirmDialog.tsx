"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/Modal";

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  loading = false,
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onCancel} title={title} dismissable={!loading} maxWidth="max-w-md">
      <div className="text-base leading-relaxed">{children}</div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading} data-autofocus>
          Batal
        </button>
        <button type="button" className={`btn ${danger ? "btn-danger" : ""}`} onClick={onConfirm} disabled={loading}>
          {loading ? "Memproses…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
