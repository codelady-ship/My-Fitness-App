"use client";
import useSidebarStore from "../../../Store/SidebarStore";

/** Title bar used at the top of every page (holds the page's single h1). */
const PageHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => {
  const darkMode = useSidebarStore((s) => s.darkMode);
  return (
    <div
      className={`flex flex-col gap-3 border-b px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between ${
        darkMode ? "border-gray-700 bg-gray-950" : "border-amber-200 bg-amber-50/60"
      }`}
    >
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children && <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>}
    </div>
  );
};

export default PageHeader;
