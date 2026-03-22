'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type StatusOption = '' | 'APPLIED' | 'OA' | 'SCREEN' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';

const STATUS_OPTIONS: Array<{ value: StatusOption; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'APPLIED', label: 'Applied' },
  { value: 'OA', label: 'OA' },
  { value: 'SCREEN', label: 'Screen' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

export function ApplicationsToolbar({
  workspaceId,
  initialQuery,
  initialStatus,
}: {
  workspaceId: string;
  initialQuery: string;
  initialStatus: StatusOption;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [status, setStatus] = useState<StatusOption>(initialStatus);
  const [open, setOpen] = useState(false);

  const hasActiveFilters = useMemo(
    () => status !== '' || q.trim().length > 0,
    [q, status],
  );

  function navigate(nextQ: string, nextStatus: StatusOption) {
    const params = new URLSearchParams();
    const trimmedQ = nextQ.trim();
    if (trimmedQ) params.set('q', trimmedQ);
    if (nextStatus) params.set('status', nextStatus);

    const query = params.toString();
    router.push(
      query
        ? `/workspaces/${workspaceId}/applications?${query}`
        : `/workspaces/${workspaceId}/applications`,
    );
  }

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            navigate(q, status);
          }}
          className="flex min-w-[260px] flex-1 items-center gap-2"
        >
          <input
            type="text"
            name="q"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search company or role"
            className="input"
          />
          <button type="submit" className="btn-primary px-3 py-2 text-sm">
            Search
          </button>
        </form>

        <div className="relative">
          <button
            type="button"
            className={
              hasActiveFilters
                ? 'btn-primary px-3 py-2 text-sm'
                : 'btn-secondary px-3 py-2 text-sm'
            }
            onClick={() => setOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            Filter
          </button>

          {open && (
            <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-2xl">
              <label className="mb-1 block text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Status
              </label>
              <select
                className="input select-clean"
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusOption)}
                style={{ WebkitAppearance: 'none', appearance: 'none' }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-xs"
                  onClick={() => {
                    setQ('');
                    setStatus('');
                    setOpen(false);
                    navigate('', '');
                  }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="btn-primary px-3 py-1.5 text-xs"
                  onClick={() => {
                    setOpen(false);
                    navigate(q, status);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

