export interface VisibilityAutoOptions {
  selector?: string;
  threshold?: number;
  onChange?: (el: Element, visible: boolean) => void;
}

interface OriginalStyles {
  contentVisibility: string;
  containIntrinsicSize: string;
}

const applied = new Map<HTMLElement, OriginalStyles>();

export function measure(el: HTMLElement): { width: number; height: number } | null {
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  if (width === 0 && height === 0) return null;
  return { width, height };
}

export function apply(el: HTMLElement): boolean {
  const size = measure(el);
  if (!size) return false;

  if (!applied.has(el)) {
    applied.set(el, {
      contentVisibility: el.style.contentVisibility,
      containIntrinsicSize: el.style.containIntrinsicSize,
    });
  }

  el.style.contentVisibility = 'auto';
  el.style.containIntrinsicSize = `auto ${size.width}px auto ${size.height}px`;
  return true;
}

export function restore(el: HTMLElement): boolean {
  const original = applied.get(el);
  if (!original) return false;

  el.style.contentVisibility = original.contentVisibility;
  el.style.containIntrinsicSize = original.containIntrinsicSize;
  applied.delete(el);
  return true;
}

export function restoreAll(): void {
  for (const el of applied.keys()) {
    const original = applied.get(el)!;
    el.style.contentVisibility = original.contentVisibility;
    el.style.containIntrinsicSize = original.containIntrinsicSize;
  }
  applied.clear();
}

export function measureAndApplyAll(selector: string): number {
  if (typeof document === 'undefined') return 0;
  const elements = document.querySelectorAll<HTMLElement>(selector);
  let count = 0;
  for (const el of elements) {
    if (apply(el)) count++;
  }
  return count;
}

export function init(options?: VisibilityAutoOptions): () => void {
  // SSR guard
  if (typeof document === 'undefined') {
    return () => {};
  }

  const {
    selector = 'section, article, [data-va]',
    threshold = 0,
    onChange,
  } = options ?? {};

  measureAndApplyAll(selector);

  // IntersectionObserver for onChange callbacks
  let visibilityObserver: IntersectionObserver | undefined;
  if (onChange) {
    visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          onChange(entry.target, entry.isIntersecting);
        }
      },
      { rootMargin: `${threshold}px` },
    );
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      visibilityObserver!.observe(el);
    });
  }

  // MutationObserver for dynamically added sections
  const mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) {
          const htmlNode = node as HTMLElement;
          if (htmlNode.matches(selector)) {
            apply(htmlNode);
            visibilityObserver?.observe(htmlNode);
          }
          htmlNode.querySelectorAll<HTMLElement>(selector).forEach((child) => {
            apply(child);
            visibilityObserver?.observe(child);
          });
        }
      }
    }
  });

  mutationObserver.observe(document.body, { childList: true, subtree: true });

  // Debounced resize handler
  let resizeTimer: ReturnType<typeof setTimeout>;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => measureAndApplyAll(selector), 150);
  };
  window.addEventListener('resize', onResize);

  // Cleanup
  return () => {
    mutationObserver.disconnect();
    visibilityObserver?.disconnect();
    window.removeEventListener('resize', onResize);
    clearTimeout(resizeTimer);
    restoreAll();
  };
}
