import type { Metadata } from 'next';
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
} from '@/lib/validation';
import { StatusSelect } from './StatusSelect';

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
    typeof rawStatus === 'string' ? parseApplicationStatus(rawStatus) : 'APPLIED';

  if (!status) {
    redirect(`/workspaces/${workspaceId}/applications?msg=Invalid%20status`);
  }

  const existingApp = await prisma.application.findFirst({
    where: { id: applicationId, workspaceId },
    select: { id: true },
  });

  if (!existingApp) {
    redirect(`/workspaces/${workspaceId}/applications?msg=Application%20not%20found`);
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { status },
  });

  revalidatePath(`/workspaces/${workspaceId}/applications`);
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
  const jobUrl = parseOptionalUrl(formData, 'jobUrl');

  if (!company || !roleTitle) {
    redirect(
      buildApplicationsHref(workspaceId, {
        create: true,
        msg: 'Company and role are required',
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

function statusTone(status: ApplicationStatus): string {
  switch (status) {
    case 'OFFER':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
    case 'REJECTED':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
    case 'INTERVIEW':
    case 'SCREEN':
      return 'bg-blue-500/15 text-blue-300 border-blue-500/40';
    case 'OA':
      return 'bg-violet-500/15 text-violet-300 border-violet-500/40';
    case 'WITHDRAWN':
      return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    default:
      return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
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
  const parsedStatusFilter = statusFilter ? parseApplicationStatus(statusFilter) : null;

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

  const totalCount = statusTotalsRaw.reduce((acc, entry) => acc + entry._count._all, 0);
  const interviewCount = (totalsByStatus.INTERVIEW ?? 0) + (totalsByStatus.SCREEN ?? 0);
  const offerCount = totalsByStatus.OFFER ?? 0;
  const rejectedCount = totalsByStatus.REJECTED ?? 0;
  const rowGridStyle = {
    gridTemplateColumns: '1.35fr 1.2fr 1fr 0.8fr 0.65fr',
  } as const;

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
              <Link href={`/workspaces/${workspaceId}`} className="btn-secondary px-4 py-2 text-sm">
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

        {msg && <p className="card px-4 py-3 text-sm text-slate-200">{decodeURIComponent(msg)}</p>}

        {showCreate && (
          <section className="card p-4">
            <form
              action={async (formData) => {
                'use server';
                await createApplication(workspaceId, formData);
              }}
              className="grid gap-3 lg:grid-cols-4"
            >
              <input className="input" name="company" placeholder="Company" required />
              <input className="input" name="roleTitle" placeholder="Role title" required />
              <input className="input" name="jobUrl" placeholder="Job URL (optional)" />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary w-full px-3 py-2.5 text-sm">
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
            <p className="mt-2 text-2xl font-semibold text-slate-100">{totalCount}</p>
          </div>
          <div className="card p-4">
            <p className="text-muted text-xs uppercase">Interviewing</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{interviewCount}</p>
          </div>
          <div className="card p-4">
            <p className="text-muted text-xs uppercase">Offers</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">{offerCount}</p>
          </div>
          <div className="card p-4">
            <p className="text-muted text-xs uppercase">Rejected</p>
            <p className="mt-2 text-2xl font-semibold text-rose-300">{rejectedCount}</p>
          </div>
        </section>

        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildApplicationsHref(workspaceId, {
                  q: searchQuery || undefined,
                })}
                className={!parsedStatusFilter ? 'btn-primary px-3 py-1.5 text-xs' : 'btn-secondary px-3 py-1.5 text-xs'}
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

            <form className="grid w-full gap-2 md:grid-cols-3" method="get">
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
              <button type="submit" className="btn-secondary px-3 py-2 text-sm">
                Apply
              </button>
            </form>
          </div>
        </section>

        <section className="card p-4">
          {applications.length === 0 ? (
            <div className="p-6 text-sm text-muted">No applications found.</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[980px] space-y-2">
                <div
                  className="grid gap-4 px-4 py-2 text-xs font-semibold tracking-wide text-slate-400 uppercase"
                  style={rowGridStyle}
                >
                  <div>Company</div>
                  <div>Role</div>
                  <div>Status</div>
                  <div>Applied</div>
                  <div>Link</div>
                </div>

                {applications.map((app) => (
                  <article
                    key={app.id}
                    className="rounded-lg border border-slate-700 bg-slate-900/55 px-4 py-4"
                  >
                    <div className="grid items-center gap-3" style={rowGridStyle}>
                      <div>
                        <p className="font-medium text-slate-100">{app.company}</p>
                      </div>

                      <div>
                        <p className="text-slate-300">{app.roleTitle}</p>
                      </div>

                      <div className="space-y-2">
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${statusTone(
                            app.status,
                          )}`}
                        >
                          {statusLabel(app.status)}
                        </span>
                        <form
                          action={async (formData) => {
                            'use server';
                            await updateStatus(workspaceId, app.id, formData);
                          }}
                          className="max-w-[220px]"
                        >
                          <StatusSelect currentStatus={app.status} />
                        </form>
                      </div>

                      <div>
                        <p className="text-slate-300">
                          {app.appliedAt
                            ? new Date(app.appliedAt).toLocaleDateString('en-GB')
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
