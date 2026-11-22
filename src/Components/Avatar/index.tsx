/* eslint-disable @next/next/no-img-element -- images can be data URLs uploaded by the user */
import { cn } from "@/lib/cn";

type Props = { src?: string; name: string; className?: string };

/* Background + a text colour that stays readable on it (each pair is 4.5:1 or better). */
const palette = [
  "bg-[#ff8a75] text-[#16213a]",
  "bg-[#8aa0d6] text-[#16213a]",
  "bg-[#16213a] text-white",
  "bg-[#f2a07b] text-[#16213a]",
  "bg-[#dfe5f3] text-[#16213a]",
  "bg-[#c8321f] text-white",
];

/** Photo if there is one, otherwise coloured initials (colour is stable per name). */
const Avatar = ({ src, name, className = "size-16 text-xl" }: Props) => {
  if (src) return <img src={src} alt={name} className={cn("shrink-0 object-cover", className)} />;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colour = palette[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % palette.length];
  return (
    <span role="img" aria-label={name} className={cn("grid shrink-0 place-items-center font-semibold", colour, className)}>
      {initials}
    </span>
  );
};

export default Avatar;
