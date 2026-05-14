"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import "./admin.css";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/patients", label: "Patients", icon: "🏥" },
  { href: "/admin/medications", label: "Medications", icon: "💊" },
  { href: "/admin/roles", label: "Roles & Permissions", icon: "🔐" },
  { href: "/admin/audit", label: "Audit Logs", icon: "📋" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  return (
    <div className="admin-wrapper">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <h2>CarePath</h2>
          <span>Admin Panel</span>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link${isActive ? " active" : ""}`}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          <div className="admin-nav-divider" />

          <Link href="/" className="admin-nav-link">
            <span style={{ fontSize: 16 }}>←</span>
            Back to Dashboard
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <button
            className="admin-nav-link"
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
          >
            <span style={{ fontSize: 16 }}>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="admin-main">{children}</main>
    </div>
  );
}
