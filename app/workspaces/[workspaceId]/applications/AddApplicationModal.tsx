'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  INITIAL_CREATE_STATE,
  type CreateApplicationState,
} from './createApplicationState';

type CreateAction = (
  state: CreateApplicationState,
  formData: FormData,
) => Promise<CreateApplicationState>;

function AddApplicationModalContent({
  action,
  onClose,
}: {
  action: CreateAction;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, INITIAL_CREATE_STATE);

  useEffect(() => {
    if (state.status === 'success') {
      onClose();
      router.refresh();
    }
  }, [state.status, onClose, router]);

  return (
    <form action={formAction} className="grid gap-3 lg:grid-cols-2">
      {state.status === 'error' && state.message && (
        <p className="lg:col-span-2 rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {state.message}
        </p>
      )}

      <div>
        <input className="input" name="company" placeholder="Company" required />
        {state.fieldErrors?.company && (
          <p className="mt-1 text-xs text-rose-300">{state.fieldErrors.company}</p>
        )}
      </div>

      <div>
        <input className="input" name="roleTitle" placeholder="Role title" required />
        {state.fieldErrors?.roleTitle && (
          <p className="mt-1 text-xs text-rose-300">{state.fieldErrors.roleTitle}</p>
        )}
      </div>

      <div className="lg:col-span-2">
        <input className="input" name="jobUrl" placeholder="Job URL (optional)" />
        {state.fieldErrors?.jobUrl && (
          <p className="mt-1 text-xs text-rose-300">{state.fieldErrors.jobUrl}</p>
        )}
      </div>

      <div className="flex justify-end lg:col-span-2">
        <button
          type="submit"
          className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
        >
          {pending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export function AddApplicationModal({ action }: { action: CreateAction }) {
  const [open, setOpen] = useState(false);
  const [formVersion, setFormVersion] = useState(0);

  function openModal() {
    setFormVersion((v) => v + 1);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="btn-primary px-4 py-2 text-sm"
        onClick={openModal}
      >
        Add application
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Add application</h2>
              <button
                type="button"
                className="btn-secondary px-3 py-1.5 text-sm"
                onClick={closeModal}
              >
                Close
              </button>
            </div>

            <AddApplicationModalContent
              key={formVersion}
              action={action}
              onClose={closeModal}
            />
          </div>
        </div>
      )}
    </>
  );
}
