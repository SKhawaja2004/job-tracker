import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function requireDbUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

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

  return prisma.user.upsert({
    where: { email: primaryEmail },
    update: { name: displayName },
    create: {
      email: primaryEmail,
      name: displayName,
    },
  });
}

export async function isWorkspaceMember(userId: string, workspaceId: string) {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    select: { id: true },
  });

  return Boolean(membership);
}
