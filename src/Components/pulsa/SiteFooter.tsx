import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer glass">
      <span>© {new Date().getFullYear()} Pulsa · A portfolio project by Antiqa. Not medical advice.</span>
      <nav aria-label="Footer">
        <Link href="/programs">Programs</Link>
        <Link href="/coaches">Coaches</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/login">Log in</Link>
        <a href="https://github.com/codelady-ship/My-Fitness-App">Source on GitHub</a>
      </nav>
    </footer>
  );
}
