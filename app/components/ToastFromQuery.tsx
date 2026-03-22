'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from './ToastProvider';

function decodeMessage(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function inferTone(message: string): 'success' | 'error' | 'info' {
  const lower = message.toLowerCase();
  if (
    lower.includes('invalid') ||
    lower.includes('not authorized') ||
    lower.includes('not found') ||
    lower.includes('required') ||
    lower.includes('error')
  ) {
    return 'error';
  }
  if (
    lower.includes('created') ||
    lower.includes('updated') ||
    lower.includes('joined') ||
    lower.includes('saved')
  ) {
    return 'success';
  }
  return 'info';
}

export function ToastFromQuery() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { pushToast } = useToast();
  const lastHandled = useRef<string | null>(null);

  useEffect(() => {
    const rawMsg = params.get('msg');
    if (!rawMsg || rawMsg === lastHandled.current) return;

    const decoded = decodeMessage(rawMsg);
    pushToast(decoded, inferTone(decoded));
    lastHandled.current = rawMsg;

    const nextParams = new URLSearchParams(params.toString());
    nextParams.delete('msg');
    const nextUrl = nextParams.toString()
      ? `${pathname}?${nextParams.toString()}`
      : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [params, pathname, pushToast, router]);

  return null;
}
