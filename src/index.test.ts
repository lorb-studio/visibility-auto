import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { measure, apply, restore, restoreAll, measureAndApplyAll, init } from './index.js';

function makeSection(tag = 'section', height = 200, width = 600): HTMLElement {
  const el = document.createElement(tag);
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
  Object.defineProperty(el, 'offsetWidth', { value: width, configurable: true });
  document.body.appendChild(el);
  return el;
}

describe('measure', () => {
  it('returns width and height from offsetWidth/offsetHeight', () => {
    const el = makeSection('section', 300, 800);
    expect(measure(el)).toEqual({ width: 800, height: 300 });
    el.remove();
  });

  it('returns null for zero-size elements', () => {
    const el = makeSection('section', 0, 0);
    expect(measure(el)).toBeNull();
    el.remove();
  });
});

describe('apply', () => {
  it('sets content-visibility and contain-intrinsic-size', () => {
    const el = makeSection('section', 400, 600);
    expect(apply(el)).toBe(true);
    expect(el.style.contentVisibility).toBe('auto');
    expect(el.style.containIntrinsicSize).toBe('auto 600px auto 400px');
    el.remove();
  });

  it('returns false for zero-size elements', () => {
    const el = makeSection('section', 0, 0);
    expect(apply(el)).toBe(false);
    el.remove();
  });

  it('stores original styles for restoration', () => {
    const el = makeSection();
    el.style.contentVisibility = 'visible';
    el.style.containIntrinsicSize = '100px';
    apply(el);
    expect(el.style.contentVisibility).toBe('auto');
    restore(el);
    expect(el.style.contentVisibility).toBe('visible');
    expect(el.style.containIntrinsicSize).toBe('100px');
    el.remove();
  });
});

describe('restore', () => {
  it('returns false for elements that were never applied', () => {
    const el = makeSection();
    expect(restore(el)).toBe(false);
    el.remove();
  });

  it('restores original empty styles', () => {
    const el = makeSection();
    apply(el);
    restore(el);
    expect(el.style.contentVisibility).toBe('');
    expect(el.style.containIntrinsicSize).toBe('');
    el.remove();
  });
});

describe('restoreAll', () => {
  it('restores all applied elements', () => {
    const a = makeSection();
    const b = makeSection('article', 150, 500);
    apply(a);
    apply(b);
    restoreAll();
    expect(a.style.contentVisibility).toBe('');
    expect(b.style.contentVisibility).toBe('');
    a.remove();
    b.remove();
  });
});

describe('measureAndApplyAll', () => {
  beforeEach(() => {
    restoreAll();
    document.body.innerHTML = '';
  });

  it('applies to all matching elements', () => {
    const a = makeSection('section', 200, 600);
    const b = makeSection('section', 300, 600);
    const count = measureAndApplyAll('section');
    expect(count).toBe(2);
    expect(a.style.contentVisibility).toBe('auto');
    expect(b.style.contentVisibility).toBe('auto');
  });

  it('skips zero-size elements', () => {
    makeSection('section', 0, 0);
    makeSection('section', 100, 400);
    const count = measureAndApplyAll('section');
    expect(count).toBe(1);
  });
});

describe('SSR guard', () => {
  it('measureAndApplyAll returns 0 when document is undefined', () => {
    const origDoc = globalThis.document;
    // @ts-expect-error - simulating SSR
    delete globalThis.document;
    expect(measureAndApplyAll('section')).toBe(0);
    globalThis.document = origDoc;
  });

  it('init returns no-op cleanup when document is undefined', () => {
    const origDoc = globalThis.document;
    // @ts-expect-error - simulating SSR
    delete globalThis.document;
    const cleanup = init();
    expect(typeof cleanup).toBe('function');
    cleanup(); // should not throw
    globalThis.document = origDoc;
  });
});

describe('init', () => {
  beforeEach(() => {
    restoreAll();
    document.body.innerHTML = '';
  });

  it('applies to default selectors (section, article, [data-va])', () => {
    const sec = makeSection('section', 200, 600);
    const art = makeSection('article', 150, 500);
    const div = document.createElement('div');
    div.setAttribute('data-va', '');
    Object.defineProperty(div, 'offsetHeight', { value: 100, configurable: true });
    Object.defineProperty(div, 'offsetWidth', { value: 400, configurable: true });
    document.body.appendChild(div);

    const cleanup = init();
    expect(sec.style.contentVisibility).toBe('auto');
    expect(art.style.contentVisibility).toBe('auto');
    expect(div.style.contentVisibility).toBe('auto');
    cleanup();
  });

  it('respects custom selector', () => {
    const panel = document.createElement('div');
    panel.className = 'panel';
    Object.defineProperty(panel, 'offsetHeight', { value: 300, configurable: true });
    Object.defineProperty(panel, 'offsetWidth', { value: 500, configurable: true });
    document.body.appendChild(panel);

    const sec = makeSection('section', 200, 600);
    const cleanup = init({ selector: '.panel' });
    expect(panel.style.contentVisibility).toBe('auto');
    expect(sec.style.contentVisibility).toBe('');
    cleanup();
  });

  it('cleanup restores all elements and removes listeners', () => {
    const el = makeSection('section', 200, 600);
    const cleanup = init();
    expect(el.style.contentVisibility).toBe('auto');
    cleanup();
    expect(el.style.contentVisibility).toBe('');
  });
});

describe('dynamic sections (MutationObserver)', () => {
  beforeEach(() => {
    restoreAll();
    document.body.innerHTML = '';
  });

  it('applies to dynamically added matching elements', async () => {
    const cleanup = init();

    const newSection = document.createElement('section');
    Object.defineProperty(newSection, 'offsetHeight', { value: 250, configurable: true });
    Object.defineProperty(newSection, 'offsetWidth', { value: 600, configurable: true });
    document.body.appendChild(newSection);

    // MutationObserver fires asynchronously
    await new Promise((r) => setTimeout(r, 0));

    expect(newSection.style.contentVisibility).toBe('auto');
    expect(newSection.style.containIntrinsicSize).toBe('auto 600px auto 250px');
    cleanup();
  });

  it('applies to nested matching elements added dynamically', async () => {
    const cleanup = init();

    const wrapper = document.createElement('div');
    const nested = document.createElement('article');
    Object.defineProperty(nested, 'offsetHeight', { value: 180, configurable: true });
    Object.defineProperty(nested, 'offsetWidth', { value: 500, configurable: true });
    wrapper.appendChild(nested);
    document.body.appendChild(wrapper);

    await new Promise((r) => setTimeout(r, 0));

    expect(nested.style.contentVisibility).toBe('auto');
    cleanup();
  });
});

describe('resize handling', () => {
  beforeEach(() => {
    restoreAll();
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('re-measures on window resize after debounce', () => {
    const el = makeSection('section', 200, 600);
    const cleanup = init();
    expect(el.style.containIntrinsicSize).toBe('auto 600px auto 200px');

    // Simulate height change
    Object.defineProperty(el, 'offsetHeight', { value: 500, configurable: true });

    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(200);

    expect(el.style.containIntrinsicSize).toBe('auto 600px auto 500px');
    cleanup();
  });

  it('debounces multiple rapid resizes', () => {
    const el = makeSection('section', 200, 600);
    const cleanup = init();

    const spy = vi.spyOn(document, 'querySelectorAll');

    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));

    // Before debounce fires, querySelectorAll from resize should not have been called
    const callsBefore = spy.mock.calls.length;

    vi.advanceTimersByTime(200);

    // Only one additional querySelectorAll call after debounce
    expect(spy.mock.calls.length - callsBefore).toBe(1);

    spy.mockRestore();
    cleanup();
  });
});

describe('onChange callback', () => {
  beforeEach(() => {
    restoreAll();
    document.body.innerHTML = '';
  });

  it('creates IntersectionObserver when onChange is provided', () => {
    const observeSpy = vi.fn();
    const disconnectSpy = vi.fn();

    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn().mockImplementation(() => ({
        observe: observeSpy,
        disconnect: disconnectSpy,
        unobserve: vi.fn(),
      })),
    );

    const el = makeSection('section', 200, 600);
    const cleanup = init({ onChange: () => {} });

    expect(observeSpy).toHaveBeenCalledWith(el);
    cleanup();
    expect(disconnectSpy).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
