import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { ClerkProvider } from '@clerk/nextjs';
import { ToastProvider } from './components/ToastProvider';
import { ToastFromQuery } from './components/ToastFromQuery';
import { AppShell } from './components/AppShell';
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
  const cookieStore = await cookies();
  const initialSidebarCollapsed =
    cookieStore.get('sidebar-collapsed')?.value === '1';

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <ToastProvider>
            <ToastFromQuery />
            <AppShell
              isSignedIn={Boolean(userId)}
              initialCollapsed={initialSidebarCollapsed}
            >
              {children}
            </AppShell>
          </ToastProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
