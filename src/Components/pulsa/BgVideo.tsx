"use client";
import { useEffect, useRef, useState } from "react";

type Props = { src: string; webm?: string; poster: string; className?: string; position?: string };

/**
 * Full-bleed, muted, looping background clip.
 * - If the browser pauses autoplay (low-power mode, data saver), play() is retried on the first
 *   interaction and whenever the tab becomes visible again.
 * - With prefers-reduced-motion the clip is not played; the poster stays.
 * - Decorative: hidden from assistive tech.
 */
export default function BgVideo({ src, webm, poster, className = "", position }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (reduced) {
      v.pause();
      return;
    }
    const tryPlay = () => {
      if (document.visibilityState !== "visible" || !v.paused) return;
      v.muted = true; // some browsers drop the muted attribute after hydration
      const p = v.play();
      if (p)
        p.catch(() => {
          /* still blocked; next interaction retries */
        });
    };
    const events = ["pointerdown", "touchstart", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, tryPlay, { passive: true }));
    document.addEventListener("visibilitychange", tryPlay);
    tryPlay();
    return () => {
      events.forEach((e) => window.removeEventListener(e, tryPlay));
      document.removeEventListener("visibilitychange", tryPlay);
    };
  }, [reduced]);

  return (
    <div className={`media-bg ${className}`} aria-hidden="true">
      <video
        ref={ref}
        muted
        loop
        playsInline
        autoPlay={!reduced}
        preload="auto"
        poster={poster}
        disablePictureInPicture
        tabIndex={-1}
        style={position ? { objectPosition: position } : undefined}
      >
        {webm && <source src={webm} type="video/webm" />}
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
