"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  "": "Home",
  "libraries": "Libraries",
  "test-sets": "Test Sets",
  "scoring": "Scoring",
  "optimizer": "Optimizer",
  "collisions": "Collisions",
  "new": "New",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: { label: string; href: string }[] = [
    { label: "Home", href: "/" },
  ];

  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    const label = LABELS[seg] || (seg.length > 8 ? `${seg.slice(0, 8)}...` : seg);
    crumbs.push({ label, href: path });
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] mb-4">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {i > 0 && <span>/</span>}
          {i < crumbs.length - 1 ? (
            <Link
              href={crumb.href}
              className="hover:text-[var(--foreground)] transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-[var(--foreground)]">{crumb.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
