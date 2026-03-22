import type { Metadata } from 'next';
import { SignUp } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create an account to start tracking job applications.',
};

export default function Page() {
  return (
    <main className="page">
      <div className="container flex justify-center">
        <section className="card w-full max-w-md p-5 sm:p-6">
          <h1 className="text-xl font-semibold tracking-tight text-slate-100">
            Create account
          </h1>
          <p className="text-muted mt-2 text-sm">
            Create your account and start managing applications in shared
            workspaces.
          </p>
          <div className="mt-5 flex justify-center">
            <SignUp />
          </div>
        </section>
      </div>
    </main>
  );
}
