import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Docs',
  description: 'Project notes and roadmap for Job Tracker.',
};

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-3 p-6">
      <h1 className="text-2xl font-semibold">Project docs</h1>
      <ul className="list-disc space-y-1 pl-6 text-sm">
        <li>MVP: auth, workspace, applications, dashboard.</li>
        <li>Later: analytics, reminders, import/export.</li>
      </ul>
    </main>
  );
}
