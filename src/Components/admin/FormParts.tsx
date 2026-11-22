"use client";
/* eslint-disable @next/next/no-img-element -- the preview can be a data URL picked by the user */
import { useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DEFAULT_AVATAR, fileToAvatar } from "@/lib/utils";

/** Label above a control. Pass the control's id as `htmlFor`. */
export const Field = ({ label, htmlFor, children, className }: { label: string; htmlFor: string; children: React.ReactNode; className?: string }) => (
  <div className={`grid content-start gap-1.5 ${className ?? ""}`}>
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
  </div>
);

/** A form select: full width of its field, value posted under `name` (read with FormData). */
export const FormSelect = ({
  id,
  name,
  defaultValue,
  options,
}: {
  id: string;
  name: string;
  defaultValue: string;
  options: readonly (readonly [value: string, label: string])[];
}) => (
  <Select name={name} defaultValue={defaultValue}>
    <SelectTrigger id={id} className="w-full">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map(([value, label]) => (
        <SelectItem key={value} value={value}>
          {label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

/** Round photo preview with a button that opens the file picker. `onPick` gets a small JPEG data URL. */
export const PhotoField = ({ src, label, onPick }: { src: string; label: string; onPick: (dataUrl: string) => void }) => {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-4">
      <img src={src || DEFAULT_AVATAR} alt="Photo preview" className="size-20 shrink-0 rounded-full border-2 border-primary object-cover" />
      <div className="grid gap-1.5">
        <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
          {label}
        </Button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              onPick(await fileToAvatar(file));
            } catch {
              /* ignore files that are not images */
            }
          }}
        />
      </div>
    </div>
  );
};

/** Validation or server message inside a form dialog (the dialog stays open). */
export const FormError = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  // the form scrolls inside the dialog: bring the message into view when it appears or changes
  useEffect(() => {
    if (children) ref.current?.scrollIntoView({ block: "nearest" });
  }, [children]);
  return children ? (
    <p ref={ref} role="alert" className="rounded-xl bg-accent px-3.5 py-2.5 text-sm font-medium text-[#8f2a1b]">
      {children}
    </p>
  ) : null;
};
