"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/dashboard",
    label: "Home",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
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

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-warm-200/60 sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Wrapper = isActive ? "span" : Link;
          const wrapperProps = isActive ? {} : { href: tab.href };
          return (
            <Wrapper
              key={tab.href}
              {...(wrapperProps as Record<string, string>)}
              className={`relative flex flex-col items-center gap-0.5 py-1.5 px-5 rounded-xl transition-all ${
                isActive ? "bg-brand-50" : "active:bg-warm-100"
              }`}
            >
              <svg
                className={`w-5 h-5 transition-colors ${isActive ? "text-brand-600" : "text-warm-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={isActive ? 2.5 : 1.5}
                  d={tab.icon}
                />
              </svg>
              <span
                className={`text-[10px] leading-tight ${
                  isActive ? "font-bold text-brand-700" : "font-medium text-warm-400"
                }`}
              >
                {tab.label}
              </span>
            </Wrapper>
          );
        })}
      </div>
    </nav>
  );
}
