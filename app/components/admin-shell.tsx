"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardList,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { clearSession, getStoredSession, subscribeToSessionStore } from "../lib/auth";
import { logout } from "../lib/api";
import { Button } from "./ui";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/institutions", label: "Register Institution", icon: Building2 },
  { href: "/failed-records", label: "Failed Records", icon: AlertTriangle },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const session = useSyncExternalStore(
    subscribeToSessionStore,
    getStoredSession,
    () => null,
  );

  useEffect(() => {
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, session]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      router.replace("/login");
    }
  }

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] px-5 py-4 text-sm font-medium text-[var(--text-secondary)] shadow-sm">
          <Activity className="h-5 w-5 animate-pulse text-[var(--primary)]" />
          Checking admin session
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside
        className={`fixed left-0 top-0 z-30 h-screen w-80 border-r border-[var(--line)] bg-[var(--surface)]/95 px-4 py-5 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <ShellBrand />
          <button
            aria-label="Close sidebar"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:bg-[var(--background)] hover:text-[var(--text-primary)] lg:hidden"
            onClick={() => setSidebarOpen(false)}
            title="Close sidebar"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ShellNav pathname={pathname} />
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-[var(--text-primary)]/35 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`flex-1 flex flex-col ${sidebarOpen ? "lg:ml-80" : ""}`}>
        <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--background)]/90 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <button
              aria-label="Toggle sidebar"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:bg-[var(--background)] hover:text-[var(--text-primary)]"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle sidebar"
              type="button"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                FHIR Adapter Admin
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Adapter operations console
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {session?.user.username}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">Staff admin</p>
              </div>
              <Button onClick={handleLogout} variant="secondary">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function ShellBrand() {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-base)] bg-[var(--primary)] text-white shadow-sm">
        <ClipboardList className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-[var(--text-primary)]">FHIR Adapter</p>
        <p className="text-xs text-[var(--text-secondary)]">Admin workspace</p>
      </div>
    </div>
  );
}

function ShellNav({
  pathname,
}: {
  pathname: string;
}) {
  return (
    <nav className="grid gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        return (
          <Link
            className={`flex items-center gap-3 rounded-[var(--radius-base)] px-3 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-[color-mix(in_srgb,var(--primary)_10%,white)] text-[var(--primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]"
            }`}
            href={item.href}
            key={item.href}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
