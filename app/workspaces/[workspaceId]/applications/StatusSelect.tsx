'use client';

import type { ApplicationStatus } from '@/lib/generated/prisma';
import { useState } from 'react';

const STATUS_SELECT_STYLE: Record<
  ApplicationStatus,
  { backgroundColor: string; borderColor: string; color: string }
> = {
  APPLIED: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: 'rgba(245, 158, 11, 0.55)',
    color: '#fde68a',
  },
  OA: {
    backgroundColor: 'rgba(139, 92, 246, 0.14)',
    borderColor: 'rgba(139, 92, 246, 0.55)',
    color: '#ddd6fe',
  },
  SCREEN: {
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
    borderColor: 'rgba(59, 130, 246, 0.55)',
    color: '#bfdbfe',
  },
  INTERVIEW: {
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
    borderColor: 'rgba(59, 130, 246, 0.55)',
    color: '#bfdbfe',
  },
  OFFER: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: 'rgba(16, 185, 129, 0.55)',
    color: '#a7f3d0',
  },
  REJECTED: {
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderColor: 'rgba(244, 63, 94, 0.55)',
    color: '#fecdd3',
  },
  WITHDRAWN: {
    backgroundColor: 'rgba(100, 116, 139, 0.18)',
    borderColor: 'rgba(100, 116, 139, 0.6)',
    color: '#e2e8f0',
  },
};

export function StatusSelect({
  currentStatus,
}: {
  currentStatus: ApplicationStatus;
}) {
  const [selectedStatus, setSelectedStatus] =
    useState<ApplicationStatus>(currentStatus);
  const tone = STATUS_SELECT_STYLE[selectedStatus];

  return (
    <select
      name="status"
      value={selectedStatus}
      className="select-clean w-full rounded-sm border px-3 py-1.5 text-sm font-semibold outline-none"
      style={{
        WebkitAppearance: 'none',
        appearance: 'none',
        ...tone,
      }}
      onChange={(e) => {
        setSelectedStatus(e.currentTarget.value as ApplicationStatus);
        e.currentTarget.form?.requestSubmit();
      }}
    >
      <option value="APPLIED">Applied</option>
      <option value="OA">Online Assessment</option>
      <option value="SCREEN">Screen</option>
      <option value="INTERVIEW">Interview</option>
      <option value="OFFER">Offer</option>
      <option value="REJECTED">Rejected</option>
      <option value="WITHDRAWN">Withdrawn</option>
    </select>
  );
}
