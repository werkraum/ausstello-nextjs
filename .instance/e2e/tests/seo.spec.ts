import { expect, test } from '@playwright/test';

const ORIGIN = 'https://ausstello-nextjs.ddev.site';

test('Liste: Titel und Canonical auf die Instanz', async ({ page }) => {
    await page.goto('/veranstaltungen');
    expect(await page.title()).not.toBe('');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`^${ORIGIN}/veranstaltungen`));
});

test('Gefilterte Liste ist noindex', async ({ page }) => {
    await page.goto('/veranstaltungen?filter%5Bquery%5D=Konzert');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('Detail: Canonical, og:title, JSON-LD', async ({ page }) => {
    await page.goto('/veranstaltungen');
    await page.locator('a.ausstello-list-teaser').first().click();
    await expect(page.locator('h1.ausstello-detail-title')).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`^${ORIGIN}/veranstaltungen/`));
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(jsonLd).toContain('"Event"');
});

test('Unbekannter Termin ist 404', async ({ page }) => {
    const response = await page.goto('/veranstaltungen/gibt-es-nicht-123456');
    expect(response?.status()).toBe(404);
});

test('Sitemap enthält Detailadressen der Instanz', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain(`<loc>${ORIGIN}/veranstaltungen/`);
});

test('Backend-Header X-Robots-Tag kommt nicht durch', async ({ request }) => {
    const response = await request.get('/veranstaltungen');
    expect(response.headers()['x-robots-tag']).toBeUndefined();
});
