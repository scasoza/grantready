"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  {
    href: "/staff",
    label: "Staff",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    href: "/documents",
    label: "Docs",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
];

function TabContent({ icon, label, isActive }: { icon: string; label: string; isActive: boolean }) {
  return (
    <>
      <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${isActive ? "bg-brand-100" : ""}`}>
        <svg className={`w-[18px] h-[18px] ${isActive ? "text-brand-700" : "text-warm-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 1.5} d={icon} />
        </svg>
      </div>
      <span className={`text-[10px] ${isActive ? "font-semibold text-brand-700" : "text-warm-400"}`}>
        {label}
      </span>
    </>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-warm-200/60 sm:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex justify-around py-1.5">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return isActive ? (
            <span key={tab.href} className="flex flex-col items-center gap-0.5 py-1 px-4">
              <TabContent icon={tab.icon} label={tab.label} isActive />
            </span>
          ) : (
            <Link key={tab.href} href={tab.href} className="flex flex-col items-center gap-0.5 py-1 px-4">
              <TabContent icon={tab.icon} label={tab.label} isActive={false} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
