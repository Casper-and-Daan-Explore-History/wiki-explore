/* eslint-disable no-undef */
/* eslint-disable indent */

// Supported Wikipedia language editions
const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'fr', label: 'FR', name: 'French' },
    { code: 'de', label: 'DE', name: 'German' },
    { code: 'es', label: 'ES', name: 'Spanish' },
    { code: 'it', label: 'IT', name: 'Italian' },
    { code: 'pt', label: 'PT', name: 'Portuguese' },
    { code: 'nl', label: 'NL', name: 'Dutch' },
    { code: 'ru', label: 'RU', name: 'Russian' },
    { code: 'ja', label: 'JA', name: 'Japanese' },
    { code: 'zh', label: 'ZH', name: 'Chinese' },
    { code: 'ar', label: 'AR', name: 'Arabic' },
    { code: 'pl', label: 'PL', name: 'Polish' },
    { code: 'sv', label: 'SV', name: 'Swedish' },
    { code: 'uk', label: 'UK', name: 'Ukrainian' },
    { code: 'ca', label: 'CA', name: 'Catalan' }
];

// Global language state
let langState = {
    active: [],  // language codes currently active
    order: [],   // display priority order
    counts: {}   // article counts per language
};

// Master article store keyed by Q-number or "{lang}:{pageId}" fallback
let articleStore = {};

// Track pending Q-number resolution to avoid double-resolving
let _pendingQResolution = {};

// Max concurrent language fetches
const MAX_CONCURRENT_FETCHES = 6;

/**
 * Initialize language state from localStorage or defaults.
 */
function initLanguageState() {
    let prefs = loadLanguagePrefs();
    if (prefs && prefs.active && prefs.active.length > 0) {
        langState.active = prefs.active;
        langState.order = prefs.order || prefs.active;
    } else {
        // Default: browser language + English
        let browserLang = (navigator.language || 'en').split('-')[0].toLowerCase();
        let supported = SUPPORTED_LANGUAGES.map(l => l.code);
        if (!supported.includes(browserLang)) browserLang = null;

        if (browserLang && browserLang !== 'en') {
            langState.active = [browserLang, 'en'];
            langState.order = [browserLang, 'en'];
        } else {
            langState.active = ['en'];
            langState.order = ['en'];
        }
    }
    langState.counts = {};
    renderLanguageBadges();
}

/**
 * Save language preferences to localStorage.
 */
function saveLanguagePrefs() {
    try {
        localStorage.setItem('wikiexplore_langs', JSON.stringify({
            active: langState.active,
            order: langState.order
        }));
    } catch (e) {
        // localStorage unavailable
    }
}

/**
 * Load language preferences from localStorage.
 */
function loadLanguagePrefs() {
    try {
        let stored = localStorage.getItem('wikiexplore_langs');
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Fetch articles from all active languages in parallel.
 * Called on map moveend instead of the old fetchArticlesInBoundingBox.
 */
async function fetchArticlesMultilingual(boundsArray) {
    let activeLangs = langState.active.slice();
    if (activeLangs.length === 0) return;

    // Fetch in groups of MAX_CONCURRENT_FETCHES
    let results = [];
    for (let i = 0; i < activeLangs.length; i += MAX_CONCURRENT_FETCHES) {
        let batch = activeLangs.slice(i, i + MAX_CONCURRENT_FETCHES);
        let promises = batch.map(lang => {
            let requestURL = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=geosearch&origin=*&utf8=1&gsbbox=${boundsArray.join('|')}&gslimit=500&gsprimary=all`;
            return fetch(requestURL)
                .then(r => r.json())
                .then(data => ({ lang: lang, data: data, error: null }))
                .catch(error => ({ lang: lang, data: null, error: error }));
        });
        let batchResults = await Promise.allSettled(promises);
        results = results.concat(batchResults);
    }

    // Process results for each language
    let qNumberPromises = [];
    for (let result of results) {
        let val = result.status === 'fulfilled' ? result.value : null;
        if (!val || val.error || !val.data) continue;
        let pageIds = processArticlesForLang(val.lang, val.data);
        if (pageIds.length > 0) {
            qNumberPromises.push(resolveQNumbers(val.lang, pageIds));
        }
    }

    // Wait for Q-number resolution then merge
    await Promise.allSettled(qNumberPromises);
    mergeByQNumber();

    // Build filtered GeoJSON and update map
    let geojson = buildFilteredGeojson();
    updateMapSource(geojson);
    updateBadgeCounts();
    renderLanguageBadges();
    $('#loadingBox').hide();
}

/**
 * Process geosearch results for a single language.
 * Adds articles to the store with "{lang}:{pageId}" keys.
 * Returns array of pageIds for Q-number resolution.
 */
function processArticlesForLang(lang, jsonData) {
    if (!jsonData || !jsonData.query || !jsonData.query.geosearch) return [];

    let pageIds = [];
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    jsonData.query.geosearch.forEach(function (value) {
        if (value.title.startsWith('List of')) return;

        let tempKey = lang + ':' + value.pageid;

        // Check if this article is already stored under a Q-number
        let existingQKey = null;
        for (let key in articleStore) {
            if (articleStore[key].langs && articleStore[key].langs[lang] &&
                articleStore[key].langs[lang].pageId === value.pageid) {
                existingQKey = key;
                break;
            }
        }

        if (existingQKey) {
            // Already known under Q-number, no action needed
            return;
        }

        // Check if already stored as temp key
        if (articleStore[tempKey]) return;

        let url;
        if (isMobile) {
            url = `https://${lang}.m.wikipedia.org/?curid=${value.pageid}`;
        } else {
            url = `https://${lang}.wikipedia.org/?curid=${value.pageid}`;
        }

        articleStore[tempKey] = {
            qNumber: null,
            lonLat: [value.lon, value.lat],
            langs: {}
        };
        articleStore[tempKey].langs[lang] = {
            pageId: value.pageid,
            title: value.title,
            url: url
        };

        pageIds.push(value.pageid);
    });

    return pageIds;
}

/**
 * Batch resolve Q-numbers for a language's articles using the pageprops API.
 * Processes in batches of 50 (API limit).
 */
async function resolveQNumbers(lang, pageIds) {
    // Deduplicate and filter already-resolved
    let toResolve = pageIds.filter(pid => {
        let key = lang + ':' + pid;
        // Skip if already has Q-number or is pending
        if (_pendingQResolution[key]) return false;
        if (articleStore[key] && articleStore[key].qNumber) return false;
        _pendingQResolution[key] = true;
        return true;
    });

    for (let i = 0; i < toResolve.length; i += 50) {
        let batch = toResolve.slice(i, i + 50);
        let requestURL = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageprops&ppprop=wikibase_item&pageids=${batch.join('|')}&formatversion=latest`;

        try {
            let response = await fetch(requestURL);
            let data = await response.json();
            if (data && data.query && data.query.pages) {
                data.query.pages.forEach(function (page) {
                    let key = lang + ':' + page.pageid;
                    if (page.pageprops && page.pageprops.wikibase_item) {
                        if (articleStore[key]) {
                            articleStore[key].qNumber = page.pageprops.wikibase_item;
                        }
                    }
                    delete _pendingQResolution[key];
                });
            }
        } catch (error) {
            console.error('Q-number resolution failed for ' + lang, error);
            batch.forEach(pid => delete _pendingQResolution[lang + ':' + pid]);
        }
    }
}

/**
 * Merge articles that share the same Q-number.
 * Re-keys temp entries to their Q-number.
 */
function mergeByQNumber() {
    let tempKeys = Object.keys(articleStore).filter(k => k.includes(':'));

    tempKeys.forEach(function (tempKey) {
        let entry = articleStore[tempKey];
        if (!entry.qNumber) return; // No Q-number resolved, keep as-is

        let qKey = entry.qNumber;

        if (articleStore[qKey]) {
            // Merge languages into existing Q-number entry
            let existing = articleStore[qKey];
            for (let lang in entry.langs) {
                if (!existing.langs[lang]) {
                    existing.langs[lang] = entry.langs[lang];
                }
            }
        } else {
            // Move entry to Q-number key
            articleStore[qKey] = entry;
        }

        // Remove temp key
        delete articleStore[tempKey];
    });
}

/**
 * Build a filtered GeoJSON FeatureCollection from the articleStore.
 * Only includes articles that have at least one active language.
 */
function buildFilteredGeojson() {
    let features = [];
    let activeLangs = langState.active;
    let order = langState.order;

    for (let key in articleStore) {
        let entry = articleStore[key];
        if (!entry.langs) continue;

        // Check if article has any active language
        let hasActiveLang = false;
        for (let i = 0; i < activeLangs.length; i++) {
            if (entry.langs[activeLangs[i]]) {
                hasActiveLang = true;
                break;
            }
        }
        if (!hasActiveLang) continue;

        // Pick display title from highest-priority active language
        let primaryLang = null;
        let displayTitle = null;
        let displayPageId = null;
        let displayUrl = null;
        for (let i = 0; i < order.length; i++) {
            if (entry.langs[order[i]] && activeLangs.includes(order[i])) {
                primaryLang = order[i];
                displayTitle = entry.langs[order[i]].title;
                displayPageId = entry.langs[order[i]].pageId;
                displayUrl = entry.langs[order[i]].url;
                break;
            }
        }
        // Fallback: first available active language
        if (!displayTitle) {
            for (let lang in entry.langs) {
                if (activeLangs.includes(lang)) {
                    primaryLang = lang;
                    displayTitle = entry.langs[lang].title;
                    displayPageId = entry.langs[lang].pageId;
                    displayUrl = entry.langs[lang].url;
                    break;
                }
            }
        }
        if (!displayTitle) continue;

        features.push({
            'type': 'Feature',
            'properties': {
                key: key,
                title: displayTitle,
                pageId: displayPageId,
                lonLat: entry.lonLat,
                url: displayUrl,
                langs: JSON.stringify(entry.langs),
                primaryLang: primaryLang
            },
            'geometry': {
                'type': 'Point',
                'coordinates': entry.lonLat
            }
        });
    }

    return {
        'type': 'FeatureCollection',
        'features': features
    };
}

/**
 * Update the map source with new GeoJSON data.
 * Also keeps the backward-compat articlesGeojson global in sync.
 */
function updateMapSource(geojson) {
    articlesGeojson = geojson;
    try {
        let source = map.getSource('wikipediaSource');
        if (source) {
            source.setData(geojson);
        }
    } catch (e) {
        // Map may not be loaded yet
    }
}

/**
 * Get the best display title for an article entry based on language priority.
 */
function getDisplayTitle(articleEntry) {
    let order = langState.order;
    let activeLangs = langState.active;
    for (let i = 0; i < order.length; i++) {
        if (articleEntry.langs[order[i]] && activeLangs.includes(order[i])) {
            return articleEntry.langs[order[i]].title;
        }
    }
    // Fallback
    for (let lang in articleEntry.langs) {
        return articleEntry.langs[lang].title;
    }
    return 'Unknown';
}

/**
 * Count articles per language from the articleStore.
 */
function updateBadgeCounts() {
    let counts = {};
    for (let key in articleStore) {
        let entry = articleStore[key];
        if (!entry.langs) continue;
        for (let lang in entry.langs) {
            counts[lang] = (counts[lang] || 0) + 1;
        }
    }
    langState.counts = counts;
}

/**
 * Render the language badge UI on the map overlay.
 */
function renderLanguageBadges() {
    let container = document.getElementById('lang-badge-container');
    if (!container) return;

    container.innerHTML = '';

    SUPPORTED_LANGUAGES.forEach(function (langDef) {
        let badge = document.createElement('div');
        badge.className = 'lang-badge' + (langState.active.includes(langDef.code) ? ' active' : '');
        badge.setAttribute('data-lang', langDef.code);
        badge.setAttribute('draggable', 'true');
        badge.setAttribute('title', langDef.name);

        let count = langState.counts[langDef.code] || 0;
        let countStr = langState.active.includes(langDef.code) && count > 0 ? ' ' + count : '';
        badge.textContent = langDef.label + countStr;

        badge.addEventListener('click', function () {
            toggleLanguage(langDef.code);
        });

        container.appendChild(badge);
    });

    initBadgeDragAndDrop();
}

/**
 * Toggle a language active/inactive. Rebuild geojson and re-render.
 */
function toggleLanguage(lang) {
    let idx = langState.active.indexOf(lang);
    if (idx >= 0) {
        // Don't allow toggling off the last language
        if (langState.active.length <= 1) return;
        langState.active.splice(idx, 1);
        // Also remove from order
        let orderIdx = langState.order.indexOf(lang);
        if (orderIdx >= 0) langState.order.splice(orderIdx, 1);
    } else {
        langState.active.push(lang);
        // Add to order if not present
        if (!langState.order.includes(lang)) {
            langState.order.push(lang);
        }
    }

    saveLanguagePrefs();

    // Rebuild and update map
    let geojson = buildFilteredGeojson();
    updateMapSource(geojson);
    renderLanguageBadges();
}

/**
 * Set up HTML5 drag-and-drop on language badges for reordering.
 */
function initBadgeDragAndDrop() {
    let container = document.getElementById('lang-badge-container');
    if (!container) return;

    let dragSrc = null;

    container.querySelectorAll('.lang-badge').forEach(function (badge) {
        badge.addEventListener('dragstart', function (e) {
            dragSrc = this;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.getAttribute('data-lang'));
            this.classList.add('dragging');
        });

        badge.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.classList.add('drag-over');
        });

        badge.addEventListener('dragleave', function () {
            this.classList.remove('drag-over');
        });

        badge.addEventListener('drop', function (e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            if (dragSrc === this) return;

            let srcLang = e.dataTransfer.getData('text/plain');
            let targetLang = this.getAttribute('data-lang');

            // Reorder: move srcLang to targetLang's position in order
            let srcIdx = langState.order.indexOf(srcLang);
            let targetIdx = langState.order.indexOf(targetLang);

            if (srcIdx < 0) {
                // Source not in order yet, add it
                if (!langState.active.includes(srcLang)) return;
                langState.order.splice(targetIdx, 0, srcLang);
            } else {
                langState.order.splice(srcIdx, 1);
                targetIdx = langState.order.indexOf(targetLang);
                langState.order.splice(targetIdx, 0, srcLang);
            }

            saveLanguagePrefs();
            let geojson = buildFilteredGeojson();
            updateMapSource(geojson);
            renderLanguageBadges();
        });

        badge.addEventListener('dragend', function () {
            this.classList.remove('dragging');
            container.querySelectorAll('.lang-badge').forEach(function (b) {
                b.classList.remove('drag-over');
            });
        });
    });
}

/**
 * Render language badges in the info panel header.
 * Shows which languages are available for the current article.
 */
function renderInfoPanelLangBadges(langsObj, currentLang) {
    let container = document.getElementById('info-lang-badges');
    if (!container) return;

    container.innerHTML = '';
    let langCodes = Object.keys(langsObj);
    if (langCodes.length <= 1) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'flex';

    langCodes.forEach(function (code) {
        let badge = document.createElement('span');
        badge.className = 'info-lang-badge' + (code === currentLang ? ' active' : '');
        badge.textContent = code.toUpperCase();
        badge.setAttribute('title', langsObj[code].title);
        badge.addEventListener('click', function () {
            switchInfoPanelLanguage(code);
        });
        container.appendChild(badge);
    });
}

/**
 * Switch the info panel to show a different language's article.
 */
function switchInfoPanelLanguage(lang) {
    if (!infoPanel._langs || !infoPanel._langs[lang]) return;

    let langData = infoPanel._langs[lang];
    infoPanel.currentLang = lang;
    infoPanel.Map_title = langData.title;
    infoPanel.wikipediaID = langData.pageId;

    // Re-fetch article details in the new language
    wikipediaApiRequestDetails(langData.pageId, lang);
    renderInfoPanelLangBadges(infoPanel._langs, lang);
}

/**
 * Build hover popup language indicator string.
 */
function buildHoverLangIndicator(langsStr) {
    try {
        let langs = typeof langsStr === 'string' ? JSON.parse(langsStr) : langsStr;
        let codes = Object.keys(langs);
        if (codes.length <= 1) return '';
        return '<span class="hover-lang-badges">' +
            codes.map(function (c) { return '<span class="hover-lang-badge">' + c.toUpperCase() + '</span>'; }).join(' ') +
            '</span>';
    } catch (e) {
        return '';
    }
}
