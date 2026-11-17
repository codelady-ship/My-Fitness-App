import SiteNav from "@/src/Components/pulsa/SiteNav";
import SiteFooter from "@/src/Components/pulsa/SiteFooter";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page">
      <SiteNav />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
