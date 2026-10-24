import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);

// jsdom does not implement the native dialog lifecycle. Browser checks verify
// actual modal focus, Escape and backdrop behavior; these methods support DOM tests.
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  configurable: true,
  value: function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  },
});
Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  configurable: true,
  value: function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  },
});
