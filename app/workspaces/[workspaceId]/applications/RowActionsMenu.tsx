'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

export function RowActionsMenu({
  editHref,
  deleteFormId,
}: {
  editHref: string;
  deleteFormId: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 8 });
  const menuWidth = 128;

  const updatePosition = useMemo(
    () => () => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      const viewportWidth =
        window.visualViewport?.width ?? document.documentElement.clientWidth;
      const maxLeft = Math.max(8, viewportWidth - menuWidth - 8);
      const idealLeft = rect.right - menuWidth;
      setMenuPosition({
        top: rect.bottom + scrollY + 8,
        left: Math.min(Math.max(idealLeft, 8), maxLeft) + scrollX,
      });
    },
    [menuWidth],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  return (
    <div ref={rootRef} className="inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        className="rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800"
        onClick={() => {
          if (!open) {
            updatePosition();
          }
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        •••
      </button>

      {open &&
        createPortal(
          <div
            className="absolute z-50 w-32 rounded-md border border-slate-700 bg-slate-900 p-1 shadow-lg"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <Link
              href={editHref}
              className="block rounded px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              Edit
            </Link>
            <button
              type="button"
              className="block w-full rounded px-3 py-2 text-left text-sm text-rose-300 hover:bg-slate-800"
              onClick={() => {
                setOpen(false);
                const ok = window.confirm(
                  'Delete this application? This cannot be undone.',
                );
                if (!ok) return;
                const form = document.getElementById(
                  deleteFormId,
                ) as HTMLFormElement | null;
                form?.requestSubmit();
              }}
            >
              Delete
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
