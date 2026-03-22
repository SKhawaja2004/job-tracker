'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

export function WorkspaceRow({
  id,
  name,
  inviteCode,
  role,
  createdAt,
  applicationsCount,
  membersCount,
  canManage,
  deleteAction,
  editAction,
}: {
  id: string;
  name: string;
  inviteCode: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: string;
  applicationsCount: number;
  membersCount: number;
  canManage: boolean;
  deleteAction: () => Promise<void>;
  editAction: (formData: FormData) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const editFormRef = useRef<HTMLFormElement>(null);
  const editNameRef = useRef<HTMLInputElement>(null);
  const deleteFormRef = useRef<HTMLFormElement>(null);

  async function handleCopyInviteCode(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function handleEdit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    const nextName = window.prompt('Rename workspace', name)?.trim();
    if (!nextName || nextName === name) return;
    if (editNameRef.current) editNameRef.current.value = nextName;
    editFormRef.current?.requestSubmit();
  }

  function handleDelete(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    const ok = window.confirm(
      'Delete this workspace? This also deletes all applications and cannot be undone.',
    );
    if (!ok) return;
    deleteFormRef.current?.requestSubmit();
  }

  return (
    <article className="relative card group p-4 transition hover:border-slate-600 hover:bg-slate-900/50">
      <Link
        href={`/workspaces/${id}/applications`}
        className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
        aria-label={`Open workspace ${name}`}
      />

      <form ref={editFormRef} action={editAction} className="hidden">
        <input ref={editNameRef} type="hidden" name="name" defaultValue={name} />
      </form>
      <form ref={deleteFormRef} action={deleteAction} className="hidden" />

      <div className="relative z-20 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-slate-100">{name}</h3>
            <span className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-slate-200 uppercase">
              {role}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-300">
              {applicationsCount} applications
            </span>
            <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-300">
              {membersCount} members
            </span>
          </div>

          <div className="mt-2 text-xs text-slate-400">
            Invite code:{' '}
            <button
              type="button"
              onClick={handleCopyInviteCode}
              className="rounded px-1 font-semibold text-slate-200 underline decoration-dotted underline-offset-2 hover:text-white"
            >
              {inviteCode}
            </button>
            {copied && <span className="ml-2 text-emerald-300">Copied</span>}
          </div>

          <p className="text-muted mt-1 text-xs">
            Created {new Date(createdAt).toLocaleDateString('en-GB')}
          </p>
        </div>

        {canManage && (
          <div className="relative z-30">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800"
              aria-label="Workspace actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              •••
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-md border border-slate-700 bg-slate-900 p-1 shadow-xl">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="block w-full rounded px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="block w-full rounded px-3 py-2 text-left text-sm text-rose-300 hover:bg-slate-800"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

