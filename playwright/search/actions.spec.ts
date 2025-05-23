import { test, expect } from '@playwright/test';
import { 
  modalIsVisibleAndFocused, 
  modalIsNotVisible, 
  waitLoad, 
  openModal, 
  closeModal, 
  typeQueryMatching, 
  typeQueryNotMatching 
} from './utils';

test.describe('Start', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitLoad(page);
  });

  test('Open modal on search button click', async ({ page }) => {
    test.skip(process.platform === 'darwin', 'macOS has overlay scrollbars');
    await openModal(page);
    await modalIsVisibleAndFocused(page);

    // check that the scrollbar offset is compensated
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await expect(page.locator('body')).toHaveCSS('margin-right', '15px');
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
    await modalIsNotVisible(page);
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
    const currentURL = page.url();

    await typeQueryMatching(page);
    await page.locator('.DocSearch-Input').press('ArrowDown');
    await page.locator('.DocSearch-Input').press('ArrowDown');
    await page.locator('.DocSearch-Input').press('ArrowUp');
    await page.locator('.DocSearch-Input').press('Enter');
    
    await expect(page).not.toHaveURL(currentURL);
  });

  test('Pointer navigation leads to result', async ({ page }) => {
    const currentURL = page.url();

    await typeQueryMatching(page);
    await page.locator('.DocSearch-Hits #docsearch-hits0-item-1 > a').click({ force: true });
    
    await expect(page).not.toHaveURL(currentURL);
  });

  test("No results are displayed if query doesn't match", async ({ page }) => {
    await typeQueryNotMatching(page);
    await expect(page.getByText('No results for')).toBeVisible();
  });

  test('should not refer to Recent/Favorite in aria-controls', async ({ page }) => {
    await expect(page.locator('.DocSearch-Input')).not.toHaveAttribute('aria-controls');
  });
});

test.describe('Recent and Favorites', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await openModal(page);
    await typeQueryMatching(page);
    await page.locator('#docsearch-hits0-item-0 > a').click({ force: true });
    await page.waitForTimeout(1000);
    await openModal(page);
    await expect(page.getByText('Recent')).toBeVisible();
  });

  test('Recent search is displayed after visiting a result', async ({ page }) => {
    await expect(page.locator('#docsearch-recentSearches-item-0')).toBeVisible();
  });

  test('Recent search can be deleted', async ({ page }) => {
    await page.locator('#docsearch-recentSearches-item-0').locator('[title="Remove this search from history"]').click();
    await expect(page.getByText('No recent searches')).toBeVisible();
  });

  test('Recent search can be favorited', async ({ page }) => {
    await page.locator('#docsearch-recentSearches-item-0').locator('[title="Save this search"]').click();
    await expect(page.getByText('Favorite')).toBeVisible();
    await expect(page.locator('#docsearch-favoriteSearches-item-0')).toBeVisible();
  });

  test('Favorite can be deleted', async ({ page }) => {
    await page.locator('#docsearch-recentSearches-item-0').locator('[title="Save this search"]').click();
    await expect(page.getByText('Favorite')).toBeVisible();
    await page.locator('#docsearch-favoriteSearches-item-0').locator('[title="Remove this search from favorites"]').click();
    await expect(page.getByText('No recent searches')).toBeVisible();
  });

  test('Input controls Recent and Favorite lists', async ({ page }) => {
    // Mark one result as favorite
    await page.locator('#docsearch-recentSearches-item-0').locator('[title="Save this search"]').click();
    await expect(page.getByText('Favorite')).toBeVisible();
    
    // Search for something else to add a new recent search
    await typeQueryMatching(page);
    await page.locator('#docsearch-hits1-item-5 > a').click({ force: true });
    await page.waitForTimeout(1000);

    await openModal(page);
    await expect(page.getByText('Recent').first()).toBeVisible();
    await expect(page.getByText('Favorite')).toBeVisible();

    // Make sure the specified elements exist
    const ariaControls = await page.locator('.DocSearch-Input').getAttribute('aria-controls');
    expect(ariaControls).toBeTruthy();
    
    const ids = ariaControls!.split(' ');
    expect(ids).toHaveLength(2);
    
    for (const id of ids) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
  });
});