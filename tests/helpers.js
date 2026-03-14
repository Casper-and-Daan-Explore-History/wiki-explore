/**
 * Shared test helpers for WikiExplore tests.
 */

const TEST_LOCATIONS = {
    amsterdam: { zoom: 14, lat: 52.3676, lng: 4.9041, label: 'Amsterdam' },
    paris: { zoom: 14, lat: 48.8566, lng: 2.3522, label: 'Paris' },
    rome: { zoom: 14, lat: 41.9028, lng: 12.4964, label: 'Rome' },
    newYork: { zoom: 14, lat: 40.7128, lng: -74.0060, label: 'New York' },
    london: { zoom: 14, lat: 51.5074, lng: -0.1278, label: 'London' },
    tokyo: { zoom: 14, lat: 35.6762, lng: 139.6503, label: 'Tokyo' },
    cairo: { zoom: 14, lat: 30.0444, lng: 31.2357, label: 'Cairo' },
};

function locationHash(loc) {
    return `#${loc.zoom}/${loc.lat}/${loc.lng}`;
}

/**
 * Navigate to a specific map location and wait for articles to load.
 * Uses polling on the page global state instead of intercepting network
 * responses — more reliable in headless environments.
 */
async function navigateToLocation(page, loc, { waitForArticles = true } = {}) {
    // Navigate and wait for DOM to be ready
    await page.goto('/' + locationHash(loc), { waitUntil: 'load', timeout: 45000 });

    // Wait for the map object to exist
    await page.waitForFunction(() => typeof map !== 'undefined' && map !== null, { timeout: 30000 });

    // Dismiss the welcome overlay immediately
    await dismissWelcome(page);

    // Wait for map style to load — if it's not loaded yet, wait for the 'load' event
    await page.waitForFunction(() => {
        if (map.isStyleLoaded()) return true;
        return new Promise(resolve => {
            map.once('load', () => resolve(true));
            // Fallback timeout to avoid hanging forever
            setTimeout(() => resolve(map.isStyleLoaded()), 20000);
        });
    }, { timeout: 40000 });

    if (waitForArticles) {
        // Poll until articlesGeojson has features (meaning geosearch completed)
        await page.waitForFunction(
            () => typeof articlesGeojson !== 'undefined' &&
                  articlesGeojson.features &&
                  articlesGeojson.features.length > 0,
            { timeout: 40000 }
        );
        // Small extra wait for the source data to propagate to the map
        await page.waitForTimeout(500);
    }
}

/**
 * Dismiss the welcome overlay by hiding it via JS.
 */
async function dismissWelcome(page) {
    await page.evaluate(() => {
        const el = document.querySelector('.WelcomeDiv');
        if (el) el.style.display = 'none';
    });
}

/**
 * Get the current articlesGeojson from the page context.
 */
async function getArticlesGeojson(page) {
    // articlesGeojson is declared with `let` so it's NOT on `window`.
    // page.evaluate runs in the page's global scope where `let` bindings are accessible.
    return page.evaluate(() => articlesGeojson);
}

/**
 * Get the current infoPanel state from the page context.
 */
async function getInfoPanel(page) {
    // infoPanel is also declared with `let`
    return page.evaluate(() => infoPanel);
}

/**
 * Get the current map center and zoom.
 */
async function getMapState(page) {
    return page.evaluate(() => {
        const center = map.getCenter();
        return {
            lat: center.lat,
            lng: center.lng,
            zoom: map.getZoom(),
        };
    });
}

/**
 * Wait for the map to be idle (tiles loaded, no movement).
 */
async function waitForMapIdle(page) {
    await page.evaluate(() => {
        return new Promise(resolve => {
            if (map.isStyleLoaded() && !map.isMoving()) {
                resolve();
            } else {
                map.once('idle', resolve);
            }
        });
    });
}

/**
 * Open the info panel for an article.
 * First tries queryRenderedFeatures (works in headed mode).
 * Falls back to picking the first article from articlesGeojson (headless-safe).
 */
async function clickArticleOnMap(page) {
    return page.evaluate(() => {
        // Try rendered features first
        let features = [];
        try {
            features = map.queryRenderedFeatures({ layers: ['annotationLayer'] });
        } catch {}

        let props;
        if (features.length > 0) {
            props = features[0].properties;
        } else if (articlesGeojson && articlesGeojson.features.length > 0) {
            // Fallback: use the first article from geojson data directly
            props = articlesGeojson.features[0].properties;
        } else {
            return null;
        }

        openInfoPanel(props);
        return {
            title: props.title,
            pageId: props.pageId,
            url: props.url,
        };
    });
}

/**
 * Wait for the info panel to be populated with Wikipedia data.
 */
async function waitForInfoPanel(page, { waitForWikidata = false } = {}) {
    // Wait for Wikipedia intro to appear
    await page.waitForFunction(
        () => infoPanel &&
              infoPanel.wikipedia_Intro &&
              infoPanel.wikipedia_Intro.length > 0,
        { timeout: 15000 }
    );

    if (waitForWikidata) {
        // Wait for Wikidata Q-number to be present
        await page.waitForFunction(
            () => infoPanel && infoPanel.qNumber,
            { timeout: 15000 }
        ).catch(() => null); // Some articles don't have Q-numbers
    }

    await page.waitForTimeout(500);
}

/**
 * Intercept and collect API responses during a test.
 */
function createApiCollector(page) {
    const collected = {
        geosearch: [],
        extracts: [],
        wikidata: [],
    };

    page.on('response', async (response) => {
        const url = response.url();
        try {
            if (url.includes('wikipedia.org/w/api.php') && url.includes('geosearch')) {
                const json = await response.json().catch(() => null);
                if (json) collected.geosearch.push(json);
            } else if (url.includes('wikipedia.org/w/api.php') && url.includes('extracts')) {
                const json = await response.json().catch(() => null);
                if (json) collected.extracts.push(json);
            } else if (url.includes('query.wikidata.org/sparql')) {
                const json = await response.json().catch(() => null);
                if (json) collected.wikidata.push(json);
            }
        } catch (e) {
            // Response may have been disposed
        }
    });

    return collected;
}

/**
 * Take a named screenshot.
 */
async function takeScreenshot(page, name) {
    await page.screenshot({
        path: `tests/screenshots/${name}.png`,
        fullPage: false,
    });
}

module.exports = {
    TEST_LOCATIONS,
    locationHash,
    navigateToLocation,
    dismissWelcome,
    getArticlesGeojson,
    getInfoPanel,
    getMapState,
    waitForMapIdle,
    clickArticleOnMap,
    waitForInfoPanel,
    createApiCollector,
    takeScreenshot,
};
