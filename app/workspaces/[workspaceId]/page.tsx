import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{workspace.name}</h1>
        <Link className="text-sm underline" href="/dashboard">
          Back to dashboard
        </Link>

        <Link
          className="rounded-md border px-3 py-2 text-sm"
          href={`/workspaces/${workspaceId}/applications`}
        >
          Applications
        </Link>
      </div>

      <div className="space-y-1 rounded-md border p-4">
        <div className="text-sm text-gray-500">Invite code</div>
        <div className="font-mono">{workspace.inviteCode}</div>
      </div>

      <p className="text-gray-600">
        Next: we’ll add applications inside this workspace.
      </p>
    </main>
  );
}
