"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type DeleteConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  recordLabel: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title = "Delete this item?",
  recordLabel,
  description,
  confirmLabel = "Delete",
  onConfirm,
}: DeleteConfirmationDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={
        description ??
        `This will permanently remove ${recordLabel}. This cannot be undone.`
      }
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
    />
  );
}
