'use client';

import { useActionState, useEffect, useState } from 'react';
import {
  INITIAL_WORKSPACE_FORM_STATE,
  type WorkspaceFormState,
} from './workspaceFormState';
import { useToast } from '@/app/components/ToastProvider';

type WorkspaceAction = (
  state: WorkspaceFormState,
  formData: FormData,
) => Promise<WorkspaceFormState>;

export function WorkspaceForms({
  createAction,
  joinAction,
}: {
  createAction: WorkspaceAction;
  joinAction: WorkspaceAction;
}) {
  const { pushToast } = useToast();
  const [createState, createFormAction, createPending] = useActionState(
    createAction,
    INITIAL_WORKSPACE_FORM_STATE,
  );
  const [joinState, joinFormAction, joinPending] = useActionState(
    joinAction,
    INITIAL_WORKSPACE_FORM_STATE,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'create' | 'join' | null>(null);

  useEffect(() => {
    if (!createState.message || createState.status === 'idle') return;
    pushToast(createState.message, createState.status === 'error' ? 'error' : 'success');
  }, [createState.message, createState.status, pushToast]);

  useEffect(() => {
    if (!joinState.message || joinState.status === 'idle') return;
    pushToast(joinState.message, joinState.status === 'error' ? 'error' : 'success');
  }, [joinState.message, joinState.status, pushToast]);

  return (
    <section className="relative flex justify-end">
      <div className="relative">
        <button
          type="button"
          className="grid h-14 w-14 place-items-center rounded-full border border-emerald-300 bg-emerald-500 font-semibold text-white shadow-lg shadow-emerald-900/35 transition hover:bg-emerald-400"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Workspace actions"
        >
          <span className="text-4xl leading-none">+</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl">
            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-800"
              onClick={() => {
                setMenuOpen(false);
                setActiveModal('create');
              }}
            >
              Create workspace
            </button>
            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-800"
              onClick={() => {
                setMenuOpen(false);
                setActiveModal('join');
              }}
            >
              Join workspace
            </button>
          </div>
        )}
      </div>

      {activeModal === 'create' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-4">
          <div className="card w-full max-w-xl p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Create workspace
                </h2>
                <p className="text-muted mt-1 text-sm">
                  Start a new tracker space and invite others later if needed.
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary px-3 py-1.5 text-sm"
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>

            <form action={createFormAction} className="space-y-3">
              <input
                type="text"
                name="name"
                placeholder="Workspace name (e.g. Internship 2026)"
                className="input"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn-primary px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={createPending}
                >
                  {createPending ? 'Creating...' : 'Create workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'join' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 p-4">
          <div className="card w-full max-w-xl p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Join workspace
                </h2>
                <p className="text-muted mt-1 text-sm">
                  Enter the invite code shared by the workspace owner.
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary px-3 py-1.5 text-sm"
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>

            <form action={joinFormAction} className="space-y-3">
              <input
                type="text"
                name="inviteCode"
                placeholder="Paste invite code"
                className="input"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn-secondary px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={joinPending}
                >
                  {joinPending ? 'Joining...' : 'Join workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
