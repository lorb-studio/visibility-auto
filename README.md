<p align="center">
  <img src=".github/icon.png" width="80" height="80" alt="visibility-auto" />
</p>

<h1 align="center">visibility-auto</h1>
<p align="center">Long pages render instantly. Three lines.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lorb/visibility-auto"><code>npm install @lorb/visibility-auto</code></a>
</p>

**Automatic.** Finds all major elements, measures them, and applies `content-visibility: auto`. Offscreen content skips rendering entirely.

**Dynamic.** New elements added to the DOM are handled automatically via MutationObserver. Window resizes trigger re-measurement.

**Reversible.** Call `cleanup()` to restore every element to its original state.

```js
import { init } from '@lorb/visibility-auto';

const cleanup = init();
// Done. Offscreen sections, articles, and [data-va] elements
// are now skipped by the browser's rendering engine.
```

## Install

```bash
npm install @lorb/visibility-auto
```

## What you can do

### Speed up any long page

Works on landing pages, documentation sites, dashboards — anything with content below the fold.

```js
import { init } from '@lorb/visibility-auto';

// Default: targets section, article, and [data-va] elements
init();

// Or target specific elements
init({ selector: '.card, .content-block, .product-row' });
```

### React to visibility changes

Know when elements enter or leave the viewport — trigger lazy loading, pause animations, start videos.

```js
init({
  selector: '.video-player',
  onChange: (el, visible) => {
    if (visible) el.querySelector('video').play();
    else el.querySelector('video').pause();
  },
});
```

### Control when elements are pre-loaded

Adjust how early off-screen elements start rendering before they scroll into view.

```js
init({
  selector: 'section',
  threshold: 200,  // Start rendering 200px before visible
});
```

### Apply to individual elements

```js
import { apply, restore, measure } from '@lorb/visibility-auto';

const dims = measure(el);   // { width, height } or null if hidden
apply(el);                   // apply content-visibility: auto
restore(el);                 // restore original styles
```

## How it works

1. Measures each element's dimensions
2. Sets `content-visibility: auto` and `contain-intrinsic-size: auto <w>px auto <h>px`
3. Browser skips rendering for offscreen elements (massive paint/layout savings)
4. MutationObserver catches dynamically added elements
5. Debounced resize handler re-measures on layout changes

SSR-safe — no-op when `document` is undefined.

## API

| Export | Description |
|--------|-------------|
| `init(options?)` | Apply to all matching elements. Returns `cleanup()` function |
| `apply(el)` | Apply to a single element |
| `restore(el)` | Restore a single element to its original styles |
| `restoreAll()` | Restore all elements |
| `measure(el)` | Measure an element's dimensions. Returns `null` if hidden |

**Options:** `selector` (CSS selector), `onChange` (visibility callback), `threshold` (pre-load distance in px)

## License

𖦹 MIT — [Lorb.studio](https://lorb.studio)
