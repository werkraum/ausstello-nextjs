import { expect, test } from '@playwright/test';

// Ein Marker auf window überlebt nur Client-Navigation – so ist sicher, dass
// kein voller Seitenaufruf stattfand.
const markSoft = (page: import('@playwright/test').Page) => page.evaluate(() => ((window as unknown as { __soft: number }).__soft = 1));
const stillSoft = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { __soft?: number }).__soft === 1);

test('Menü (next/link): geladenes Modul initialisiert die neue Liste per ausstello:scan', async ({ page }) => {
    // Das Output-Modul ist schon geladen, bevor weich zur Liste navigiert wird.
    await page.goto('/veranstaltungen');
    await expect(page.locator('.ausstello[data-ausstello-ready="1"]').first()).toBeAttached();
    await markSoft(page);
    await page.getByRole('link', { name: 'Start' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1.ausstello-detail-title, .ausstello-list-teaser').first()).toBeVisible();
    await page.getByRole('link', { name: 'Veranstaltungen' }).click();
    await expect(page).toHaveURL(/\/veranstaltungen$/);
    await expect(page.locator('.ausstello[data-ausstello-ready="1"]').first()).toBeAttached();
    await expect(page.locator('.ausstello .ts-wrapper').first()).toBeVisible();
    expect(await stillSoft(page)).toBe(true);
});

test('Weich zum Detail: Detail-JS initialisiert, Anmelde-Dialog öffnet', async ({ page }) => {
    await page.goto('/');
    const href = await page.locator('a.ausstello-list-teaser').first().getAttribute('href');
    test.skip(href === null, 'Kein Termin in den lokalen Daten');
    const path = new URL(href!).pathname;

    await markSoft(page);
    // Next stellt den Router des App Routers als window.next.router bereit.
    await page.evaluate((p) => (window as unknown as { next: { router: { push(p: string): void } } }).next.router.push(p), path);
    await expect(page.locator('h1.ausstello-detail-title')).toBeVisible();
    await expect(page.locator('.ausstello[data-ausstello-detail-ready="1"]').first()).toBeAttached();
    expect(await stillSoft(page)).toBe(true);

    const open = page.locator('.ausstello-registration-open').first();
    if (await open.count()) {
        await open.click();
        await expect(page.locator('dialog.ausstello-registration-dialog[open]')).toBeVisible();
    }
});

test('Weich von Detail zu Detail: zweites Detail wird ebenfalls initialisiert', async ({ page }) => {
    await page.goto('/veranstaltungen');
    const hrefs = await page.locator('a.ausstello-list-teaser').evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).pathname));
    test.skip(hrefs.length < 2, 'Weniger als zwei Termine in den lokalen Daten');

    await page.goto(hrefs[0]!);
    await markSoft(page);
    await page.evaluate((p) => (window as unknown as { next: { router: { push(p: string): void } } }).next.router.push(p), hrefs[1]!);
    await expect(page).toHaveURL(new RegExp(`${hrefs[1]}$`));
    await expect(page.locator('.ausstello[data-ausstello-detail-ready="1"]').first()).toBeAttached();
    expect(await stillSoft(page)).toBe(true);
});
