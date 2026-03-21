import type { ApplicationStatus } from '@/lib/generated/prisma';

export type UpdateApplicationState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: {
    company?: string;
    roleTitle?: string;
    jobUrl?: string;
    status?: string;
  };
  values?: {
    company?: string;
    roleTitle?: string;
    jobUrl?: string;
    status?: ApplicationStatus;
  };
};

export const INITIAL_UPDATE_STATE: UpdateApplicationState = {
  status: 'idle',
};
