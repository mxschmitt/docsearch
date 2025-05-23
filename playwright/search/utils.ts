import { expect, Page } from '@playwright/test';

export async function modalIsVisibleAndFocused(page: Page) {
  await expect(page.locator('.DocSearch-Modal')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.DocSearch-Input')).toBeFocused();
}

export async function modalIsNotVisible(page: Page) {
  await expect(page.locator('body')).not.toHaveClass('DocSearch--active');
  await expect(page.locator('.DocSearch-Modal')).not.toBeVisible();
}

export async function darkmode(page: Page) {
  await page.locator('.react-toggle').click({ force: true });
  await page.locator('.react-toggle-screenreader-only').blur();
  await expect(page.locator('html.dark')).toBeVisible();
}

export async function waitLoad(page: Page) {
  await expect(page.locator('.DocSearch-Button')).toBeVisible({ timeout: 10000 });
}

export async function openModal(page: Page) {
  await expect(page.locator('.DocSearch-Button')).toBeVisible();
  await page.locator('.DocSearch-Button').click();
  await modalIsVisibleAndFocused(page);
}

export async function closeModal(page: Page) {
  await page.keyboard.press('Escape');
  await modalIsNotVisible(page);
}

export async function search(page: Page, query: string) {
  const waitForResponse = page.waitForResponse('https://r2iyf7eth7-dsn.algolia.net/*/**');
  await page.locator('.DocSearch-Input').fill(query);
  await waitForResponse;
}

export async function typeQueryMatching(page: Page) {
  await search(page, 'g');
}

export async function typeQueryNotMatching(page: Page) {
  await search(page, 'zzz');
}