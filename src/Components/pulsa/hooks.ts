"use client";
import { useEffect, useRef, useState } from "react";

/** true when the visitor asked the OS for less motion. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Count from 0 to `target` over `duration` ms (easeOutCubic) after `delay` ms.
 * Server render and reduced motion show the final value.
 */
export function useCountUp(target: number, { duration = 1400, delay = 0, decimals = 0 } = {}) {
  const [value, setValue] = useState(target);
  const raf = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    setValue(0);
    let start = 0;
    const timer = window.setTimeout(() => {
      const step = (now: number) => {
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        setValue(target * easeOutCubic(t));
        if (t < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf.current);
    };
  }, [target, duration, delay]);
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Pointer parallax: writes eased --mx / --my (-1…1) on the element.
 * Children use them with their own depth. Off for touch and reduced motion.
 */
export function useParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let tx = 0,
      ty = 0,
      x = 0,
      y = 0,
      frame = 0;
    const tick = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      el.style.setProperty("--mx", x.toFixed(4));
      el.style.setProperty("--my", y.toFixed(4));
      frame = Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);
  return ref;
}
