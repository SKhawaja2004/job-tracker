import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ApplicationStatus } from '@/lib/generated/prisma';
import { prisma } from '@/lib/prisma';
import {
  APPLICATION_MANAGE_ROLES,
  APPLICATION_STATUS_UPDATE_ROLES,
  hasWorkspaceRole,
  requireDbUser,
  isWorkspaceMember,
} from '@/lib/auth';
import {
  parseApplicationStatus,
  parseOptionalUrl,
  parseRequiredText,
  validateCompany,
  validateRoleTitle,
} from '@/lib/validation';
import { StatusSelect } from './StatusSelect';
import { RowActionsMenu } from './RowActionsMenu';
import { AddApplicationModal } from './AddApplicationModal';
import { ApplicationsToolbar } from './ApplicationsToolbar';
import { type CreateApplicationState } from './createApplicationState';
import { type UpdateApplicationState } from './updateApplicationState';

export const metadata: Metadata = {
  title: 'Applications',
  description: 'Track and manage job applications in a clean list view.',
};

function buildApplicationsHref(
  workspaceId: string,
  options: {
    status?: ApplicationStatus;
    q?: string;
    msg?: string;
  },
) {
  const params = new URLSearchParams();
  if (options.status) params.set('status', options.status);
  if (options.q) params.set('q', options.q);
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

  const canUpdateStatus = await hasWorkspaceRole(
    dbUser.id,
    workspaceId,
    APPLICATION_STATUS_UPDATE_ROLES,
  );
  if (!canUpdateStatus) {
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
  _prevState: CreateApplicationState,
  formData: FormData,
): Promise<CreateApplicationState> {
  'use server';

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const isMember = await isWorkspaceMember(dbUser.id, workspaceId);
  if (!isMember) {
    return { status: 'error', message: 'Not authorized for this workspace.' };
  }

  const company = parseRequiredText(formData, 'company');
  const roleTitle = parseRequiredText(formData, 'roleTitle');
  const rawJobUrl = parseRequiredText(formData, 'jobUrl');
  const jobUrl = parseOptionalUrl(formData, 'jobUrl');

  const fieldErrors: CreateApplicationState['fieldErrors'] = {};
  const companyError = validateCompany(company);
  if (companyError) fieldErrors.company = companyError;
  const roleTitleError = validateRoleTitle(roleTitle);
  if (roleTitleError) fieldErrors.roleTitle = roleTitleError;
  if (rawJobUrl && !jobUrl) fieldErrors.jobUrl = 'Invalid job URL.';

  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors };
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
  return { status: 'success', message: 'Application created.' };
}


async function deleteApplication(
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

async function updateApplicationFromList(
  workspaceId: string,
  applicationId: string,
  _prevState: UpdateApplicationState,
  formData: FormData,
): Promise<UpdateApplicationState> {
  'use server';

  const dbUser = await requireDbUser();
  if (!dbUser) redirect('/sign-in');

  const canManage = await hasWorkspaceRole(
    dbUser.id,
    workspaceId,
    APPLICATION_MANAGE_ROLES,
  );
  if (!canManage) {
    return { status: 'error', message: 'Not authorized for this workspace.' };
  }

  const company = parseRequiredText(formData, 'company');
  const roleTitle = parseRequiredText(formData, 'roleTitle');
  const rawJobUrl = parseRequiredText(formData, 'jobUrl');
  const jobUrl = parseOptionalUrl(formData, 'jobUrl');
  const rawStatus = formData.get('status');
  const parsedStatus =
    typeof rawStatus === 'string' ? parseApplicationStatus(rawStatus) : null;

  const fieldErrors: UpdateApplicationState['fieldErrors'] = {};
  const companyError = validateCompany(company);
  if (companyError) fieldErrors.company = companyError;
  const roleTitleError = validateRoleTitle(roleTitle);
  if (roleTitleError) fieldErrors.roleTitle = roleTitleError;
  if (rawJobUrl && !jobUrl) fieldErrors.jobUrl = 'Invalid job URL.';
  if (!parsedStatus) fieldErrors.status = 'Invalid status.';

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: 'error',
      message: 'Please fix the highlighted fields.',
      fieldErrors,
      values: {
        company,
        roleTitle,
        jobUrl: rawJobUrl,
        status: parsedStatus ?? undefined,
      },
    };
  }

  const status = parsedStatus as ApplicationStatus;

  const existingApp = await prisma.application.findFirst({
    where: { id: applicationId, workspaceId },
    select: { id: true },
  });
  if (!existingApp) {
    return { status: 'error', message: 'Application not found.' };
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      company,
      roleTitle,
      jobUrl,
      status,
    },
  });

  revalidatePath(`/workspaces/${workspaceId}/applications`);
  return { status: 'success', message: 'Application updated.' };
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

  const statusFilter = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const qRaw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const searchQuery = typeof qRaw === 'string' ? qRaw.trim() : '';
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
  const canManageApplications = await hasWorkspaceRole(
    dbUser.id,
    workspaceId,
    APPLICATION_MANAGE_ROLES,
  );

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
    gridTemplateColumns: '1.5fr 1.25fr 1fr 0.85fr 0.6fr',
  } as CSSProperties;

  return (
    <main className="page">
      <div className="container max-w-6xl space-y-4">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
            {workspace.name}
          </h1>
          <AddApplicationModal
            action={createApplication.bind(
              null,
              workspaceId,
            ) as (
              state: CreateApplicationState,
              formData: FormData,
            ) => Promise<CreateApplicationState>}
          />
        </section>

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

        <ApplicationsToolbar
          workspaceId={workspaceId}
          initialQuery={searchQuery}
          initialStatus={(parsedStatusFilter ?? '') as
            | ''
            | 'APPLIED'
            | 'OA'
            | 'SCREEN'
            | 'INTERVIEW'
            | 'OFFER'
            | 'REJECTED'
            | 'WITHDRAWN'}
        />

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
                  <div></div>
                </div>

                {applications.map((app) => (
                  <article
                    key={app.id}
                    className="relative rounded-lg border border-slate-700 bg-slate-900/55 px-4 py-4 transition hover:border-slate-600 hover:bg-slate-900/85"
                  >
                    <Link
                      href={`/workspaces/${workspaceId}/applications/${app.id}`}
                      aria-label={`Open ${app.company} ${app.roleTitle}`}
                      className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
                    />
                    <div
                      className="relative z-20"
                      style={{
                        ...rowGridStyle,
                        display: 'grid',
                        alignItems: 'center',
                        columnGap: '1rem',
                      }}
                    >
                      <div>
                        <Link
                          href={`/workspaces/${workspaceId}/applications/${app.id}`}
                          className="relative z-30 block rounded px-1 py-2 -my-2 font-medium text-slate-100 pointer-events-auto"
                        >
                          {app.company}
                        </Link>
                      </div>

                      <div>
                        <Link
                          href={`/workspaces/${workspaceId}/applications/${app.id}`}
                          className="relative z-30 block rounded px-1 py-2 -my-2 text-slate-300 pointer-events-auto"
                        >
                          {app.roleTitle}
                        </Link>
                      </div>

                      <div className="relative z-20 pointer-events-auto space-y-2">
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

                      <div className="pointer-events-none">
                        <div className="block rounded px-1 py-2 -my-2 text-slate-300">
                          {app.appliedAt
                            ? new Date(app.appliedAt).toLocaleDateString('en-GB')
                            : '-'}
                        </div>
                      </div>

                      <div className="relative z-20 pointer-events-auto flex items-center justify-center gap-2">
                        {app.jobUrl && (
                          <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open job link"
                            title="Open job link"
                            className="text-slate-400 transition-colors hover:text-blue-400"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                            >
                              <path
                                d="M10.59 13.41a1 1 0 0 1 0-1.41l3.83-3.83a3 3 0 1 1 4.24 4.24l-3.83 3.83a3 3 0 0 1-4.24 0"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M13.41 10.59a1 1 0 0 1 0 1.41l-3.83 3.83a3 3 0 0 1-4.24-4.24l3.83-3.83a3 3 0 0 1 4.24 0"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </a>
                        )}

                        {canManageApplications && (
                          <>
                            <form
                              id={`delete-form-${app.id}`}
                              action={async (formData) => {
                                'use server';
                                await deleteApplication(
                                  workspaceId,
                                  app.id,
                                  formData,
                                );
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
                              deleteFormId={`delete-form-${app.id}`}
                              initialValues={{
                                company: app.company,
                                roleTitle: app.roleTitle,
                                jobUrl: app.jobUrl ?? '',
                                status: app.status,
                              }}
                              editAction={updateApplicationFromList.bind(
                                null,
                                workspaceId,
                                app.id,
                              ) as (
                                state: UpdateApplicationState,
                                formData: FormData,
                              ) => Promise<UpdateApplicationState>}
                            />
                          </>
                        )}
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
