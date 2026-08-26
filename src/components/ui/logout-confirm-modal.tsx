"use client";

// Logout confirmation modal: asks the user to confirm before ending session.
import { LogOut, X } from "lucide-react";

type LogoutConfirmModalProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function LogoutConfirmModal({
  open,
  onConfirm,
  onCancel,
}: LogoutConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[380px] rounded-2xl border border-border-default bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg border border-border-default bg-card text-text-muted transition hover:bg-surface-overlay hover:text-text-primary"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-crimson/10">
            <LogOut size={20} className="text-brand-crimson" />
          </span>
          <div>
            <h2 className="text-[15px] font-bold text-text-primary">
              Confirm Logout
            </h2>
            <p className="text-[12px] text-text-secondary">
              Are you sure you want to sign out?
            </p>
          </div>
        </div>

        <p className="mt-4 text-[13px] text-text-secondary">
          You will be redirected to the login page and your current session will
          end.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border-default bg-card px-4 py-2 text-[13px] font-semibold text-text-secondary transition hover:bg-surface-overlay"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-crimson px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
