import { ApplicationStatus } from '@/lib/generated/prisma';

const WORKSPACE_NAME_MIN = 2;
const WORKSPACE_NAME_MAX = 80;
const COMPANY_MIN = 2;
const COMPANY_MAX = 120;
const ROLE_TITLE_MIN = 2;
const ROLE_TITLE_MAX = 160;
const LOCATION_MAX = 120;
const NOTES_MAX = 4000;

export function parseRequiredText(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

export function parseOptionalText(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

function hasLengthBetween(
  value: string,
  min: number,
  max: number,
  fieldLabel: string,
): string | null {
  if (value.length < min || value.length > max) {
    return `${fieldLabel} must be ${min}-${max} characters.`;
  }
  return null;
}

export function isValidWorkspaceName(name: string): boolean {
  return !validateWorkspaceName(name);
}

export function isValidInviteCode(code: string): boolean {
  return !validateInviteCode(code);
}

export function validateWorkspaceName(name: string): string | null {
  return hasLengthBetween(name, WORKSPACE_NAME_MIN, WORKSPACE_NAME_MAX, 'Workspace name');
}

export function validateInviteCode(code: string): string | null {
  if (code.length < 8 || code.length > 128) {
    return 'Please enter a valid invite code.';
  }
  if (!/^[a-zA-Z0-9-]+$/.test(code)) {
    return 'Please enter a valid invite code.';
  }
  return null;
}

export function validateCompany(value: string): string | null {
  return hasLengthBetween(value, COMPANY_MIN, COMPANY_MAX, 'Company');
}

export function validateRoleTitle(value: string): string | null {
  return hasLengthBetween(value, ROLE_TITLE_MIN, ROLE_TITLE_MAX, 'Role title');
}

export function validateLocation(value: string): string | null {
  if (!value) return null;
  if (value.length > LOCATION_MAX) {
    return `Location must be ${LOCATION_MAX} characters or fewer.`;
  }
  return null;
}

export function validateNotes(value: string): string | null {
  if (!value) return null;
  if (value.length > NOTES_MAX) {
    return `Notes must be ${NOTES_MAX} characters or fewer.`;
  }
  return null;
}

export function parseOptionalUrl(
  formData: FormData,
  key: string,
): string | null {
  const raw = formData.get(key);
  const value = typeof raw === 'string' ? raw.trim() : '';

  if (!value) {
    return null;
  }

  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value);
  const normalized = hasProtocol ? value : `https://${value}`;

  try {
    const url = new URL(normalized);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname || !url.hostname.includes('.')) return null;

    return url.toString();
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
