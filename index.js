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

let ResultsObject = {};
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
    runQuery();

    setTimeout(function() {
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

map.on('load', function() {
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
    map.on('click', 'clusters', function(e) {
        let features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']
        });
        let clusterId = features[0].properties.cluster_id;
        map.getSource('wikipediaSource').getClusterExpansionZoom(
            clusterId,
            function(err, zoom) {
                if (err) return;

                map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            }
        );
    });

    // When a click event occurs on a feature in
    // the unclustered-point layer, open a popup at
    // the location of the feature, with
    // description HTML from its properties.
    // map.on('click', 'unclustered-point', function (e) {
    // let coordinates = e.features[0].geometry.coordinates.slice();

    // // Ensure that if the map is zoomed out such that
    // // multiple copies of the feature are visible, the
    // // popup appears over the copy being pointed to.
    // while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    // coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    // }
    // });

    map.on('mouseenter', 'clusters', function() {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'clusters', function() {
        map.getCanvas().style.cursor = '';
    });

    map.on('contextmenu', 'clusters', function(e) {

        let features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        let clusterId = features[0].properties.cluster_id,
            point_count = features[0].properties.point_count,
            clusterSource = map.getSource( /* cluster layer data source id */ 'wikipediaSource');

        // Get all points under a cluster
        clusterSource.getClusterLeaves(clusterId, point_count, 0, function(err, aFeatures) {
            let e = {};
            e.features = aFeatures;

            openPopupListBelowClick(e);
        });

        // openPopupListBelowClick(e);
    });

    // hover popup QnumberLayer
    map.on('mousemove', 'QnbrLayerIcon', function(e) {
        let hoverdQID = e.features[0].properties.Qnbr;
        if (ResultsObject[hoverdQID].imgthum != undefined) {
            let html = '<img src="' + ResultsObject[hoverdQID].imgthum + '" alt="' + ResultsObject[hoverdQID].label + '" class="popupImg">';
            hoverPopup
                .setLngLat(e.lngLat)
                .setHTML(html)
                .addTo(map);

            map.getCanvas().style.cursor = 'pointer';
        }
        // console.log(e);
    });
    map.on('mouseleave', 'QnbrLayerIcon', function() {
        map.getCanvas().style.cursor = '';
        hoverPopup.remove();
    });

    // click
    map.on('click', function() {
        // hideInfopanel()
    });

    map.on('click', 'unclustered-point', popupOpen);
    map.on('click', 'cluster-count', popupOpen);

    // Map panning ends
    map.on('moveend', function() {
        // runQuery();
        wikipdiaApiGeoRequest();
    });
});

function popupOpen(e) {
    //console.log(e.features)
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
    //console.log("list")
    //console.log(e)

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
            .click(function() {
                let listNbr = $(this).attr('data-list-nbr');
                listNbr = Number(listNbr);
                //console.log("List data binded to butons");
                //console.log(clickedListDataGlobalStorage[listNbr]);
                //console.log(clickedListDataGlobalStorage[listNbr]);
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

// runQuery();
function runQuery() {
    // let canvas = map.getCanvas()
    // let w = canvas.width
    // let h = canvas.height
    // let cUL = map.unproject([0, 0]).toArray()
    // let cLR = map.unproject([w, h]).toArray()

    // // the function that process the query
    // function makeSPARQLQuery(endpointUrl, sparqlQuery, doneCallback) {
    //     let settings = {
    //         headers: { Accept: 'application/sparql-results+json' },
    //         data: { query: sparqlQuery }
    //     };
    //     return $.ajax(endpointUrl, settings).then(doneCallback);
    // }

    // let endpointUrl = 'https://query.wikidata.org/sparql',
    //     sparqlQuery = "#defaultView:ImageGride\n" +
    //         "SELECT\n" +
    //         "  ?item ?itemLabel ?itemDescription\n" +
    //         "  ?geo ?img ?categorie ?wikiMediaCategory\n" +
    //         "  (GROUP_CONCAT(?instanceLabel; SEPARATOR = \", \") AS ?instancesof) # a nices String with the labels of the different instances of related to the item\n" +
    //         "WITH\n" +
    //         "{\n" +
    //         "  SELECT \n" +
    //         "    ?item \n" +
    //         "    (SAMPLE(?geo_) AS ?geo) # The SAMPLE code is needed to inform the GROUP BY code what to do when there are more than one.\n" +
    //         "    (SAMPLE(?img_) AS ?img)\n" +
    //         "  WHERE\n" +
    //         "  {\n" +
    //         "    #### Selection based on location ####   \n" +
    //         "    SERVICE wikibase:box\n" +
    //         "    {\n" +
    //         "      ?item wdt:P625 ?geo_.\n" +
    //         "      bd:serviceParam wikibase:cornerWest \"Point(" + cUL[0] + " " + cUL[1] + ")\"^^geo:wktLiteral. \n" +
    //         "      bd:serviceParam wikibase:cornerEast \"Point(" + cLR[0] + " " + cLR[1] + ")\"^^geo:wktLiteral.\n" +
    //         "    }\n" +
    //         "\n" +
    //         "    MINUS { ?item (wdt:P31/(wdt:P279*)) wd:Q376799. } # Remove everything related to roads\n" +
    //         "    ?item wdt:P18 ?img_. # Only keep items with pictures\n" +
    //         "  }\n" +
    //         "  GROUP BY ?item\n" +
    //         "} AS %get_items\n" +
    //         "WHERE\n" +
    //         "{\n" +
    //         "  INCLUDE %get_items\n" +
    //         "\n" +
    //         "  #### Categorise items ####\n" +
    //         "  BIND(\n" +
    //         "    IF(EXISTS {?item (wdt:P31/(wdt:P279*)) wd:Q811979},\n" +
    //         "       \"Architectural\",\n" +
    //         "       IF(EXISTS {?item (wdt:P31/(wdt:P279*)) wd:Q1656682},\n" +
    //         "          \"Event\",\n" +
    //         "          \"Other\"\n" +
    //         "         )\n" +
    //         "      )\n" +
    //         "  AS ?categorie)\n" +
    //         "  \n" +
    //         "  OPTIONAL { ?item wdt:P31 ?instance. } # Get instances\n" +
    //         "   \n" +
    //         "  OPTIONAL { ?item wdt:P373 ?wikiMediaCategory. }\n" +
    //         "   \n" +
    //         "  #### Wikipedia link ####\n" +
    //         "  OPTIONAL {\n" +
    //         "    ?article schema:about ?item . # Get wikipedia link\n" +
    //         "    ?article schema:isPartOf <https://en.wikipedia.org/>. # Only keep EN language\n" +
    //         "  }\n" +
    //         "  \n" +
    //         "  #### Labels & discription #### \n" +
    //         "  SERVICE wikibase:label { # Get labels\n" +
    //         "    bd:serviceParam wikibase:language \"en\". \n" +
    //         "    ?instance rdfs:label ?instanceLabel.      # The specification of the letiables to be labeld is needed for grouping the instances of correctly\n" +
    //         "    ?item rdfs:label ?itemLabel.\n" +
    //         "    ?item schema:description ?itemDescription.\n" +
    //         "  }\n" +
    //         "}\n" +
    //         "GROUP BY ?item ?itemLabel ?itemDescription ?geo ?img ?categorie ?article ?wikiMediaCategory";

    // makeSPARQLQuery(endpointUrl, sparqlQuery, function (data) {
    //     // $( 'body' ).append( $( '<pre>' ).text( JSON.stringify( data ) ) );
    //     // console.log( data );
    //     processQueryResults(data);
    // }
    // );
}

wikipdiaApiGeoRequest();

function wikipdiaApiGeoRequest() {
    let canvas = map.getCanvas();
    let w = canvas.width;
    let h = canvas.height;
    let cUL = map.unproject([0, 0]).toArray();
    let cLR = map.unproject([w, h]).toArray();

    let cornerCoordinates = map.getBounds();
    let crns = [cornerCoordinates['_ne'].lat, cornerCoordinates['_sw'].lng, cornerCoordinates['_sw'].lat, cornerCoordinates['_ne'].lng];
    console.log(cornerCoordinates['_ne'].lat);
    console.log(cornerCoordinates['_sw'].lng);
    console.log(cornerCoordinates['_sw'].lat);
    console.log(cornerCoordinates['_ne'].lng);

    console.log(cUL[1]);
    console.log(cUL[0]);
    console.log(cLR[1]);
    console.log(cLR[0]);

    requestURL = 'https://en.wikipedia.org/w/api.php?action=query&format=json&list=geosearch&origin=*&utf8=1&gsbbox=' + crns[0] + '|' + crns[1] + '|' + crns[2] + '|' + crns[3] + '&gslimit=500&gsprimary=all';
    // console.log('Request is for ' + requestURL);
    console.log('Request sent');
    ajaxQueue.push($.getJSON(requestURL, function(data) {
        parseJSONResponse(data);
    }));
}

function parseJSONResponse(jsonData) {
    console.log('Request respons');
    console.log(jsonData);
    console.log('@1');

    $.each(jsonData.query.geosearch, function(index, value) {
        //console.log( index + ": " + value.title );
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

        // console.log("Found Article " + index + ": " + article.title);
        // console.log(article);
        addWikipadiaPage(article);
    });
    updateWikipediaGeojsonSource();
}

function addWikipadiaPage(article) {
    // console.log('Request Prcessing step 1');
    addWikipediaPageToGeojson(article);
    // updateWikipediaGeojsonSource();

}

function addWikipediaPageToGeojson(article) {
    console.log('Request Prcessing step 2');
    // if (mapIsActive) { // is map active?
    if (isArticleNew(article)) {
        let point = { //write the specific geojson feature for this point
            'type': 'Feature',
            'properties': article, // all info known about the article is saved as property
            'geometry': {
                'type': 'Point',
                'coordinates': article.lonLat
            }
        };
        wikipediaGeojson.features.push(point); // add the newly created geojson feature the geojson
    }

}

function isArticleNew(article) {
    for (i in wikipediaGeojson.features) {
        if (wikipediaGeojson.features[i].properties.pageId == article.pageId) {
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
        map.on('load', function() {
            map.getSource('wikipediaSource').setData(wikipediaGeojson);
            $('#loadingBox').hide();
        });
    }
}

function openDetailPannel(selectionInfo) {
    //console.log("This is selected:");
    //console.log(selectionInfo);
    detailsPannelData = {
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
    ajaxQueue.push($.getJSON(requestURL, function(data) {
        parseWikipediaApiResponseDetails(data);
    }));
}

function parseWikipediaApiResponseDetails(jsonData) {
    let wikipediaApiRespons = jsonData.query.pages[0];

    detailsPannelData.wikipedia_Intro = wikipediaApiRespons.extract;
    detailsPannelData.wikipedia_ImgTitle = wikipediaApiRespons.pageimage;
    detailsPannelData.Qnumber = wikipediaApiRespons.pageprops.wikibase_item;
    if (wikipediaApiRespons.pageimage != undefined) {
        detailsPannelData.wikipedia_ImgUrl = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + wikipediaApiRespons.pageimage;
    }
    detailsPannelData.wikipedia_Categories = [];

    //ToDo: get a desent thumnail. Maibe by transforming img url?

    // if (wikipediaApiRespons.thumbnail != undefined) {
    //     let url = wikipediaApiRespons.thumbnail.source;
    //     url.replace("50px", "500px"); // changing thmbnail size
    //     detailsPannelData.imgThumbnailUrl = url;
    // }

    for (i in wikipediaApiRespons.categories) {
        detailsPannelData.wikipedia_Categories.push(wikipediaApiRespons.categories[i].title); // adding all wikipediaApiRespons cathegories.
    }

    detailsPannelData.wikipedia_ApiOngoing = false; // change status to no API call ongoing.
    //console.log(detailsPannelData);

    updateDetailsPannel();
}

function updateDetailsPannel() {
    console.log(detailsPannelData);

    resetDetailsPannel();

    function resetDetailsPannel() {
        $('#article-title').text('no title');
        $('#article-intro').html('');
        // $("#article-year").text("-");
        $('#article-year').hide();
        $('#articleimage').hide();
        // $("#article-image-loader").attr("display", "block");
        $('#article-image').attr('src', 'img/kutgif.gif');
        // $("#article-image").attr("alt", "loading");
        // $("#article-description").html("no discription");
        $('#article-visitors').text('-');
        $('#article-instance-of').html('-');

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
    }

    $('#article-title').text(detailsPannelData.Map_title);
    $('#article-intro').html(detailsPannelData.wikipedia_Intro);

    // year label
    let yearLabel = formatingInseption();
    if (yearLabel) {
        $('#article-year').text(yearLabel);
        $('#article-year').show();
    }

    if (detailsPannelData.wikipedia_ImgUrl != undefined) {
        $('#articleimage').show();
        // $("#article-image-loader").attr("display", "none");
        // $("#article-image").removeClass("loader");

        $('#article-image').attr('src', detailsPannelData.wikipedia_ImgUrl);
        $('#article-image').attr('alt', detailsPannelData.wikipedia_ImgTitle);

    }

    // $("#article-description").html(detailsPannelData.Wikidata_itemDescription);
    $('#article-visitors').text(formatingVisitors());
    $('#article-instance-of').html(formatingInstanceOfList());

    if (detailsPannelData.Wikidata_item != undefined) {
        $('#article-wikidata').attr('href', detailsPannelData.Wikidata_item);
        $('#article-wikidata').show();
    }

    if (detailsPannelData.Wikidata_WikipediaLink != undefined) {
        $('#article-wikipedia').attr('href', detailsPannelData.Wikidata_WikipediaLink);
        $('#article-wikipedia').show();
    }

    if (detailsPannelData.Wikidata_CommonsCategory != undefined) {
        $('#article-wikicommons').attr('href', detailsPannelData.Wikidata_CommonsCategory);
        $('#article-wikicommons').show();
    }

    if (detailsPannelData.Wikidata_FreebaseIdGoogleSearch != undefined) {
        $('#article-google-search').attr('href', detailsPannelData.Wikidata_FreebaseIdGoogleSearch);
        $('#article-google-search').show();
    }

    if (detailsPannelData.Wikidata_GoogleMapsCustomerId != undefined) {
        $('#article-google-maps').attr('href', detailsPannelData.Wikidata_GoogleMapsCustomerId);
        $('#article-google-maps').show();
    }

    function formatingInseption() {
        if (detailsPannelData.Wikidata_inception != undefined) {
            return 'From ' + detailsPannelData.Wikidata_inception;
        } else {
            return;
        }
    }

    function formatingVisitors() {
        let visitors = '-';
        if (detailsPannelData.Wikidata_visitorsPerYear != undefined) {
            let visitorsString = detailsPannelData.Wikidata_visitorsPerYear.toString();
            visitors = visitorsString.replace('visitors per year', ' ');
        }
        return visitors;
    }

    function formatingInstanceOfList() {
        let string = '';
        let array = detailsPannelData.Wikidata_instanceOfLabel;
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