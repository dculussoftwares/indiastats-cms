import { test, expect } from '@playwright/test';

// Default to production but allow override via BASE_URL env var
const BASE_URL = process.env.BASE_URL || 'https://indiastats.org';

test.describe('Production Smoke Test', () => {
  test('Homepage loads and displays core elements', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check title
    await expect(page).toHaveTitle(/IndiaStats/i);
    
    // Check for logo text
    await expect(page.locator('a[href="/"]').first()).toContainText('IndiaStats');
    
    // Check for main heading
    await expect(page.locator('h1')).toContainText('IndiaStats');
    await expect(page.locator('text=The most comprehensive')).toBeVisible();
    
    // Check for search button
    const searchBtn = page.locator('button[aria-label*="Search"]');
    await expect(searchBtn).toBeVisible();
  });

  test('State Dashboard (Tamil Nadu) loads data', async ({ page }) => {
    await page.goto(`${BASE_URL}/tamil-nadu/dashboard`);
    
    // Verify URL and title
    await expect(page).toHaveURL(/.*tamil-nadu\/dashboard/);
    
    // Check for statistics grid
    await expect(page.getByRole('heading', { name: 'Districts' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Assemblies' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Booths' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Voters' })).toBeVisible();
  });

  test('District Page loads', async ({ page }) => {
    // We try to access dt1 district by its likely slug or ID if we can't find slug.
    // Based on our code, district pages are at /[stateSlug]/district/[districtSlug]
    // Let's try 'chennai' as it's a very common one.
    const response = await page.goto(`${BASE_URL}/tamil-nadu/district/chennai`);
    
    if (response?.status() === 404) {
      console.log('Chennai district not found, trying dt1...');
      await page.goto(`${BASE_URL}/tamil-nadu/district/dt1`);
    }
    
    // Check for district name in h1
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'District Overview' })).toBeVisible({ timeout: 15000 });
    
    // Check for assembly list
    await expect(page.locator('text=Assembly Constituencies').first()).toBeVisible({ timeout: 15000 });
  });

  test('Caste Demographics page loads', async ({ page }) => {
    test.slow();
    await page.goto(`${BASE_URL}/tamil-nadu/caste-demographics`);
    
    // Check for main heading - wait longer for client-side load
    await expect(page.locator('h1').first()).toContainText(/Caste Demographics/i, { timeout: 30000 });
    
    // Wait for the skeleton loader to disappear
    await expect(page.locator('.animate-pulse')).not.toBeVisible({ timeout: 60000 });
    
    // Check for some actual content after data loads - using broader search
    await expect(page.locator('text=/Caste/i').first()).toBeVisible({ timeout: 30000 });
  });

  test('OG Image Endpoints return valid images', async ({ request }) => {
    test.slow();
    const endpoints = [
      '/api/og/ac001',
      '/api/og/district/dt1',
      '/api/og/state/tamil-nadu'
    ];

    for (const endpoint of endpoints) {
      console.log(`Checking OG endpoint: ${endpoint}`);
      let response = await request.get(`${BASE_URL}${endpoint}`);
      
      // Retry multiple times if 503 or 500 (might be cold start or transient)
      let retries = 0;
      while (response.status() >= 500 && retries < 3) {
        console.log(`Retrying ${endpoint} (attempt ${retries + 1}) due to status ${response.status()}...`);
        await new Promise(r => setTimeout(r, 15000)); // Wait 15s between retries
        response = await request.get(`${BASE_URL}${endpoint}`);
        retries++;
      }
      
      expect(response.status(), `OG endpoint ${endpoint} failed with status ${response.status()}`).toBe(200);
      expect(response.headers()['content-type']).toBe('image/png');
      
      // Check image size (reasonable for a 1200x630 PNG)
      const buffer = await response.body();
      expect(buffer.length).toBeGreaterThan(5000); 
    }
  });

  test('Search functionality works', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const searchBtn = page.locator('button[aria-label*="Search"]');
    await searchBtn.click();
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Chennai');
    
    // Wait for loading to finish
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });
    
    // Wait for search results to appear in the dropdown/list
    // Using a case-insensitive regex to match CHENNAI or Chennai
    await expect(page.locator('text=/Chennai/i').first()).toBeVisible({ timeout: 20000 });
  });

  test('Mobile view works', async ({ page }) => {
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    
    // Check if main content is still visible
    await expect(page.locator('h1').first()).toContainText('IndiaStats', { timeout: 15000 });
    
    // Check if menu button is visible (if applicable)
    // const menuBtn = page.locator('button[aria-label="Menu"]');
    // await expect(menuBtn).toBeVisible();
  });
});
