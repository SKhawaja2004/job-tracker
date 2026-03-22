'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';

function NavItem({
  href,
  label,
  compact,
  active,
}: {
  href: string;
  label: string;
  compact: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      title={compact ? label : undefined}
      className={
        active
          ? 'block rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100'
          : 'block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100'
      }
    >
      {compact ? label.charAt(0) : label}
    </Link>
  );
}

export function AppShell({
  children,
  isSignedIn,
  initialCollapsed,
}: {
  children: ReactNode;
  isSignedIn: boolean;
  initialCollapsed: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const updateCollapsed = (next: boolean) => {
    setCollapsed(next);
    if (typeof window === 'undefined') return;
    const value = next ? '1' : '0';
    window.localStorage.setItem('sidebar-collapsed', value);
    document.cookie = `sidebar-collapsed=${value}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <div className="min-h-screen md:flex">
      <aside
        className={`hidden border-r border-slate-800 bg-slate-950/70 transition-[width] duration-200 md:flex md:flex-col ${
          collapsed ? 'md:w-[64px]' : 'md:w-[244px]'
        }`}
      >
        <div
          className={`px-3 py-4 ${
            collapsed
              ? 'flex items-center justify-center'
              : 'flex items-center justify-between gap-2'
          }`}
        >
          {!collapsed && (
            <Link
              href="/"
              className="truncate text-sm font-semibold tracking-wide text-slate-100"
              title="Job Tracker"
            >
              Job Tracker
            </Link>
          )}
          <button
            type="button"
            onClick={() => updateCollapsed(!collapsed)}
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '>' : '<'}
          </button>
        </div>

        <nav className="space-y-1 px-3">
          <NavItem
            href="/dashboard"
            label="Dashboard"
            compact={collapsed}
            active={pathname.startsWith('/dashboard')}
          />
          <NavItem
            href="/docs"
            label="Docs"
            compact={collapsed}
            active={pathname.startsWith('/docs')}
          />
          <button
            type="button"
            disabled
            title={collapsed ? 'Settings' : undefined}
            className={`block w-full cursor-not-allowed rounded-lg px-3 py-2 text-left text-sm text-slate-500 ${
              collapsed ? 'text-center' : ''
            }`}
          >
            {collapsed ? 'S' : 'Settings (soon)'}
          </button>
        </nav>

        <div className="mt-auto border-t border-slate-800 px-4 py-4">
          {isSignedIn ? (
            <div
              className={`flex items-center ${
                collapsed ? 'justify-center' : 'justify-between'
              }`}
            >
              {!collapsed && <span className="text-xs text-slate-400">Account</span>}
              <UserButton />
            </div>
          ) : (
            <div
              className={`flex ${
                collapsed ? 'flex-col gap-2' : 'gap-2'
              }`}
            >
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  {collapsed ? 'In' : 'Sign in'}
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="btn-primary px-3 py-1.5 text-xs"
                >
                  {collapsed ? 'Up' : 'Sign up'}
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="topbar md:hidden">
          <div className="container flex items-center justify-between gap-3 py-3">
            <Link href="/" className="text-sm font-semibold tracking-wide">
              Job Tracker
            </Link>
            <div className="flex items-center gap-2">
              {isSignedIn ? (
                <UserButton />
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="btn-secondary px-3 py-1.5 text-sm"
                    >
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      type="button"
                      className="btn-primary px-3 py-1.5 text-sm"
                    >
                      Sign up
                    </button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
