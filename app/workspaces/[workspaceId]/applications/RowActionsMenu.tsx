'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import type { ApplicationStatus } from '@/lib/generated/prisma';
import { useToast } from '@/app/components/ToastProvider';
import {
  INITIAL_UPDATE_STATE,
  type UpdateApplicationState,
} from './updateApplicationState';

const STATUS_OPTIONS: Array<{ value: ApplicationStatus; label: string }> = [
  { value: 'APPLIED', label: 'Applied' },
  { value: 'OA', label: 'OA' },
  { value: 'SCREEN', label: 'Screen' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

type EditAction = (
  state: UpdateApplicationState,
  formData: FormData,
) => Promise<UpdateApplicationState>;

function RowEditModal({
  action,
  initialValues,
  onClose,
}: {
  action: EditAction;
  initialValues: {
    company: string;
    roleTitle: string;
    jobUrl: string;
    status: ApplicationStatus;
  };
  onClose: () => void;
}) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [state, formAction, pending] = useActionState(action, INITIAL_UPDATE_STATE);

  useEffect(() => {
    if (state.status === 'success') {
      if (state.message) pushToast(state.message, 'success');
      onClose();
      router.refresh();
    }
  }, [state.message, state.status, pushToast, onClose, router]);

  useEffect(() => {
    if (state.status === 'error' && state.message) {
      pushToast(state.message, 'error');
    }
  }, [state.message, state.status, pushToast]);

  const company = state.values?.company ?? initialValues.company;
  const roleTitle = state.values?.roleTitle ?? initialValues.roleTitle;
  const jobUrl = state.values?.jobUrl ?? initialValues.jobUrl;
  const status = state.values?.status ?? initialValues.status;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Edit application</h3>
          <button
            type="button"
            className="btn-secondary px-3 py-1.5 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <form action={formAction} className="grid gap-3 lg:grid-cols-2">
          <div>
            <input
              className="input"
              name="company"
              defaultValue={company}
              placeholder="Company"
              required
            />
            {state.fieldErrors?.company && (
              <p className="mt-1 text-xs text-rose-300">{state.fieldErrors.company}</p>
            )}
          </div>

          <div>
            <input
              className="input"
              name="roleTitle"
              defaultValue={roleTitle}
              placeholder="Role title"
              required
            />
            {state.fieldErrors?.roleTitle && (
              <p className="mt-1 text-xs text-rose-300">{state.fieldErrors.roleTitle}</p>
            )}
          </div>

          <div className="lg:col-span-2">
            <input
              className="input"
              name="jobUrl"
              defaultValue={jobUrl}
              placeholder="Job URL (optional)"
            />
            {state.fieldErrors?.jobUrl && (
              <p className="mt-1 text-xs text-rose-300">{state.fieldErrors.jobUrl}</p>
            )}
          </div>

          <div className="lg:col-span-2">
            <select
              name="status"
              defaultValue={status}
              className="input select-clean"
              style={{ WebkitAppearance: 'none', appearance: 'none' }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {state.fieldErrors?.status && (
              <p className="mt-1 text-xs text-rose-300">{state.fieldErrors.status}</p>
            )}
          </div>

          <div className="flex justify-end lg:col-span-2">
            <button
              type="submit"
              className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending}
            >
              {pending ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RowActionsMenu({
  deleteFormId,
  initialValues,
  editAction,
}: {
  deleteFormId: string;
  initialValues: {
    company: string;
    roleTitle: string;
    jobUrl: string;
    status: ApplicationStatus;
  };
  editAction: EditAction;
}) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 8 });
  const menuWidth = 128;

  const updatePosition = useMemo(
    () => () => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      const viewportWidth =
        window.visualViewport?.width ?? document.documentElement.clientWidth;
      const maxLeft = Math.max(8, viewportWidth - menuWidth - 8);
      const idealLeft = rect.right - menuWidth;
      setMenuPosition({
        top: rect.bottom + scrollY + 8,
        left: Math.min(Math.max(idealLeft, 8), maxLeft) + scrollX,
      });
    },
    [menuWidth],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  return (
    <>
      <div ref={rootRef} className="inline-block text-left">
        <button
          ref={buttonRef}
          type="button"
          className="rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800"
          onClick={() => {
            if (!open) {
              updatePosition();
            }
            setOpen((v) => !v);
          }}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          •••
        </button>

        {open &&
          createPortal(
            <div
              ref={menuRef}
              className="absolute z-50 w-32 rounded-md border border-slate-700 bg-slate-900 p-1 shadow-lg"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <button
                type="button"
                className="block w-full rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                onClick={() => {
                  setOpen(false);
                  setFormVersion((v) => v + 1);
                  setEditOpen(true);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="block w-full rounded px-3 py-2 text-left text-sm text-rose-300 hover:bg-slate-800"
                onClick={() => {
                  setOpen(false);
                  const ok = window.confirm(
                    'Delete this application? This cannot be undone.',
                  );
                  if (!ok) return;
                  const form = document.getElementById(
                    deleteFormId,
                  ) as HTMLFormElement | null;
                  form?.requestSubmit();
                }}
              >
                Delete
              </button>
            </div>,
            document.body,
          )}
      </div>

      {editOpen && (
        <RowEditModal
          key={formVersion}
          action={editAction}
          initialValues={initialValues}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
