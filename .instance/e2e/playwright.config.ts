import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    use: {
        baseURL: 'https://ausstello-nextjs.ddev.site',
        ignoreHTTPSErrors: false,
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
