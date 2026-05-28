"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  LogOut,
  Menu,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getStoredSession, subscribeToSessionStore } from "../lib/auth";
import { logout } from "../lib/api";
import type { AuthSession } from "../lib/types";
import { Button } from "./ui";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/institutions", label: "Register Institution", icon: Building2 },
  { href: "/failed-records", label: "Failed Records", icon: AlertTriangle },
];

function resolveRouteLabel(pathname: string) {
  const match = navItems.find((item) => item.href === pathname);

  if (match) {
    return match.label;
  }

  const trimmed = pathname.replace(/^\//, "").replace(/\/+$/, "");
  return trimmed
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(" / ");
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const routeLabel = resolveRouteLabel(pathname);

  useEffect(() => {
    const updateSession = () => {
      setSession(getStoredSession());
      setHydrated(true);
    };

    updateSession();

    const unsubscribe = subscribeToSessionStore(updateSession);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, pathname, router, session]);

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
    <div className="min-h-screen flex overflow-x-hidden">
      <aside
        className={`fixed left-0 top-0 z-30 h-screen w-80 max-w-full overflow-x-hidden overflow-y-auto border-r border-[var(--line)] bg-[var(--surface)]/95 px-4 py-5 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between gap-3 px-3">
          <ShellBrand />
          <button
            aria-label="Collapse sidebar"
            className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:bg-[var(--background)] hover:text-[var(--text-primary)]"
            onClick={() => setSidebarOpen(false)}
            title="Collapse sidebar"
            type="button"
          >
            <Menu className="h-5 w-5" />
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

      <div className={`flex-1 flex flex-col overflow-x-hidden ${sidebarOpen ? "lg:ml-80" : ""}`}>
        <header
          className="fixed top-0 z-30 border-b border-[var(--line)] bg-[var(--background)]/90 backdrop-blur"
          style={{
            left: sidebarOpen ? "20rem" : 0,
            width: sidebarOpen ? "calc(100% - 20rem)" : "100%",
          }}
        >
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button
                  aria-label="Open sidebar"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:bg-[var(--background)] hover:text-[var(--text-primary)]"
                  onClick={() => setSidebarOpen(true)}
                  title="Open sidebar"
                  type="button"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              {!sidebarOpen && (
              <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-base)] border border-[var(--line)] bg-[var(--surface)] p-0.5 shadow-sm">
                
                <Image
                  alt="FHIR Adapter Admin"
                  className="h-full w-full rounded-[calc(var(--radius-base)-0.125rem)] object-cover"
                  height={40}
                  src="/icon.png"
                  width={40}
                />
              </div>
              )}
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {routeLabel}
                </p>
              </div>
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

        <main className="mx-auto w-full max-w-7xl px-4 py-6 pt-20 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function ShellBrand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-base)] border border-[var(--line)] bg-[var(--surface)] p-0.5 shadow-sm">
        <Image
          alt="FHIR Adapter Admin"
          className="h-full w-full rounded-[calc(var(--radius-base)-0.125rem)] object-cover"
          height={40}
          src="/icon.png"
          width={40}
        />
      </div>
      <div className="text-left">
        <p className="text-sm font-bold text-[var(--text-primary)]">FHIR Adapter Admin</p>
        <p className="text-xs text-[var(--text-secondary)]">Adapter operations console</p>
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
