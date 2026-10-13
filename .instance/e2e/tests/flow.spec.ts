import { expect, test } from '@playwright/test';

test('Liste filtern per Tag-Chip, blättern, Detail öffnen, Lightbox', async ({ page }) => {
    await page.goto('/veranstaltungen');
    await expect(page.locator('a.ausstello-list-teaser').first()).toBeVisible();

    const chip = page.locator('.ausstello-form-tags-item-name').first();
    if (await chip.count()) {
        await chip.click();
        await page.waitForURL(/filter%5Btags%5D|filter\[tags\]/);
        await expect(page.locator('.ausstello-form-tags-item-name[data-selected="1"]')).toHaveCount(1);
        await page.goto('/veranstaltungen');
    }

    const next = page.locator('.ausstello-pagination-next a');
    if (await next.count()) {
        await next.click();
        await expect(page).toHaveURL(/page=2/);
    }

    await page.locator('a.ausstello-list-teaser').first().click();
    await expect(page).toHaveURL(/^https:\/\/ausstello-nextjs\.ddev\.site\/veranstaltungen\/[A-Za-z0-9-]+$/);
    await expect(page.locator('h1.ausstello-detail-title')).toBeVisible();

    const gallery = page.locator('#lightbox-gallery a').first();
    if (await gallery.count()) {
        await gallery.click();
        await expect(page.locator('.pswp')).toBeVisible();
    }
});

test('Keine Fehler in der Konsole', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto('/veranstaltungen');
    await page.locator('a.ausstello-list-teaser').first().click();
    await expect(page.locator('h1.ausstello-detail-title')).toBeVisible();
    expect(errors).toEqual([]);
});
