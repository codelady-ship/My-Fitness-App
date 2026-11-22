"use client";
import { useEffect, useState } from "react";
import { Loader2Icon, TriangleAlertIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { writeErrorMessage } from "@/Store/DataStore";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** red confirm button (deletes); otherwise coral */
  destructive?: boolean;
  /** Runs before the dialog closes. If it rejects, the dialog stays open and shows the reason; nothing else happens. */
  onConfirm: () => void | Promise<void>;
  /** After `onConfirm` succeeded and the dialog closed. */
  onDone?: () => void;
};

/** "Are you sure?" as a shadcn AlertDialog (no window.confirm: the admin also runs in a sandboxed iframe). */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onDone,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) setError("");
  }, [open]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(writeErrorMessage(err));
      setBusy(false);
      return;
    }
    setBusy(false);
    onOpenChange(false);
    onDone?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlertIcon aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="rounded-xl bg-accent px-3.5 py-2.5 text-sm font-medium text-[#8f2a1b]">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <Button type="button" variant={destructive ? "destructive" : "default"} onClick={confirm} disabled={busy} aria-busy={busy}>
            {busy && <Loader2Icon aria-hidden className="animate-spin" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
