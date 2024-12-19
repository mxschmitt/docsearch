import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function waitForLoad(page: Page): Promise<void> {
  await page.locator('.DocSearch-Button').waitFor();
}

async function openModal(page: Page): Promise<void> {
  await page.locator('.DocSearch-Button').click();
  await modalIsVisibleAndFocused(page);
}

async function closeModal(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await modalIsNotVisible(page);
}

async function modalIsVisibleAndFocused(page: Page): Promise<void> {
  await expect(page.locator('.DocSearch-Modal')).toBeVisible();
  await expect(page.locator('.DocSearch-Input')).toBeFocused();
}

async function modalIsNotVisible(page: Page): Promise<void> {
  await expect(page.locator('body')).not.toHaveClass('DocSearch--active');
  await expect(page.locator('.DocSearch-Modal')).not.toBeVisible();
}

async function search(page: Page, query: string): Promise<void> {
  const waitForResponse = page.waitForResponse('https://r2iyf7eth7-dsn.algolia.net/*/**');
  await page.locator('.DocSearch-Input').fill(query);
  await waitForResponse;
}

async function typeQueryMatching(page: Page): Promise<void> {
  await search(page, 'g');
}

async function typeQueryNotMatching(page: Page): Promise<void> {
  await search(page, 'zzz');
}

// Test suites
test.describe('Start', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForLoad(page);
  });

  test('Open modal on search button click', async ({ page }) => {
    await openModal(page);
  });

  test('Open modal with key shortcut on Windows/Linux', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await modalIsVisibleAndFocused(page);
  });

  test('Open modal with key shortcut on Windows/Linux when caps lock is on', async ({ page }) => {
    await page.keyboard.press('Control+K');
    await modalIsVisibleAndFocused(page);
  });

  test('Open modal with key shortcut on macOS', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await modalIsVisibleAndFocused(page);
  });

  test('Open modal with key shortcut on macOS when caps lock is on', async ({ page }) => {
    await page.keyboard.press('Meta+K');
    await modalIsVisibleAndFocused(page);
  });

  test('Open modal with forward slash key shortcut', async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.keyboard.press('/');
    await modalIsVisibleAndFocused(page);
  });
});

test.describe('End', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await openModal(page);
  });

  test('Close modal with Esc key', async ({ page }) => {
    await closeModal(page);
  });

  test('Close modal by clicking outside its container', async ({ page }) => {
    await page.locator('.DocSearch-Container').click();
    await modalIsNotVisible(page);
  });

  test('Close modal with key shortcut on Windows/Linux', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await modalIsNotVisible(page);
  });

  test('Close modal with key shortcut on macOS', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await modalIsNotVisible(page);
  });
});

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await openModal(page);
  });

  test('Results are displayed after a query', async ({ page }) => {
    await typeQueryMatching(page);
    await expect(page.locator('.DocSearch-Hits').first()).toBeVisible();
  });

  test('Query can be cleared', async ({ page }) => {
    await typeQueryMatching(page);
    await page.locator('.DocSearch-Reset').click();
    await expect(page.locator('.DocSearch-Hits')).not.toBeVisible();
    await expect(page.getByText('No recent searches')).toBeVisible();
  });

  test('Keyboard navigation leads to result', async ({ page }) => {
    const startUrl = page.url();
    await typeQueryMatching(page);
    await page.locator('.DocSearch-Input').press('ArrowDown+ArrowDown+ArrowUp');
    await page.locator('.DocSearch-Input').press('Enter');
    await expect(page).not.toHaveURL(startUrl);
  });

  test('Pointer navigation leads to result', async ({ page }) => {
    const startUrl = page.url();
    await typeQueryMatching(page);
    await page.locator('#docsearch-hits0-item-1 > a').click({ force: true });
    await expect(page).not.toHaveURL(startUrl);
  });

  test("No results are displayed if query doesn't match", async ({ page }) => {
    await typeQueryNotMatching(page);
    await expect(page.getByText('No results for')).toBeVisible();
  });
});

test.describe('Recent and Favorites', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await openModal(page);
    await typeQueryMatching(page);
    await page.locator('#docsearch-hits0-item-0 > a').click();
    await openModal(page);
    await expect(page.getByText('Recent')).toBeVisible();
  });

  test('Recent search is displayed after visiting a result', async ({ page }) => {
    await expect(page.locator('#docsearch-recentSearches-item-0')).toBeVisible();
  });

  test('Recent search can be deleted', async ({ page }) => {
    await page.locator('#docsearch-recentSearches-item-0').getByTitle('Remove this search from history').click();
    await expect(page.getByText('No recent searches')).toBeVisible();
  });

  test('Recent search can be favorited', async ({ page }) => {
    await page.locator('#docsearch-recentSearches-item-0').getByTitle('Save this search').click();
    await expect(page.getByText('Favorite')).toBeVisible();
    await expect(page.locator('#docsearch-favoriteSearches-item-0')).toBeVisible();
  });

  test('Favorite can be deleted', async ({ page }) => {
    await page.locator('#docsearch-recentSearches-item-0').getByTitle('Save this search').click();
    await expect(page.getByText('Favorite')).toBeVisible();
    await page.locator('#docsearch-favoriteSearches-item-0').getByTitle('Remove this search from favorites').click();
    await expect(page.getByText('No recent searches')).toBeVisible();
  });
});
