/* eslint-disable @next/next/no-img-element -- images can be data URLs uploaded by the user */
type Props = { src?: string; name: string; className?: string };

const palette = ["bg-[#ff8a75]", "bg-[#6f86c6]", "bg-[#16213a]", "bg-[#f2a07b]", "bg-[#8aa0d6]", "bg-[#d9442f]"];

/** Photo if there is one, otherwise coloured initials (colour is stable per name). */
const Avatar = ({ src, name, className = "h-16 w-16 text-xl" }: Props) => {
  if (src) return <img src={src} alt={name} className={`${className} object-cover`} />;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colour = palette[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % palette.length];
  return (
    <span role="img" aria-label={name} className={`${className} ${colour} grid shrink-0 place-items-center font-semibold text-white`}>
      {initials}
    </span>
  );
};

export default Avatar;
