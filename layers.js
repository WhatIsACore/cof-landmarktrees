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
    Paths: {
        source: 'Paths.pbf',
        options: {
            type: 'line',
            minzoom: 14,
            maxzoom: 21,
            paint: {
                'line-color': '#d0e0c8',
                'line-width': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                    14, 1,
                    20, 4
                ]
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
                'line-color': '#ffffff',
                'line-width': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                        12, [
                            'match', ['get', 'CLASS'],
                                'PWY', 2,
                                'ART', 2,
                                'COL', 1,
                                1
                        ],
                        19, [
                            'match', ['get', 'CLASS'],
                                'PWY', 24,
                                'ART', 24,
                                'COL', 16,
                                8
                        ]
                ]
            }
        }
    },
    Buildings: {
        source: 'Buildings.pbf',
        options: {
            type: 'fill',
            minzoom: 14,
            maxzoom: 21,
            paint: {
                'fill-color': '#ddd8cc',
                'fill-opacity': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                    13, 0.1,
                    16, 1
                ]
            }
        }
    },
    Trees: {
        source: 'Trees.pbf',
        options: {
            type: 'circle',
            minzoom: 15,
            maxzoom: 21,
            paint: {
                'circle-color': '#008800',
                'circle-radius': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                    13, 2,
                    19, 12
                ],
                'circle-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    14, [
                        'case', ['boolean', ['feature-state', 'hover'], false],
                        1, 0
                    ],
                    20, [
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
                'line-width': 3
            }
        }
    },
    StreetLabels: {
        source: 'Streets.pbf',
        options: {
            type: 'symbol',
            minzoom: 14,
            maxzoom: 21,
            layout: {
                'text-field': ['get', 'NAME'],
                'text-font': ['Noto Sans Bold'],
                'text-size': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                    13, 12,
                    16, [
                        'match', ['get', 'CLASS'],
                            'PWY', 16,
                            'ART', 16,
                            'COL', 14,
                            12
                    ],
                    21, [
                        'match', ['get', 'CLASS'],
                            'PWY', 30,
                            'ART', 30,
                            'COL', 26,
                            22
                    ]
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
                    14.5, 0,
                    15.5, [
                        'match', ['get', 'CLASS'],
                            'PWY', 1,
                            'ART', 1,
                            0
                    ],
                    16, [
                        'match', ['get', 'CLASS'],
                            'PWY', 1,
                            'ART', 1,
                            0
                    ],
                    17, [
                        'match', ['get', 'CLASS'],
                            'PWY', 1,
                            'ART', 1,
                            'COL', 1,
                            0
                    ],
                    18, 1
                ]
            }
        }
    },
    ParkLabels: {
        source: 'ParkLabels.pbf',
        options: {
            type: 'symbol',
            minzoom: 13,
            maxzoom: 21,
            layout: {
                'text-field': ['get', 'name'],
                'text-font': ['Noto Sans Bold'],
                'text-size': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                    12, 11,
                    21, 64
                ],
                'text-variable-anchor': ['center', 'top', 'bottom', 'left', 'right'],
                'text-radial-offset': 1,
                'text-justify': 'auto'
            },
            paint: {
                'text-color': 'rgb(58, 122, 12)',
                'text-halo-color': 'rgba(255, 255, 250, 0.5)',
                'text-halo-width': 2,
                'text-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    13, 0,
                    14, 1
                ],
            }
        }
    },
    // DistrictLabels: {
    //     source: 'DistrictLabels.pbf',
    //     options: {
    //         type: 'symbol',
    //         minzoom: 12,
    //         maxzoom: 15,
    //         layout: {
    //             'text-field': ['get', 'name'],
    //             'text-font': ['Noto Sans Bold'],
    //             'text-size': [
    //                 'interpolate', ['exponential', 2], ['zoom'],
    //                 12, 14,
    //                 15, 24
    //             ]
    //         },
    //         paint: {
    //             'text-color': 'rgba(40, 70, 0, 0.7)',
    //             'text-halo-color': 'rgba(255, 255, 250, 0.5)',
    //             'text-halo-width': 2,
    //             'text-halo-blur': 1,
    //             'text-opacity': [
    //                 'interpolate', ['linear'], ['zoom'],
    //                 13, 1,
    //                 15, 0
    //             ]
    //         }
    //     }
    // },
    Landmarks: {
        source: 'Landmarks.pbf',
        images: [
            {
                name: 'landmark-icon',
                source: 'landmark-icon.png'
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
                    'case', ['get', 'isNotable'],
                        'landmark-notable-icon',
                        'landmark-icon'
                ],
                'icon-size': [
                    'interpolate', ['exponential', 1.5], ['zoom'],
                    13, [
                        'case', ['get', 'isNotable'],
                            0.1, 0.08
                    ],
                    19, [
                        'case', ['get', 'isNotable'],
                            0.25, 0.2
                    ],
                ],
                'icon-allow-overlap': true,
                'icon-anchor': 'bottom'
            }
        }
    }
}