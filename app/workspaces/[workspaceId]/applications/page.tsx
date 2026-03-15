import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ApplicationStatus } from '@/lib/generated/prisma';
import { prisma } from '@/lib/prisma';
import { requireDbUser, isWorkspaceMember } from '@/lib/auth';
import {
  parseApplicationStatus,
  parseOptionalUrl,
  parseRequiredText,
  safeDecodeMessage,
} from '@/lib/validation';
import { StatusSelect } from './StatusSelect';
import { RowActionsMenu } from './RowActionsMenu';

export const metadata: Metadata = {
  title: 'Applications',
  description: 'Track and manage job applications in a clean list view.',
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

function buildApplicationsHref(
  workspaceId: string,
  options: {
    status?: ApplicationStatus;
    q?: string;
    create?: boolean;
    msg?: string;
  },
) {
  const params = new URLSearchParams();
  if (options.status) params.set('status', options.status);
  if (options.q) params.set('q', options.q);
  if (options.create) params.set('new', '1');
  if (options.msg) params.set('msg', options.msg);

  const query = params.toString();
  return query
    ? `/workspaces/${workspaceId}/applications?${query}`
    : `/workspaces/${workspaceId}/applications`;
}

async function updateStatus(
  workspaceId: string,
  applicationId: string,
  formData: FormData,
): Promise<void> {
  'use server';

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const isMember = await isWorkspaceMember(dbUser.id, workspaceId);
  if (!isMember) {
    redirect('/dashboard?msg=Not%20authorized%20for%20this%20workspace');
  }

  const rawStatus = formData.get('status');
  const status =
    typeof rawStatus === 'string' ? parseApplicationStatus(rawStatus) : null;

  if (!status) {
    redirect(`/workspaces/${workspaceId}/applications?msg=Invalid%20status`);
  }

  const existingApp = await prisma.application.findFirst({
    where: { id: applicationId, workspaceId },
    select: { id: true },
  });

  if (!existingApp) {
    redirect(
      `/workspaces/${workspaceId}/applications?msg=Application%20not%20found`,
    );
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { status },
  });

  const redirectToRaw = formData.get('redirectTo');
  const redirectTo =
    typeof redirectToRaw === 'string' &&
    redirectToRaw.startsWith(`/workspaces/${workspaceId}/applications`)
      ? redirectToRaw
      : `/workspaces/${workspaceId}/applications`;

  revalidatePath(`/workspaces/${workspaceId}/applications`);
  redirect(redirectTo);
}

async function createApplication(
  workspaceId: string,
  formData: FormData,
): Promise<void> {
  'use server';

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const isMember = await isWorkspaceMember(dbUser.id, workspaceId);
  if (!isMember) {
    redirect('/dashboard?msg=Not%20authorized%20for%20this%20workspace');
  }

  const company = parseRequiredText(formData, 'company');
  const roleTitle = parseRequiredText(formData, 'roleTitle');
  const rawJobUrl = parseRequiredText(formData, 'jobUrl');
  const jobUrl = parseOptionalUrl(formData, 'jobUrl');

  if (!company || !roleTitle) {
    redirect(
      buildApplicationsHref(workspaceId, {
        create: true,
        msg: 'Company and role are required',
      }),
    );
  }

  if (rawJobUrl && !jobUrl) {
    redirect(
      buildApplicationsHref(workspaceId, {
        create: true,
        msg: 'Invalid job URL',
      }),
    );
  }

  await prisma.application.create({
    data: {
      workspaceId,
      createdById: dbUser.id,
      company,
      roleTitle,
      jobUrl,
      status: 'APPLIED',
      appliedAt: new Date(),
    },
  });

  revalidatePath(`/workspaces/${workspaceId}/applications`);
  redirect(`/workspaces/${workspaceId}/applications?msg=Application%20created`);
}

async function deleteApplication(
  workspaceId: string,
  applicationId: string,
  formData: FormData,
): Promise<void> {
  'use server';

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const isMember = await isWorkspaceMember(dbUser.id, workspaceId);
  if (!isMember) {
    redirect('/dashboard?msg=Not%20authorized%20for%20this%20workspace');
  }

  const existingApp = await prisma.application.findFirst({
    where: { id: applicationId, workspaceId },
    select: { id: true },
  });

  if (!existingApp) {
    redirect(
      `/workspaces/${workspaceId}/applications?msg=Application%20not%20found`,
    );
  }

  await prisma.application.delete({
    where: { id: applicationId },
  });

  const redirectToRaw = formData.get('redirectTo');
  const redirectTo =
    typeof redirectToRaw === 'string' &&
    redirectToRaw.startsWith(`/workspaces/${workspaceId}/applications`)
      ? redirectToRaw
      : `/workspaces/${workspaceId}/applications`;

  revalidatePath(`/workspaces/${workspaceId}/applications`);
  redirect(redirectTo);
}

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

export default async function WorkspaceApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceId } = await params;
  const sp = (await searchParams) ?? {};

  const msg = Array.isArray(sp.msg) ? sp.msg[0] : sp.msg;
  const statusFilter = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const qRaw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const searchQuery = typeof qRaw === 'string' ? qRaw.trim() : '';
  const showCreate = (Array.isArray(sp.new) ? sp.new[0] : sp.new) === '1';
  const parsedStatusFilter = statusFilter
    ? parseApplicationStatus(statusFilter)
    : null;

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      memberships: { some: { userId: dbUser.id } },
    },
    select: { id: true, name: true },
  });

  if (!workspace) notFound();

  const applications = await prisma.application.findMany({
    where: {
      workspaceId,
      ...(parsedStatusFilter ? { status: parsedStatusFilter } : {}),
      ...(searchQuery
        ? {
            OR: [
              { company: { contains: searchQuery, mode: 'insensitive' } },
              { roleTitle: { contains: searchQuery, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { company: 'asc' }],
  });

  const statusTotalsRaw = await prisma.application.groupBy({
    by: ['status'],
    where: { workspaceId },
    _count: { _all: true },
  });

  const totalsByStatus = Object.fromEntries(
    statusTotalsRaw.map((entry) => [entry.status, entry._count._all]),
  ) as Partial<Record<ApplicationStatus, number>>;

  const totalCount = statusTotalsRaw.reduce(
    (acc, entry) => acc + entry._count._all,
    0,
  );
  const interviewCount =
    (totalsByStatus.INTERVIEW ?? 0) + (totalsByStatus.SCREEN ?? 0);
  const offerCount = totalsByStatus.OFFER ?? 0;
  const rejectedCount = totalsByStatus.REJECTED ?? 0;
  const rowGridStyle = {
    gridTemplateColumns: '1.35fr 1.2fr 1fr 0.8fr 0.65fr 0.7fr',
  } as CSSProperties;
  const toolbarGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 1fr) 180px 110px',
    gap: '0.5rem',
    minWidth: '620px',
  } as CSSProperties;

  const decodedMsg = safeDecodeMessage(msg);
  const showInvalidUrlError = decodedMsg?.includes('Invalid job URL');
  const showRequiredError = decodedMsg?.includes(
    'Company and role are required',
  );

  return (
    <main className="page">
      <div className="container max-w-6xl space-y-4">
        <section className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
                {workspace.name} applications
              </h1>
              <p className="text-muted mt-1 text-sm">
                Clean table view for day-to-day tracking.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/workspaces/${workspaceId}`}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Back
              </Link>
              <Link
                href={buildApplicationsHref(workspaceId, {
                  status: parsedStatusFilter ?? undefined,
                  q: searchQuery || undefined,
                  create: true,
                })}
                className="btn-primary px-4 py-2 text-sm"
              >
                Add application
              </Link>
            </div>
          </div>
        </section>

        {decodedMsg && (
          <p className="card px-4 py-3 text-sm text-slate-200">{decodedMsg}</p>
        )}

        {showCreate && (
          <section className="card p-4">
            {showInvalidUrlError && (
              <p className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                Invalid job URL. Use a full URL or domain (e.g.
                example.com/job).
              </p>
            )}
            {showRequiredError && (
              <p className="rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                Company and role are required.
              </p>
            )}
            <form
              action={async (formData) => {
                'use server';
                await createApplication(workspaceId, formData);
              }}
              className="grid gap-3 lg:grid-cols-4"
            >
              <input
                className="input"
                name="company"
                placeholder="Company"
                required
              />
              <input
                className="input"
                name="roleTitle"
                placeholder="Role title"
                required
              />
              <input
                className="input"
                name="jobUrl"
                placeholder="Job URL (optional)"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn-primary w-full px-3 py-2.5 text-sm"
                >
                  Save
                </button>
                <Link
                  href={buildApplicationsHref(workspaceId, {
                    status: parsedStatusFilter ?? undefined,
                    q: searchQuery || undefined,
                  })}
                  className="btn-secondary w-full px-3 py-2.5 text-center text-sm"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </section>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-4">
            <p className="text-muted text-xs uppercase">Total</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">
              {totalCount}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-muted text-xs uppercase">Interviewing</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">
              {interviewCount}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-muted text-xs uppercase">Offers</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">
              {offerCount}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-muted text-xs uppercase">Rejected</p>
            <p className="mt-2 text-2xl font-semibold text-rose-300">
              {rejectedCount}
            </p>
          </div>
        </section>

        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildApplicationsHref(workspaceId, {
                  q: searchQuery || undefined,
                })}
                className={
                  !parsedStatusFilter
                    ? 'btn-primary px-3 py-1.5 text-xs'
                    : 'btn-secondary px-3 py-1.5 text-xs'
                }
              >
                All
              </Link>
              {STATUSES.map((status) => (
                <Link
                  key={status}
                  href={buildApplicationsHref(workspaceId, {
                    status,
                    q: searchQuery || undefined,
                  })}
                  className={
                    parsedStatusFilter === status
                      ? 'btn-primary px-3 py-1.5 text-xs'
                      : 'btn-secondary px-3 py-1.5 text-xs'
                  }
                >
                  {statusLabel(status)}
                </Link>
              ))}
            </div>

            <div className="w-full overflow-x-auto">
              <form style={toolbarGridStyle} method="get">
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search company or role"
                  className="input"
                />
                <select
                  name="status"
                  defaultValue={parsedStatusFilter ?? ''}
                  className="input select-clean"
                  style={{ WebkitAppearance: 'none', appearance: 'none' }}
                >
                  <option value="">All statuses</option>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="btn-secondary px-3 py-2 text-sm"
                >
                  Apply
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="card p-4">
          {applications.length === 0 ? (
            <div className="text-muted p-6 text-sm">No applications found.</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[980px] space-y-2">
                <div
                  className="px-4 py-2 text-xs font-semibold tracking-wide text-slate-400 uppercase"
                  style={{
                    ...rowGridStyle,
                    display: 'grid',
                    columnGap: '1rem',
                  }}
                >
                  <div>Company</div>
                  <div>Role</div>
                  <div>Status</div>
                  <div>Applied</div>
                  <div>Link</div>
                  <div>Actions</div>
                </div>

                {applications.map((app) => (
                  <article
                    key={app.id}
                    className="rounded-lg border border-slate-700 bg-slate-900/55 px-4 py-4"
                  >
                    <div
                      style={{
                        ...rowGridStyle,
                        display: 'grid',
                        alignItems: 'center',
                        columnGap: '0.75rem',
                      }}
                    >
                      <div>
                        <Link
                          href={`/workspaces/${workspaceId}/applications/${app.id}`}
                          className="font-medium text-slate-100 underline-offset-2 hover:underline"
                        >
                          {app.company}
                        </Link>
                      </div>

                      <div>
                        <p className="text-slate-300">{app.roleTitle}</p>
                      </div>

                      <div className="space-y-2">
                        <form
                          action={async (formData) => {
                            'use server';
                            await updateStatus(workspaceId, app.id, formData);
                          }}
                          className="max-w-[220px]"
                        >
                          <input
                            type="hidden"
                            name="redirectTo"
                            value={buildApplicationsHref(workspaceId, {
                              status: parsedStatusFilter ?? undefined,
                              q: searchQuery || undefined,
                            })}
                          />
                          <StatusSelect currentStatus={app.status} />
                        </form>
                      </div>

                      <div>
                        <p className="text-slate-300">
                          {app.appliedAt
                            ? new Date(app.appliedAt).toLocaleDateString(
                                'en-GB',
                              )
                            : '-'}
                        </p>
                      </div>

                      <div>
                        {app.jobUrl ? (
                          <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-100 underline underline-offset-2"
                          >
                            Open
                          </a>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </div>

                      <div>
                        <form
                          id={`delete-form-${app.id}`}
                          action={async (formData) => {
                            'use server';
                            await deleteApplication(workspaceId, app.id, formData);
                          }}
                          className="hidden"
                        >
                          <input
                            type="hidden"
                            name="redirectTo"
                            value={buildApplicationsHref(workspaceId, {
                              status: parsedStatusFilter ?? undefined,
                              q: searchQuery || undefined,
                            })}
                          />
                        </form>
                        <RowActionsMenu
                          editHref={`/workspaces/${workspaceId}/applications/${app.id}/edit`}
                          deleteFormId={`delete-form-${app.id}`}
                        />
                      </div>

                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
