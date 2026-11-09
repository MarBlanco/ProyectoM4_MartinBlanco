import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { afterEach } from 'vitest';

// Mantine usa APIs del navegador que jsdom no implementa. Se simulan solo
// cuando existe `window` (los tests del endpoint corren en entorno node).
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        }),
    });

    window.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    };

    window.HTMLElement.prototype.scrollIntoView = () => {};

    // Textarea con `autosize` escucha la carga de fuentes.
    Object.defineProperty(document, 'fonts', {
        configurable: true,
        value: {
            addEventListener: () => {},
            removeEventListener: () => {},
            ready: Promise.resolve(),
        },
    });
}

afterEach(() => {
    cleanup();

    if (typeof window !== 'undefined') {
        notifications.clean();
        modals.closeAll();
    }
});
