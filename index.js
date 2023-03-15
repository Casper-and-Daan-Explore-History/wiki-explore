/* eslint-disable no-undef */

let wikipediaGeojson = {
    'type': 'FeatureCollection',
    'features': [
        //     {
        //     "type": "Feature",
        //     "properties": {},
        //     "geometry": {
        //         "type": "Point",
        //         "coordinates": [0, 0]
        //     }
        // }
    ]
};

let mapIsActive = false;

let ajaxQueue = new Array();

let detailsPannelData = {
    'wikipedia_ApiOngoing': false, // current status of API resquest
    'wikimedia_ApiOngoing': false, // current status of API resquest
    'wikidata_ApiOngoing': false, // current status of API resquest
    'wikipedia_QueryDone': false, // Data collection status
    'wikimedia_QueryDone': false, // Data collection status
    'wikidata_QueryDone': false // Data collection status
};

// get a random city from the cities array
let randCityNumber = Math.floor(Math.random() * cities.length); // cities letiable is comming from a different js file.
const startingLocation = cities[randCityNumber]; // cities letiable is comming from a different js file.

mapboxgl.accessToken = 'pk.eyJ1IjoiY2Fza2VzIiwiYSI6ImNsZGtwdGRrdzA4dWMzb3BoMWdxM3Zib2UifQ.2q2xfShG5nmDHTxg7n_ZhQ';
let map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/caskes/cldkq0ha9000r01n3hjgwtkrn', // stylesheet location
    center: startingLocation.cord, // starting position [lng, lat]
    zoom: 15,
    hash: true
});

// document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

// Zoom and rotation constroles.
map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

// Fullscreen constroles.
map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');

// eslint-disable-next-line no-unused-vars
function newRandomLocation() {
    map.flyTo({ center: startingLocation });
}

$('.startButton').click(
    hideWelcomCoverPage()
);
// $("#coverContainer").click(
//     hideWelcomCoverPage
// );

function hideWelcomCoverPage() {
    $('.WelcomeDiv').toggleClass('transparent');
    $('#coverContainer').toggleClass('transparent');

    setTimeout(function () {
        $('.WelcomeDiv').hide();
        $('#coverContainer').hide();
    }, 500);
}

//Create a popup to display when hovering over a marker.
let hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: true
});

//Create a popup to display when clicking on a marker.
let listPopup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true
});

map.on('load', function () {
    mapIsActive = true;

    // adding geocoer search box one welkom screen
    let geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl
    });
    document.getElementById('geocoderWelcome').appendChild(geocoder.onAdd(map));

    //adding geocoder
    let geocoder2 = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl
    });
    document.getElementById('geocoderMap').appendChild(geocoder2.onAdd(map));

    map.addSource('wikipediaSource', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': []
        },
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 16
    });

    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'wikipediaSource',
        // filter: ['!', ['has', 'point_count']],
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

    // inspect a cluster on click
    map.on('click', 'clusters', function (e) {
        let features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']
        });
        let clusterId = features[0].properties.cluster_id;
        map.getSource('wikipediaSource').getClusterExpansionZoom(
            clusterId,
            function (err, zoom) {
                if (err) return;

                map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            }
        );
    });

    // hover popup Wikipedia Layer
    map.on('mousemove', 'unclustered-point', hoverPopupOn);
    map.on('mouseleave', 'unclustered-point', hoverPopupOff);
    map.on('mousemove', 'cluster-count', hoverPopupOn);
    map.on('mouseleave', 'cluster-count', hoverPopupOff);

    map.on('mouseenter', 'clusters', function () {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'clusters', function () {
        map.getCanvas().style.cursor = '';
    });

    map.on('contextmenu', 'clusters', function (e) {

        let features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        let clusterId = features[0].properties.cluster_id,
            point_count = features[0].properties.point_count,
            clusterSource = map.getSource( /* cluster layer data source id */ 'wikipediaSource');

        // Get all points under a cluster
        clusterSource.getClusterLeaves(clusterId, point_count, 0, function (err, aFeatures) {
            let e = {};
            e.features = aFeatures;

            openPopupListBelowClick(e);
        });

        // openPopupListBelowClick(e);
    });

    // click
    map.on('click', function () {
        // hideInfopanel()
    });

    map.on('click', 'unclustered-point', popupOpen);
    map.on('click', 'cluster-count', popupOpen);

    // Map panning ends
    map.on('moveend', function () {
        wikipediaApiGeoRequest();
    });
});
function hoverPopupOn(e) {
    let html = '';
    if (e.features.length == 1) { // one article
        if (e.features[0].properties.title != undefined) {
            let articleTitle = e.features[0].properties.title; // getting article title
            html = '<ul class="articleDropdown"><li id="">' + articleTitle + '</li></ul>'; // generate html for one article using artile title
        } else {
            html = '<ul class="articleDropdown"><li id="">Click to zoom</li></ul>'; // generate html for one article using artile title
        }
    } else if (e.features.length > 1) { // mor than one article
        html = '<ul class="articleDropdown"><li id="">' + e.features.length + ' articles.' + '</li></ul>'; // generating html for  more than one article uusing the number of articles as a title.
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

function hoverPopupOff() {
    map.getCanvas().style.cursor = '';
    hoverPopup.remove();
}

function popupOpen(e) {
    if (e.features.length > 1) {
        openPopupListBelowClick(e);
        return;
    } else if (e.features[0].properties.cluster) {
        //zoom

        map.flyTo({
            zoom: map.getZoom() + 1,
            center: e.features[0].geometry.coordinates.slice(),
            speed: 0.85,
            // this animation is considered essential with respect to prefers-reduced-motion
            essential: true
        });

    } else {
        openDetailPannel(e.features[0].properties); //Starts API calls
    }
}

function openPopupListBelowClick(e) {
    const listData = e.features;
    const html = `
    <ul class="articleDropdown">
        ${listData.map((feature, index) => `
        <li data-list-nbr="${index}">
            ${feature.properties.title}
        </li>
        `).join('')}
    </ul>
    `; // generate html for list of articles

    listPopup// initiate list popup
        .setLngLat(e.features[0].geometry.coordinates.slice())
        .setHTML(html)
        .addTo(map);

    // bind click events to list elements
    document.querySelectorAll('.articleDropdown li').forEach((item) => {
        item.addEventListener('click', function () {
            let listNbr = $(this).attr('data-list-nbr');
            listNbr = Number(listNbr);
            openDetailPannel(listData[listNbr].properties);
            listPopup.remove();
        });
    });

    // hide standard Mapbox popup CSS
    document.querySelectorAll('.mapboxgl-popup-content').forEach((item) => {
        item.style.background = 'transparent';
        item.style.padding = '0';
    });
}

wikipediaApiGeoRequest(); // initial first API call to get articles in the map view

function wikipediaApiGeoRequest() {
    const bounds = map.getBounds();
    const boundsArray = [
        bounds['_ne'].lat,
        bounds['_sw'].lng,
        bounds['_sw'].lat,
        bounds['_ne'].lng
    ];

    const requestURL = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=geosearch&origin=*&utf8=1&gsbbox=${boundsArray.join('|')}&gslimit=500&gsprimary=all`;
    console.log('Searching articles');
    ajaxQueue.push(fetch(requestURL)
        .then(response => response.json())
        .then(data => parseJSONResponse(data)));
}

function parseJSONResponse(jsonData) {
    console.log('Found ' + jsonData.query.geosearch.length + ' articles');
    $.each(jsonData.query.geosearch, function (index, value) {
        let article = {
            'pageId': value.pageid,
            'title': value.title,
            'lonLat': [value.lon, value.lat]
        };

        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            article.url = 'https://en.m.wikipedia.org/?curid=' + value.pageid;
        } else {
            article.url = 'https://en.wikipedia.org/?curid=' + value.pageid;
        }

        addWikipediaPageToGeojson(article);
    });
    updateWikipediaGeojsonSource();
}

function addWikipediaPageToGeojson(article) { // add article to geojson
    if (isArticleNotInGeojson(article)) { // check if article is already in geojson
        let feature = {
            'type': 'Feature',
            'properties': article,
            'geometry': {
                'type': 'Point',
                'coordinates': article.lonLat
            }
        };
        wikipediaGeojson.features.push(feature);
    }
}

function isArticleNotInGeojson(article) {
    for (const feature of wikipediaGeojson.features) {
        if (feature.properties.pageId === article.pageId) {
            return false;
        }
    }
    return true;
}

function updateWikipediaGeojsonSource() {
    if (mapIsActive) {
        map.getSource('wikipediaSource').setData(wikipediaGeojson);
        $('#loadingBox').hide();
    } else {
        map.on('load', function () {
            map.getSource('wikipediaSource').setData(wikipediaGeojson);
            $('#loadingBox').hide();
        });
    }
}

function openDetailPannel(selectionInfo) {
    //console.log("This is selected:");
    //console.log(selectionInfo);
    detailsPannelData = { // reset data
        'wikipedia_ApiOngoing': false, // current status of API resquest
        'wikimedia_ApiOngoing': false, // current status of API resquest
        'wikidata_ApiOngoing': false, // current status of API resquest
        'wikipedia_QueryDone': false, // Data collection status
        'wikimedia_QueryDone': false, // Data collection status
        'wikidata_QueryDone': false // Data collection status
    };

    detailsPannelData.Map_title = selectionInfo.title; // title
    detailsPannelData.wikipediaID = selectionInfo.pageId; // pageId
    detailsPannelData.Map_lonLat = JSON.parse(selectionInfo.lonLat); // "lonLat": [value.lon, value.lat]

    WikipediaApiRequestDetails(detailsPannelData.wikipediaID);
}

function WikipediaApiRequestDetails(pageID) {
    detailsPannelData.wikipedia_ApiOngoing = true;
    requestURL = 'https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&prop=extracts%7Cpageprops%7Cpageimages%7Ccategories&pageids=' + pageID + '&utf8=1&formatversion=latest&exintro=1';
    // API sandox link: https://en.wikipedia.org/wiki/Special:ApiSandbox#action=query&format=json&origin=*&prop=extracts%7Cpageprops%7Cpageimages%7Ccategories&pageids=58387057&utf8=1&formatversion=latest&exintro=1
    ajaxQueue.push($.getJSON(requestURL, function (data) {
        parseWikipediaApiResponseDetails(data);
    }));
}

function parseWikipediaApiResponseDetails(jsonData) {
    let wikipediaApiRespons = jsonData.query.pages[0];

    detailsPannelData.wikipedia_Intro = wikipediaApiRespons.extract;
    detailsPannelData.wikipedia_ImgTitle = wikipediaApiRespons.pageimage;
    detailsPannelData.Qnumber = wikipediaApiRespons.pageprops.wikibase_item;
    if (wikipediaApiRespons.pageimage != undefined) {
        detailsPannelData.wikipedia_ImgUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${wikipediaApiRespons.pageimage}?width=800`;
    }
    detailsPannelData.wikipedia_Categories = [];

    for (i in wikipediaApiRespons.categories) {
        detailsPannelData.wikipedia_Categories.push(wikipediaApiRespons.categories[i].title); // adding all wikipediaApiRespons cathegories.
    }

    detailsPannelData.wikipedia_ApiOngoing = false; // change status to no API call ongoing.
    //console.log(detailsPannelData);

    // If new Qnumber, and no data jet, then get Wikidata data:
    if (!detailsPannelData.wikidata_ApiOngoing && !detailsPannelData.wikidata_QueryDone && detailsPannelData.Qnumber != undefined) {
        //console.log("should call Wikidata API");
        WikidataApiRequestDetails();
    }

    updateDetailsPannel(detailsPannelData);
}

function WikidataApiRequestDetails() {
    function makeSPARQLQuery(endpointUrl, sparqlQuery, doneCallback) {
        var settings = {
            headers: { Accept: 'application/sparql-results+json' },
            data: { query: sparqlQuery }
        };
        return $.ajax(endpointUrl, settings).then(doneCallback);
    }

    //https://query.wikidata.org/#SELECT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20%3Fimg%20%3Fcommons%20%3FWikipediaLink%20%3Felevation%20%3Farea%20%3FofficialWebsite%20%3FflagImage%20%3FLonLat%20%3FcoatOfArmsImage%20%3FCommonsCategory%20%3FFreebaseIdGoogleSearch%20%3FGoogleKnowledgeGraphId%20%3FstartTime%20%3FendTime%20%3Finception%20%3Freligion%20%3FsignificantEvent%20%3Faudio%20%3FmaximumCapacity%20%3FvisitorsPerYear%20%3FheritageDesignationLabel%20%3Flength%20%3Fwidth%20%3Fheight%20%3FplanViewImage%20%3FFacebookId%20%3FGoogleMapsCustomerId%20%3FInstagramUsername%20%3FMapillaryId%20%3FTwitterUsername%20%3FOpenStreetMapRelationId%20%3FInstagramLocationId%20%3FFoursquareVenueId%20%3FImdbId%20%3FLinkedInCompanyId%20%3FTripAdvisorId%20%3FYelpId%20%3FYouTubeChannelId%20%3FphoneNumber%20%3FemailAddress%20%3Fsubreddit%20%3FGoogleArtsCulturePartnerId%20%3Fpopulation%20%3FcommonsLink%20%3FinstanceOfLabel%20WHERE%20%7B%0A%0A%20%20%23%20https%3A%2F%2Fwww.wikidata.org%2Fwiki%2FQ2981%20Notre%20Dam%20of%20Paris%0A%20%20%23%20https%3A%2F%2Fwww.wikidata.org%2Fwiki%2FQ243%20Toure%20Eiffel%0A%20%20%20%20%0A%20%20VALUES%20%3Fitem%20%7B%20%23%3Fitem%20variable%20is%20set%20to%20Qnumber%0A%20%20%20%20wd%3AQ243%0A%20%20%7D%0A%20%20%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP18%20%20%20%3Fimg.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP373%20%20%3FcommonsLink.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP31%20%20%20%3FinstanceOf.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP625%20%20%3FLonLat.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1082%20%3Fpopulation.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2044%20%3Felevation.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2046%20%3Farea.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP856%20%20%3FofficialWebsite.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP41%20%20%20%3FflagImage.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP94%20%20%20%3FcoatOfArmsImage.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP373%20%20%3FCommonsCategory.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP646%20%20%3FFreebaseIdGoogleSearch.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2671%20%3FGoogleKnowledgeGraphId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP580%20%20%3FstartTime.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP582%20%20%3FendTime.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP571%20%20%3Finception.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP140%20%20%3Freligion.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP793%20%20%3FsignificantEvent.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP51%20%20%20%3Faudio.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1083%20%3FmaximumCapacity.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1174%20%3FvisitorsPerYear.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1435%20%3FheritageDesignation.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2043%20%3Flength.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2049%20%3Fwidth.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2048%20%3Fheight.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP3311%20%3FplanViewImage.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2013%20%3FFacebookId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP3749%20%3FGoogleMapsCustomerId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2003%20%3FInstagramUsername.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1947%20%3FMapillaryId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2002%20%3FTwitterUsername.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP402%20%20%3FOpenStreetMapRelationId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP4173%20%3FInstagramLocationId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1968%20%3FFoursquareVenueId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP345%20%20%3FImdbId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP4264%20%3FLinkedInCompanyId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP3134%20%3FTripAdvisorId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20
    var endpointUrl = 'https://query.wikidata.org/sparql',
        sparqlQuery = 'SELECT ?item ?itemLabel ?itemDescription ?img ?commons ?WikipediaLink ?elevation ?area ?officialWebsite ?flagImage ?LonLat ?coatOfArmsImage ?CommonsCategory ?FreebaseIdGoogleSearch ?GoogleKnowledgeGraphId ?startTime ?endTime ?inception ?religion ?significantEvent ?audio ?maximumCapacity ?visitorsPerYear ?heritageDesignationLabel ?length ?width ?height ?planViewImage ?FacebookId ?GoogleMapsCustomerId ?InstagramUsername ?MapillaryId ?TwitterUsername ?OpenStreetMapRelationId ?InstagramLocationId ?FoursquareVenueId ?ImdbId ?LinkedInCompanyId ?TripAdvisorId ?YelpId ?YouTubeChannelId ?phoneNumber ?emailAddress ?subreddit ?GoogleArtsCulturePartnerId ?population ?commonsLink ?instanceOfLabel WHERE {\n' +
            '\n' +
            '  # https://www.wikidata.org/wiki/Q2981 Notre Dam of Paris\n' +
            '  # https://www.wikidata.org/wiki/Q243 Toure Eiffel\n' +
            '    \n' +
            '  VALUES ?item { #?item variable is set to Qnumber\n' +
            '    wd:' + detailsPannelData.Qnumber + '\n' +
            '  }\n' +
            '  \n' +
            '  OPTIONAL { ?item  wdt:P18   ?img. }\n' +
            '  OPTIONAL { ?item  wdt:P373  ?commonsLink. }\n' +
            '  OPTIONAL { ?item  wdt:P31   ?instanceOf. }\n' +
            '  OPTIONAL { ?item  wdt:P625  ?LonLat. }\n' +
            '  OPTIONAL { ?item  wdt:P1082 ?population. }\n' +
            '  OPTIONAL { ?item  wdt:P2044 ?elevation. }\n' +
            '  OPTIONAL { ?item  wdt:P2046 ?area. }\n' +
            '  OPTIONAL { ?item  wdt:P856  ?officialWebsite. }\n' +
            '  OPTIONAL { ?item  wdt:P41   ?flagImage. }\n' +
            '  OPTIONAL { ?item  wdt:P94   ?coatOfArmsImage. }\n' +
            '  OPTIONAL { ?item  wdt:P373  ?CommonsCategory. }\n' +
            '  OPTIONAL { ?item  wdt:P646  ?FreebaseIdGoogleSearch. }\n' +
            '  OPTIONAL { ?item  wdt:P2671 ?GoogleKnowledgeGraphId. }\n' +
            '  OPTIONAL { ?item  wdt:P580  ?startTime. }\n' +
            '  OPTIONAL { ?item  wdt:P582  ?endTime. }\n' +
            '  OPTIONAL { ?item  wdt:P571  ?inception. }\n' +
            '  OPTIONAL { ?item  wdt:P140  ?religion. }\n' +
            '  OPTIONAL { ?item  wdt:P793  ?significantEvent. }\n' +
            '  OPTIONAL { ?item  wdt:P51   ?audio. }\n' +
            '  OPTIONAL { ?item  wdt:P1083 ?maximumCapacity. }\n' +
            '  OPTIONAL { ?item  wdt:P1174 ?visitorsPerYear. }\n' +
            '  OPTIONAL { ?item  wdt:P1435 ?heritageDesignation. }\n' +
            '  OPTIONAL { ?item  wdt:P2043 ?length. }\n' +
            '  OPTIONAL { ?item  wdt:P2049 ?width. }\n' +
            '  OPTIONAL { ?item  wdt:P2048 ?height. }\n' +
            '  OPTIONAL { ?item  wdt:P3311 ?planViewImage. }\n' +
            '  OPTIONAL { ?item  wdt:P2013 ?FacebookId. }\n' +
            '  OPTIONAL { ?item  wdt:P3749 ?GoogleMapsCustomerId. }\n' +
            '  OPTIONAL { ?item  wdt:P2003 ?InstagramUsername. }\n' + // to be added as a button
            '  OPTIONAL { ?item  wdt:P1947 ?MapillaryId. }\n' +
            '  OPTIONAL { ?item  wdt:P2002 ?TwitterUsername. }\n' + // to be added as a button
            '  OPTIONAL { ?item  wdt:P402  ?OpenStreetMapRelationId. }\n' +
            '  OPTIONAL { ?item  wdt:P4173 ?InstagramLocationId. }\n' + // to be added as a button
            '  OPTIONAL { ?item  wdt:P1968 ?FoursquareVenueId. }\n' +
            '  OPTIONAL { ?item  wdt:P345  ?ImdbId. }\n' +
            '  OPTIONAL { ?item  wdt:P4264 ?LinkedInCompanyId. }\n' + // to be added as a button
            '  OPTIONAL { ?item  wdt:P3134 ?TripAdvisorId. }\n' + // to be added as a button
            '  OPTIONAL { ?item  wdt:P3108 ?YelpId. }\n' + // to be added as a button
            '  OPTIONAL { ?item  wdt:P2397 ?YouTubeChannelId. }\n' + // to be added as a button
            '  OPTIONAL { ?item  wdt:P1329 ?phoneNumber. }\n' + // to be added as a button
            '  OPTIONAL { ?item  wdt:P968  ?emailAddress. }\n' + // to be added as a button
            '  OPTIONAL { ?item  wdt:P3984 ?subreddit. }\n' + // to be added as a button
            '  OPTIONAL { ?item  wdt:P4702 ?GoogleArtsCulturePartnerId. }\n' +
            '  \n' +
            '  OPTIONAL {\n' +
            '    ?WikipediaLink schema:about ?item;\n' +
            '      schema:isPartOf <https://en.wikipedia.org/>.\n' +
            '  }\n' +
            '  OPTIONAL { SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". } }\n' +
            '  OPTIONAL {\n' +
            '    SERVICE wikibase:label {\n' +
            '      bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en".\n' +
            '      ?item rdfs:label ?itemLabel;\n' +
            '        schema:description ?itemDescription.\n' +
            '    }\n' +
            '  }\n' +
            '}';

    makeSPARQLQuery(endpointUrl, sparqlQuery, function (data) {
        $('body').append($('<pre>').text(JSON.stringify(data)));
        //console.log(data.results.bindings);
        WikidataApiResultsProcessingDetails(data.results.bindings);
    });

    function WikidataApiResultsProcessingDetails(data) {
        cleanResults();

        function cleanResults() {
            var gatherdResults = {}; //raw results come in with a lot of fluf and in repated fashon to account for several values. Here we keep the minimum and put the results in an array if needed.

            for (i in data) { // loop throug resonds sets
                var keys = Object.keys(data[i]); //get all the object's keys
                for (k in keys) {
                    if (gatherdResults[keys[k]] === undefined) { //If no value was ever saved for this key(variable name)
                        gatherdResults[keys[k]] = [data[i][keys[k]].value]; // save value in a new array
                    } else {
                        if (jQuery.inArray(data[i][keys[k]].value, gatherdResults[keys[k]]) === -1) // If this value does not exist in array
                            gatherdResults[keys[k]].push(data[i][keys[k]].value); // then add to array
                    }
                }
            }
            //console.log(gatherdResults);
            makeResultsUsefull(gatherdResults);
        }

        function makeResultsUsefull(data) {
            var keys = Object.keys(data);
            console.log(keys);
            console.log(data.img);
            // https://commons.wikimedia.org/wiki/File:P1050763_Louvre_code_Hammurabi_face_rwk-gradient.jpg
            // https://commons.wikimedia.org/wiki/Special:FilePath/P1050763%20Louvre%20code%20Hammurabi%20face%20rwk-gradient.jpg
            // https://commons.wikimedia.org/wiki/Special:FilePath/  Louvre%20chateau%201.jpg
            // https://commons.wikimedia.org/wiki/File:             Louvre%20chateau%201.jpg

            for (k in keys) {
                for (v in data[keys[k]]) {
                    var value = '';

                    switch (keys[k]) { // for every variable there is an other method of enriching.
                    case 'CommonsCategory':
                        value = 'https://commons.wikimedia.org/wiki/Category:' + encodeURIComponent(data[keys[k]][v]);
                        break;

                    case 'LonLat':
                        value = data[keys[k]][v];
                        value = value.replace('Point(', '');
                        value = value.replace(')', '');
                        value = value.split(' ');
                        value = [Number(value[0]), Number(value[1])];
                        // if (value.length == 1) value = value[0];
                        break;

                        // this changes the img url  to the img page
                        // case "img":
                        //     value = data[keys[k]][v];
                        //     value = value.replace(
                        //         "https://commons.wikimedia.org/wiki/Special:FilePath/",
                        //         "https://commons.wikimedia.org/wiki/File:"
                        //     )
                        //     break;

                    case 'TwitterUsername':
                        value = 'https://twitter.com/' + data[keys[k]][v];
                        break;

                    case 'height':
                        value = data[keys[k]][v] + ' meters';
                        break;

                    case 'FreebaseIdGoogleSearch':
                        value = 'https://www.google.com/search?kgmid=' + encodeURIComponent(data[keys[k]][v]);
                        break;

                    case 'commonsLink':
                        value = 'https://commons.wikimedia.org/wiki/Category:' + encodeURIComponent(data[keys[k]][v]);
                        break;

                    case 'inception':
                        value = data[keys[k]][v].split('-');
                        value = value[0];
                        break;

                    case 'length':
                        value = data[keys[k]][v] + ' meters';
                        break;

                    case 'FacebookId':
                        value = 'https://www.facebook.com/' + encodeURIComponent(data[keys[k]][v]);
                        break;

                    case 'FoursquareVenueId':
                        value = 'https://foursquare.com/v/' + encodeURIComponent(data[keys[k]][v]);
                        break;

                    case 'GoogleMapsCustomerId':
                        value = 'https://maps.google.com/?cid=' + encodeURIComponent(data[keys[k]][v]);
                        break;

                    case 'InstagramLocationId':
                        value = 'https://www.instagram.com/explore/locations/' + encodeURIComponent(data[keys[k]][v]) + '/';
                        break;

                    case 'InstagramUsername':
                        value = 'https://www.instagram.com/' + encodeURIComponent(data[keys[k]][v]) + '/';
                        break;

                    case 'ImdbId':
                        value = 'https://wikidata-externalid-url.toolforge.org/?p=345&url_prefix=https://www.imdb.com/&id=' + encodeURIComponent(data[keys[k]][v]);
                        break;

                    case 'LinkedInCompanyId':
                        value = 'https://www.linkedin.com/company/' + encodeURIComponent(data[keys[k]][v]);
                        break;

                    case 'MapillaryId':
                        value = 'https://www.mapillary.com/map/im/' + encodeURIComponent(data[keys[k]][v]);
                        break;

                    case 'TripAdvisorId':
                        value = 'https://www.tripadvisor.com/' + encodeURIComponent(data[keys[k]][v]);
                        break;

                    case 'YelpId':
                        // value = "https://www.yelp.com/biz/" + encodeURIComponent(data[keys[k]][v]);
                        value = 'https://www.yelp.com/biz/' + data[keys[k]][v];
                        break;

                    case 'YouTubeChannelId':
                        value = 'https://www.youtube.com/channel/' + encodeURIComponent(data[keys[k]][v]);
                        break;

                    case 'visitorsPerYear':
                        value = bigNumberFormatter(data[keys[k]][v]) + ' visitors per year';
                        break;

                        // case "":
                        //     break;
                        // case "":
                        //     break;
                        // case "":
                        //     break;
                        // case "":
                        //     break;

                        // value = "" + data[keys[k]][v];
                        // value = "" + encodeURIComponent(data[keys[k]][v]);
                        // value = value.replace(")", "");
                        // value = value.split(" ");

                    default:
                        value = data[keys[k]][v];
                        break;
                    }

                    // save enriched value to final object used to display results to UI
                    if (detailsPannelData['Wikidata_' + keys[k]] === undefined) { // does it exist?
                        detailsPannelData['Wikidata_' + keys[k]] = [value]; // then: replace
                    } else {
                        detailsPannelData['Wikidata_' + keys[k]].push(value); // then: save as new
                    }
                }
            }
            console.log(detailsPannelData);
            // popup.setHTML(popuphtml())
            updateDetailsPannel(detailsPannelData);
            if (!detailsPannelData.wikimedia_ApiOngoing && !detailsPannelData.wikimedia_QueryDone && (detailsPannelData.Wikidata_CommonsCategory != undefined || detailsPannelData.Wikidata_commonsLink != undefined)) {
                console.log('could call Commons API');
                // WikidataApiRequestDetails()
            }
        }

    }

    //detailsPannelData.Qnumber
}

function updateDetailsPannel(data) {
    console.log(data);

    { // reset all fields
        $('#article-title').text('no title');
        $('#article-intro').html('');
        $('#article-year').hide();
        $('#articleimage').hide();
        $('#article-image').attr('src', 'img/kutgif.gif');
        // $('#article-instance-of').html('-');

        $('#article-wikidata').hide();
        $('#article-wikidata').attr('href', '');

        $('#article-wikipedia').hide();
        $('#article-wikipedia').attr('href', '');

        $('#article-wikicommons').hide();
        $('#article-wikicommons').attr('href', '');

        $('#article-google-search').hide();
        $('#article-google-search').attr('href', '');

        $('#article-google-maps').hide();
        $('#article-google-maps').attr('href', '');

        $('#article-official-website').hide();
        $('#article-official-website').attr('href', '');
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

    // $('#article-instance-of').html(formatingInstanceOfList());

    if (data.Wikidata_item != undefined) { // Wikidata
        $('#article-wikidata').attr('href', data.Wikidata_item);
        $('#article-wikidata').show();
    }

    if (data.Wikidata_WikipediaLink != undefined) { // Wikipedia
        $('#article-wikipedia').attr('href', data.Wikidata_WikipediaLink);
        $('#article-wikipedia').show();
    }

    if (data.Wikidata_CommonsCategory != undefined) { // Wikimedia Commons album
        $('#article-wikicommons').attr('href', data.Wikidata_CommonsCategory);
        $('#article-wikicommons').show();
    }

    if (data.Wikidata_FreebaseIdGoogleSearch != undefined) { // Google Search
        $('#article-google-search').attr('href', data.Wikidata_FreebaseIdGoogleSearch);
        $('#article-google-search').show();
    }

    let lonlat = data.Map_lonLat || (data.Wikidata_LonLat && data.Wikidata_LonLat[0]);
    if (lonlat && lonlat.length == 2) { // Google Maps based on coordinates
        $('#article-google-maps').attr('href', `https://www.google.com/maps/search/?api=1&query=${lonlat[1]},${lonlat[0]}`);
        $('#article-google-maps').show();
    }

    if (data.Wikidata_GoogleMapsCustomerId != undefined) { // Google Maps based on Google Maps ID (overwrites coordinates)
        $('#article-google-maps').attr('href', data.Wikidata_GoogleMapsCustomerId);
        $('#article-google-maps').show();
    }

    if (data.Wikidata_officialWebsite != undefined) { // Google Maps
        $('#article-official-website').attr('href', data.Wikidata_officialWebsite);
        $('#article-official-website').show();
    }

    function formatingInseption() { return data.Wikidata_inception != undefined ? `From  ${data.Wikidata_inception}` : undefined; }

    // eslint-disable-next-line no-unused-vars
    function formatingInstanceOfList() {
        let string = '';
        let array = data.Wikidata_instanceOfLabel;
        for (i in array) {
            string += array[i];
            if (i < array.length - 1) {
                string += ', ';
            }
        }
        return string;
    }
    showInfopanel();
}

function bigNumberFormatter(num) { return num >= 1000000 ? (num / 1000000).toFixed(0) + ' M' : num >= 1000 ? (num / 1000).toFixed(0) + ' k' : num; }

// Ideas for future:
// - on map movement queries: wikipedia API, Wikidata query, Wiki commons API (toggle for all 3)
// - plaatje, title, intro, Wikipedia link, Wikidata link, mini discription, (list of related categories: quality?)
// - extra from wikidata's Qnbr: instance of, official website, inception, part of, pronunciation audio, date of official opening, commons ategorie, significant event,
// audio, visitors per year, height, area, Google Maps Customer ID, Insta Location, Mapillary ID, Facebook ID, Freebase ID (Google Search), Instagram username, Twitter username
// - extra from LonLat: Google maps link, Bing maps, WikiShootMe
// - extra form commons: photo album, hi qualit images, image locator tool link
// options: see images arround this location