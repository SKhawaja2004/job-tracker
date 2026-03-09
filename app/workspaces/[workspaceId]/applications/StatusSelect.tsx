'use client';

export function StatusSelect({ currentStatus }: { currentStatus: string }) {
  return (
    <select
      name="status"
      defaultValue={currentStatus}
      className="input select-clean rounded-sm"
      style={{
        WebkitAppearance: 'none',
        appearance: 'none',
        backgroundColor: '#0f131a',
      }}
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
