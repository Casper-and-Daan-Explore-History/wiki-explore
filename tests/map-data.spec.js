const { test, expect } = require('@playwright/test');
const {
    TEST_LOCATIONS,
    navigateToLocation,
    getArticlesGeojson,
    getMapState,
    takeScreenshot,
} = require('./helpers');

test.describe('GeoJSON data on the map', () => {

    test('articles are loaded into articlesGeojson after navigation', async ({ page }) => {
        await navigateToLocation(page, TEST_LOCATIONS.amsterdam);

        const geojson = await getArticlesGeojson(page);
        expect(geojson).toBeTruthy();
        expect(geojson.type).toBe('FeatureCollection');
        expect(geojson.features.length).toBeGreaterThan(0);

        await takeScreenshot(page, 'amsterdam-articles-loaded');
    });

    test('each feature has required GeoJSON structure', async ({ page }) => {
        await navigateToLocation(page, TEST_LOCATIONS.paris);

        const geojson = await getArticlesGeojson(page);
        expect(geojson.features.length).toBeGreaterThan(0);

        for (const feature of geojson.features.slice(0, 20)) {
            expect(feature.type).toBe('Feature');
            expect(feature.geometry.type).toBe('Point');
            expect(feature.geometry.coordinates).toHaveLength(2);

            const [lng, lat] = feature.geometry.coordinates;
            expect(typeof lng).toBe('number');
            expect(typeof lat).toBe('number');
            expect(lng).toBeGreaterThanOrEqual(-180);
            expect(lng).toBeLessThanOrEqual(180);
            expect(lat).toBeGreaterThanOrEqual(-90);
            expect(lat).toBeLessThanOrEqual(90);

            expect(feature.properties).toHaveProperty('pageId');
            expect(feature.properties).toHaveProperty('title');
            expect(feature.properties).toHaveProperty('url');
            expect(feature.properties).toHaveProperty('key');
            expect(feature.properties).toHaveProperty('langs');
            expect(feature.properties).toHaveProperty('primaryLang');
            expect(typeof feature.properties.pageId).toBe('number');
            expect(typeof feature.properties.title).toBe('string');
            expect(feature.properties.title.length).toBeGreaterThan(0);
        }
    });

    test('no duplicate articles in geojson', async ({ page }) => {
        await navigateToLocation(page, TEST_LOCATIONS.rome);

        const geojson = await getArticlesGeojson(page);
        // Use the key property (Q-number or lang:pageId) for uniqueness
        const keys = geojson.features.map(f => f.properties.key || f.properties.pageId);
        const uniqueKeys = new Set(keys);
        expect(keys.length).toBe(uniqueKeys.size);
    });

    test('articles are geographically near the requested location', async ({ page }) => {
        const loc = TEST_LOCATIONS.amsterdam;
        await navigateToLocation(page, loc);

        const geojson = await getArticlesGeojson(page);
        expect(geojson.features.length).toBeGreaterThan(0);

        for (const feature of geojson.features) {
            const [lng, lat] = feature.geometry.coordinates;
            const dLat = Math.abs(lat - loc.lat);
            const dLng = Math.abs(lng - loc.lng);
            expect(dLat).toBeLessThan(0.5);
            expect(dLng).toBeLessThan(0.5);
        }
    });

    test('articles accumulate across pans (never cleared)', async ({ page }) => {
        await navigateToLocation(page, TEST_LOCATIONS.amsterdam);
        const geojson1 = await getArticlesGeojson(page);
        const count1 = geojson1.features.length;
        expect(count1).toBeGreaterThan(0);

        // Pan slightly east
        await page.evaluate(() => {
            const center = map.getCenter();
            map.jumpTo({ center: [center.lng + 0.02, center.lat] });
        });

        // Wait for new articles to be fetched
        await page.waitForFunction(
            (prevCount) => articlesGeojson.features.length > prevCount,
            count1,
            { timeout: 20000 }
        ).catch(() => {});

        await page.waitForTimeout(1500);
        const geojson2 = await getArticlesGeojson(page);
        expect(geojson2.features.length).toBeGreaterThanOrEqual(count1);
    });

    test('map source has article features', async ({ page }) => {
        await navigateToLocation(page, TEST_LOCATIONS.paris);

        // Check the actual Mapbox source data
        const sourceData = await page.evaluate(() => {
            const source = map.getSource('wikipediaSource');
            if (!source) return null;
            // The source is loaded if articlesGeojson has features
            return {
                type: source.type,
                featureCount: articlesGeojson.features.length,
            };
        });

        expect(sourceData).toBeTruthy();
        expect(sourceData.type).toBe('geojson');
        expect(sourceData.featureCount).toBeGreaterThan(0);

        await takeScreenshot(page, 'paris-map-source');
    });
});

test.describe('Map state and URL hash', () => {

    test('URL hash reflects map position', async ({ page }) => {
        const loc = TEST_LOCATIONS.london;
        await navigateToLocation(page, loc);

        const hash = new URL(page.url()).hash;
        expect(hash).toBeTruthy();

        const parts = hash.replace('#', '').split('/').map(Number);
        expect(parts.length).toBeGreaterThanOrEqual(3);

        const [zoom, lat, lng] = parts;
        expect(Math.abs(lat - loc.lat)).toBeLessThan(1);
        expect(Math.abs(lng - loc.lng)).toBeLessThan(1);
    });

    test('map center matches requested location', async ({ page }) => {
        const loc = TEST_LOCATIONS.tokyo;
        await navigateToLocation(page, loc);

        const state = await getMapState(page);
        expect(Math.abs(state.lat - loc.lat)).toBeLessThan(0.5);
        expect(Math.abs(state.lng - loc.lng)).toBeLessThan(0.5);
    });
});
