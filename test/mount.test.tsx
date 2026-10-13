// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { AusstelloMount } from '../src/client/index';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('AusstelloMount', () => {
    it('feuert ausstello:scan bei jedem Mount, auch mit neuem key an derselben Stelle', async () => {
        let count = 0;
        document.addEventListener('ausstello:scan', () => count++);
        const root = createRoot(document.createElement('div'));

        await act(async () => root.render(<AusstelloMount key="a" />));
        expect(count).toBe(1);

        await act(async () => root.render(<AusstelloMount key="a" />));
        expect(count).toBe(1);

        await act(async () => root.render(<AusstelloMount key="b" />));
        expect(count).toBe(2);
    });

    it('feuert ausstello:leave beim Unmount genau einmal', async () => {
        let count = 0;
        const onLeave = () => count++;
        document.addEventListener('ausstello:leave', onLeave);
        const root = createRoot(document.createElement('div'));

        await act(async () => root.render(<AusstelloMount />));
        expect(count).toBe(0);

        await act(async () => root.unmount());
        expect(count).toBe(1);
        document.removeEventListener('ausstello:leave', onLeave);
    });
});
