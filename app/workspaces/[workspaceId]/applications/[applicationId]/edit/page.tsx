import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ApplicationStatus } from '@/lib/generated/prisma';
import { prisma } from '@/lib/prisma';
import { APPLICATION_MANAGE_ROLES, hasWorkspaceRole, requireDbUser } from '@/lib/auth';
import {
  parseOptionalText,
  parseApplicationStatus,
  parseOptionalUrl,
  parseRequiredText,
  validateCompany,
  validateLocation,
  validateNotes,
  validateRoleTitle,
} from '@/lib/validation';

export const metadata: Metadata = {
  title: 'Edit Application',
  description: 'Update application details, notes, and status.',
};

const STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'OA',
  'SCREEN',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
];

function statusLabel(status: ApplicationStatus): string {
  switch (status) {
    case 'APPLIED':
      return 'Applied';
    case 'OA':
      return 'OA';
    case 'SCREEN':
      return 'Screen';
    case 'INTERVIEW':
      return 'Interview';
    case 'OFFER':
      return 'Offer';
    case 'REJECTED':
      return 'Rejected';
    case 'WITHDRAWN':
      return 'Withdrawn';
  }
}

async function updateApplicationDetails(
  workspaceId: string,
  applicationId: string,
  formData: FormData,
): Promise<void> {
  'use server';

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const canManage = await hasWorkspaceRole(
    dbUser.id,
    workspaceId,
    APPLICATION_MANAGE_ROLES,
  );
  if (!canManage) {
    redirect('/dashboard?msg=Not%20authorized%20for%20this%20workspace');
  }

  const company = parseRequiredText(formData, 'company');
  const roleTitle = parseRequiredText(formData, 'roleTitle');
  const location = parseOptionalText(formData, 'location');
  const notes = parseOptionalText(formData, 'notes');
  const rawJobUrl = parseRequiredText(formData, 'jobUrl');
  const jobUrl = parseOptionalUrl(formData, 'jobUrl');

  const companyError = validateCompany(company);
  const roleTitleError = validateRoleTitle(roleTitle);
  const locationError = validateLocation(location);
  const notesError = validateNotes(notes);

  if (companyError || roleTitleError || locationError || notesError) {
    const message =
      companyError || roleTitleError || locationError || notesError || 'Invalid input.';
    redirect(
      `/workspaces/${workspaceId}/applications/${applicationId}/edit?msg=${encodeURIComponent(message)}`,
    );
  }

  if (rawJobUrl && !jobUrl) {
    redirect(
      `/workspaces/${workspaceId}/applications/${applicationId}/edit?msg=Invalid%20job%20URL`,
    );
  }

  const rawStatus = formData.get('status');
  const status =
    typeof rawStatus === 'string' ? parseApplicationStatus(rawStatus) : null;
  if (!status) {
    redirect(
      `/workspaces/${workspaceId}/applications/${applicationId}/edit?msg=Invalid%20status`,
    );
  }

  const appliedAtRaw = parseRequiredText(formData, 'appliedAt');
  let appliedAt: Date | null = null;
  if (appliedAtRaw) {
    const parsed = new Date(appliedAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      redirect(
        `/workspaces/${workspaceId}/applications/${applicationId}/edit?msg=Invalid%20application%20date`,
      );
    }
    appliedAt = parsed;
  }

  const existingApp = await prisma.application.findFirst({
    where: { id: applicationId, workspaceId },
    select: { id: true },
  });
  if (!existingApp) {
    notFound();
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      company,
      roleTitle,
      status,
      jobUrl,
      location: location || null,
      notes: notes || null,
      appliedAt,
    },
  });

  revalidatePath(`/workspaces/${workspaceId}/applications`);
  revalidatePath(`/workspaces/${workspaceId}/applications/${applicationId}`);
  redirect(
    `/workspaces/${workspaceId}/applications/${applicationId}?msg=Application%20updated`,
  );
}

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ workspaceId: string; applicationId: string }>;
}) {
  const { workspaceId, applicationId } = await params;

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      workspaceId,
      workspace: { memberships: { some: { userId: dbUser.id } } },
    },
    select: {
      id: true,
      company: true,
      roleTitle: true,
      status: true,
      jobUrl: true,
      location: true,
      notes: true,
      appliedAt: true,
      workspace: { select: { id: true, name: true } },
      updatedAt: true,
    },
  });

  if (!application) notFound();

  const appliedDateDefault = application.appliedAt
    ? application.appliedAt.toISOString().slice(0, 10)
    : '';

  return (
    <main className="page">
      <div className="container max-w-4xl space-y-4">
        <section className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-muted text-sm">{application.workspace.name}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-100">
                {application.company}
              </h1>
              <p className="text-muted mt-1 text-sm">{application.roleTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/workspaces/${workspaceId}/applications`}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Back to applications
              </Link>
              <Link
                href={`/workspaces/${workspaceId}/applications/${applicationId}`}
                className="btn-secondary px-4 py-2 text-sm"
              >
                View details
              </Link>
              {application.jobUrl && (
                <a
                  href={application.jobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Open posting
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold text-slate-100">
            Edit application
          </h2>
          <p className="text-muted mt-1 text-sm">
            Last updated{' '}
            {new Date(application.updatedAt).toLocaleString('en-GB')}
          </p>

          <form
            action={async (formData) => {
              'use server';
              await updateApplicationDetails(
                workspaceId,
                application.id,
                formData,
              );
            }}
            className="mt-5 space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400 uppercase">
                  Company
                </label>
                <input
                  name="company"
                  defaultValue={application.company}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400 uppercase">
                  Role
                </label>
                <input
                  name="roleTitle"
                  defaultValue={application.roleTitle}
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400 uppercase">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={application.status}
                  className="input select-clean"
                  style={{ WebkitAppearance: 'none', appearance: 'none' }}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400 uppercase">
                  Applied Date
                </label>
                <input
                  type="date"
                  name="appliedAt"
                  defaultValue={appliedDateDefault}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400 uppercase">
                  Location
                </label>
                <input
                  name="location"
                  defaultValue={application.location ?? ''}
                  className="input"
                  placeholder="City / Remote / Hybrid"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400 uppercase">
                Job URL
              </label>
              <input
                name="jobUrl"
                defaultValue={application.jobUrl ?? ''}
                className="input"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400 uppercase">
                Notes
              </label>
              <textarea
                name="notes"
                defaultValue={application.notes ?? ''}
                className="input min-h-36"
                placeholder="Interview notes, company research, follow-ups..."
              />
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary px-4 py-2 text-sm">
                Save changes
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
