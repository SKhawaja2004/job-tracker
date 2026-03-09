'use client';

import Link from 'next/link';
import { useState } from 'react';

export function WorkspaceRow({
  id,
  name,
  inviteCode,
  role,
  createdAt,
}: {
  id: string;
  name: string;
  inviteCode: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <Link
      href={`/workspaces/${id}`}
      className="card flex items-start justify-between gap-4 p-4 transition hover:border-slate-300"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-semibold">{name}</h3>
          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
            {role}
          </span>
        </div>
        <p className="text-muted mt-1 truncate text-xs">{inviteCode}</p>
        <p className="text-muted mt-1 text-xs">
          Created {new Date(createdAt).toLocaleDateString('en-GB')}
        </p>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
      >
        {copied ? 'Copied' : 'Copy code'}
      </button>
    </Link>
  );
}
