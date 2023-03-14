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
    hideWelcomCoverPage
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

    // create data sources for layers to use
    map.addSource('QnbrSource', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': []
        }
    });

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

    //ad layers to bring data sources to map
    // map.addLayer({ // wikipediaLayer
    //     "id": "wikipediaLayer",
    //     "type": "symbol",
    //     "source": "wikipediaSource",
    //     'layout': {
    //         'icon-image': 'wikipedia',
    //     }
    // });

    // map.addLayer({
    //     id: 'clusters',
    //     type: 'circle',
    //     source: 'wikipediaSource',
    //     filter: ['has', 'point_count'],
    //     paint: {
    //         // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
    //         // with three steps to implement three types of circles:
    //         //   * Blue, 20px circles when point count is less than 100
    //         //   * Yellow, 30px circles when point count is between 100 and 750
    //         //   * Pink, 40px circles when point count is greater than or equal to 750
    //         'circle-color': '#4B7982',
    //         'circle-stroke-color': '#fff',
    //         'circle-stroke-width': 1,
    //         'circle-radius': [
    //             'step', ['get', 'point_count'],
    //             20,
    //             10,
    //             30,
    //             25,
    //             40
    //         ]
    //     }
    // });

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

    map.loadImage(
        'https://casper-and-daan-explore-history.github.io/wiki-battle-map/img/architecture_small.png',
        function(error, image) {
            if (error) throw error;
            map.addImage('archi', image);
            map.loadImage(
                'https://casper-and-daan-explore-history.github.io/wiki-battle-map/img/event.png',
                function(error, image) {
                    if (error) throw error;
                    map.addImage('event', image);
                    map.loadImage(
                        'https://casper-and-daan-explore-history.github.io/wiki-battle-map/img/other.png',
                        function(error, image) {
                            if (error) throw error;
                            map.addImage('other', image);
                            map.loadImage(
                                'https://casper-and-daan-explore-history.github.io/wiki-battle-map/img/wikipedia.png',
                                function(error, image) {
                                    if (error) throw error;
                                    map.addImage('wikipedia', image);
                                    addLayerWithIcons(); // All images are now loaded, add layer that uses the images

                                }
                            );

                        }
                    );
                }
            );
        }
    );

    function addLayerWithIcons() {
        map.addLayer({
            'id': 'QnbrLayerIcon',
            'type': 'symbol',
            'source': 'QnbrSource',
            // "source-layer": "gp_registered_patients",
            // "filter": ["in", "stack", "two","three","five","nine","one"],
            // "minzoom": 11,
            // "interactive": true,
            'layout': {
                // "icon-offset": [14,-154],
                'icon-image': [
                    'match', ['get', 'cat'],
                    ['Architectural'],
                    'archi', ['Event'],
                    'event',
                    'other'
                ],
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'icon-padding': 0,
                'icon-size': 0.6
            }
        });
    }

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

    // If new Qnumber, and no data jet, then get Wikidata data:
    if (!detailsPannelData.wikidata_ApiOngoing && !detailsPannelData.wikidata_QueryDone && detailsPannelData.Qnumber != undefined) {
        //console.log("should call Wikidata API");
        WikidataApiRequestDetails();
    }

    updateDetailsPannel();
}

function WikidataApiRequestDetails() {
    function makeSPARQLQuery(endpointUrl, sparqlQuery, doneCallback) {
        let settings = {
            headers: { Accept: 'application/sparql-results+json' },
            data: { query: sparqlQuery }
        };
        return $.ajax(endpointUrl, settings).then(doneCallback);
    }

    //https://query.wikidata.org/#SELECT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20%3Fimg%20%3Fcommons%20%3FWikipediaLink%20%3Felevation%20%3Farea%20%3FofficialWebsite%20%3FflagImage%20%3FLonLat%20%3FcoatOfArmsImage%20%3FCommonsCategory%20%3FFreebaseIdGoogleSearch%20%3FGoogleKnowledgeGraphId%20%3FstartTime%20%3FendTime%20%3Finception%20%3Freligion%20%3FsignificantEvent%20%3Faudio%20%3FmaximumCapacity%20%3FvisitorsPerYear%20%3FheritageDesignationLabel%20%3Flength%20%3Fwidth%20%3Fheight%20%3FplanViewImage%20%3FFacebookId%20%3FGoogleMapsCustomerId%20%3FInstagramUsername%20%3FMapillaryId%20%3FTwitterUsername%20%3FOpenStreetMapRelationId%20%3FInstagramLocationId%20%3FFoursquareVenueId%20%3FImdbId%20%3FLinkedInCompanyId%20%3FTripAdvisorId%20%3FYelpId%20%3FYouTubeChannelId%20%3FphoneNumber%20%3FemailAddress%20%3Fsubreddit%20%3FGoogleArtsCulturePartnerId%20%3Fpopulation%20%3FcommonsLink%20%3FinstanceOfLabel%20WHERE%20%7B%0A%0A%20%20%23%20https%3A%2F%2Fwww.wikidata.org%2Fwiki%2FQ2981%20Notre%20Dam%20of%20Paris%0A%20%20%23%20https%3A%2F%2Fwww.wikidata.org%2Fwiki%2FQ243%20Toure%20Eiffel%0A%20%20%20%20%0A%20%20VALUES%20%3Fitem%20%7B%20%23%3Fitem%20letiable%20is%20set%20to%20Qnumber%0A%20%20%20%20wd%3AQ243%0A%20%20%7D%0A%20%20%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP18%20%20%20%3Fimg.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP373%20%20%3FcommonsLink.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP31%20%20%20%3FinstanceOf.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP625%20%20%3FLonLat.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1082%20%3Fpopulation.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2044%20%3Felevation.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2046%20%3Farea.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP856%20%20%3FofficialWebsite.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP41%20%20%20%3FflagImage.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP94%20%20%20%3FcoatOfArmsImage.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP373%20%20%3FCommonsCategory.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP646%20%20%3FFreebaseIdGoogleSearch.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2671%20%3FGoogleKnowledgeGraphId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP580%20%20%3FstartTime.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP582%20%20%3FendTime.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP571%20%20%3Finception.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP140%20%20%3Freligion.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP793%20%20%3FsignificantEvent.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP51%20%20%20%3Faudio.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1083%20%3FmaximumCapacity.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1174%20%3FvisitorsPerYear.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1435%20%3FheritageDesignation.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2043%20%3Flength.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2049%20%3Fwidth.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2048%20%3Fheight.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP3311%20%3FplanViewImage.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2013%20%3FFacebookId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP3749%20%3FGoogleMapsCustomerId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2003%20%3FInstagramUsername.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1947%20%3FMapillaryId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP2002%20%3FTwitterUsername.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP402%20%20%3FOpenStreetMapRelationId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP4173%20%3FInstagramLocationId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP1968%20%3FFoursquareVenueId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP345%20%20%3FImdbId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP4264%20%3FLinkedInCompanyId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20%20wdt%3AP3134%20%3FTripAdvisorId.%20%7D%0A%20%20OPTIONAL%20%7B%20%3Fitem%20
    let endpointUrl = 'https://query.wikidata.org/sparql',
        sparqlQuery = 'SELECT ?item ?itemLabel ?itemDescription ?img ?commons ?WikipediaLink ?elevation ?area ?officialWebsite ?flagImage ?LonLat ?coatOfArmsImage ?CommonsCategory ?FreebaseIdGoogleSearch ?GoogleKnowledgeGraphId ?startTime ?endTime ?inception ?religion ?significantEvent ?audio ?maximumCapacity ?visitorsPerYear ?heritageDesignationLabel ?length ?width ?height ?planViewImage ?FacebookId ?GoogleMapsCustomerId ?InstagramUsername ?MapillaryId ?TwitterUsername ?OpenStreetMapRelationId ?InstagramLocationId ?FoursquareVenueId ?ImdbId ?LinkedInCompanyId ?TripAdvisorId ?YelpId ?YouTubeChannelId ?phoneNumber ?emailAddress ?subreddit ?GoogleArtsCulturePartnerId ?population ?commonsLink ?instanceOfLabel WHERE {\n' +
        '\n' +
        '  # https://www.wikidata.org/wiki/Q2981 Notre Dam of Paris\n' +
        '  # https://www.wikidata.org/wiki/Q243 Toure Eiffel\n' +
        '    \n' +
        '  VALUES ?item { #?item letiable is set to Qnumber\n' +
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
        '  OPTIONAL { ?item  wdt:P2003 ?InstagramUsername. }\n' +
        '  OPTIONAL { ?item  wdt:P1947 ?MapillaryId. }\n' +
        '  OPTIONAL { ?item  wdt:P2002 ?TwitterUsername. }\n' +
        '  OPTIONAL { ?item  wdt:P402  ?OpenStreetMapRelationId. }\n' +
        '  OPTIONAL { ?item  wdt:P4173 ?InstagramLocationId. }\n' +
        '  OPTIONAL { ?item  wdt:P1968 ?FoursquareVenueId. }\n' +
        '  OPTIONAL { ?item  wdt:P345  ?ImdbId. }\n' +
        '  OPTIONAL { ?item  wdt:P4264 ?LinkedInCompanyId. }\n' +
        '  OPTIONAL { ?item  wdt:P3134 ?TripAdvisorId. }\n' +
        '  OPTIONAL { ?item  wdt:P3108 ?YelpId. }\n' +
        '  OPTIONAL { ?item  wdt:P2397 ?YouTubeChannelId. }\n' +
        '  OPTIONAL { ?item  wdt:P1329 ?phoneNumber. }\n' +
        '  OPTIONAL { ?item  wdt:P968  ?emailAddress. }\n' +
        '  OPTIONAL { ?item  wdt:P3984 ?subreddit. }\n' +
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

    makeSPARQLQuery(endpointUrl, sparqlQuery, function(data) {
        $('body').append($('<pre>').text(JSON.stringify(data)));
        //console.log(data.results.bindings);
        WikidataApiResultsProcessingDetails(data.results.bindings);
    });

    function WikidataApiResultsProcessingDetails(data) {
        cleanResults();

        function cleanResults() {
            let gatherdResults = {}; //raw results come in with a lot of fluf and in repated fashon to account for several values. Here we keep the minimum and put the results in an array if needed.

            for (i in data) { // loop throug resonds sets
                let keys = Object.keys(data[i]); //get all the object's keys
                for (k in keys) {
                    if (gatherdResults[keys[k]] === undefined) { //If no value was ever saved for this key(letiable name)
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
            let keys = Object.keys(data);
            console.log(keys);
            console.log(data.img);
            // https://commons.wikimedia.org/wiki/File:P1050763_Louvre_code_Hammurabi_face_rwk-gradient.jpg
            // https://commons.wikimedia.org/wiki/Special:FilePath/P1050763%20Louvre%20code%20Hammurabi%20face%20rwk-gradient.jpg
            // https://commons.wikimedia.org/wiki/Special:FilePath/  Louvre%20chateau%201.jpg
            // https://commons.wikimedia.org/wiki/File:             Louvre%20chateau%201.jpg

            for (k in keys) {
                for (v in data[keys[k]]) {
                    let value = '';

                    switch (keys[k]) { // for every letiable there is an other method of enriching.
                    case 'CommonsCategory':
                        value = 'https://commons.wikimedia.org/wiki/Category:' + encodeURIComponent(data[keys[k]][v]);
                        break;

                    case 'LonLat':
                        value = data[keys[k]][v];
                        value = value.replace('Point(', '');
                        value = value.replace(')', '');
                        value = value.split(' ');
                        value = [Number(value[0]), Number(value[1])];
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
                        value = bigNumberFormater(data[keys[k]][v]) + ' visitors per year';
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
            updateDetailsPannel();
            if (!detailsPannelData.wikimedia_ApiOngoing && !detailsPannelData.wikimedia_QueryDone && (detailsPannelData.Wikidata_CommonsCategory != undefined || detailsPannelData.Wikidata_commonsLink != undefined)) {
                console.log('should call Commons API');
                // WikidataApiRequestDetails()
            }
        }

    }

    //detailsPannelData.Qnumber
}

function bigNumberFormater(num) {
    // if (num >= 1000000000) {
    // return (num / 1000000000).toFixed(0) + 'G';
    // return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
    // }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(0) + ' million';
        // return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(0) + ' thousand';
        // return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num;
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