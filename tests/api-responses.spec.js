const { test, expect } = require('@playwright/test');
const {
    TEST_LOCATIONS,
    navigateToLocation,
    clickArticleOnMap,
    waitForInfoPanel,
    createApiCollector,
    takeScreenshot,
} = require('./helpers');

test.describe('Wikipedia Geosearch API', () => {

    test('returns articles for Amsterdam', async ({ page }) => {
        const api = createApiCollector(page);
        await navigateToLocation(page, TEST_LOCATIONS.amsterdam);

        expect(api.geosearch.length).toBeGreaterThan(0);

        const response = api.geosearch[api.geosearch.length - 1];
        expect(response).toHaveProperty('query');
        expect(response.query).toHaveProperty('geosearch');
        expect(response.query.geosearch.length).toBeGreaterThan(0);

        // Each article should have required fields
        const article = response.query.geosearch[0];
        expect(article).toHaveProperty('pageid');
        expect(article).toHaveProperty('title');
        expect(article).toHaveProperty('lat');
        expect(article).toHaveProperty('lon');
        expect(typeof article.pageid).toBe('number');
        expect(typeof article.lat).toBe('number');
        expect(typeof article.lon).toBe('number');
    });

    test('returns articles for multiple known cities', async ({ page }) => {
        const citiesToTest = [
            TEST_LOCATIONS.paris,
            TEST_LOCATIONS.london,
            TEST_LOCATIONS.rome,
        ];

        for (const city of citiesToTest) {
            const api = createApiCollector(page);
            await navigateToLocation(page, city);

            expect(
                api.geosearch.length,
                `Expected geosearch responses for ${city.label}`
            ).toBeGreaterThan(0);

            const last = api.geosearch[api.geosearch.length - 1];
            expect(
                last.query.geosearch.length,
                `Expected articles near ${city.label}`
            ).toBeGreaterThan(0);
        }
    });

    test('geosearch bounding box matches current viewport', async ({ page }) => {
        const geosearchRequests = [];
        page.on('request', (req) => {
            if (req.url().includes('wikipedia.org') && req.url().includes('geosearch') && req.url().includes('gsbbox')) {
                geosearchRequests.push(req.url());
            }
        });

        await navigateToLocation(page, TEST_LOCATIONS.amsterdam);

        expect(geosearchRequests.length).toBeGreaterThan(0);

        // Parse the gsbbox parameter: top|left|bottom|right
        const lastUrl = new URL(geosearchRequests[geosearchRequests.length - 1]);
        const gsbbox = lastUrl.searchParams.get('gsbbox');
        expect(gsbbox).toBeTruthy();

        const [top, left, bottom, right] = gsbbox.split('|').map(Number);
        expect(top).toBeGreaterThan(bottom);  // north > south
        expect(top).toBeGreaterThan(50);      // roughly Netherlands
        expect(bottom).toBeLessThan(54);
    });

    test('app deduplicates articles from API response', async ({ page }) => {
        const api = createApiCollector(page);
        await navigateToLocation(page, TEST_LOCATIONS.paris);

        expect(api.geosearch.length).toBeGreaterThan(0);

        // Verify the app deduplicates articles by key (Q-number or lang:pageId)
        const geojson = await page.evaluate(() => articlesGeojson);
        const keys = geojson.features.map(f => f.properties.key || f.properties.pageId);
        const uniqueKeys = new Set(keys);
        expect(keys.length).toBe(uniqueKeys.size);
    });
});

test.describe('Wikipedia Extracts API', () => {

    test('returns article details when clicking a map feature', async ({ page }) => {
        const api = createApiCollector(page);
        await navigateToLocation(page, TEST_LOCATIONS.amsterdam);

        const clicked = await clickArticleOnMap(page);
        if (!clicked) {
            test.skip('No unclustered features visible at this zoom');
            return;
        }

        await waitForInfoPanel(page);

        expect(api.extracts.length).toBeGreaterThan(0);
        const extractResp = api.extracts[api.extracts.length - 1];
        expect(extractResp).toHaveProperty('query');
        expect(extractResp.query).toHaveProperty('pages');

        const pages = Object.values(extractResp.query.pages);
        expect(pages.length).toBeGreaterThan(0);

        const p = pages[0];
        expect(p).toHaveProperty('title');
        expect(p).toHaveProperty('extract');
        expect(p.extract.length).toBeGreaterThan(0);
    });
});

test.describe('Wikidata SPARQL API', () => {

    test('returns structured data after article click', async ({ page }) => {
        const api = createApiCollector(page);
        await navigateToLocation(page, TEST_LOCATIONS.amsterdam);

        const clicked = await clickArticleOnMap(page);
        if (!clicked) {
            test.skip('No features visible');
            return;
        }

        await waitForInfoPanel(page, { waitForWikidata: true });

        if (api.wikidata.length === 0) {
            test.skip('No Wikidata query was made — article may lack a Q-number');
            return;
        }

        const wdResp = api.wikidata[api.wikidata.length - 1];
        expect(wdResp).toHaveProperty('results');
        expect(wdResp.results).toHaveProperty('bindings');
        expect(Array.isArray(wdResp.results.bindings)).toBe(true);
    });
});
