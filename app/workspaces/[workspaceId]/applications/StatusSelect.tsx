'use client';

export function StatusSelect({ currentStatus }: { currentStatus: string }) {
  return (
    <select
      name="status"
      defaultValue={currentStatus}
      className="rounded border px-2 py-1 text-sm"
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
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
