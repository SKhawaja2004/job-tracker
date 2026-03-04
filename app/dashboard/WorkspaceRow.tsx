'use client';

import { useState } from 'react';

export function WorkspaceRow({
  name,
  inviteCode,
}: {
  name: string;
  inviteCode: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border p-3">
      <div className="min-w-0">
        <div className="truncate font-medium">{name}</div>
        <div className="truncate text-sm text-gray-500">{inviteCode}</div>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-md border px-3 py-2 text-sm"
      >
        {copied ? 'Copied!' : 'Copy code'}
      </button>
    </div>
  );
}
