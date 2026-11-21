"use client";
import React, { useEffect, useRef } from "react";
import { enhanceSelect } from "@/lib/listbox";

/**
 * A <select> with the Pulsa listbox in front of it (lib/listbox.ts). Takes the same props as <select>;
 * the native element stays in the page, so `value` / `onChange` work as usual and it still renders
 * as a plain select before hydration.
 */
export default function Select(props: React.ComponentProps<"select">) {
  const ref = useRef<HTMLSelectElement>(null);
  useEffect(() => (ref.current ? enhanceSelect(ref.current) : undefined), []);
  return <select ref={ref} {...props} />;
}
