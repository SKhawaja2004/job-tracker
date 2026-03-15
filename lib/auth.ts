import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

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

  return prisma.user.create({
    data: {
      clerkId,
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
