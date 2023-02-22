var selectedQ = undefined;
var QnbrGeojson = {
    'type': 'FeatureCollection',
    'features': []
};
var wikipediaGeojson = {
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
var resultsFromQuery = [];
var allQnbrs = [];
var ResultsObject = {};
var results; // results form commons.wikimedia img search from category
var imgSlideIndex = 1;
var mapIsActive = false;

var ajaxQueue = new Array();

var detailsPannelData = {
    "wikipedia_ApiOngoing": false, // current status of API resquest
    "wikimedia_ApiOngoing": false, // current status of API resquest
    "wikidata_ApiOngoing": false, // current status of API resquest
    "wikipedia_QueryDone": false, // Data collection status
    "wikimedia_QueryDone": false, // Data collection status
    "wikidata_QueryDone": false // Data collection status
};


function hideAboutpanel() {
    document.getElementById("about").style.display = "none";
}

function openAboutpanel() {
    document.getElementById("about").style.display = "block";
}

function openHamburger() {
    document.getElementById("hamburgermenu").style.display = "block";
}

function closeHamburger() {
    document.getElementById("hamburgermenu").style.display = "none";
}


const startingLocations = [
    [77.217, 28.667],
    [121.467, 31.167],
    [116.408, 39.904],
    [104.063, 30.660],
    [113.260, 23.130],
    [114.054, 22.535],
    [90.394, 23.729],
    [28.960, 41.010],
    [72.878, 19.076],
    [67.010, 24.860],
    [3.400, 6.450],
    [139.692, 35.690],
    [117.206, 39.147],
    [108.900, 34.267],
    [120.616, 31.304],
    [37.618, 55.756],
    [113.661, 34.749],
    [114.288, 30.587],
    [-46.634, -23.550],
    [120.168, 30.250],
    [15.314, -4.332],
    [115.485, 38.867],
    [77.591, 12.979],
    [74.344, 31.550],
    [118.343, 35.061],
    [114.509, 38.042],
    [106.845, -6.215],
    [113.749, 23.047],
    [106.702, 10.776],
    [80.275, 13.083],
    [120.400, 36.117],
    [112.971, 28.199],
    [126.633, 45.750],
    [112.529, 32.999],
    [-77.038, -12.060],
    [126.990, 37.560],
    [120.656, 27.999],
    [113.106, 23.029],
    [114.489, 36.612],
    [121.549, 29.875],
    [119.100, 36.717],
    [117.281, 31.864],
    [118.767, 32.050],
    [78.475, 17.362],
    [31.236, 30.044],
    [139.774, 35.684],
    [116.983, 36.667],
    [117.186, 34.261],
    [123.426, 41.804],
    [125.323, 43.880],
    [125.200, 43.900],
    [114.642, 33.625],
    [114.934, 25.829],
    [-99.146, 19.419],
    [-0.128, 51.507],
    [115.433, 35.233],
    [118.586, 24.914],
    [108.315, 22.819],
    [51.417, 35.700],
    [102.706, 25.043],
    [-74.006, 40.713],
    [116.567, 35.400],
    [119.292, 26.077],
    [105.841, 21.025],
    [115.804, 32.899],
    [46.710, 24.650],
    [115.647, 34.426],
    [-74.082, 4.610],
    [106.507, 29.550],
    [120.887, 31.983],
    [118.174, 39.629],
    [72.580, 23.030],
    [114.159, 22.278],
    [120.283, 31.567],
    [121.600, 38.900],
    [116.845, 38.304],
    [114.475, 37.066],
    [121.266, 37.400],
    [112.424, 34.659],
    [119.649, 29.105],
    [114.025, 32.977],
    [110.403, 21.197],
    [44.417, 33.350],
    [105.286, 27.302],
    [-43.196, -22.908],
    [120.134, 33.394],
    [112.586, 26.897],
    [121.422, 28.658],
    [106.934, 27.705],
    [111.472, 27.242],
    [117.963, 28.442],
    [-70.667, -33.450],
    [115.887, 28.684],
    [110.918, 21.662],
    [114.067, 32.126],
    [116.365, 23.553],
    [114.415, 23.111],
    [106.708, 26.579],
    [81.850, 25.450],
    [115.983, 36.450],
    [73.855, 18.520],
    [72.830, 21.170],
    [114.875, 30.450],
    [103.800, 1.300],
    [110.151, 22.629],
    [103.803, 25.510],
    [113.885, 35.299],
    [100.517, 13.750],
    [121.540, 31.223],
    [106.078, 30.799],
    [31.212, 29.987],
    [116.310, 37.451],
    [36.817, -1.286],
    [32.839, 39.936],
    [116.694, 23.373],
    [114.346, 36.096],
    [117.081, 36.200],
    [116.701, 39.520],
    [111.595, 26.452],
    [96.160, 16.795],
    [120.750, 30.752],
    [107.495, 31.215],
    [30.317, 59.950],
    [32.527, 15.603],
    [116.968, 33.633],
    [112.542, 37.873],
    [111.595, 26.452],
    [111.684, 29.040],
    [119.969, 31.812],
    [120.583, 30.000],
    [120.579, 30.002],
    [112.153, 32.065],
    [112.236, 30.324],
    [118.082, 24.480],
    [103.714, 27.333],
    [117.661, 24.509],
    [113.131, 29.365],
    [114.383, 27.804],
    [115.774, 33.863],
    [118.283, 33.933],
    [-4.027, 5.336],
    [114.979, 27.117],
    [110.283, 25.267],
    [113.300, 33.735],
    [104.640, 28.760],
    [29.893, 31.198],
    [104.738, 31.467],
    [151.210, -33.868],
    [110.998, 35.030],
    [117.033, 30.500],
    [39.283, -6.800],
    [118.050, 36.783],
    [109.468, 34.500],
    [113.027, 25.799],
    [113.083, 22.583],
    [116.002, 29.705],
    [119.180, 34.591],
    [104.640, 28.760],
    [109.959, 27.549],
    [114.340, 34.794],
    [119.436, 32.391],
    [119.133, 33.500],
    [144.961, -37.821],
    [119.900, 32.483],
    [88.364, 22.573],
    [104.640, 28.760],
    [28.042, -26.204],
    [113.350, 22.533],
    [112.333, 28.583],
    [116.508, 31.754],
    [116.119, 24.300],
    [-7.620, 33.599],
    [121.446, 25.011],
    [103.832, 36.062],
    [114.881, 40.811],
    [27.138, 38.413],
    [109.609, 23.096],
    [113.820, 34.024],
    [69.166, 34.533],
    [113.911, 30.927],
    [105.441, 28.892],
    [115.686, 37.735],
    [117.033, 30.500],
    [109.428, 24.326],
    [106.634, 30.467],
    [112.467, 23.050],
    [123.951, 47.340],
    [87.613, 43.823],
    [116.358, 27.981],
    [118.922, 42.266],
    [111.280, 30.708],
    [35.933, 31.950],
    [118.311, 32.306],
    [111.509, 36.081],
    [-118.244, 34.052],
    [39.173, 21.543],
    [113.051, 23.684],
    [108.717, 34.350],
    [111.997, 27.738],
    [118.013, 37.381],
    [113.147, 27.841],
    [8.517, 12.000],
    [139.633, 35.433],
    [126.981, 46.638],
    [18.500, -34.000],
    [18.594, -33.893],
    [117.550, 34.867],
    [105.064, 29.587],
    [106.619, 23.901],
    [13.383, 52.517],
    [118.362, 31.334],
    [109.739, 38.265],
    [126.562, 43.846],
    [115.030, 35.764],
    [113.230, 35.229],
    [117.932, 40.974],
    [104.395, 31.129],
    [129.040, 35.100],
    [111.663, 40.815],
    [108.085, 24.693],
    [3.059, 36.776],
    [111.135, 37.520],
    [110.776, 32.635],
    [80.947, 26.847],
    [120.096, 30.869],
    [122.989, 41.107],
    [107.175, 34.361],
    [113.291, 40.094],
    [-3.692, 40.419],
    [108.617, 21.950],
    [117.353, 32.935],
    [106.756, 31.858],
    [112.717, -7.267],
    [112.738, -7.246],
    [106.634, 30.467],
    [105.574, 30.510],
    [112.742, 37.693],
    [103.758, 29.585],
    [107.026, 33.079],
    [119.010, 25.439],
    [119.455, 32.211],
    [106.634, 30.467],
    [73.079, 31.418],
    [113.097, 36.195],
    [109.189, 27.723],
    [-63.198, -17.789],
    [119.588, 39.940],
    [113.291, 40.094],
    [75.867, 26.917],
    [112.723, 38.418],
    [-58.382, -34.600],
    [111.317, 23.483],
    [38.737, 9.027],
    [120.667, 24.150],
    [117.016, 32.483],
    [104.833, 26.594],
    [-47.883, -15.794],
    [59.604, 36.307],
    [76.653, 12.309],
    [47.980, 29.375],
    [105.731, 34.581],
    [119.433, 35.416],
    [30.524, 50.450],
    [121.033, 14.633],
    [44.200, 15.350],
    [103.838, 30.057],
    [-90.525, 14.610],
    [126.649, 37.464],
    [119.523, 26.662],
    [122.100, 37.500],
    [29.081, 40.191],
    [112.211, 31.038],
    [-38.493, -12.983],
    [112.717, -7.267],
    [112.738, -7.246],
    [107.567, -6.950],
    [110.320, 20.020],
    [122.264, 43.617],
    [120.449, 41.576],
    [12.483, 41.893],
    [-68.148, -16.494],
    [125.730, 39.030],
    [106.225, 38.479],
    [113.593, 24.801],
    [114.692, 23.750],
    [32.463, 15.684],
    [125.008, 46.598],
    [135.502, 34.694],
    [-87.650, 41.850],
    [120.300, 22.617],
    [-79.387, 43.670],
    [112.923, 27.843],
    [-79.888, -2.190],
    [117.024, 25.088],
    [123.837, 42.284],
    [109.835, 40.656],
    [121.129, 41.114],
    [80.331, 26.473],
    [118.173, 26.645],
    [115.333, 22.766],
    [116.630, 23.670],
    [100.970, 22.780],
    [109.024, 32.688],
    [99.169, 25.121],
    [120.838, 40.709],
    [47.521, -18.939],
    [121.532, 25.048],
    [104.640, 30.126],
    [-69.893, 18.476],
    [91.833, 22.335],
    [117.630, 26.266],
    [69.267, 41.300],
    [111.963, 21.856],
    [130.365, 46.808],
    [3.917, 7.396],
    [114.329, 29.834],
    [114.011, 33.583],
    [100.087, 23.886],
    [118.752, 30.948],
    [-75.575, 6.245],
    [104.626, 35.581],
    [-43.942, -19.928],
    [55.309, 25.270],
    [82.565, 25.145],
    [82.580, 25.150],
    [104.765, 29.350],
    [13.234, -8.838],
    [105.840, 32.435],
    [117.711, 39.003],
    [115.033, 30.202],
    [-76.520, 3.440],
    [101.779, 36.624],
    [128.600, 35.867],
    [-1.528, 12.369],
    [-38.528, -3.728],
    [9.700, 4.050],
    [124.383, 40.117],
    [11.518, 3.858],
    [121.217, 24.850],
    [113.568, 22.277],
    [122.230, 40.665],
    [30.696, 36.908],
    [105.349, 33.535],
    [79.083, 21.154],
    [123.837, 42.284],
    [102.543, 24.350],
    [112.035, 22.924],
    [107.000, -6.233],
    [77.417, 28.667],
    [153.028, -27.468],
    [105.934, 26.246],
    [117.016, 32.483],
    [106.823, -6.394],
    [136.933, 35.117],
    [-0.853, 9.408],
    [-0.187, 5.604],
    [129.600, 44.586],
    [109.486, 36.595],
    [112.848, 35.491],
    [124.808, 45.139],
    [119.751, 49.215],
    [106.632, -6.178],
    [109.233, 23.733],
    [32.492, 37.873],
    [113.366, 31.718],
    [35.313, 37.003],
    [-95.383, 29.763],
    [118.467, 37.450],
    [124.383, 40.117],
    [118.876, 28.954],
    [49.835, 40.367],
    [107.640, 35.728],
    [2.351, 48.857],
    [118.360, 31.714],
    [118.510, 31.686],
    [109.998, 39.815],
    [31.052, -17.829],
    [-82.359, 23.137],
    [104.921, 11.570],
    [45.342, 2.039],
    [116.159, 23.299],
    [119.917, 28.450],
    [116.789, 33.956],
    [98.667, 3.667],
    [106.667, 20.800],
    [107.367, 22.417],
    [73.068, 33.601],
    [120.977, 31.387],
    [111.548, 24.416],
    [-1.617, 6.683],
    [106.682, 35.541],
    [73.200, 22.300],
    [118.579, 24.814],
    [109.924, 33.868],
    [115.861, -31.956],
    [83.317, 17.733],
    [111.195, 34.774],
    [122.832, 45.615],
    [37.383, 37.067],
    [74.183, 32.150],
    [-78.513, -0.220],
    [-7.992, 12.646],
    [6.167, 35.550],
    [27.562, 53.902],
    [75.847, 22.721],
    [38.792, 37.158],
    [13.167, 52.533],
    [101.695, 3.148],
    [22.417, -5.896],
    [71.568, 34.014],
    [-117.037, 32.536],
    [141.354, 43.062],
    [51.668, 32.645],
    [-66.933, 10.500],
    [109.998, 39.815],
    [113.850, 27.633],
    [76.900, 43.250],
    [37.150, 36.200],
    [35.850, 32.556],
    [16.373, 48.208],
    [35.006, -15.786],
    [72.963, 19.180],
    [26.083, 44.400],
    [-49.272, -25.430],
    [120.183, 22.983],
    [120.189, 23.000],
    [71.471, 30.198],
    [130.965, 45.294],
    [123.892, 41.871],
    [10.000, 53.550],
    [120.977, 14.596],
    [37.650, 0.050],
    [15.271, -4.269],
    [121.649, 42.013],
    [102.633, 37.928],
    [124.364, 43.172],
    [34.617, 36.800],
    [-60.017, -3.100],
    [77.417, 23.250],
    [21.011, 52.230],
    [27.458, -11.670],
    [125.600, 7.067],
    [36.292, 33.513],
    [13.400, 9.300],
    [28.283, -15.417],
    [68.368, 25.379],
    [40.237, 37.911],
    [73.813, 18.628],
    [19.041, 47.498],
    [112.429, 39.341],
    [113.124, 40.992],
    [113.133, 40.993],
    [43.117, 36.367],
    [85.141, 25.610],
    [109.100, 21.467],
    [39.826, 21.423],
    [127.489, 50.246],
    [117.204, 29.294],
    [107.414, 40.757],
    [-13.712, 9.509],
    [-13.677, 9.538],
    [120.967, 14.650],
    [32.581, 0.314],
    [20.467, 44.817],
    [20.473, 44.797],
    [-34.881, -8.054],
    [106.718, -6.289],
    [2.177, 41.383],
    [82.017, 22.150],
    [110.417, -6.967],
    [75.849, 30.908],
    [-112.074, 33.448],
    [123.177, 41.264],
    [117.150, 35.083],
    [130.417, 33.600],
    [82.917, 55.033],
    [50.992, 35.833],
    [78.020, 27.180],
    [-75.164, 39.953],
    [-101.683, 21.122],
    [114.289, 35.750],
    [52.543, 29.610],
    [78.119, 9.920],
    [23.597, -6.121],
    [46.283, 38.083],
    [86.183, 22.800],
    [-71.633, 10.633],
    [139.700, 35.517],
    [104.717, -3.000],
    [104.764, -2.983],
    [7.367, 5.117],
    [110.484, 29.125],
    [135.183, 34.691],
    [104.177, 36.545],
    [120.733, 31.650],
    [110.279, 21.615],
    [103.001, 29.989],
    [121.266, 30.170],
    [-48.504, -1.456],
    [110.083, 23.400],
    [110.081, 20.915],
    [126.917, 35.167],
    [11.575, 48.138],
    [73.783, 20.000],
    [-51.230, -30.033],
    [-68.000, 10.167],
    [54.397, 24.451],
    [6.783, 6.167],
    [-103.392, 20.720],
    [127.385, 36.351],
    [174.783, -36.850],
    [112.045, 32.689],
    [112.079, 32.683],
    [174.783, -36.850],
    [135.768, 35.012],
    [-103.348, 20.677],
    [118.010, 34.342],
    [-98.494, 29.425],
    [-98.218, 19.051],
    [36.231, 49.993],
    [120.551, 31.877],
    [120.653, 27.778],
    [58.592, 23.614],
    [121.372, 28.380],
    [110.848, 21.913],
    [115.635, 22.949],
    [77.300, 28.417],
    [89.550, 22.817],
    [106.906, 47.921],
    [-117.163, 32.715],
    [-49.256, -16.681],
    [122.063, 41.120],
    [35.488, 38.723],
    [120.962, 28.119],
    [106.192, 37.987],
    [119.956, 36.783],
    [20.457, 44.818],
    [75.320, 19.880],
    [113.576, 37.858],
    [112.554, 28.315],
    [9.190, 45.467],
    [118.315, 29.713],
    [102.103, 36.501],
    [174.783, -36.850],
    [-70.700, 19.450],
    [117.485, 30.658],
    [119.414, -5.133],
    [36.330, 41.287],
    [70.798, 22.297],
    [-64.183, -31.417],
    [47.810, 30.515],
    [123.761, 41.292],
    [-46.533, -23.467],
    [-106.487, 31.739],
    [139.645, 35.862],
    [-56.167, -34.867],
    [117.780, 35.910],
    [117.767, 30.933],
    [77.700, 28.990],
    [126.545, 44.825],
    [-96.809, 32.779],
    [104.097, 26.231],
    [125.947, 41.730],
    [110.629, 21.654],
    [126.418, 41.938],
    [138.600, -34.928],
    [122.747, 40.852],
    [120.265, 31.909],
    [13.404, 52.519],
    [23.322, 42.698],
    [14.421, 50.088],
    [-74.796, 10.964],
    [27.859, -26.268],
    [79.933, 23.167],
    [120.563, 32.385],
    [44.008, 56.327],
    [100.221, 26.881],
    [119.840, 32.939],
    [-87.210, 14.098],
    [117.667, 36.183],
    [55.392, 25.358],
    [73.133, 19.233],
    [49.114, 55.791],
    [-114.063, 51.048],
    [105.783, 10.033],
    [7.491, 9.056],
    [127.010, 37.286],
    [108.210, 16.069],
    [96.084, 21.983],
    [72.800, 19.470],
    [4.350, 50.850],
    [101.715, 26.585],
    [131.155, 46.639],
    [114.924, 27.795],
    [61.400, 55.150],
    [50.876, 34.640],
    [39.667, -4.050],
    [100.455, 38.935],
    [83.013, 25.319],
    [132.450, 34.400],
    [-96.809, 32.779],
    [13.150, 11.833],
    [-60.639, -32.958],
    [32.576, -25.915],
    [51.533, 25.300],
    [48.684, 31.319],
    [39.610, 24.470],
    [74.806, 34.091],
    [73.383, 54.967],
    [125.138, 42.898],
    [112.620, -7.980],
    [-17.400, 14.750],
    [50.117, 53.183],
    [105.263, -5.429],
    [129.317, 35.550],
    [114.984, 38.516],
    [-47.057, -22.901],
    [111.666, 27.696],
    [96.115, 19.748],
    [122.099, 30.016],
    [122.205, 29.989],
    [30.061, -1.954],
    [117.000, 28.233],
    [112.846, 26.418],
    [128.889, 47.723],
    [5.615, 6.318],
    [-17.457, 14.732],
    [106.278, 36.008],
    [-1.903, 52.480],
    [-100.309, 25.671],
    [74.877, 31.627],
    [110.482, 22.517],
    [113.473, 34.151],
    [78.080, 27.880],
    [-77.133, -12.061],
    [-87.207, 14.094],
    [13.187, 32.875],
    [39.717, 47.233],
    [73.010, 19.030],
    [44.793, 41.723],
    [116.450, 35.367],
    [91.746, 26.172],
    [55.948, 54.726],
    [-5.003, 34.043],
    [106.822, 10.951],
    [98.505, 39.737],
    [121.155, 30.037],
    [113.827, 30.652],
    [124.809, 43.504],
    [15.050, 12.110],
    [92.872, 56.009],
    [6.958, 50.942],
    [119.824, 31.370],
    [119.417, 36.000],
    [71.433, 51.133],
    [-43.054, -22.827],
    [-15.979, 18.086],
    [88.325, 22.574],
    [44.514, 40.181],
    [104.467, 25.711],
    [120.014, 32.172],
    [-44.303, -2.530],
    [85.335, 23.356],
    [78.193, 26.215],
    [105.188, 37.514],
    [126.835, 37.656],
    [113.495, 27.661],
    [114.884, 30.397],
    [-69.347, 10.068],
    [130.278, 47.314],
    [140.869, 38.268],
    [10.180, 36.801],
    [76.791, 30.735],
    [74.567, 42.867],
    [80.617, 16.517],
    [56.249, 58.014],
    [39.211, 51.672],
    [108.300, 21.600],
    [128.681, 35.228],
    [104.547, 30.393],
    [118.733, 36.883],
    [-75.525, 10.424],
    [-115.468, 32.663],
    [73.028, 26.294],
    [32.467, -25.967],
    [4.250, 8.133],
    [109.502, 18.254],
    [106.800, -6.600],
    [106.800, -6.592],
    [104.017, 1.068],
    [-35.735, -9.666],
    [121.141, 28.852],
    [69.600, 42.300],
    [2.118, 13.515],
    [31.242, 30.129],
    [-35.735, -9.666],
    [-121.873, 37.304],
    [121.997, 39.627],
    [112.585, 31.169],
    [-10.805, 6.311],
    [-157.967, 21.467],
    [44.515, 48.709],
    [73.037, 33.699],
    [110.937, 22.356],
    [106.752, 10.792],
    [81.634, 21.238],
    [-71.537, -16.399],
    [7.000, 4.750],
    [112.758, 32.129],
    [114.899, 33.443],
    [75.830, 25.180],
    [67.007, 30.192],
    [79.415, 28.364],
    [115.667, 24.168],
    [-72.339, 18.543],
    [101.450, 0.533],
    [140.106, 35.607],
    [35.040, 48.468],
    [122.076, 6.908],
    [18.069, 59.329],
    [44.400, 35.467],
    [127.201, 37.236],
    [14.250, 40.833],
    [123.902, 10.293],
    [29.088, 37.773],
    [38.917, 15.333],
    [31.383, 31.050],
    [76.967, 11.000],
    [109.583, 19.500],
    [75.910, 17.672],
    [-13.233, 8.483],
    [127.138, 37.439],
    [102.600, 17.967],
    [-5.804, 35.777],
    [47.069, 34.317],
    [-86.274, 12.146],
    [32.633, 15.633],
    [25.191, 0.515],
    [130.883, 33.883],
    [-102.296, 21.881],
    [-75.695, 45.425],
    [-113.500, 53.533],
    [-7.981, 31.629],
    [131.006, 45.768],
    [-79.029, -8.112],
    [35.217, 31.783],
    [78.693, 10.827],
    [-83.001, 39.962],
    [-99.240, 19.479],
    [-99.234, 19.479],
    [-99.233, 19.483],
    [-97.733, 30.300],
    [7.033, 5.483],
    [-54.622, -20.469],
    [-4.283, 11.183],
    [50.100, 26.433],
    [-89.620, 20.970],
    [18.563, 4.373],
    [3.350, 7.150],
    [-86.848, 21.161],
    [78.729, 28.843],
    [78.777, 28.839],
    [121.176, 14.584],
    [-43.312, -22.786],
    [121.050, 14.517],
    [-81.650, 30.330],
    [-122.416, 37.778],
    [38.983, 45.033],
    [-79.500, 9.000],
    [-81.650, 30.317],
    [45.433, 35.550],
    [-106.076, 28.637],
    [101.450, 3.033],
    [-35.209, -5.795],
    [77.033, 28.467],
    [-80.843, 35.227],
    [43.299, 33.426],
    [120.714, 36.976],
    [-70.217, 8.633],
    [75.579, 31.326],
    [30.521, 39.777],
    [7.700, 45.067],
    [5.376, 43.297],
    [-42.804, -5.095],
    [91.141, 29.646],
    [126.783, 37.499],
    [101.070, 4.600],
    [112.620, -7.980],
    [-100.992, 25.423],
    [68.786, 38.573],
    [-86.158, 39.769],
    [3.333, 6.583],
    [3.343, 6.619],
    [4.900, 52.383],
    [-110.958, 29.075],
    [-0.633, 35.697],
    [-6.817, 34.050],
    [5.195, 7.250],
    [4.542, 8.480],
    [4.550, 8.500],
    [-42.804, -5.095],
    [44.009, 36.191],
    [85.367, 27.717],
    [46.000, 51.533],
    [-46.565, -23.694],
    [-68.200, -16.500],
    [85.828, 20.264],
    [1.223, 6.132],
    [115.217, -8.667],
    [108.942, 34.906],
    [127.490, 36.637],
    [11.865, -4.789],
    [58.383, 37.950],
    [135.495, 34.532],
    [135.483, 34.567],
    [-43.451, -22.759],
    [-34.880, -7.120],
    [-46.565, -23.694],
    [72.850, 19.300],
    [-97.333, 32.756],
    [15.977, 45.813],
    [39.723, 41.005],
    [121.083, 14.575],
    [-34.880, -7.120],
    [105.261, -5.429],
    [88.883, 29.250],
    [88.880, 29.265],
    [103.761, 1.456],
    [-43.451, -22.759],
    [9.454, 0.390],
    [139.036, 37.916],
    [-0.376, 39.470],
    [-1.549, 53.800],
    [137.733, 34.717],
    [33.783, -13.983],
    [13.500, -14.917],
    [36.717, 34.733],
    [-100.975, 22.150],
    [127.489, 39.966],
    [127.533, 39.917],
    [41.276, 39.910],
    [55.745, 24.208],
    [19.937, 50.061],
    [8.680, 50.114],
    [71.672, 29.396],
    [97.178, 31.137],
    [7.417, 10.511],
    [7.440, 10.523],
    [-85.751, 38.256],
    [44.061, 9.566],
    [117.154, -0.502],
    [79.833, 6.917],
    [106.369, 39.010],
    [-62.652, 8.360],
    [-72.505, 7.908],
    [-122.332, 47.606],
    [65.533, 57.150],
    [76.900, 8.500],
    [39.267, -15.117],
    [28.188, -25.746],
    [130.708, 32.803],
    [130.708, 32.803],
    [45.068, 37.549],
    [4.567, 7.767],
    [4.576, 7.760],
    [-67.500, -45.867],
    [124.650, 8.483],
    [-103.443, 20.474],
    [139.367, 35.567],
    [44.340, 32.029],
    [139.367, 35.567],
    [35.118, 47.850],
    [-79.650, 43.600],
    [133.917, 34.650],
    [86.033, 44.300],
    [-103.419, 25.544],
    [7.494, 6.440],
    [120.983, 14.700],
    [127.214, 37.637],
    [-46.533, -23.657],
    [73.067, 19.300],
    [101.594, 3.064],
    [100.329, 5.415],
    [-35.015, -8.113],
    [77.546, 29.964],
    [-97.150, 49.883],
    [79.601, 17.976],
    [120.937, 14.329],
    [-99.228, 19.539],
    [35.792, 35.524],
    [-48.277, -18.919],
    [125.167, 6.117],
    [36.750, 35.133],
    [-46.792, -23.533],
    [9.844, 10.316],
    [10.739, 59.913],
    [78.167, 11.650],
    [114.592, -3.319],
    [-71.058, 42.360],
    [-100.260, 25.678],
    [19.455, 51.777],
    [44.033, 32.617],
    [121.017, 14.467],
    [-77.037, 38.895],
    [-45.887, -23.179],
    [138.383, 34.976],
    [-5.983, 37.383],
    [-106.489, 31.759],
    [-104.985, 39.739],
    [113.550, 22.167],
    [49.589, 37.276],
    [2.417, 6.367],
    [108.200, -7.333],
    [76.283, 9.967],
    [-99.887, 16.863],
    [83.367, 26.761],
    [93.515, 42.832],
    [13.361, 38.116],
    [-86.774, 36.162],
    [129.783, 41.800],
    [-47.807, -21.178],
    [15.733, -12.767],
    [120.964, 14.462],
    [-103.364, 20.603],
    [23.728, 37.984],
    [-67.033, 10.600],
    [-67.030, 10.604],
    [8.591, 53.347],
    [11.326, 8.920],
    [11.367, 8.900],
    [72.671, 32.084],
    [-5.033, 7.683],
    [29.361, -3.383],
    [-106.410, 23.241],
    [74.533, 32.500],
    [126.767, 37.200],
    [-104.654, 24.023],
    [28.567, -20.167],
    [-122.667, 45.517],
    [127.149, 35.822],
    [126.822, 37.324],
    [107.591, 16.464],
    [121.045, 14.814],
    [127.152, 36.806],
    [-44.054, -19.932],
    [-115.145, 36.169],
    [80.450, 16.300],
    [-89.971, 35.118],
    [53.217, 56.850],
    [6.772, 51.231],
    [-47.458, -23.502],
    [-35.015, -8.113],
    [24.934, 60.176],
    [139.983, 35.695],
    [-83.048, 42.332],
    [28.835, 47.023],
    [17.033, 51.110],
    [101.607, 3.107],
    [153.400, -28.017],
    [77.320, 28.570],
    [83.787, 53.357],
    [-89.971, 35.118],
    [-37.050, -10.917],
    [-66.157, -17.394],
    [20.067, 32.117],
    [127.149, 35.822],
    [-123.114, 49.261],
    [4.479, 51.923],
    [9.178, 48.776],
    [121.033, 14.550],
    [-100.388, 20.588],
    [-4.250, 55.861],
    [71.673, 40.995],
    [81.717, 21.367],
    [48.367, 54.317],
    [74.881, 12.870],
    [104.300, 52.283],
    [89.182, 42.950],
    [8.883, 9.933],
    [-76.615, 39.286],
    [31.334, 29.842],
    [33.343, 47.909],
    [-90.596, 14.531],
    [109.341, -0.021],
    [-56.097, -15.596],
    [-38.967, -12.267],
    [135.067, 48.483],
    [44.022, 13.579],
    [24.107, 56.948],
    [65.705, 31.608],
    [39.850, 57.617],
    [120.983, 14.450],
    [85.867, 20.450],
    [85.879, 20.465],
    [-65.217, -26.817],
    [11.981, 57.672],
    [-48.277, -18.919],
    [12.569, 55.676],
    [103.610, -1.590],
    [122.951, 10.676]
]
let randCityNumber = Math.floor(Math.random() * cities.length);
const startingLocation = cities[randCityNumber]
// const startingLocation = startingLocations[Math.floor(Math.random() * startingLocations.length)]


mapboxgl.accessToken = 'pk.eyJ1IjoiY2Fza2VzIiwiYSI6ImNsZGtwdGRrdzA4dWMzb3BoMWdxM3Zib2UifQ.2q2xfShG5nmDHTxg7n_ZhQ';
var map = new mapboxgl.Map({
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

function newRandomLocation() {
    map.flyTo({ center: startingLocation });
}

/* Get the documentElement (<html>) to display the page in fullscreen */
var elem = document.documentElement;

/* View in fullscreen */
function openFullscreen() {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
    }
}

/* Close fullscreen */
function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
    }
}


$(".startButton").click(
    hideWelcomCoverPage
);
// $("#coverContainer").click(
//     hideWelcomCoverPage
// );

function hideWelcomCoverPage() {
    $(".WelcomeDiv").toggleClass("transparent");
    $("#coverContainer").toggleClass("transparent");
    runQuery();


    setTimeout(function() {
        $(".WelcomeDiv").hide();
        $("#coverContainer").hide();
    }, 500);
}

var hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: true
});

var popup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true
});

var listPopup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true
});

var contentpopup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: false
});

function buildAllVisibleItems() {

    // var features = map.queryRenderedFeatures({ layers: ['QnbrLayer'] });

    // console.log(features);
    // console.log(QnbrDone);
}

function flyTo(lon, lat, zoom) {
    if (zoom === undefined) { zoom = 14 };
    map.flyTo({
        center: [
            lon,
            lat
        ],
        zoom: zoom,
        essential: true // this animation is considered essential with respect to prefers-reduced-motion
    });
};

map.on('load', function() {
    mapIsActive = true;



    // adding geocoer search box one welkom screen
    var geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl
    });
    document.getElementById('geocoderWelcome').appendChild(geocoder.onAdd(map))

    //adding geocoder
    var geocoder2 = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl
    });
    document.getElementById('geocoderMap').appendChild(geocoder2.onAdd(map))



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
        clusterRadius: 16,
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
            'text-size': 12,
        },
        paint: {
            "text-color": "#ffffff"
        }
    });

    // inspect a cluster on click
    map.on('click', 'clusters', function(e) {
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']
        });
        var clusterId = features[0].properties.cluster_id;
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
    // var coordinates = e.features[0].geometry.coordinates.slice();

    // // Ensure that if the map is zoomed out such that
    // // multiple copies of the feature are visible, the
    // // popup appears over the copy being pointed to.
    // while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    // coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    // }
    // });

    map.on('mouseenter', 'clusters', function(e) {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'clusters', function() {
        map.getCanvas().style.cursor = '';
    });

    map.on('contextmenu', 'clusters', function(e) {

        var features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        var clusterId = features[0].properties.cluster_id,
            point_count = features[0].properties.point_count,
            clusterSource = map.getSource( /* cluster layer data source id */ 'wikipediaSource');

        // Get all points under a cluster
        clusterSource.getClusterLeaves(clusterId, point_count, 0, function(err, aFeatures) {
            var e = {};
            e.features = aFeatures;

            openPopupListBelowClick(e);
        })

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
                                    addLayerWithIcons() // All images are now loaded, add layer that uses the images

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
            "id": "QnbrLayerIcon",
            "type": "symbol",
            "source": "QnbrSource",
            // "source-layer": "gp_registered_patients",
            // "filter": ["in", "stack", "two","three","five","nine","one"],
            // "minzoom": 11,
            // "interactive": true,
            "layout": {
                // "icon-offset": [14,-154],
                "icon-image": [
                    "match", ["get", "cat"],
                    ["Architectural"],
                    "archi", ["Event"],
                    "event",
                    "other"
                ],
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
                "icon-padding": 0,
                "icon-size": 0.6,
            },
        });
    }


    // hover popup QnumberLayer
    map.on('mousemove', 'QnbrLayerIcon', function(e) {
        var hoverdQID = e.features[0].properties.Qnbr;
        if (ResultsObject[hoverdQID].imgthum != undefined) {
            var html = '<img src="' + ResultsObject[hoverdQID].imgthum + '" alt="' + ResultsObject[hoverdQID].label + '" class="popupImg">';
            hoverPopup
                .setLngLat(e.lngLat)
                .setHTML(html)
                .addTo(map);

            map.getCanvas().style.cursor = 'pointer';
        } else {
            var html = '<p class="popupText">No image</p>';
        }
        // console.log(e);
    });
    map.on('mouseleave', 'QnbrLayerIcon', function() {
        map.getCanvas().style.cursor = '';
        hoverPopup.remove();
    });

    // hover popup Wikipedia Layer
    map.on('mousemove', 'unclustered-point', hoverPopupOn);
    map.on('mouseleave', 'unclustered-point', hoverPopupOff);
    map.on('mousemove', 'cluster-count', hoverPopupOn);
    map.on('mouseleave', 'cluster-count', hoverPopupOff);

    // click
    map.on('click', function(e) {
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


function hoverPopupOn(e) {
    // console.log(e.features);
    if (e.features.length == 1) { // one article
        if (e.features[0].properties.title != undefined) {
            var articleTitle = e.features[0].properties.title; // getting article title
            var html = '<ul class="articleDropdown"><li id="">' + articleTitle + '</li></ul>'; // generate html for one article using artile title
        } else {
            var html = '<ul class="articleDropdown"><li id="">Click to zoom</li></ul>'; // generate html for one article using artile title
        }
    } else if (e.features.length > 1) { // mor than one article
        var html = '<ul class="articleDropdown"><li id="">' + e.features.length + " articles." + '</li></ul>'; // generating html for  more than one article uusing the number of articles as a title.
    }

    var coordinates = e.features[0].geometry.coordinates.slice(); // latLng to place popup

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) { // avoid missplacinf popup on zomed out world where some part of the mercato projection is visible twice.
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    hoverPopup //popup simple name of article or number of articles under mouse
        .setLngLat(coordinates)
        .setHTML(html)
        .addTo(map);

    $(".mapboxgl-popup-content").css({ // styling popup
        "background": "transparent",
        "padding": "0"
    })

    map.getCanvas().style.cursor = 'pointer'; // changing mouse signaling the posibility to click
}

function hoverPopupOff(e) {

    map.getCanvas().style.cursor = '';
    hoverPopup.remove();

}

function popupOpen(e) {
    //console.log(e.features)
    if (e.features.length > 1) {
        openPopupListBelowClick(e);
        return
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

var clickedListDataGlobalStorage;

function openPopupListBelowClick(e) {
    //console.log("list")
    //console.log(e)

    var listData = e.features; // local save of map data for click events that accure alter.

    var html = '';
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
        clickedListDataGlobalStorage[i] = listData[i].properties

        $("#" + e.features[i].properties.title.replace(/[^a-z0-9]/gi, '')) // use the same formating for the #id
            .attr("data-list-nbr", i)
            .click(function() {
                var listNbr = $(this).attr("data-list-nbr")
                listNbr = Number(listNbr);
                //console.log("List data binded to butons");
                //console.log(clickedListDataGlobalStorage[listNbr]);
                //console.log(clickedListDataGlobalStorage[listNbr]);
                openDetailPannel(clickedListDataGlobalStorage[listNbr]);
                listPopup.remove();
            })
    }

    // hide standard Mapbox popup CSS
    $(".mapboxgl-popup-content").has(".articleDropdown").css({
        "background": "transparent",
        "padding": "0"
    })
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
    //     var settings = {
    //         headers: { Accept: 'application/sparql-results+json' },
    //         data: { query: sparqlQuery }
    //     };
    //     return $.ajax(endpointUrl, settings).then(doneCallback);
    // }

    // var endpointUrl = 'https://query.wikidata.org/sparql',
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
    //         "    ?instance rdfs:label ?instanceLabel.      # The specification of the variables to be labeld is needed for grouping the instances of correctly\n" +
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

function processQueryResults(data) {
    //remove duplicates

    resultsFromQuery = []; //empties result array
    for (d in data.results.bindings) {
        var result = {};
        result.qnumber = qnumberExtraction(data.results.bindings[d].item.value);
        result.qnumberURL = data.results.bindings[d].item.value;
        if (data.results.bindings[d].article != undefined) { result.wikipedia = data.results.bindings[d].article.value; }
        if (data.results.bindings[d].geo != undefined) { result.geo = extractLngLat(data.results.bindings[d].geo.value); }
        if (data.results.bindings[d].img != undefined) { result.img = data.results.bindings[d].img.value; }
        if (data.results.bindings[d].img != undefined) { result.imgthum = data.results.bindings[d].img.value + "?width=600px"; }
        if (data.results.bindings[d].wikiMediaCategory != undefined) { result.commons = data.results.bindings[d].wikiMediaCategory.value; }
        if (data.results.bindings[d].wikiMediaCategory != undefined) { result.commonsurl = "https://commons.wikimedia.org/wiki/Category:" + encodeURIComponent(data.results.bindings[d].wikiMediaCategory.value); }
        if (data.results.bindings[d].itemLabel != undefined) { result.label = data.results.bindings[d].itemLabel.value; }
        if (data.results.bindings[d].itemDescription != undefined) { result.description = data.results.bindings[d].itemDescription.value; }
        if (data.results.bindings[d].instancesof != undefined) { result.instanceof = data.results.bindings[d].instancesof.value; }
        if (data.results.bindings[d].categorie != undefined) { result.categorie = data.results.bindings[d].categorie.value; }

        // resultsFromQuery.push(result);//pushes every result into the array
        ResultsObject[result.qnumber] = result;
        // buildResultsObject(result);
    }
    allQnbrs = Object.keys(ResultsObject);


    //console.log(ResultsObject);
    // console.log(resultsFromQuery);
    //console.log("@1");
    buildGeojsonFromQueryResults();
}

// Helper - organising query results to a usefull object
function buildResultsObject(result) {
    var Q = result.qnumber;
    if (ResultsObject[Q] != undefined) {
        if (ResultsObject[Q].wikipedia != results.wikipedia) {
            ResultsObject[Q].wikipedia = "";
        };
        if (ResultsObject[Q].geo != results.geo) {
            ResultsObject[Q].geo = "";
        };
        if (ResultsObject[Q].img != results.img) {
            ResultsObject[Q].img = "";
        };
        if (ResultsObject[Q].imgthum != results.imgthum) {
            ResultsObject[Q].imgthum = "";
        };
        if (ResultsObject[Q].commons != results.commons) {
            ResultsObject[Q].commons = "";
        };
        if (ResultsObject[Q].label != results.label) {
            ResultsObject[Q].label = "";
        };
        if (ResultsObject[Q].description != results.description) {
            ResultsObject[Q].description = "";
        };
        if (ResultsObject[Q].instanceof != results.instanceof) {
            ResultsObject[Q].instanceof = "";
        };
        if (ResultsObject[Q].categorie != results.categorie) {
            ResultsObject[Q].categorie = "";
        };

    } else {
        ResultsObject[Q] = result;
    }
}

// Processing - Data from wikidata to Geojson
function buildGeojsonFromQueryResults() {
    //console.log("@2");
    QnbrGeojson.features = [];
    for (i in allQnbrs) {
        addPointToQnbrGeojson(ResultsObject[allQnbrs[i]].geo, ResultsObject[allQnbrs[i]].qnumber, ResultsObject[allQnbrs[i]].categorie)
    }
    if (mapIsActive) {
        //console.log("@3");
        map.getSource('QnbrSource').setData(QnbrGeojson);
        $("#loadingBox").hide();
        setTimeout(function() {
            buildAllVisibleItems()
        }, 500);
    } else {
        //console.log("@4");
        map.on('load', function() {
            map.getSource('QnbrSource').setData(QnbrGeojson);
            $("#loadingBox").hide();
            buildAllVisibleItems()
        });
    }
}

// Helper - Add point to geojson object
function addPointToQnbrGeojson(LngLat, Qnbr, categorie) {
    // console.log("show point");
    // for (i in LngLat) {
    var point = {
        "type": "Feature",
        "properties": {
            'Qnbr': Qnbr,
            'cat': categorie
        },
        "geometry": {
            "type": "Point",
            "coordinates": LngLat
        }
    };


    QnbrGeojson.features.push(point)
        // }
}

// Helper - procesing String
function extractLngLat(dirtyGeo) {
    var cleanLongLat = dirtyGeo.replace("Point(", "");
    cleanLongLat = cleanLongLat.replace(")", "");
    const lonlat = cleanLongLat.split(" ");
    lonlat[0] = Number(lonlat[0]);
    lonlat[1] = Number(lonlat[1]);
    return lonlat;
}

// Helper - procesing String
function qnumberExtraction(QURL) {
    var value = QURL.replace("https://www.wikidata.org/entity/", "");
    return value;
}

// Query - for images from Wiki commons
function getCommonsCategoryImgs(pageTitle, Qdestination, vieuwDestination) {
    if (ResultsObject[Qdestination].commonsImgs != undefined) {
        resultsFromCommonsReady(Qdestination, vieuwDestination);
        return;
    }

    // pageTitle = encodeURIComponent(pageTitle)
    // var apiURL = "https://commons.wikimedia.org/w/api.php?action=query&format=json&list=categorymembers&pageids=4606622&utf8=1&cmtitle=Category%3A" + pageTitle + "&cmtype=subcat%7Cfile&cmlimit=max"
    $(document).ready(function() {
        $.ajax({
            url: 'https://commons.wikimedia.org/w/api.php',
            data: {
                action: 'query',
                format: 'json',
                list: 'categorymembers',
                utf8: '1',
                cmtitle: 'Category:' + pageTitle + '',
                cmtype: 'subcat|file',
                cmlimit: 'max'
            },
            dataType: 'jsonp',
            success: processResult
        });
    });

    function processResult(apiResult) {
        var imgUrlPrefix = "https://commons.wikimedia.org/wiki/Special:FilePath/";
        var pageUrlPrefix = "https://commons.wikimedia.org/wiki/";
        var thumSufix = "?width=300px";
        var arrayOfImgs = [];
        for (r in apiResult.query.categorymembers) {
            if (apiResult.query.categorymembers[r].title.slice(0, 8) != "Category") {
                var imgObject = {
                    imgurl: imgUrlPrefix + encodeURIComponent(apiResult.query.categorymembers[r].title),
                    thumurl: imgUrlPrefix + encodeURIComponent(apiResult.query.categorymembers[r].title) + thumSufix,
                    pageurl: pageUrlPrefix + encodeURIComponent(apiResult.query.categorymembers[r].title)
                };
                arrayOfImgs.push(imgObject)
            }
        }

        var firstImgObject = {
            imgurl: ResultsObject[selectedQ].img,
            thumurl: ResultsObject[selectedQ].imgthum,
            // pageurl: pageUrlPrefix + encodeURIComponent(apiResult.query.categorymembers[r].title)
        };
        arrayOfImgs.unshift(firstImgObject);

        ResultsObject[Qdestination].commonsImgs = arrayOfImgs;
        //  for (var i = 0; i < apiResult.query.search.length; i++){
        //       $('#display-result').append('<p>'+apiResult.query.search[i].title+'</p>');
        //  }
        resultsFromCommonsReady(Qdestination, vieuwDestination);
    };
}

// Processing Commons images
function resultsFromCommonsReady(Q, vieuwDestination) {
    //console.log(ResultsObject[Q]);
    switch (vieuwDestination) {
        case "gallery":
            populateGalleryVieuw(Q);

            break;
        case "carousel":
            buildCarouselContent(Q);

            break;
        default:
            break;
    }

    // return results;
}

// Helper - open link in new window
function openInNewWindow(url) {
    if (selectedQ === undefined) {
        var lngLat = map.getCenter();
        var lng = lngLat.lng;
        var lat = lngLat.lat;
    } else {
        var lng = ResultsObject[selectedQ].geo[0];
        var lat = ResultsObject[selectedQ].geo[1];
    }


    //selectedQ
    switch (url) {
        case "wikidata":
            url = "https://www.wikidata.org/wiki/" + selectedQ;
            break;
        case "wikipedia":
            url = ResultsObject[selectedQ].wikipedia;
            break;
        case "commons":
            url = "url-commons";
            break;
        case "wikimedia":
            url = ResultsObject[selectedQ].commonsurl;
            break;
        case "googleMaps":
            url = "https://www.google.com/maps/@" + lat + "," + lng + ",1000m/data=!3m1!1e3";
            break;
        case "flickr":
            url = "https://www.flickr.com/map?&fLat=" + lat + "&fLon=" + lng + "&zl=15"
            break;
        case "wikishootme":
            url = "https://tools.wmflabs.org/wikishootme/#lat=" + lat + "&lng=" + lng + "&zoom=14";
            break;
        default:
            console.log("no url recognised")
            break;
    }
    //console.log("open: " + url)
    window.open(url); //This will open the url in a new window.
}

// Interaction - Selection processing
function selectNew(Q) {
    if (Q === undefined) {
        selectedQ = undefined;
        // $("#selectionContainer").hide();
        $("#selectionContainer").css({ 'display': 'none' });
        $(".singleImgSelection").hide();
        $("#slideshow-container").hide();
        $("#wikidata").hide();
        $("#commons").hide();
        //console.log("unselected");
    } else {
        var data = ResultsObject[Q]
        selectedQ = Q;
        //console.log("selected" + Q);

        $("#wikidata").show();
        $("#commons").show();
        $("#slideshow-container").hide();
        // $("#selectionContainer").show();
        $("#selectionContainer").css({ 'display': 'flex' });
        $(".singleImgSelection").attr("src", data.imgthum);
        $("#slectedItemTitle").text(data.label);
        // $("#slectedItemDescription").text(data.description);
        $("#slectedItemCategory").text(data.categorie);
        // $(".singleImgSelection").attr("src", data.imgthum);
        $(".singleImgSelection").show();
        // getCommonsCategoryImgs(data.commons, selectedQ, "carousel");
    };

    // if (data != undefined && lat != undefined) {
    //     flyTo(lng, lat, zoom); //camera flyes to selection
    //     showPoint(lng, lat); // highlight map point
    // };
}



wikipdiaApiGeoRequest();
// Wikipedia query from here:

function wikipdiaApiGeoRequest() {
    let canvas = map.getCanvas()
    let w = canvas.width
    let h = canvas.height
    let cUL = map.unproject([0, 0]).toArray()
    let cLR = map.unproject([w, h]).toArray()

    let cornerCoordinates = map.getBounds()
    let crns = [cornerCoordinates["_ne"].lat, cornerCoordinates["_sw"].lng, cornerCoordinates["_sw"].lat, cornerCoordinates["_ne"].lng]
    console.log(cornerCoordinates["_ne"].lat);
    console.log(cornerCoordinates["_sw"].lng);
    console.log(cornerCoordinates["_sw"].lat);
    console.log(cornerCoordinates["_ne"].lng);

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
    console.log("@1");

    $.each(jsonData.query.geosearch, function(index, value) {
        //console.log( index + ": " + value.title );
        var article = {
            "pageId": value.pageid,
            "title": value.title,
            "lonLat": [value.lon, value.lat]
        }

        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            article.url = 'https://en.m.wikipedia.org/?curid=' + value.pageid;
        } else {
            article.url = 'https://en.wikipedia.org/?curid=' + value.pageid;
        }

        // console.log("Found Article " + index + ": " + article.title);
        // console.log(article);
        addWikipadiaPage(article)
    });
    updateWikipediaGeojsonSource();
}

function stopAllAjax() {
    $.each(ajaxQueue, function(index, item) {
        item.abort();
        item = null;
    });
    ajaxQueue = new Array();
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
        var point = { //write the specific geojson feature for this point
            "type": "Feature",
            "properties": article, // all info known about the article is saved as property
            "geometry": {
                "type": "Point",
                "coordinates": article.lonLat
            }
        };
        wikipediaGeojson.features.push(point) // add the newly created geojson feature the geojson
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
        $("#loadingBox").hide();
    } else {
        map.on('load', function() {
            map.getSource('wikipediaSource').setData(wikipediaGeojson);
            $("#loadingBox").hide();
        });
    }
}


function openDetailPannel(selectionInfo) {
    //console.log("This is selected:");
    //console.log(selectionInfo);
    detailsPannelData = {
        "wikipedia_ApiOngoing": false, // current status of API resquest
        "wikimedia_ApiOngoing": false, // current status of API resquest
        "wikidata_ApiOngoing": false, // current status of API resquest
        "wikipedia_QueryDone": false, // Data collection status
        "wikimedia_QueryDone": false, // Data collection status
        "wikidata_QueryDone": false // Data collection status
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
    var wikipediaApiRespons = jsonData.query.pages[0];

    detailsPannelData.wikipedia_Intro = wikipediaApiRespons.extract;
    detailsPannelData.wikipedia_ImgTitle = wikipediaApiRespons.pageimage;
    detailsPannelData.Qnumber = wikipediaApiRespons.pageprops.wikibase_item;
    if (wikipediaApiRespons.pageimage != undefined) {
        detailsPannelData.wikipedia_ImgUrl = "https://commons.wikimedia.org/wiki/Special:FilePath/" + wikipediaApiRespons.pageimage;
    }
    detailsPannelData.wikipedia_Categories = [];

    //ToDo: get a desent thumnail. Maibe by transforming img url?

    // if (wikipediaApiRespons.thumbnail != undefined) {
    //     var url = wikipediaApiRespons.thumbnail.source;
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
        WikidataApiRequestDetails()
    }

    updateDetailsPannel();
}


function CommonsApiRequest(pageID) {
    detailsPannelData.wikipedia_ApiOngoing = true;
    requestURL = 'https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&prop=extracts%7Cpageprops%7Cpageimages%7Ccategories&pageids=' + pageID + '&utf8=1&formatversion=latest&exintro=1';
    // API sandox link: https://en.wikipedia.org/wiki/Special:ApiSandbox#action=query&format=json&origin=*&prop=extracts%7Cpageprops%7Cpageimages%7Ccategories&pageids=58387057&utf8=1&formatversion=latest&exintro=1
    ajaxQueue.push($.getJSON(requestURL, function(data) {
        parseCommonsApiResponseDetails(data);
    }));
}

function parseCommonsApiResponseDetails(jsonData) {
    var wikipediaApiRespons = jsonData.query.pages[0];

    detailsPannelData.wikipedia_Intro = wikipediaApiRespons.extract;
    detailsPannelData.wikipedia_ImgTitle = wikipediaApiRespons.pageimage;
    detailsPannelData.Qnumber = wikipediaApiRespons.pageprops.wikibase_item;
    detailsPannelData.wikipedia_ImgUrl = "https://commons.wikimedia.org/wiki/Special:FilePath/" + wikipediaApiRespons.pageimage;
    detailsPannelData.wikipedia_Categories = [];

    //ToDo: get a desent thumnail. Maibe by transforming img url?

    // if (wikipediaApiRespons.thumbnail != undefined) {
    //     var url = wikipediaApiRespons.thumbnail.source;
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
        WikidataApiRequestDetails()
    }

    updateDetailsPannel();
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
        sparqlQuery = "SELECT ?item ?itemLabel ?itemDescription ?img ?commons ?WikipediaLink ?elevation ?area ?officialWebsite ?flagImage ?LonLat ?coatOfArmsImage ?CommonsCategory ?FreebaseIdGoogleSearch ?GoogleKnowledgeGraphId ?startTime ?endTime ?inception ?religion ?significantEvent ?audio ?maximumCapacity ?visitorsPerYear ?heritageDesignationLabel ?length ?width ?height ?planViewImage ?FacebookId ?GoogleMapsCustomerId ?InstagramUsername ?MapillaryId ?TwitterUsername ?OpenStreetMapRelationId ?InstagramLocationId ?FoursquareVenueId ?ImdbId ?LinkedInCompanyId ?TripAdvisorId ?YelpId ?YouTubeChannelId ?phoneNumber ?emailAddress ?subreddit ?GoogleArtsCulturePartnerId ?population ?commonsLink ?instanceOfLabel WHERE {\n" +
        "\n" +
        "  # https://www.wikidata.org/wiki/Q2981 Notre Dam of Paris\n" +
        "  # https://www.wikidata.org/wiki/Q243 Toure Eiffel\n" +
        "    \n" +
        "  VALUES ?item { #?item variable is set to Qnumber\n" +
        "    wd:" + detailsPannelData.Qnumber + "\n" +
        "  }\n" +
        "  \n" +
        "  OPTIONAL { ?item  wdt:P18   ?img. }\n" +
        "  OPTIONAL { ?item  wdt:P373  ?commonsLink. }\n" +
        "  OPTIONAL { ?item  wdt:P31   ?instanceOf. }\n" +
        "  OPTIONAL { ?item  wdt:P625  ?LonLat. }\n" +
        "  OPTIONAL { ?item  wdt:P1082 ?population. }\n" +
        "  OPTIONAL { ?item  wdt:P2044 ?elevation. }\n" +
        "  OPTIONAL { ?item  wdt:P2046 ?area. }\n" +
        "  OPTIONAL { ?item  wdt:P856  ?officialWebsite. }\n" +
        "  OPTIONAL { ?item  wdt:P41   ?flagImage. }\n" +
        "  OPTIONAL { ?item  wdt:P94   ?coatOfArmsImage. }\n" +
        "  OPTIONAL { ?item  wdt:P373  ?CommonsCategory. }\n" +
        "  OPTIONAL { ?item  wdt:P646  ?FreebaseIdGoogleSearch. }\n" +
        "  OPTIONAL { ?item  wdt:P2671 ?GoogleKnowledgeGraphId. }\n" +
        "  OPTIONAL { ?item  wdt:P580  ?startTime. }\n" +
        "  OPTIONAL { ?item  wdt:P582  ?endTime. }\n" +
        "  OPTIONAL { ?item  wdt:P571  ?inception. }\n" +
        "  OPTIONAL { ?item  wdt:P140  ?religion. }\n" +
        "  OPTIONAL { ?item  wdt:P793  ?significantEvent. }\n" +
        "  OPTIONAL { ?item  wdt:P51   ?audio. }\n" +
        "  OPTIONAL { ?item  wdt:P1083 ?maximumCapacity. }\n" +
        "  OPTIONAL { ?item  wdt:P1174 ?visitorsPerYear. }\n" +
        "  OPTIONAL { ?item  wdt:P1435 ?heritageDesignation. }\n" +
        "  OPTIONAL { ?item  wdt:P2043 ?length. }\n" +
        "  OPTIONAL { ?item  wdt:P2049 ?width. }\n" +
        "  OPTIONAL { ?item  wdt:P2048 ?height. }\n" +
        "  OPTIONAL { ?item  wdt:P3311 ?planViewImage. }\n" +
        "  OPTIONAL { ?item  wdt:P2013 ?FacebookId. }\n" +
        "  OPTIONAL { ?item  wdt:P3749 ?GoogleMapsCustomerId. }\n" +
        "  OPTIONAL { ?item  wdt:P2003 ?InstagramUsername. }\n" +
        "  OPTIONAL { ?item  wdt:P1947 ?MapillaryId. }\n" +
        "  OPTIONAL { ?item  wdt:P2002 ?TwitterUsername. }\n" +
        "  OPTIONAL { ?item  wdt:P402  ?OpenStreetMapRelationId. }\n" +
        "  OPTIONAL { ?item  wdt:P4173 ?InstagramLocationId. }\n" +
        "  OPTIONAL { ?item  wdt:P1968 ?FoursquareVenueId. }\n" +
        "  OPTIONAL { ?item  wdt:P345  ?ImdbId. }\n" +
        "  OPTIONAL { ?item  wdt:P4264 ?LinkedInCompanyId. }\n" +
        "  OPTIONAL { ?item  wdt:P3134 ?TripAdvisorId. }\n" +
        "  OPTIONAL { ?item  wdt:P3108 ?YelpId. }\n" +
        "  OPTIONAL { ?item  wdt:P2397 ?YouTubeChannelId. }\n" +
        "  OPTIONAL { ?item  wdt:P1329 ?phoneNumber. }\n" +
        "  OPTIONAL { ?item  wdt:P968  ?emailAddress. }\n" +
        "  OPTIONAL { ?item  wdt:P3984 ?subreddit. }\n" +
        "  OPTIONAL { ?item  wdt:P4702 ?GoogleArtsCulturePartnerId. }\n" +
        "  \n" +
        "  OPTIONAL {\n" +
        "    ?WikipediaLink schema:about ?item;\n" +
        "      schema:isPartOf <https://en.wikipedia.org/>.\n" +
        "  }\n" +
        "  OPTIONAL { SERVICE wikibase:label { bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\". } }\n" +
        "  OPTIONAL {\n" +
        "    SERVICE wikibase:label {\n" +
        "      bd:serviceParam wikibase:language \"[AUTO_LANGUAGE],en\".\n" +
        "      ?item rdfs:label ?itemLabel;\n" +
        "        schema:description ?itemDescription.\n" +
        "    }\n" +
        "  }\n" +
        "}";

    makeSPARQLQuery(endpointUrl, sparqlQuery, function(data) {
        $('body').append($('<pre>').text(JSON.stringify(data)));
        //console.log(data.results.bindings);
        WikidataApiResultsProcessingDetails(data.results.bindings)
    });

    function WikidataApiResultsProcessingDetails(data) {
        cleanResults()

        function cleanResults() {
            var gatherdResults = {}; //raw results come in with a lot of fluf and in repated fashon to account for several values. Here we keep the minimum and put the results in an array if needed.

            for (i in data) { // loop throug resonds sets
                var keys = Object.keys(data[i]); //get all the object's keys 
                for (k in keys) {
                    if (gatherdResults[keys[k]] === undefined) { //If no value was ever saved for this key(variable name)
                        gatherdResults[keys[k]] = [data[i][keys[k]].value]; // save value in a new array
                    } else {
                        if (jQuery.inArray(data[i][keys[k]].value, gatherdResults[keys[k]]) === -1) // If this value does not exist in array
                            gatherdResults[keys[k]].push(data[i][keys[k]].value) // then add to array
                    }
                }
            }
            //console.log(gatherdResults);
            makeResultsUsefull(gatherdResults)
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
                    var value = "";

                    switch (keys[k]) { // for every variable there is an other method of enriching.
                        case "CommonsCategory":
                            value = "https://commons.wikimedia.org/wiki/Category:" + encodeURIComponent(data[keys[k]][v]);
                            break;

                        case "LonLat":
                            value = data[keys[k]][v];
                            value = value.replace("Point(", "");
                            value = value.replace(")", "");
                            value = value.split(" ");
                            value = [Number(value[0]), Number(value[1])]
                            break;

                            // this changes the img url  to the img page 
                            // case "img":
                            //     value = data[keys[k]][v];
                            //     value = value.replace(
                            //         "https://commons.wikimedia.org/wiki/Special:FilePath/",
                            //         "https://commons.wikimedia.org/wiki/File:"
                            //     )
                            //     break;

                        case "TwitterUsername":
                            value = "https://twitter.com/" + data[keys[k]][v];
                            break;

                        case "height":
                            value = data[keys[k]][v] + " meters";
                            break;

                        case "FreebaseIdGoogleSearch":
                            value = "https://www.google.com/search?kgmid=" + encodeURIComponent(data[keys[k]][v]);
                            break;

                        case "commonsLink":
                            value = "https://commons.wikimedia.org/wiki/Category:" + encodeURIComponent(data[keys[k]][v]);
                            break;

                        case "inception":
                            value = data[keys[k]][v].split("-");
                            value = value[0];
                            break;

                        case "length":
                            value = data[keys[k]][v] + " meters";
                            break;

                        case "FacebookId":
                            value = "https://www.facebook.com/" + encodeURIComponent(data[keys[k]][v]);
                            break;

                        case "FoursquareVenueId":
                            value = "https://foursquare.com/v/" + encodeURIComponent(data[keys[k]][v]);
                            break;

                        case "GoogleMapsCustomerId":
                            value = "https://maps.google.com/?cid=" + encodeURIComponent(data[keys[k]][v]);
                            break;

                        case "InstagramLocationId":
                            value = "https://www.instagram.com/explore/locations/" + encodeURIComponent(data[keys[k]][v]) + "/";
                            break;

                        case "InstagramUsername":
                            value = "https://www.instagram.com/" + encodeURIComponent(data[keys[k]][v]) + "/";
                            break;

                        case "ImdbId":
                            value = "https://wikidata-externalid-url.toolforge.org/?p=345&url_prefix=https://www.imdb.com/&id=" + encodeURIComponent(data[keys[k]][v]);
                            break;

                        case "LinkedInCompanyId":
                            value = "https://www.linkedin.com/company/" + encodeURIComponent(data[keys[k]][v]);
                            break;

                        case "MapillaryId":
                            value = "https://www.mapillary.com/map/im/" + encodeURIComponent(data[keys[k]][v]);
                            break;

                        case "TripAdvisorId":
                            value = "https://www.tripadvisor.com/" + encodeURIComponent(data[keys[k]][v]);
                            break;

                        case "YelpId":
                            // value = "https://www.yelp.com/biz/" + encodeURIComponent(data[keys[k]][v]);
                            value = "https://www.yelp.com/biz/" + data[keys[k]][v];
                            break;

                        case "YouTubeChannelId":
                            value = "https://www.youtube.com/channel/" + encodeURIComponent(data[keys[k]][v]);
                            break;

                        case "visitorsPerYear":
                            value = bigNumberFormater(data[keys[k]][v]) + " visitors per year";
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
                    if (detailsPannelData["Wikidata_" + keys[k]] === undefined) { // does it exist?
                        detailsPannelData["Wikidata_" + keys[k]] = [value]; // then: replace
                    } else {
                        detailsPannelData["Wikidata_" + keys[k]].push(value); // then: save as new
                    }
                }
            }
            console.log(detailsPannelData);
            // popup.setHTML(popuphtml())
            updateDetailsPannel()
            if (!detailsPannelData.wikimedia_ApiOngoing && !detailsPannelData.wikimedia_QueryDone && (detailsPannelData.Wikidata_CommonsCategory != undefined || detailsPannelData.Wikidata_commonsLink != undefined)) {
                console.log("should call Commons API");
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

function popuphtml() {
    var html = "";
    html += "<table>";
    var keys = Object.keys(detailsPannelData);
    for (i in keys) {
        html += "<tr><td>";
        html += keys[i];
        html += "</td><td>";
        html += detailsPannelData[keys[i]];
        html += "</td></tr>";
    }

    // <table>
    //     <tr>
    //         <td>Alfreds Futterkiste</td>
    //         <td>Maria Anders</td>
    //     </tr>
    // </table>
    // console.log(html);
    return html;
}

function updateDetailsPannel() {
    console.log(detailsPannelData);


    resetDetailsPannel();

    function resetDetailsPannel() {
        $("#article-title").text("no title");
        $("#article-intro").html("");
        // $("#article-year").text("-");
        $("#article-year").hide();
        $("#articleimage").hide();
        // $("#article-image-loader").attr("display", "block");
        $("#article-image").attr("src", "img/kutgif.gif");
        // $("#article-image").attr("alt", "loading");
        // $("#article-description").html("no discription");
        $("#article-visitors").text("-");
        $("#article-instance-of").html("-");

        $("#article-wikidata").hide();
        $("#article-wikidata").attr("href", "");

        $("#article-wikipedia").hide();
        $("#article-wikipedia").attr("href", "");

        $("#article-wikicommons").hide();
        $("#article-wikicommons").attr("href", "");

        $("#article-google-search").hide();
        $("#article-google-search").attr("href", "");

        $("#article-google-maps").hide();
        $("#article-google-maps").attr("href", "");
    }

    $("#article-title").text(detailsPannelData.Map_title);
    $("#article-intro").html(detailsPannelData.wikipedia_Intro);

    // year label 
    let yearLabel = formatingInseption();
    if (yearLabel) {
        $("#article-year").text(yearLabel);
        $("#article-year").show();
    }

    if (detailsPannelData.wikipedia_ImgUrl != undefined) {
        $("#articleimage").show();
        // $("#article-image-loader").attr("display", "none");
        // $("#article-image").removeClass("loader");

        $("#article-image").attr("src", detailsPannelData.wikipedia_ImgUrl);
        $("#article-image").attr("alt", detailsPannelData.wikipedia_ImgTitle);

    }

    // $("#article-description").html(detailsPannelData.Wikidata_itemDescription);
    $("#article-visitors").text(formatingVisitors());
    $("#article-instance-of").html(formatingInstanceOfList());

    if (detailsPannelData.Wikidata_item != undefined) {
        $("#article-wikidata").attr("href", detailsPannelData.Wikidata_item);
        $("#article-wikidata").show();
    }

    if (detailsPannelData.Wikidata_WikipediaLink != undefined) {
        $("#article-wikipedia").attr("href", detailsPannelData.Wikidata_WikipediaLink);
        $("#article-wikipedia").show();
    }

    if (detailsPannelData.Wikidata_CommonsCategory != undefined) {
        $("#article-wikicommons").attr("href", detailsPannelData.Wikidata_CommonsCategory);
        $("#article-wikicommons").show();
    }

    if (detailsPannelData.Wikidata_FreebaseIdGoogleSearch != undefined) {
        $("#article-google-search").attr("href", detailsPannelData.Wikidata_FreebaseIdGoogleSearch);
        $("#article-google-search").show();
    }

    if (detailsPannelData.Wikidata_GoogleMapsCustomerId != undefined) {
        $("#article-google-maps").attr("href", detailsPannelData.Wikidata_GoogleMapsCustomerId);
        $("#article-google-maps").show();
    }

    function formatingInseption() {
        var value = "";
        if (detailsPannelData.Wikidata_inception != undefined) {
            return "From " + detailsPannelData.Wikidata_inception;
        } else {
            return
        }
    }

    function formatingVisitors() {
        var visitors = "-";
        if (detailsPannelData.Wikidata_visitorsPerYear != undefined) {
            var visitorsString = detailsPannelData.Wikidata_visitorsPerYear.toString()
            visitors = visitorsString.replace("visitors per year", " ");
        }
        return visitors;
    }

    function formatingInstanceOfList() {
        var string = "";
        var array = detailsPannelData.Wikidata_instanceOfLabel;
        for (i in array) {
            string += array[i]
            if (i < array.length - 1) {
                string += ", "
            }
        }
        return string
    }
    showInfopanel();
}





// on map movement queries: wikipedia API, Wikidata query, Wiki commons API (toggle for all 3)
// plaatje, title, intro, Wikipedia link, Wikidata link, mini discription, (list of related categories: quality?)
// extra from Qnbr: instance of, official website, inception, part of, pronunciation audio, date of official opening, commons ategorie, significant event, 
// audio, visitors per year, height, area, Google Maps Customer ID, Insta Location, Mapillary ID, Facebook ID, Freebase ID (Google Search), Instagram username, Twitter username
// extra LonLat: Google maps link, Bing maps, WikiShootMe
// extra form commons: photo album, hi qualit images, image locator tool
// options: see images arround this location