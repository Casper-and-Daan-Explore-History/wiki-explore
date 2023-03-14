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

let hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: true
});

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
        wikipdiaApiGeoRequest();
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

let clickedListDataGlobalStorage;

function openPopupListBelowClick(e) {
    let listData = e.features; // local save of map data for click events that accure alter.

    let html = '';
    html += '<ul class="articleDropdown">'; //start of list

    for (i in e.features) { // for every list element
        html += '<li ';
        html += 'id="';
        html += e.features[i].properties.title.replace(/[^a-z0-9]/gi, ''); // assign an css #id. make sure the #id is simple clean text
        html += '">';
        html += e.features[i].properties.title; // add title
        html += '</li>';
    }

    html += '</ul>'; // end of lsit

    // initiate list popup
    listPopup
        .setLngLat(e.features[0].geometry.coordinates.slice())
        .setHTML(html)
        .addTo(map);

    clickedListDataGlobalStorage = [];
    for (i in e.features) { // bind click events to list elements
        clickedListDataGlobalStorage[i] = listData[i].properties;

        $('#' + e.features[i].properties.title.replace(/[^a-z0-9]/gi, '')) // use the same formating for the #id
            .attr('data-list-nbr', i)
            .click(function () {
                let listNbr = $(this).attr('data-list-nbr');
                listNbr = Number(listNbr);
                openDetailPannel(clickedListDataGlobalStorage[listNbr]);
                listPopup.remove();
            });
    }

    // hide standard Mapbox popup CSS
    $('.mapboxgl-popup-content').has('.articleDropdown').css({
        'background': 'transparent',
        'padding': '0'
    });
}

wikipdiaApiGeoRequest();

function wikipdiaApiGeoRequest() {
    let cornerCoordinates = map.getBounds();
    let crns = [cornerCoordinates['_ne'].lat, cornerCoordinates['_sw'].lng, cornerCoordinates['_sw'].lat, cornerCoordinates['_ne'].lng];

    requestURL = 'https://en.wikipedia.org/w/api.php?action=query&format=json&list=geosearch&origin=*&utf8=1&gsbbox=' + crns[0] + '|' + crns[1] + '|' + crns[2] + '|' + crns[3] + '&gslimit=500&gsprimary=all';
    console.log('Searching articles');
    ajaxQueue.push($.getJSON(requestURL, function (data) {
        parseJSONResponse(data);
    }));
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
    detailsPannelData.Map_lonLat = selectionInfo.lonLat; // "lonLat": [value.lon, value.lat]

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

    updateDetailsPannel(detailsPannelData);
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

        // $('#article-google-search').hide();
        // $('#article-google-search').attr('href', '');

        $('#article-google-maps').hide();
        $('#article-google-maps').attr('href', '');
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

    if (data.Wikidata_item != undefined) {
        $('#article-wikidata').attr('href', data.Wikidata_item);
        $('#article-wikidata').show();
    }

    if (data.Wikidata_WikipediaLink != undefined) {
        $('#article-wikipedia').attr('href', data.Wikidata_WikipediaLink);
        $('#article-wikipedia').show();
    }

    if (data.Wikidata_CommonsCategory != undefined) {
        $('#article-wikicommons').attr('href', data.Wikidata_CommonsCategory);
        $('#article-wikicommons').show();
    }

    if (data.Wikidata_FreebaseIdGoogleSearch != undefined) {
        $('#article-google-search').attr('href', data.Wikidata_FreebaseIdGoogleSearch);
        $('#article-google-search').show();
    }

    if (data.Wikidata_GoogleMapsCustomerId != undefined) {
        $('#article-google-maps').attr('href', data.Wikidata_GoogleMapsCustomerId);
        $('#article-google-maps').show();
    }

    function formatingInseption() {
        if (data.Wikidata_inception != undefined) {
            return 'From ' + data.Wikidata_inception;
        } else {
            return;
        }
    }

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

// Ideas for future:
// - on map movement queries: wikipedia API, Wikidata query, Wiki commons API (toggle for all 3)
// - plaatje, title, intro, Wikipedia link, Wikidata link, mini discription, (list of related categories: quality?)
// - extra from wikidata's Qnbr: instance of, official website, inception, part of, pronunciation audio, date of official opening, commons ategorie, significant event,
// audio, visitors per year, height, area, Google Maps Customer ID, Insta Location, Mapillary ID, Facebook ID, Freebase ID (Google Search), Instagram username, Twitter username
// - extra from LonLat: Google maps link, Bing maps, WikiShootMe
// - extra form commons: photo album, hi qualit images, image locator tool link
// options: see images arround this location