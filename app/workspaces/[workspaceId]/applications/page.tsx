import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { StatusSelect } from './StatusSelect';

async function updateStatus(
  workspaceId: string,
  applicationId: string,
  formData: FormData,
): Promise<void> {
  'use server';

  const rawStatus = formData.get('status');
  const status = typeof rawStatus === 'string' ? rawStatus : 'APPLIED';

  await prisma.application.update({
    where: { id: applicationId },
    data: { status: status as any },
  });

  revalidatePath(`/workspaces/${workspaceId}/applications`);
}

function statusLabel(status: string) {
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
    default:
      return status;
  }
}
async function createApplication(
  workspaceId: string,
  formData: FormData,
): Promise<void> {
  'use server';

  const companyRaw = formData.get('company');
  const roleRaw = formData.get('roleTitle');
  const jobUrlRaw = formData.get('jobUrl');

  const company = typeof companyRaw === 'string' ? companyRaw.trim() : '';
  const roleTitle = typeof roleRaw === 'string' ? roleRaw.trim() : '';
  const jobUrl = typeof jobUrlRaw === 'string' ? jobUrlRaw.trim() : '';

  if (!company || !roleTitle) {
    redirect(
      `/workspaces/${workspaceId}/applications?msg=Company%20and%20role%20are%20required`,
    );
  }

  // TEMP: until we add auth, use DEMO_USER_ID
  const createdById = process.env.DEMO_USER_ID;
  if (!createdById) {
    redirect(
      `/workspaces/${workspaceId}/applications?msg=Missing%20DEMO_USER_ID%20in%20.env`,
    );
  }

  await prisma.application.create({
    data: {
      workspaceId,
      createdById,
      company,
      roleTitle,
      jobUrl: jobUrl || null,
      status: 'APPLIED',
      appliedAt: new Date(),
    },
  });

  revalidatePath(`/workspaces/${workspaceId}/applications`);
  redirect(`/workspaces/${workspaceId}/applications?msg=Application%20created`);
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

  // Verify workspace exists (otherwise 404)
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true },
  });

  if (!workspace) notFound();

  // Fetch applications in this workspace
  const applications = await prisma.application.findMany({
    where: {
      workspaceId,
      ...(statusFilter ? { status: statusFilter as any } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{workspace.name}</h1>
          <p className="text-sm text-gray-500">Applications</p>
        </div>

        <Link className="text-sm underline" href={`/workspaces/${workspaceId}`}>
          Back to workspace
        </Link>
      </div>

      {msg && (
        <p className="text-sm text-gray-600">{decodeURIComponent(msg)}</p>
      )}

      {/* Create Application Form */}
      <form
        action={async (formData) => {
          'use server';
          await createApplication(workspaceId, formData);
        }}
        className="space-y-3 rounded-md border p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="company">
              Company
            </label>
            <input
              id="company"
              name="company"
              className="w-full rounded-md border px-3 py-2"
              placeholder="e.g. Google"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="roleTitle">
              Role title
            </label>
            <input
              id="roleTitle"
              name="roleTitle"
              className="w-full rounded-md border px-3 py-2"
              placeholder="e.g. Software Engineer Intern"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="jobUrl">
            Job URL (optional)
          </label>
          <input
            id="jobUrl"
            name="jobUrl"
            className="w-full rounded-md border px-3 py-2"
            placeholder="https://..."
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Add application
        </button>
      </form>
      {/*Filter Tabs*/}
      <div className="flex flex-wrap gap-2">
        <Link
          className={`rounded-md border px-3 py-1 text-sm ${
            !statusFilter ? 'bg-black text-white' : ''
          }`}
          href={`/workspaces/${workspaceId}/applications`}
        >
          All
        </Link>

        {[
          'APPLIED',
          'OA',
          'SCREEN',
          'INTERVIEW',
          'OFFER',
          'REJECTED',
          'WITHDRAWN',
        ].map((s) => (
          <Link
            key={s}
            className={`rounded-md border px-3 py-1 text-sm ${
              statusFilter === s ? 'bg-black text-white' : ''
            }`}
            href={`/workspaces/${workspaceId}/applications?status=${s}`}
          >
            {s}
          </Link>
        ))}
      </div>
      {/* Applications List */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Latest</h2>

        {applications.length === 0 ? (
          <p className="text-gray-500">No applications yet.</p>
        ) : (
          <div className="space-y-2">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-start justify-between gap-4 rounded-md border p-4"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {app.company} — {app.roleTitle}
                  </div>

                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                    {statusLabel(app.status)}
                  </span>

                  <form
                    action={async (formData) => {
                      'use server';
                      await updateStatus(workspaceId, app.id, formData);
                    }}
                  >
                    <StatusSelect currentStatus={app.status} />
                  </form>

                  {app.jobUrl && (
                    <a
                      className="text-sm break-all underline"
                      href={app.jobUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {app.jobUrl}
                    </a>
                  )}
                </div>

                <div className="text-sm text-gray-500">
                  {app.appliedAt
                    ? new Date(app.appliedAt).toLocaleDateString('en-GB')
                    : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
