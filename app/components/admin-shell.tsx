"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardList,
  FileClock,
  LogOut,
  Menu,
  UserRoundPlus,
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
  { href: "/patients/new", label: "Register Patient", icon: UserRoundPlus },
  { href: "/institutions", label: "Institutions", icon: Building2 },
  { href: "/failed-records", label: "Failed Records", icon: AlertTriangle },
  { href: "/logs", label: "Logs", icon: FileClock },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
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
        <div className="flex items-center gap-3 rounded-lg border border-[#d8e1d8] bg-white px-5 py-4 text-sm font-medium text-[#435246] shadow-sm">
          <Activity className="h-5 w-5 animate-pulse text-[#2f6b4f]" />
          Checking admin session
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r border-[#d8e1d8] bg-[#fbfcfa]/95 px-4 py-5 lg:block">
        <ShellBrand />
        <ShellNav pathname={pathname} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-[#d8e1d8] bg-[#fbfcfa]/90 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <button
              aria-label="Open navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#cbd8cc] bg-white text-[#435246] lg:hidden"
              onClick={() => setMenuOpen(true)}
              title="Open navigation"
              type="button"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-[#17201b]">
                FHIR Adapter Admin
              </p>
              <p className="text-xs text-[#637166]">
                Adapter operations console
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-[#17201b]">
                  {session?.user.username}
                </p>
                <p className="text-xs text-[#637166]">Staff admin</p>
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

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-[#17201b]/35"
            onClick={() => setMenuOpen(false)}
            type="button"
          />
          <div className="relative z-10 h-full w-[min(86vw,320px)] border-r border-[#d8e1d8] bg-[#fbfcfa] p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <ShellBrand />
              <button
                aria-label="Close navigation"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#cbd8cc] bg-white text-[#435246]"
                onClick={() => setMenuOpen(false)}
                title="Close navigation"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ShellNav onNavigate={() => setMenuOpen(false)} pathname={pathname} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ShellBrand() {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-md bg-[#2f6b4f] text-white shadow-sm">
        <ClipboardList className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-[#17201b]">FHIR Adapter</p>
        <p className="text-xs text-[#637166]">Admin workspace</p>
      </div>
    </div>
  );
}

function ShellNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="grid gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        return (
          <Link
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-[#dceade] text-[#1f4d39]"
                : "text-[#4c5b4f] hover:bg-[#edf2ed] hover:text-[#17201b]"
            }`}
            href={item.href}
            key={item.href}
            onClick={onNavigate}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
