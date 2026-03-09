import { ApplicationStatus } from '@/lib/generated/prisma';

export function parseRequiredText(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

export function isValidWorkspaceName(name: string): boolean {
  return name.length >= 2 && name.length <= 80;
}

export function isValidInviteCode(code: string): boolean {
  return code.length >= 8 && code.length <= 128;
}

export function parseOptionalUrl(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  const value = typeof raw === 'string' ? raw.trim() : '';

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function parseApplicationStatus(raw: string): ApplicationStatus | null {
  const allowed: ApplicationStatus[] = [
    'APPLIED',
    'OA',
    'SCREEN',
    'INTERVIEW',
    'OFFER',
    'REJECTED',
    'WITHDRAWN',
  ];

  return allowed.includes(raw as ApplicationStatus)
    ? (raw as ApplicationStatus)
    : null;
}
