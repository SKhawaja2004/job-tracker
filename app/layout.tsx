import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
  title: {
    default: 'Job Tracker',
    template: '%s | Job Tracker',
  },
  description:
    'Collaborative job application tracker with workspaces, status boards, and search.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <header className="topbar">
            <div className="container flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-6">
                <Link href="/" className="text-sm font-semibold tracking-wide">
                  Job Tracker
                </Link>
                <nav className="hidden items-center gap-2 sm:flex">
                  <Link
                    href="/dashboard"
                    className="btn-secondary px-3 py-1.5 text-sm"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/docs"
                    className="btn-secondary px-3 py-1.5 text-sm"
                  >
                    Docs
                  </Link>
                </nav>
              </div>

              <div className="flex items-center gap-2">
                {userId ? (
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
        </ClerkProvider>
      </body>
    </html>
  );
}
