const LAYERDATA = {
    Land: {
        options: {
            type: 'background',
            paint: {
                'background-color': '#f0e8e4'
            }
        }
    },
    Greens: {
        source: 'Greens.pbf',
        options: {
            type: 'fill',
            minzoom: 12,
            maxzoom: 21,
            paint: {
                'fill-color': '#b4c8b4'
            }
        }
    },
    Parks: {
        source: 'Parks.pbf',
        options: {
            type: 'fill',
            minzoom: 12,
            maxzoom: 21,
            paint: {
                'fill-color': '#b8c8aa'
            }
        }
    },
    Water: {
        source: 'Water.pbf',
        options: {
            type: 'fill',
            minzoom: 12,
            maxzoom: 21,
            paint: {
                'fill-color': '#c4d4e4'
            }
        }
    },
    Streets: {
        source: 'Streets.pbf',
        options: {
            type: 'line',
            minzoom: 12,
            maxzoom: 21,
            paint: {
                'line-color': [
                    'match', ['get', 'C'],
                    1, '#d0e0c8',
                    '#ffffff'
                ],
                'line-width': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                        12, [
                            'match', ['get', 'C'],
                            7, 2,
                            6, 2,
                            5, 1,
                            4, 1,
                            3, 1,
                            0
                        ],
                        19, [
                            'match', ['get', 'C'],
                            7, 28,
                            6, 24,
                            5, 16,
                            4, 12,
                            3, 8,
                            4
                        ]
                ]
            }
        }
    },
    Buildings: {
        source: 'Buildings.pbf',
        options: {
            type: 'fill',
            minzoom: 13.5,
            maxzoom: 21,
            paint: {
                'fill-color': '#ddd8cc',
                'fill-opacity': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                    13, 0.1,
                    15.5, 1
                ]
            }
        }
    },
    Trees: {
        source: 'Trees.pbf',
        options: {
            type: 'circle',
            minzoom: 14,
            maxzoom: 21,
            paint: {
                'circle-color': '#008800',
                'circle-radius': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                    14, 2,
                    19, 10
                ],
                'circle-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    14, [
                        'case', ['boolean', ['feature-state', 'hover'], false],
                        1, 0
                    ],
                    15, [
                        'case', ['boolean', ['feature-state', 'hover'], false],
                        1, 0.3
                    ],
                    19, [
                        'case', ['boolean', ['feature-state', 'hover'], false],
                        1, 0.7
                    ],
                ]
            }
        }
    },
    City: {
        source: 'City.pbf',
        options: {
            type: 'line',
            minzoom: 12,
            maxzoom: 14,
            paint: {
                'line-color': '#44aa44',
                'line-width': 2
            }
        }
    },
    BuildingLabels: {
        source: 'Buildings.pbf',
        options: {
            type: 'symbol',
            minzoom: 17,
            maxzoom: 21,
            layout: {
                'text-field': ['get', '#'],
                'text-font': ['Noto Sans Bold'],
                'text-size': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                    17, 8,
                    21, 20
                ],
            },
            paint: {
                'text-color': '#999988',
                'text-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    17, 0,
                    18, 1
                ]
            }
        }
    },
    StreetLabels: {
        source: 'Streets.pbf',
        options: {
            type: 'symbol',
            minzoom: 13,
            maxzoom: 21,
            layout: {
                'text-field': ['get', 'N'],
                'text-font': ['Noto Sans Bold'],
                'text-size': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                    13, 10,
                    17, [
                        'match', ['get', 'C'],
                        7, 15,
                        6, 15,
                        5, 15,
                        4, 13,
                        10
                    ],
                    21, [
                        'match', ['get', 'C'],
                        7, 32,
                        6, 28,
                        5, 28,
                        4, 24,
                        3, 20,
                        16
                    ],
                ],
                'symbol-placement': 'line',
                'symbol-spacing': 500
            },
            paint: {
                'text-color': 'rgb(136, 148, 118)',
                'text-halo-color': 'rgb(255, 255, 250)',
                'text-halo-width': 1,
                'text-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    13.5, 0,
                    14.5, [
                        'match', ['get', 'C'],
                        7, 1,
                        6, 1,
                        5, 1,
                        0
                    ],
                    15.5, [
                        'match', ['get', 'C'],
                        7, 1,
                        6, 1,
                        5, 1,
                        4, 1,
                        0
                    ],
                    16.5, 1
                ]
            }
        }
    },
    FeatureLabels: {
        source: 'FeatureLabels.pbf',
        options: {
            type: 'symbol',
            minzoom: 14,
            maxzoom: 21,
            layout: {
                'text-field': ['get', 'name'],
                'text-font': ['Noto Sans Bold'],
                'text-size': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                    14, 10,
                    21, 36
                ]
            },
            paint: {
                'text-color': 'rgb(88, 124, 55)',
                'text-halo-color': 'rgba(255, 255, 250, 0.5)',
                'text-halo-width': 2,
                'text-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    14, 0,
                    15, 1
                ],
            }
        }
    },
    ParkLabels: {
        source: 'ParkLabels.pbf',
        options: {
            type: 'symbol',
            minzoom: 12,
            maxzoom: 21,
            layout: {
                'text-field': ['get', 'name'],
                'text-font': ['Noto Sans Bold'],
                'text-size': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                    12, 10,
                    21, 60
                ],
                'text-variable-anchor': ['center', 'top', 'bottom'],
                'text-radial-offset': 1,
                'text-justify': 'auto'
            },
            paint: {
                'text-color': 'rgb(58, 122, 12)',
                'text-halo-color': 'rgba(255, 255, 250, 0.5)',
                'text-halo-width': 2,
                'text-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    12.5, 0,
                    13.5, 1
                ],
            }
        }
    },
    Landmarks: {
        source: 'Landmarks.pbf',
        images: [
            {
                name: 'landmark-icon',
                source: 'landmark-icon.png'
            },
            {
                name: 'landmark-multiple-icon',
                source: 'landmark-multiple-icon.png'
            },
            {
                name: 'landmark-notable-icon',
                source: 'landmark-notable-icon.png'
            }
        ],
        options: {
            type: 'symbol',
            minzoom: 12,
            maxzoom: 21,
            layout: {
                'icon-image': [
                    'match', ['get', 'type'],
                        'notable', 'landmark-notable-icon',
                        'multiple', 'landmark-multiple-icon',
                        'landmark-icon'
                ],
                'icon-size': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                    14, [
                        'match', ['get', 'type'],
                            'notable', 0.4,
                            'multiple', 0.28,
                            0.32
                    ],
                    21, [
                        'match', ['get', 'type'],
                            'notable', 1,
                            'multiple', 0.72,
                            0.8
                    ],
                ],
                'icon-allow-overlap': true,
                'icon-anchor': 'bottom'
            }
        }
    }
}