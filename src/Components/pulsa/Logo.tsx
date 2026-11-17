import Link from "next/link";

const Logo = ({ href = "/" }: { href?: string }) => (
  <Link href={href} className="logo" aria-label="Pulsa home">
    <span className="logo-mark" aria-hidden="true">
      P
    </span>
    <span aria-hidden="true">PULSA</span>
  </Link>
);

export default Logo;
