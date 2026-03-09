import type { Metadata } from 'next';
import { SignUp } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create an account to start tracking job applications.',
};

export default function Page() {
  return <SignUp />;
}
