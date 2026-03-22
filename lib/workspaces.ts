import { prisma } from '@/lib/prisma';

type DefaultWorkspaceResult = {
  workspaceId: string;
  created: boolean;
};

/**
 * Ensures a user has at least one workspace for fast first-run onboarding.
 * If none exist, we create a personal starter workspace.
 */
export async function ensureDefaultWorkspace(
  userId: string,
): Promise<DefaultWorkspaceResult> {
  const existingMembership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { workspaceId: true },
  });

  if (existingMembership) {
    return { workspaceId: existingMembership.workspaceId, created: false };
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: 'My applications',
      inviteCode: crypto.randomUUID(),
      memberships: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
    select: { id: true },
  });

  return { workspaceId: workspace.id, created: true };
}

