"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "◆" },
  { href: "/test-sets", label: "Test Sets", icon: "▤" },
  { href: "/scoring", label: "Scoring", icon: "◎" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] min-h-screen p-4">
      <Link href="/" className="block mb-8">
        <h1 className="text-lg font-bold tracking-tight">EVE Merus</h1>
        <p className="text-xs text-[var(--muted)]">Skills Library Optimizer</p>
      </Link>

      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                active
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <span className="text-xs">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-4 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--muted)] px-3 mb-2 uppercase tracking-wider">
          Libraries
        </p>
        <LibraryNav />
      </div>
    </aside>
  );
}

function LibraryNav() {
  // Client-side library list — fetched on mount
  // In a real app this would use SWR or similar
  return (
    <div className="text-xs text-[var(--muted)] px-3">
      <p>Connect Supabase to see libraries</p>
    </div>
  );
}
