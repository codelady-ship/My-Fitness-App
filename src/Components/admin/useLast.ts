import { useRef } from "react";

/** The last non-null value: a dialog keeps showing its record while it fades out after the parent cleared it. */
export function useLast<T>(value: T | null): T | null {
  const last = useRef<T | null>(value);
  if (value !== null) last.current = value;
  return last.current;
}
