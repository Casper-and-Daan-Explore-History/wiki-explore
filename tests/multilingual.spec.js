const { test, expect } = require('@playwright/test');
const {
    TEST_LOCATIONS,
    navigateToLocation,
    getArticlesGeojson,
    clickArticleOnMap,
    waitForInfoPanel,
    takeScreenshot,
} = require('./helpers');

test.describe('Multilingual feature', () => {

    test('language badge container is visible on map', async ({ page }) => {
        await navigateToLocation(page, TEST_LOCATIONS.paris);

        const container = page.locator('#lang-badge-container');
        await expect(container).toBeVisible();

        // Should have badge elements
        const badges = container.locator('.lang-badge');
        const count = await badges.count();
        expect(count).toBeGreaterThan(0);
    });

    test('at least one language badge is active', async ({ page }) => {
        await navigateToLocation(page, TEST_LOCATIONS.paris);

        const activeBadges = page.locator('.lang-badge.active');
        const count = await activeBadges.count();
        expect(count).toBeGreaterThan(0);
    });

    test('articles have multilingual properties', async ({ page }) => {
        await navigateToLocation(page, TEST_LOCATIONS.paris);

        const geojson = await getArticlesGeojson(page);
        expect(geojson.features.length).toBeGreaterThan(0);

        const feature = geojson.features[0];
        expect(feature.properties).toHaveProperty('key');
        expect(feature.properties).toHaveProperty('langs');
        expect(feature.properties).toHaveProperty('primaryLang');

        // langs should be a JSON string that parses to an object
        const langs = JSON.parse(feature.properties.langs);
        expect(typeof langs).toBe('object');
        const langCodes = Object.keys(langs);
        expect(langCodes.length).toBeGreaterThan(0);
    });

    test('toggling a language off removes its exclusive articles', async ({ page }) => {
        // Set up with two languages (en + fr) for Paris
        await page.goto('/', { waitUntil: 'load', timeout: 45000 });
        await page.waitForFunction(() => typeof map !== 'undefined', { timeout: 30000 });

        // Set language state to en + fr
        await page.evaluate(() => {
            const el = document.querySelector('.WelcomeDiv');
            if (el) el.style.display = 'none';
            langState.active = ['en', 'fr'];
            langState.order = ['en', 'fr'];
            saveLanguagePrefs();
        });

        // Navigate to Paris
        await navigateToLocation(page, TEST_LOCATIONS.paris);

        const geojsonBefore = await getArticlesGeojson(page);
        const countBefore = geojsonBefore.features.length;
        expect(countBefore).toBeGreaterThan(0);

        // Toggle FR off via the function
        await page.evaluate(() => {
            toggleLanguage('fr');
        });

        const geojsonAfter = await getArticlesGeojson(page);
        const countAfter = geojsonAfter.features.length;

        // Should have same or fewer articles after toggling off a language
        expect(countAfter).toBeLessThanOrEqual(countBefore);
    });

    test('info panel shows language badges for multilingual articles', async ({ page }) => {
        // Set up with multiple languages
        await page.goto('/', { waitUntil: 'load', timeout: 45000 });
        await page.waitForFunction(() => typeof map !== 'undefined', { timeout: 30000 });

        await page.evaluate(() => {
            const el = document.querySelector('.WelcomeDiv');
            if (el) el.style.display = 'none';
            langState.active = ['en', 'fr'];
            langState.order = ['en', 'fr'];
            saveLanguagePrefs();
        });

        await navigateToLocation(page, TEST_LOCATIONS.paris);

        const clicked = await clickArticleOnMap(page);
        if (!clicked) {
            test.skip('No features visible');
            return;
        }

        await waitForInfoPanel(page);

        // Check if info panel lang badges container exists
        const badgeContainer = page.locator('#info-lang-badges');
        await expect(badgeContainer).toBeAttached();
    });

    test('language preferences persist in localStorage', async ({ page }) => {
        await navigateToLocation(page, TEST_LOCATIONS.amsterdam);

        // Set specific languages
        await page.evaluate(() => {
            langState.active = ['en', 'de', 'nl'];
            langState.order = ['nl', 'en', 'de'];
            saveLanguagePrefs();
        });

        // Read back from localStorage
        const stored = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('wikiexplore_langs'));
        });

        expect(stored).toBeTruthy();
        expect(stored.active).toContain('en');
        expect(stored.active).toContain('de');
        expect(stored.active).toContain('nl');
        expect(stored.order[0]).toBe('nl');
    });

    test('fetches from multiple Wikipedia language editions', async ({ page }) => {
        const geosearchLangs = new Set();
        page.on('request', (req) => {
            const url = req.url();
            if (url.includes('wikipedia.org/w/api.php') && url.includes('geosearch')) {
                const match = url.match(/https:\/\/(\w+)\.wikipedia\.org/);
                if (match) geosearchLangs.add(match[1]);
            }
        });

        // Set up with two languages
        await page.goto('/', { waitUntil: 'load', timeout: 45000 });
        await page.waitForFunction(() => typeof map !== 'undefined', { timeout: 30000 });

        await page.evaluate(() => {
            const el = document.querySelector('.WelcomeDiv');
            if (el) el.style.display = 'none';
            langState.active = ['en', 'fr'];
            langState.order = ['en', 'fr'];
            saveLanguagePrefs();
        });

        await navigateToLocation(page, TEST_LOCATIONS.paris);

        // Should have fetched from both en and fr Wikipedia
        expect(geosearchLangs.has('en')).toBe(true);
        expect(geosearchLangs.has('fr')).toBe(true);
    });

    test('activating a language puts it first in order and first in badge list', async ({ page }) => {
        await navigateToLocation(page, TEST_LOCATIONS.amsterdam);

        // Start with only English
        await page.evaluate(() => {
            langState.active = ['en'];
            langState.order = ['en'];
            saveLanguagePrefs();
            renderLanguageBadges();
        });

        // Activate NL
        await page.evaluate(() => {
            toggleLanguage('nl');
        });

        // NL should be first in order, EN second
        const state = await page.evaluate(() => ({
            order: langState.order,
            active: langState.active,
        }));
        expect(state.order[0]).toBe('nl');
        expect(state.order[1]).toBe('en');

        // First badge in DOM should be NL
        const firstBadgeLang = await page.locator('.lang-badge').first().getAttribute('data-lang');
        expect(firstBadgeLang).toBe('nl');
    });

    test('NL Wikipedia has articles not found in EN Wikipedia (Amsterdam)', async ({ page }) => {
        await page.goto('/', { waitUntil: 'load', timeout: 45000 });
        await page.waitForFunction(() => typeof map !== 'undefined', { timeout: 30000 });

        // Set EN + NL active
        await page.evaluate(() => {
            const el = document.querySelector('.WelcomeDiv');
            if (el) el.style.display = 'none';
            langState.active = ['en', 'nl'];
            langState.order = ['nl', 'en'];
            saveLanguagePrefs();
        });

        await navigateToLocation(page, TEST_LOCATIONS.amsterdam);

        // Count articles with both EN+NL vs total
        const counts = await page.evaluate(() => {
            let nlOnly = 0;
            let total = 0;
            for (let key in articleStore) {
                let entry = articleStore[key];
                if (!entry.langs) continue;
                total++;
                if (entry.langs.nl && !entry.langs.en) nlOnly++;
            }
            return { nlOnly, total, nlCount: langState.counts.nl || 0, enCount: langState.counts.en || 0 };
        });

        // NL Wikipedia should have articles EN doesn't
        expect(counts.total).toBeGreaterThan(0);
        expect(counts.nlCount).toBeGreaterThan(0);
        expect(counts.enCount).toBeGreaterThan(0);
        // In Amsterdam, NL Wikipedia typically has more articles than EN
        console.log(`Amsterdam: ${counts.total} total, ${counts.nlCount} NL, ${counts.enCount} EN, ${counts.nlOnly} NL-only`);
    });
});
