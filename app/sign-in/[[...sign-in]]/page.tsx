import type { Metadata } from 'next';
import { SignIn } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to access your job tracking workspaces.',
};

export default function Page() {
  return (
    <main className="page">
      <div className="container flex justify-center">
        <section className="card w-full max-w-md p-5 sm:p-6">
          <h1 className="text-xl font-semibold tracking-tight text-slate-100">
            Sign in
          </h1>
          <p className="text-muted mt-2 text-sm">
            Access your dashboard and continue tracking your applications.
          </p>
          <div className="mt-5 flex justify-center">
            <SignIn />
          </div>
        </section>
      </div>
    </main>
  );
}
