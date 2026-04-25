"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-sage/20 bg-white p-7 text-center shadow-soft outline-none">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-sage/15 bg-sage-50 text-sage-700">
            <HelpCircle className="h-8 w-8" aria-hidden="true" />
          </div>
          <Dialog.Title className="mt-5 font-heading text-3xl text-[#284237]">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6 text-ink/65">
            {description}
          </Dialog.Description>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              variant="outline"
              className="w-full border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 sm:w-auto"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
