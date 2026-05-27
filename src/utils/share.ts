export type ShareResult = 'shared' | 'copied' | 'failed';

interface SharePayload {
  title?: string;
  text: string;
  url?: string;
}

/**
 * Share via the Web Share API when available (mobile), otherwise copy the text
 * to the clipboard. Returns what actually happened so callers can show the
 * right toast. A user-cancelled native share resolves to 'failed' silently
 * (no toast needed).
 */
export async function shareOrCopy({ title, text, url }: SharePayload): Promise<ShareResult> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      // AbortError = user dismissed the sheet; treat as a no-op.
      if (err instanceof DOMException && err.name === 'AbortError') return 'failed';
      // Fall through to clipboard on any other share failure.
    }
  }

  const payload = url ? `${text} ${url}` : text;
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(payload);
      return 'copied';
    } catch {
      return 'failed';
    }
  }
  return 'failed';
}
