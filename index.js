/* eslint-disable no-undef */
/* eslint-disable indent */

let articlesGeojson = { // #map
    'type': 'FeatureCollection',
    'features': []
};

let infoPanel = {}; // #panel

// Map style constants
const MAP_STYLE_DEFAULT = 'mapbox://styles/caskes/cldkq0ha9000r01n3hjgwtkrn';
const MAP_STYLE_SATELLITE = 'mapbox://styles/mapbox/satellite-streets-v12';
let isSatelliteView = false;

// cities is an array from the data.js file. It consists of objects with
// the keys: "n" for name, "c" for coordinates and q for the Q number.
function randCity() {
    let randIndex = Math.floor(Math.random() * cities.length);
    return cities[randIndex];
}

// #url-state — Parse URL for initial state
const _urlParams = new URLSearchParams(window.location.search);
const _hashMatch = window.location.hash.match(/^#(\d+\.?\d*)\/([-\d.]+)\/([-\d.]+)/);
const _hasUrlCoords = !!_hashMatch;
const _urlArticle = _urlParams.get('article');
const _urlSatellite = _urlParams.get('satellite') === '1';
const _urlLangs = _urlParams.get('langs');

const srtartLocation = randCity(); // #welcome
mapboxgl.accessToken = 'pk.eyJ1IjoiY2Fza2VzIiwiYSI6ImNsZGtwdGRrdzA4dWMzb3BoMWdxM3Zib2UifQ.2q2xfShG5nmDHTxg7n_ZhQ'; // #map

// If URL has coordinates, use them; otherwise random city
let _initialCenter = srtartLocation.c;
let _initialZoom = 15;
if (_hasUrlCoords) {
    _initialCenter = [parseFloat(_hashMatch[3]), parseFloat(_hashMatch[2])];
    _initialZoom = parseFloat(_hashMatch[1]);
}

const mapConfig = { // #map
    container: 'map', // container element id
    style: _urlSatellite ? MAP_STYLE_SATELLITE : MAP_STYLE_DEFAULT, // stylesheet location
    center: _initialCenter,
    zoom: _initialZoom,
    hash: true // hash location in url
};
const map = new mapboxgl.Map(mapConfig); // #map

// Skip welcome screen if URL has coordinates (vanilla JS since jQuery may not be loaded yet)
if (_hasUrlCoords) {
    let _welcomeDiv = document.querySelector('.WelcomeDiv');
    if (_welcomeDiv) _welcomeDiv.style.display = 'none';
    let _coverDiv = document.getElementById('coverContainer');
    if (_coverDiv) _coverDiv.style.display = 'none';
}

// Apply satellite state from URL
if (_urlSatellite) {
    isSatelliteView = true;
}

// #url-state — Article restore flag and function
let _urlArticleRestored = false;

function restoreArticleFromUrl(qNumber) {
    if (!qNumber) return;
    // Look up article in the store by Q-number
    let entry = (typeof articleStore !== 'undefined') ? articleStore[qNumber] : null;
    if (entry && entry.langs) {
        // Build properties to open the info panel
        let activeLangs = langState.active;
        let order = langState.order;
        let primaryLang = null;
        let displayTitle = null;
        let displayPageId = null;

        for (let i = 0; i < order.length; i++) {
            if (entry.langs[order[i]] && activeLangs.includes(order[i])) {
                primaryLang = order[i];
                displayTitle = entry.langs[order[i]].title;
                displayPageId = entry.langs[order[i]].pageId;
                break;
            }
        }
        if (!displayTitle) {
            for (let lang in entry.langs) {
                primaryLang = lang;
                displayTitle = entry.langs[lang].title;
                displayPageId = entry.langs[lang].pageId;
                break;
            }
        }
        if (displayTitle) {
            openInfoPanel({
                key: qNumber,
                title: displayTitle,
                pageId: displayPageId,
                lonLat: entry.lonLat,
                langs: JSON.stringify(entry.langs),
                primaryLang: primaryLang
            });
        }
    } else {
        // Article not in store yet — fetch via Wikidata to get coordinates and title
        fetchArticleByQNumber(qNumber);
    }
}

function fetchArticleByQNumber(qNumber) {
    let lang = langState.active[0] || 'en';
    let sparql = `SELECT ?sitelink ?coord WHERE {
        OPTIONAL { wd:${qNumber} wdt:P625 ?coord. }
        OPTIONAL {
            ?sitelink schema:about wd:${qNumber};
            schema:isPartOf <https://${lang}.wikipedia.org/>.
        }
    } LIMIT 1`;

    let headers = new Headers({ Accept: 'application/sparql-results+json', ...WIKIMEDIA_HEADERS });
    let body = new URLSearchParams({ query: sparql });

    fetch('https://query.wikidata.org/sparql', { method: 'POST', headers, body })
        .then(r => r.json())
        .then(function (data) {
            if (!data.results || !data.results.bindings || data.results.bindings.length === 0) return;
            let row = data.results.bindings[0];

            // Get the Wikipedia page URL to extract the page ID
            if (row.sitelink) {
                let wikiUrl = row.sitelink.value;
                let titleMatch = wikiUrl.match(/\/wiki\/(.+)$/);
                if (titleMatch) {
                    let title = decodeURIComponent(titleMatch[1].replace(/_/g, ' '));
                    // Resolve page ID via Wikipedia API
                    fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(title)}&formatversion=latest`, { headers: WIKIMEDIA_HEADERS })
                        .then(r => r.json())
                        .then(function (wikiData) {
                            if (!wikiData.query || !wikiData.query.pages) return;
                            let page = wikiData.query.pages[0];
                            if (!page || page.missing) return;

                            let lonLat = null;
                            if (row.coord) {
                                let coordStr = row.coord.value.replace('Point(', '').replace(')', '');
                                let parts = coordStr.split(' ');
                                lonLat = [parseFloat(parts[0]), parseFloat(parts[1])];
                            }

                            let langs = {};
                            langs[lang] = { pageId: page.pageid, title: page.title };

                            openInfoPanel({
                                key: qNumber,
                                title: page.title,
                                pageId: page.pageid,
                                lonLat: lonLat,
                                langs: JSON.stringify(langs),
                                primaryLang: lang
                            });
                        })
                        .catch(e => console.error('Failed to resolve article from URL', e));
                }
            }
        })
        .catch(e => console.error('Failed to fetch article by Q-number', e));
}

// #url-state — Sync app state to URL query parameters
let _urlUpdateTimer = null;
function updateUrlState() {
    // Debounce to avoid fighting with Mapbox's hash updates
    clearTimeout(_urlUpdateTimer);
    _urlUpdateTimer = setTimeout(function () {
        let params = new URLSearchParams();

        // Languages in order
        if (typeof langState !== 'undefined' && langState.active && langState.active.length > 0) {
            params.set('langs', langState.order.filter(l => langState.active.includes(l)).join(','));
        }

        // Selected article
        if (infoPanel && infoPanel.qNumber) {
            params.set('article', infoPanel.qNumber);
        }

        // Satellite mode
        if (isSatelliteView) {
            params.set('satellite', '1');
        }

        let paramStr = params.toString();
        let newUrl = window.location.pathname + (paramStr ? '?' + paramStr : '') + window.location.hash;
        history.replaceState(null, '', newUrl);
    }, 100);
}

// Zoom and rotation constroles.
map.addControl(new mapboxgl.NavigationControl(), 'bottom-right'); // #map

// eslint-disable-next-line no-unused-vars
function newRandomLocation() {
    const location = randCity();
    map.flyTo({
        center: location.c,
        zoom: 15
    });
} // #random-location

document.getElementById('randomButton').addEventListener('click', newRandomLocation); // #random-location

document.querySelectorAll('.startButton').forEach(button => {
    button.addEventListener('click', hideWelcomCoverPage);
});

function hideWelcomCoverPage() { // #welcome
    $('.WelcomeDiv').hide();
    $('#coverContainer').hide();
}

//Create a popup to display when hovering over a marker.
let hoverPopup = new mapboxgl.Popup({ // #map
    closeButton: false,
    closeOnClick: true
});

//Create a popup to display when clicking on a marker.
let listPopup = new mapboxgl.Popup({ // #article-list
    closeButton: true,
    closeOnClick: true
});

// adding geocoer search box one welkom screen
let geocoder = new MapboxGeocoder({ // #welcome
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl
});
document.getElementById('geocoderWelcome').appendChild(geocoder.onAdd(map));

// Debounce utility: delays calling fn until wait ms after the last invocation
let _moveendTimer = null;
function debouncedFetchArticles() {
    clearTimeout(_moveendTimer);
    _moveendTimer = setTimeout(function () {
        fetchArticlesInBoundingBox();
    }, 500);
}

map.on('load', function () {

    // Initialize multilingual language state and badges
    if (typeof initLanguageState === 'function') {
        initLanguageState();
    }

    // Ensure source and layers exist before first data fetch (race condition fix)
    addWikipediaSourceAndLayers();

    // initial API call to get data on the map
    fetchArticlesInBoundingBox(); // #geo-api

    //adding geocoder
    let geocoder2 = new MapboxGeocoder({ // #map
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl
    });
    document.getElementById('geocoderMap').appendChild(geocoder2.onAdd(map)); // #map

    // Source and layers are added via style.load → addWikipediaSourceAndLayers()

    // hover popup Wikipedia Layer
    map.on('mousemove', 'unclustered-point', hoverPopupOn); // #map
    map.on('mouseleave', 'unclustered-point', hoverPopupOff); // #map
    map.on('mousemove', 'cluster-count', hoverPopupOn); // #map
    map.on('mouseleave', 'cluster-count', hoverPopupOff); // #map

    map.on('mouseenter', 'cluster-count', function () { // #map
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'cluster-count', function () { // #map
        map.getCanvas().style.cursor = '';
    });

    map.on('click', 'unclustered-point', popupOpen); // #info-panel
    map.on('click', 'cluster-count', popupOpen); // #article-list

    // Map panning ends — debounced to prevent request storms
    map.on('moveend', function () { // #geo-api
        debouncedFetchArticles();
        updateUrlState();
    });

    // Show the contextual menu on right-click
    map.on('contextmenu', function (e) { // #context-menu
        e.preventDefault();
        const point = map.project(e.lngLat);
        showContextMenu(point);
    });

    // hides the contextual menu on any interaction
    map.on('move', hideContextMenu); // #context-menu
    map.on('zoom', hideContextMenu);
    map.on('rotate', hideContextMenu);
    map.on('dragstart', hideContextMenu);
    map.on('touchstart', hideContextMenu);

});

// #satellite-toggle (constants and isSatelliteView declared at top of file)

function addWikipediaSourceAndLayers() {
    if (map.getSource('wikipediaSource')) return;

    map.addSource('wikipediaSource', {
        'type': 'geojson',
        'data': articlesGeojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 16
    });

    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'wikipediaSource',
        paint: {
            'circle-color': '#4B7982',
            'circle-opacity': 0.8,
            'circle-radius': 10,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
        }
    });

    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'wikipediaSource',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        },
        paint: {
            'text-color': '#ffffff'
        }
    });
}

document.getElementById('satelliteToggle').addEventListener('click', function () {
    isSatelliteView = !isSatelliteView;
    let newStyle = isSatelliteView ? MAP_STYLE_SATELLITE : MAP_STYLE_DEFAULT;
    let btn = document.getElementById('satelliteToggle');
    let label = btn.querySelector('.random-label');
    let icon = btn.querySelector('.icon');

    if (isSatelliteView) {
        if (label) label.textContent = 'Map';
        if (icon) icon.className = 'fas fa-map icon';
    } else {
        if (label) label.textContent = 'Satellite';
        if (icon) icon.className = 'fas fa-satellite icon';
    }

    map.setStyle(newStyle);
    updateUrlState();
});

// Update satellite button label if loaded from URL in satellite mode
if (_urlSatellite) {
    let _btn = document.getElementById('satelliteToggle');
    let _label = _btn ? _btn.querySelector('.random-label') : null;
    let _icon = _btn ? _btn.querySelector('.icon') : null;
    if (_label) _label.textContent = 'Map';
    if (_icon) _icon.className = 'fas fa-map icon';
}

map.on('style.load', function () {
    addWikipediaSourceAndLayers();
});

// #context-menu
const contextMenuHTML = `
  <div id="context-menu">
    <ul>
      <li><a id="google-maps-link" href="#" target="_blank">Google Maps</a></li>
      <li><a id="apple-maps-link" href="#" target="_blank">Apple Maps</a></li>
      <li><a id="bing-maps-link" href="#" target="_blank">Bing Maps</a></li>
      <li><a id="here-wego-link" href="#" target="_blank">HERE WeGo</a></li>
      <li><a id="openstreetmap-link" href="#" target="_blank">OpenStreetMap</a></li>
      <li><a id="wikishootme-link" href="#" target="_blank">WikiShootMe</a></li>
      <li><a id="mapillary-link" href="#" target="_blank">Mapillary</a></li>
    </ul>
  </div>
`;
document.body.insertAdjacentHTML('beforeend', contextMenuHTML); // #context-menu
document.querySelector('#context-menu').addEventListener('click', hideContextMenu); // #context-menu

function generateContextMenuLinks(lat, lng) { // #context-menu
    const googleMapsLink = document.getElementById('google-maps-link');
    googleMapsLink.href = `https://www.google.com/maps/?ll=${lat},${lng}&z=${map.getZoom()}&t=k`;

    const appleMapsLink = document.getElementById('apple-maps-link');
    appleMapsLink.href = `http://maps.apple.com/?ll=${lat},${lng}&z=${map.getZoom()}&t=s`;

    const bingMapsLink = document.getElementById('bing-maps-link');
    bingMapsLink.href = `https://www.bing.com/maps/?v=2&cp=${lat}~${lng}&lvl=${map.getZoom()}&sty=a`;

    const wikishootmeLink = document.getElementById('wikishootme-link');
    wikishootmeLink.href = `https://tools.wmflabs.org/wikishootme/#lat=${lat}&lon=${lng}&zoom=${map.getZoom()}`;

    const openstreetmapLink = document.getElementById('openstreetmap-link');
    openstreetmapLink.href = `https://www.openstreetmap.org/#map=${map.getZoom()}/${lat}/${lng}&markers=${lat},${lng}`;

    const hereWegoLink = document.getElementById('here-wego-link');
    hereWegoLink.href = `https://wego.here.com/?map=${lat},${lng},${map.getZoom()},satellite`;

    const mapillaryLink = document.getElementById('mapillary-link');
    mapillaryLink.href = `https://www.mapillary.com/app?lat=${lat}&lng=${lng}&z=${map.getZoom()}`;
}

function showContextMenu(point) { // #context-menu
    const contextMenu = document.getElementById('context-menu');
    const latLng = map.unproject([point.x, point.y]);
    const lat = latLng.lat;
    const lng = latLng.lng;
    generateContextMenuLinks(lat, lng);
    const mapElement = document.getElementById('map');
    const rect = mapElement.getBoundingClientRect();
    const offsetLeft = rect.left + window.pageXOffset;
    const offsetTop = rect.top + window.pageYOffset;
    contextMenu.style.left = point.x + offsetLeft + 'px';
    contextMenu.style.top = point.y + offsetTop + 'px';
    contextMenu.style.display = 'block';
    map.once('mousedown', hideContextMenu);
}

function hideContextMenu() { document.getElementById('context-menu').style.display = 'none'; } // #context-menu

function hoverPopupOn(e) { // #map
    let html = '';
    if (e.features.length == 1) { // one article
        if (e.features[0].properties.title != undefined) {
            let articleTitle = e.features[0].properties.title; // getting article title
            let langBadges = e.features[0].properties.langs ? buildHoverLangIndicator(e.features[0].properties.langs) : '';
            html = `<ul class="articleDropdown"><li id="">${articleTitle}${langBadges}</li></ul>`;
        } else {
            html = '<ul class="articleDropdown"><li id="">Multiple articles</li></ul>'; // generate html for one article using artile title
        }
    } else if (e.features.length > 1) { // mor than one article
        html = `<ul class="articleDropdown"><li id="">${e.features.length} articles</li></ul>`;
    }

    let coordinates = e.features[0].geometry.coordinates.slice(); // latLng to place popup

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) { // avoid missplacinf popup on zomed out world where some part of the mercato projection is visible twice.
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    hoverPopup //popup simple name of article or number of articles under mouse
        .setLngLat(coordinates)
        .setHTML(html)
        .addTo(map);

    $('.mapboxgl-popup-content').css({ // styling popup
        'background': 'transparent',
        'padding': '0'
    });

    map.getCanvas().style.cursor = 'pointer'; // changing mouse signaling the posibility to click
}

function hoverPopupOff() { // #map
    map.getCanvas().style.cursor = '';
    hoverPopup.remove();
}

// bad name, needs to be changed. This function is called when user clicks on map
function popupOpen(e) { // #map #article-list
    console.log(e.features[0].properties);
    if (e.features.length > 1) createListPopup(e.features); // more than one article under click
    if (e.features[0].properties.cluster) {// a cluster under click
        const featuresUnderClick = e.features; // get all features under the click
        const clusterId = featuresUnderClick[0].properties.cluster_id; // cluster id is to identify wich features are in the cluster
        const pointCount = featuresUnderClick[0].properties.point_count; // point count is to know howmany features should be requested from the cluster
        const source = map.getSource('wikipediaSource'); // get the source of the cluster layer
        source.getClusterLeaves(clusterId, pointCount, 0, (error, features) => { createListPopup(features); });
    } else openInfoPanel(e.features[0].properties); // one article under click
}

function createListPopup(features) { // #article-list

    const html = `
    <ul class="articleDropdown">
        ${features.map((feature, index) => `
        <li data-list-nbr="${index}">
            ${feature.properties.title}
        </li>
        `).join('')}
    </ul>
    `; // generate html for list of articles

    listPopup// initiate list popup
        .setLngLat(features[0].geometry.coordinates.slice())
        .setHTML(html)
        .addTo(map);

    // bind click events to list elements
    document.querySelectorAll('.articleDropdown li').forEach((item) => {
        item.addEventListener('click', function () {
            let listNbr = $(this).attr('data-list-nbr');
            listNbr = Number(listNbr);
            console.log('createListPopup');
            console.log(features[listNbr].properties);
            openInfoPanel(features[listNbr].properties);
            listPopup.remove();
        });
    });

    // hide standard Mapbox popup CSS
    document.querySelectorAll('.mapboxgl-popup-content').forEach((item) => {
        item.style.background = 'transparent';
        item.style.padding = '0';
    });
}

function fetchArticlesInBoundingBox() { //#geo-api
    const bounds = map.getBounds();
    const boundsArray = [ // bounding box
        bounds['_ne'].lat,
        bounds['_sw'].lng,
        bounds['_sw'].lat,
        bounds['_ne'].lng
    ];

    console.log('Searching articles in new map locations');
    fetchArticlesMultilingual(boundsArray);
}

function openInfoPanel(poiProperties) { // #panel
    console.log(poiProperties);
    infoPanel = {}; // reset
    infoPanel.Map_title = poiProperties.title; // title
    infoPanel.wikipediaID = poiProperties.pageId; // pageId
    if (typeof poiProperties.lonLat === 'string') {
        infoPanel.Map_lonLat = JSON.parse(poiProperties.lonLat);
    } else {
        infoPanel.Map_lonLat = poiProperties.lonLat;
    }

    // Parse multilingual data if available
    let langs = null;
    if (poiProperties.langs) {
        try {
            langs = typeof poiProperties.langs === 'string' ? JSON.parse(poiProperties.langs) : poiProperties.langs;
        } catch (e) {
            langs = null;
        }
    }
    infoPanel._langs = langs;
    infoPanel.currentLang = poiProperties.primaryLang || 'en';

    // Immediately reset the visual state to prevent old content flashing
    resetInfoPanelVisuals();

    // Store the key (Q-number or temp) for URL state
    infoPanel._articleKey = poiProperties.key || null;

    console.log(`openInfoPanel: ${infoPanel}`);
    console.log(infoPanel);
    wikipediaApiRequestDetails(infoPanel.wikipediaID, infoPanel.currentLang);
}

async function wikipediaApiRequestDetails(pageID, lang) { // #wiki-api
    lang = lang || 'en';
    console.log(`Fetching details for article with pageID: ${pageID} (${lang})`);
    // API sandbox link: https://en.wikipedia.org/wiki/Special:ApiSandbox#action=query&format=json&origin=*&prop=extracts%7Cpageprops%7Cpageimages%7Ccategories&pageids=58387057&utf8=1&formatversion=latest&exintro=1
    const requestURL = `https://${lang}.wikipedia.org/w/api.php?action=query&origin=*&format=json&prop=extracts%7Cpageprops%7Cpageimages%7Ccategories%7Cextlinks&pageids=${pageID}&utf8=1&formatversion=latest&exintro=1&ellimit=500`;
    fetch(requestURL, { headers: WIKIMEDIA_HEADERS })
        .then(response => response.json())
        .then(data => parseWikipediaApiResponseDetails(data))
        .catch(error => console.error(error));
}

function parseWikipediaApiResponseDetails(jsonData) {
    let wikipediaApiRespons = jsonData.query.pages[0];

    infoPanel.wikipedia_Intro = wikipediaApiRespons.extract;
    infoPanel.wikipedia_ImgTitle = wikipediaApiRespons.pageimage;
    infoPanel.qNumber = wikipediaApiRespons.pageprops.wikibase_item;
    if (infoPanel.qNumber) {
        updateUrlState();
        WikidataApiRequestDetails();
    }
    if (wikipediaApiRespons.pageimage != undefined) {
        infoPanel.wikipedia_ImgUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${wikipediaApiRespons.pageimage}?width=800`;
    }
    infoPanel.wikipedia_Categories = [];

    for (const i in wikipediaApiRespons.categories) {
        infoPanel.wikipedia_Categories.push(wikipediaApiRespons.categories[i].title); // adding all wikipediaApiRespons cathegories.
    }

    infoPanel.wikipedia_ExtLinks = [];
    if (wikipediaApiRespons.extlinks) {
        infoPanel.wikipedia_ExtLinks = wikipediaApiRespons.extlinks.map(link => link.url);
    }

    updateInfoPanel(infoPanel);
}

function WikidataApiRequestDetails() {

    async function fetchWikidataData(endpointUrl, sparqlQuery, doneCallback) {
        const headers = new Headers({ Accept: 'application/sparql-results+json', ...WIKIMEDIA_HEADERS });
        const body = new URLSearchParams({ query: sparqlQuery });

        try {
            const response = await fetch(endpointUrl, { method: 'POST', headers, body });
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const json = await response.json();
            doneCallback(json);
        } catch (error) {
            console.error(error);
        }
    }

    //https://query.wikidata.org/#SELECT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20%3Fimg%20%3Fcommons%20%3FWikipediaLink%20%3Felevation%20%3Farea%20%3FofficialWebsite%20%3FflagImage%20%3FLonLat%20%3FcoatOfArmsImage%20%3FCommonsCategory%20%3FFreebaseIdGoogleSearch%20%3FGoogleKnowledgeGraphId%20%3FstartTime%20%3FendTime%20%3Finception%20%3Freligion%20%3FsignificantEvent%20%3Faudio%20%3FmaximumCapacity%20%3FvisitorsPerYear%20%3FheritageDesignationLabel%20%3Flength%20%3Fwidth%20%3Fheight%20%3FplanViewImage%20%3FFacebookId%20%3FGoogleMapsCustomerId%20%3FInstagramUsername%20%3FMapillaryId%20%3FTwitterUsername%20%3FOpenStreetMapRelationId%20%3FInstagramLocationId%20%3FFoursquareVenueId%20%3FImdbId%20%3FLinkedInCompanyId%20%3FTripAdvisorId%20%3FYelpId%20%3FYouTubeChannelId%20%3FphoneNumber%20%3FemailAddress%20%3Fsubreddit%20%3FGoogleArtsCulturePartnerId%20%3Fpopulation%20%3FcommonsLink%20%3FinstanceOfLabel%20WHERE%20%7B%0A%0A%20%20%23%20https%3A%2F%2Fwww.wikidata.org%2Fwiki%2FQ2981%20Notre%20Dam%20of%20Paris%0A%20%20%23%20https%3A%2F%2Fwww.wikidata.org%2Fwiki%2FQ243%20Toure%20Eiffel%0A%20%20%20%20%0A%20%20VALUES%20%3Fitem%20%7B%20%23%3Fitem%20variable%20is%20set%20to%20Qnumber%0A%20%20%20%20wd%3AQ243%0A%20%20%7D%0A%20%20%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP18%20%20%20%3Fimg.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP373%20%20%3FcommonsLink.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP31%20%20%20%3FinstanceOf.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP625%20%20%3FLonLat.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1082%20%3Fpopulation.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2044%20%3Felevation.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2046%20%3Farea.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP856%20%20%3FofficialWebsite.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP41%20%20%20%3FflagImage.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP94%20%20%20%3FcoatOfArmsImage.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP373%20%20%3FCommonsCategory.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP646%20%20%3FFreebaseIdGoogleSearch.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2671%20%3FGoogleKnowledgeGraphId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP580%20%20%3FstartTime.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP582%20%20%3FendTime.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP571%20%20%3Finception.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP140%20%20%3Freligion.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP793%20%20%3FsignificantEvent.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP51%20%20%20%3Faudio.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1083%20%3FmaximumCapacity.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1174%20%3FvisitorsPerYear.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1435%20%3FheritageDesignation.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2043%20%3Flength.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2049%20%3Fwidth.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2048%20%3Fheight.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP3311%20%3FplanViewImage.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2013%20%3FFacebookId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP3749%20%3FGoogleMapsCustomerId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2003%20%3FInstagramUsername.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1947%20%3FMapillaryId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2002%20%3FTwitterUsername.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP402%20%20%3FOpenStreetMapRelationId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP4173%20%3FInstagramLocationId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1968%20%3FFoursquareVenueId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP345%20%20%3FImdbId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP4264%20%3FLinkedInCompanyId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP3134%20%3FTripAdvisorId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20
    let endpointUrl = 'https://query.wikidata.org/sparql';
    let sparqlQuery = `
        SELECT ?item ?itemLabel ?itemDescription ?img ?commons ?WikipediaLink ?elevation ?area ?officialWebsite ?flagImage ?LonLat ?coatOfArmsImage ?CommonsCategory ?FreebaseIdGoogleSearch ?GoogleKnowledgeGraphId ?startTime ?endTime ?inception ?religion ?significantEvent ?audio ?maximumCapacity ?visitorsPerYear ?heritageDesignationLabel ?length ?width ?height ?planViewImage ?FacebookId ?GoogleMapsCustomerId ?InstagramUsername ?MapillaryId ?TwitterUsername ?OpenStreetMapRelationId ?InstagramLocationId ?FoursquareVenueId ?ImdbId ?LinkedInCompanyId ?TripAdvisorId ?YelpId ?YouTubeChannelId ?phoneNumber ?emailAddress ?subreddit ?GoogleArtsCulturePartnerId ?population ?commonsLink ?instanceOfLabel WHERE {
          VALUES ?item { wd:${infoPanel.qNumber} }
          OPTIONAL { ?item  wdt:P18   ?img. }
          OPTIONAL { ?item  wdt:P373  ?commonsLink. }
          OPTIONAL { ?item  wdt:P31   ?instanceOf. }
          OPTIONAL { ?item  wdt:P625  ?LonLat. }
          OPTIONAL { ?item  wdt:P1082 ?population. }
          OPTIONAL { ?item  wdt:P2044 ?elevation. }
          OPTIONAL { ?item  wdt:P2046 ?area. }
          OPTIONAL { ?item  wdt:P856  ?officialWebsite. }
          OPTIONAL { ?item  wdt:P41   ?flagImage. }
          OPTIONAL { ?item  wdt:P94   ?coatOfArmsImage. }
          OPTIONAL { ?item  wdt:P373  ?CommonsCategory. }
          OPTIONAL { ?item  wdt:P646  ?FreebaseIdGoogleSearch. }
          OPTIONAL { ?item  wdt:P2671 ?GoogleKnowledgeGraphId. }
          OPTIONAL { ?item  wdt:P580  ?startTime. }
          OPTIONAL { ?item  wdt:P582  ?endTime. }
          OPTIONAL { ?item  wdt:P571  ?inception. }
          OPTIONAL { ?item  wdt:P140  ?religion. }
          OPTIONAL { ?item  wdt:P793  ?significantEvent. }
          OPTIONAL { ?item  wdt:P51   ?audio. }
          OPTIONAL { ?item  wdt:P1083 ?maximumCapacity. }
          OPTIONAL { ?item  wdt:P1174 ?visitorsPerYear. }
          OPTIONAL { ?item  wdt:P1435 ?heritageDesignation. }
          OPTIONAL { ?item  wdt:P2043 ?length. }
          OPTIONAL { ?item  wdt:P2049 ?width. }
          OPTIONAL { ?item  wdt:P2048 ?height. }
          OPTIONAL { ?item  wdt:P3311 ?planViewImage. }
          OPTIONAL { ?item  wdt:P2013 ?FacebookId. }
          OPTIONAL { ?item  wdt:P3749 ?GoogleMapsCustomerId. }
          OPTIONAL { ?item  wdt:P2003 ?InstagramUsername. } 
          OPTIONAL { ?item  wdt:P1947 ?MapillaryId. }
          OPTIONAL { ?item  wdt:P2002 ?TwitterUsername. } 
          OPTIONAL { ?item  wdt:P402  ?OpenStreetMapRelationId. }
          OPTIONAL { ?item  wdt:P4173 ?InstagramLocationId. } 
          OPTIONAL { ?item  wdt:P1968 ?FoursquareVenueId. }
          OPTIONAL { ?item  wdt:P345  ?ImdbId. }
          OPTIONAL { ?item  wdt:P4264 ?LinkedInCompanyId. } 
          OPTIONAL { ?item  wdt:P3134 ?TripAdvisorId. } 
          OPTIONAL { ?item  wdt:P3108 ?YelpId. } 
          OPTIONAL { ?item  wdt:P2397 ?YouTubeChannelId. } 
          OPTIONAL { ?item  wdt:P1329 ?phoneNumber. } 
          OPTIONAL { ?item  wdt:P968  ?emailAddress. } 
          OPTIONAL { ?item  wdt:P3984 ?subreddit. } 
          OPTIONAL { ?item  wdt:P4702 ?GoogleArtsCulturePartnerId. }
          OPTIONAL {
            ?WikipediaLink schema:about ?item;
              schema:isPartOf <https://${infoPanel.currentLang || 'en'}.wikipedia.org/>.
          }
          OPTIONAL { SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". } }
          OPTIONAL {
            SERVICE wikibase:label {
              bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en".
              ?item rdfs:label ?itemLabel;
                schema:description ?itemDescription.
            }
          }
        }`;

    fetchWikidataData(endpointUrl, sparqlQuery, function (data) {
        WikidataApiResultsProcessingDetails(data.results.bindings);
    });

    function WikidataApiResultsProcessingDetails(rawResponsData) {
        let data = {}; //raw results come in with a lot of fluf and in repated fashon to account for several values. Here we keep the minimum and put the results in an array if needed.
        {
            for (let row of rawResponsData) { // loop throug resonds sets
                let keys = Object.keys(row); //get all the object's keys
                for (let key of keys) {
                    let value = row[key].value;
                    if (!data[key]) data[key] = [value];
                    else if (!data[key].includes(value)) data[key].push(value);
                }
            }
        }

        {
            let keys = Object.keys(data);
            for (let key of keys) { // value categories
                for (let v in data[key]) { // array of values
                    let value = '';

                    switch (key) { // for every variable there is an other method of enriching.
                        case 'CommonsCategory':
                            value = `https://commons.wikimedia.org/wiki/Category:${encodeURIComponent(data[key][v])}`;
                            break;

                        case 'LonLat':
                            value = data[key][v];
                            value = value.replace('Point(', '');
                            value = value.replace(')', '');
                            value = value.split(' ');
                            value = [Number(value[0]), Number(value[1])];
                            break;

                        case 'TwitterUsername':
                            value = `https://twitter.com/${data[key][v]}`;
                            break;

                        case 'height':
                            value = `${data[key][v]} meters`; break;

                        case 'FreebaseIdGoogleSearch':
                            value = `https://www.google.com/search?kgmid=${encodeURIComponent(data[key][v])}`;
                            break;

                        case 'commonsLink':
                            value = `https://commons.wikimedia.org/wiki/Category:${encodeURIComponent(data[key][v])}`;
                            break;

                        case 'inception':
                            value = data[key][v].split('-');
                            value = value[0];
                            break;

                        case 'length':
                            value = `${data[key][v]} meters`;
                            break;

                        case 'FacebookId':
                            value = `https://www.facebook.com/${encodeURIComponent(data[key][v])}`;
                            break;

                        case 'FoursquareVenueId':
                            value = `https://foursquare.com/v/${encodeURIComponent(data[key][v])}`;
                            break;

                        case 'GoogleMapsCustomerId':
                            value = `https://maps.google.com/?cid=${encodeURIComponent(data[key][v])}`;
                            break;

                        case 'InstagramLocationId':
                            value = `https://www.instagram.com/explore/locations/${encodeURIComponent(data[key][v])}/`;
                            break;

                        case 'InstagramUsername':
                            value = `https://www.instagram.com/${encodeURIComponent(data[key][v])}/`;
                            break;

                        case 'ImdbId':
                            value = `https://wikidata-externalid-url.toolforge.org/?p=345&url_prefix=https://www.imdb.com/&id=${encodeURIComponent(data[key][v])}`;
                            break;

                        case 'LinkedInCompanyId':
                            value = `https://www.linkedin.com/company/${encodeURIComponent(data[key][v])}`;
                            break;

                        case 'MapillaryId':
                            value = `https://www.mapillary.com/map/im/${encodeURIComponent(data[key][v])}`;
                            break;

                        case 'TripAdvisorId':
                            value = `https://www.tripadvisor.com/${encodeURIComponent(data[key][v])}`;
                            break;

                        case 'YelpId':
                            value = `https://www.yelp.com/biz/${data[key][v]}`;
                            break;

                        case 'YouTubeChannelId':
                            value = `https://www.youtube.com/channel/${encodeURIComponent(data[key][v])}`;
                            break;

                        case 'visitorsPerYear':
                            value = `${bigNumberFormatter(data[key][v])} visitors per year`;
                            break;

                        default:
                            value = data[key][v];
                            break;
                    }

                    // save enriched value to final object used to display results to UI
                    infoPanel[`Wikidata_${key}`] = infoPanel[`Wikidata_${key}`] || [];
                    infoPanel[`Wikidata_${key}`].push(value);
                }
            }
            updateInfoPanel(infoPanel);
            if (infoPanel.Wikidata_CommonsCategory != undefined || infoPanel.Wikidata_commonsLink != undefined) {
                // could call Commons API here
            }
        }

    }

    //infoPanel.qNumber
}

function resetInfoPanelVisuals() {
    $('#article-title').text('');
    $('#article-intro').html('');
    $('#article-year').text('').hide();
    $('#articleimage').hide();
    $('#article-image').attr('src', 'img/loading.gif');
    $('#info-lang-badges').hide().empty();

    $('#article-wikidata').parent('.listitem').hide();
    $('#article-wikidata').attr('href', '');
    $('#article-wikipedia').parent('.listitem').hide();
    $('#article-wikipedia').attr('href', '');
    $('#article-wikicommons').parent('.listitem').hide();
    $('#article-wikicommons').attr('href', '');
    $('#article-google-search').parent('.listitem').hide();
    $('#article-google-search').attr('href', '');
    $('#article-google-maps').parent('.listitem').hide();
    $('#article-google-maps').attr('href', '');
    $('#article-google-maps-hint').remove();
    $('#article-official-website').parent('.listitem').hide();
    $('#article-official-website').attr('href', '');
    $('#wikisources').hide();
    $('#sources-list').empty();
}

function updateInfoPanel(data) {
    { // reset all fields
        resetInfoPanelVisuals();
    }

    $('#article-title').text(data.Map_title);
    $('#article-intro').html(data.wikipedia_Intro);

    // year label
    let yearLabel = formatingInseption();
    if (yearLabel) {
        $('#article-year').text(yearLabel);
        $('#article-year').show();
    }

    if (data.wikipedia_ImgUrl != undefined) {
        $('#articleimage').show();
        $('#article-image').attr('src', data.wikipedia_ImgUrl);
        $('#article-image').attr('alt', data.wikipedia_ImgTitle);
    }

    if (data.Wikidata_item != undefined) { // Wikidata
        $('#article-wikidata').attr('href', data.Wikidata_item);
        $('#article-wikidata').parent('.listitem').show();
    }

    if (data.Wikidata_WikipediaLink != undefined) { // Wikipedia
        $('#article-wikipedia').attr('href', data.Wikidata_WikipediaLink);
        $('#article-wikipedia').parent('.listitem').show();
    }

    if (data.Wikidata_CommonsCategory != undefined) { // Wikimedia Commons album
        $('#article-wikicommons').attr('href', data.Wikidata_CommonsCategory);
        $('#article-wikicommons').parent('.listitem').show();
    }

    if (data.Wikidata_FreebaseIdGoogleSearch != undefined) { // Google Search
        $('#article-google-search').attr('href', data.Wikidata_FreebaseIdGoogleSearch);
        $('#article-google-search').parent('.listitem').show();
    }

    let lonlat = data.Map_lonLat || (data.Wikidata_LonLat && data.Wikidata_LonLat[0]);
    $('#article-google-maps-hint').remove();
    if (lonlat && lonlat.length == 2) { // Google Maps based on coordinates
        $('#article-google-maps').attr('href', `https://www.google.com/maps/search/?api=1&query=${lonlat[1]},${lonlat[0]}`);
        $('#article-google-maps').parent('.listitem').show();
        $('#article-google-maps').find('.listitemlabel').text('Google Maps');
        $('<span id="article-google-maps-hint" style="font-size:10px;color:#999;margin-left:4px;">(coordinates)</span>').appendTo($('#article-google-maps').find('.listitemlabel'));
    }

    if (data.Wikidata_GoogleMapsCustomerId != undefined) { // Google Maps based on Google Maps ID (overwrites coordinates)
        $('#article-google-maps').attr('href', data.Wikidata_GoogleMapsCustomerId);
        $('#article-google-maps').parent('.listitem').show();
        $('#article-google-maps-hint').remove();
        $('#article-google-maps').find('.listitemlabel').text('Google Maps');
    }

    if (data.Wikidata_officialWebsite != undefined) { // Google Maps
        $('#article-official-website').attr('href', data.Wikidata_officialWebsite);
        $('#article-official-website').parent('.listitem').show();
    }

    // Render sources from Wikipedia
    if (data.wikipedia_ExtLinks && data.wikipedia_ExtLinks.length > 0) {
        let filtered = filterExtLinks(data.wikipedia_ExtLinks);
        if (filtered.length > 0) {
            let listHtml = filtered.map(function (url) {
                return `<li><a href="${url}" target="_blank" rel="noopener">${formatExtLink(url)}</a></li>`;
            }).join('');
            $('#sources-list').html(listHtml);
            $('#wikisources').show();
        }
    }

    function formatingInseption() { return data.Wikidata_inception != undefined ? `From  ${data.Wikidata_inception}` : undefined; }

    // Render info panel language badges
    if (data._langs && typeof renderInfoPanelLangBadges === 'function') {
        renderInfoPanelLangBadges(data._langs, data.currentLang);
    }

    showInfopanel(); // function from buttons.js
}

function bigNumberFormatter(num) { return num >= 1000000 ? `${(num / 1000000).toFixed(0)} M` : num >= 1000 ? `${(num / 1000).toFixed(0)} k` : num; }

function formatExtLink(url) {
    try {
        let parsed = new URL(url);
        let domain = parsed.hostname.replace(/^www\./, '');
        let path = parsed.pathname + parsed.search;
        if (path === '/') path = '';
        if (path.length > 40) path = path.substring(0, 40) + '…';
        return `<strong>${domain}</strong>${path}`;
    } catch (e) {
        return url;
    }
}

const FILTERED_DOMAINS = [
    'web.archive.org', 'archive.org', 'ghostarchive.org',
    'books.google.com', 'news.google.com',
    'viaf.org', 'catalogue.bnf.fr', 'd-nb.info', 'id.loc.gov',
    'musicbrainz.org', 'isni.org', 'worldcat.org',
    'geohack.toolforge.org', 'doi.org'
];

function filterExtLinks(urls) {
    let seen = new Set();
    return urls.filter(function (url) {
        if (seen.has(url)) return false;
        seen.add(url);
        try {
            let hostname = new URL(url).hostname;
            return !FILTERED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
        } catch (e) {
            return true;
        }
    });
}



function updateWelcomeDivBackground() {
    const landingPageBackgroundUrls = [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Vintage_car_meets_world_heritage_site.jpg/2560px-Vintage_car_meets_world_heritage_site.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/L%27Umbracle%2C_Valencia%2C_Spain_-_Jan_2007.jpg/2560px-L%27Umbracle%2C_Valencia%2C_Spain_-_Jan_2007.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Mont_Blanc_from_Les_Arcs_1950.jpg/2560px-Mont_Blanc_from_Les_Arcs_1950.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Ana_rosa_metro_station%2C_S%C3%A3o_Paulo%2C_Brazil.jpg/2560px-Ana_rosa_metro_station%2C_S%C3%A3o_Paulo%2C_Brazil.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Esztergom_by_night_01_-_Simor_J%C3%A1nos_utca.jpg/2560px-Esztergom_by_night_01_-_Simor_J%C3%A1nos_utca.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Edinburgh_Castle_from_Grass_Market.jpg/2560px-Edinburgh_Castle_from_Grass_Market.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Catedral_de_Salzburgo%2C_Salzburgo%2C_Austria%2C_2019-05-19%2C_DD_30-32_HDR.jpg/2560px-Catedral_de_Salzburgo%2C_Salzburgo%2C_Austria%2C_2019-05-19%2C_DD_30-32_HDR.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Neues_Rathaus_Hannover%2C_Innenansicht.jpg/2560px-Neues_Rathaus_Hannover%2C_Innenansicht.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Katharinenkirche%2C_Mellenbach%2C_2022-05-27.jpg/2560px-Katharinenkirche%2C_Mellenbach%2C_2022-05-27.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Mariakerk_%28Wierum%29_10-07-2023._%28d.j.b%29_04.jpg/2560px-Mariakerk_%28Wierum%29_10-07-2023._%28d.j.b%29_04.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Canary_Wharf_from_Limehouse_London_June_2016_HDR.jpg/2560px-Canary_Wharf_from_Limehouse_London_June_2016_HDR.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Schloss_Sigmaringen_2022.jpg/2560px-Schloss_Sigmaringen_2022.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Casa_hist%C3%B3rica_de_Boroujerdi%2C_Kashan%2C_Ir%C3%A1n%2C_2016-09-19%2C_DD_32.jpg/2560px-Casa_hist%C3%B3rica_de_Boroujerdi%2C_Kashan%2C_Ir%C3%A1n%2C_2016-09-19%2C_DD_32.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/D%C3%BClmen%2C_Kirchspiel%2C_St.-Jakobus-Kirche%2C_Chor_und_Altar_--_2022_--_4184-8.jpg/2560px-D%C3%BClmen%2C_Kirchspiel%2C_St.-Jakobus-Kirche%2C_Chor_und_Altar_--_2022_--_4184-8.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Ratusz_w_Kolobrzegu.jpg/2560px-Ratusz_w_Kolobrzegu.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Keylong_West_Lahaul_Himachal_Oct22_A7C_03375_panorama.jpg/2560px-Keylong_West_Lahaul_Himachal_Oct22_A7C_03375_panorama.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Mekong_bank_with_stilt_dwellings_and_clouds_at_golden_hour_in_Don_Det_Laos.jpg/2560px-Mekong_bank_with_stilt_dwellings_and_clouds_at_golden_hour_in_Don_Det_Laos.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Puente_de_Don_Luis_I%2C_Oporto%2C_Portugal%2C_2019-06-02%2C_DD_29-31_HDR.jpg/2560px-Puente_de_Don_Luis_I%2C_Oporto%2C_Portugal%2C_2019-06-02%2C_DD_29-31_HDR.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/%EC%97%AC%EC%A3%BC_%EC%98%81%EB%A6%89%EA%B3%BC_%EC%98%81%EB%A6%89_%EC%84%B8%EC%A2%85_%EC%98%81%EB%A6%89_%EC%9E%AC%EC%8B%A4.jpg/2560px-%EC%97%AC%EC%A3%BC_%EC%98%81%EB%A6%89%EA%B3%BC_%EC%98%81%EB%A6%89_%EC%84%B8%EC%A2%85_%EC%98%81%EB%A6%89_%EC%9E%AC%EC%8B%A4.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/160322-066_View_from_Thiri.jpg/2560px-160322-066_View_from_Thiri.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Abbotsford_House_Study_Room.jpg/2560px-Abbotsford_House_Study_Room.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Himalayas%2C_Cholatse%2C_Nepal.jpg/2560px-Himalayas%2C_Cholatse%2C_Nepal.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Guarda-corpo_da_Avenida_Portugal_-_Rio_de_Janeiro_-_20220923024517.jpg/2560px-Guarda-corpo_da_Avenida_Portugal_-_Rio_de_Janeiro_-_20220923024517.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/D%C3%B6rzbach_-_Hohebach_-_J%C3%BCdischer_Friedhof_-_Ansicht_1.jpg/2560px-D%C3%B6rzbach_-_Hohebach_-_J%C3%BCdischer_Friedhof_-_Ansicht_1.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Town_hall_of_Leuven_%287%29.jpg/2390px-Town_hall_of_Leuven_%287%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Everest%2C_Himalayas.jpg/2560px-Everest%2C_Himalayas.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Rottenburg_a.N._-_Wurmlingen_-_Kapellenberg_-_Ansicht_von_OSO_im_April_mit_Gegenlicht.jpg/2560px-Rottenburg_a.N._-_Wurmlingen_-_Kapellenberg_-_Ansicht_von_OSO_im_April_mit_Gegenlicht.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Church_of_St._John_at_Kaneo_6.jpg/2560px-Church_of_St._John_at_Kaneo_6.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Hohenloher_Freilandmuseum_-_Baugruppe_Hohenloher_Dorf_-_Bauerngarten_-_Ansicht_von_Osten_im_Juni.jpg/2560px-Hohenloher_Freilandmuseum_-_Baugruppe_Hohenloher_Dorf_-_Bauerngarten_-_Ansicht_von_Osten_im_Juni.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/CargoNet_185_Vindeln_-_Tv%C3%A4r%C3%A5lund.jpg/2560px-CargoNet_185_Vindeln_-_Tv%C3%A4r%C3%A5lund.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Rani_ki_vav_-_Patan_-_Gujarat_-_Wall_Decorations.jpg/2560px-Rani_ki_vav_-_Patan_-_Gujarat_-_Wall_Decorations.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/TR_Yedig%C3%B6ller_asv2021-10_img16.jpg/2560px-TR_Yedig%C3%B6ller_asv2021-10_img16.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Kungstr%C3%A4dg%C3%A5rden_Metro_station_May_2014_08.jpg/2560px-Kungstr%C3%A4dg%C3%A5rden_Metro_station_May_2014_08.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Ch%C3%A2teau_de_Val%C3%A8re_et_Haut_de_Cry_-_juillet_2022.jpg/2560px-Ch%C3%A2teau_de_Val%C3%A8re_et_Haut_de_Cry_-_juillet_2022.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Iglesia_parroquial%2C_Geiranger%2C_Noruega%2C_2019-09-07%2C_DD_84-97_PAN.jpg/2560px-Iglesia_parroquial%2C_Geiranger%2C_Noruega%2C_2019-09-07%2C_DD_84-97_PAN.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Sydney_%28AU%29%2C_Darling_Harbour_--_2019_--_3193-5.jpg/2560px-Sydney_%28AU%29%2C_Darling_Harbour_--_2019_--_3193-5.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/E-burg_asv2019-05_img54_Chkalovskaya_metro_station.jpg/2560px-E-burg_asv2019-05_img54_Chkalovskaya_metro_station.jpg"
    ]
    const randomUrl = landingPageBackgroundUrls[Math.floor(Math.random() * landingPageBackgroundUrls.length)];
    const element = document.querySelector('.WelcomeDiv');
    if (element) { element.style.backgroundImage = `url("${randomUrl}")`; }
}
updateWelcomeDivBackground();