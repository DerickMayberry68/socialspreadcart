"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

type HandledErrorAlertProps = {
  open: boolean;
  title?: string;
  message: string;
  actionLabel?: string;
  onOpenChange: (open: boolean) => void;
};

function sanitizeMessage(message: string) {
  const cleaned = message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !line.startsWith("at ") &&
        !line.includes("webpack-internal://") &&
        !line.includes("node_modules/") &&
        line !== "Call Stack",
    )
    .join(" ");

  return cleaned || "Something went wrong. Please try again.";
}

export function HandledErrorAlert({
  open,
  title = "Something went wrong",
  message,
  actionLabel = "OK",
  onOpenChange,
}: HandledErrorAlertProps) {
  const displayMessage = sanitizeMessage(message);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-red-100 bg-white p-7 text-center shadow-soft outline-none">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-red-100 bg-red-50 text-red-600">
            <AlertTriangle className="h-8 w-8" aria-hidden="true" />
          </div>
          <Dialog.Title className="mt-5 font-heading text-3xl text-[#284237]">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6 text-ink/65">
            {displayMessage}
          </Dialog.Description>
          <div className="mt-6 flex justify-center">
            <Dialog.Close asChild>
              <Button type="button">{actionLabel}</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
