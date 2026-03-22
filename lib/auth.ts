import { auth, currentUser } from '@clerk/nextjs/server';
import { Prisma, WorkspaceRole } from '@/lib/generated/prisma';
import { prisma } from '@/lib/prisma';

export const APPLICATION_MANAGE_ROLES: WorkspaceRole[] = ['OWNER', 'ADMIN'];
export const APPLICATION_STATUS_UPDATE_ROLES: WorkspaceRole[] = [
  'OWNER',
  'ADMIN',
  'MEMBER',
];

export async function requireDbUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const primaryEmail =
    clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    throw new Error('Authenticated user is missing an email address.');
  }

  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    clerkUser.username ||
    null;

  try {
    return await prisma.user.upsert({
      where: { clerkId },
      update: {
        email: primaryEmail,
        name: displayName,
      },
      create: {
        clerkId,
        email: primaryEmail,
        name: displayName,
      },
    });
  } catch (error) {
    // Handle unique constraint races during first-login sync.
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2002'
    ) {
      throw error;
    }

    const existingByClerkId = await prisma.user.findUnique({
      where: { clerkId },
    });
    if (existingByClerkId) {
      return prisma.user.update({
        where: { id: existingByClerkId.id },
        data: { email: primaryEmail, name: displayName },
      });
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email: primaryEmail },
    });
    if (existingByEmail) {
      return prisma.user.update({
        where: { id: existingByEmail.id },
        data: { clerkId, name: displayName },
      });
    }

    throw error;
  }
}

export async function isWorkspaceMember(userId: string, workspaceId: string) {
  const role = await getWorkspaceRole(userId, workspaceId);
  return role !== null;
}

export async function getWorkspaceRole(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceRole | null> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    select: { role: true },
  });

  return membership?.role ?? null;
}

export async function hasWorkspaceRole(
  userId: string,
  workspaceId: string,
  allowedRoles: WorkspaceRole[],
) {
  const role = await getWorkspaceRole(userId, workspaceId);
  return role !== null && allowedRoles.includes(role);
}
