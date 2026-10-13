import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    // Das lokale Backend ist mit den Entwicklungsdaten langsam (eine Listenanfrage
    // braucht ca. 4-5 s), daher grosszuegige Zeitlimits.
    timeout: 60_000,
    expect: { timeout: 15_000 },
    use: {
        baseURL: 'https://ausstello-nextjs.ddev.site',
        ignoreHTTPSErrors: false,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
        navigationTimeout: 60_000,
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
