import { defineConfig } from 'tsup';

export default defineConfig([
    {
        entry: { index: 'src/index.ts' },
        format: ['esm'],
        dts: true,
        external: ['@werkraum/ausstello-next/client', 'server-only', 'next', 'react', 'react-dom'],
    },
    {
        entry: { client: 'src/client/index.ts' },
        format: ['esm'],
        dts: true,
        banner: { js: "'use client';" },
        external: ['react'],
    },
]);
