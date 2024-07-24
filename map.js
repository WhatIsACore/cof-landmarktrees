'use strict';

const $ = e => document.querySelector(e);
const $$ = e => document.querySelectorAll(e);

const LONGITUDE = -122;  // +- 0.5
const LATITUDE = 37.55;  // +- 0.2
const CENTER = [-121.974, 37.548];
const ZOOM = 15;
const GL = maplibregl;  // alias to make library switching easier (in case we decide mapbox is needed later)

const localeOptions = ['en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
}];

const map = new GL.Map({
    container: 'map',
    center: CENTER,
    style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {},
        layers: []
    },
    zoom: ZOOM,
    minZoom: 12,
    maxZoom: 20,
    maxPitch: 60,
    maxBounds: [
        [LONGITUDE - 0.5, LATITUDE - 0.2],
        [LONGITUDE + 0.5, LATITUDE + 0.2]
    ]
});

const LAYERS = Object.keys(LAYERDATA);
let landmarkData;
let targetTree, targetLandmark;  // track currently targeted (hovered) tree for actions

map.on('load', () => {

    // load landmark tree information
    fetch('landmarks/landmarkData.json').then(res => res.json()).then(json => landmarkData = json);

    // load in sources and create layers in order asynchronously
    LAYERS.forEach(async name => {
        const data = LAYERDATA[name];

        if (data.images != null)  // if images, load them first
            await Promise.all(
                data.images.map(i =>
                    new Promise(async resolve => {
                        let image = await map.loadImage(`assets/${i.source}`);
                        map.addImage(i.name, image.data);
                        resolve();
                    })
                )
            );

        if (data.source != null) {  // if geojson source, asynchronously fetch data first
            fetchSourceData(`data/${data.source}`)
            .then(json => {
                data.loaded = true;

                // create the source using obtained geojson
                map.addSource(name, {
                    type: 'geojson',
                    data: json
                });

                // determine the next loaded layer to maintain proper ordering
                let nextLoadedLayer = null;
                for (let i = LAYERS.indexOf(name) + 1; i < LAYERS.length; i++) {
                    let layerName = LAYERS[i];
                    if (LAYERDATA[layerName].loaded) {
                        nextLoadedLayer = layerName;
                        break;
                    }
                }

                map.addLayer({
                    id: name,
                    source: name,
                    ...data.options
                }, nextLoadedLayer);
            });
        } else {  // if non-geojson source, add layer directly
            data.loaded = true;
            map.addLayer({
                id: name,
                source: name,
                ...data.options
            });
        }
    });

    // tree hover interactions
    map.on('mousemove', 'Trees', e => {
        if (e.features.length == 0) return;

        map.getCanvas().style.cursor = 'pointer';

        if (targetTree != null)  // remove hover from previous tree
            map.setFeatureState(
                { source: 'Trees', id: targetTree.id },
                { hover: false }
            );

        targetTree = e.features[0];
        map.setFeatureState(
            { source: 'Trees', id: targetTree.id },
            { hover: true }
        );
        let name = targetTree.properties.name.length > 0 ?
            targetTree.properties.name.replace(/\b\w/g, c => c.toUpperCase()) :  // capitalize words
            'unknown';
        setTooltip(targetTree.geometry.coordinates, `${name}`);
    });

    map.on('mouseleave', 'Trees', e => {
        map.getCanvas().style.cursor = 'default';
        if (targetTree != null)
            map.setFeatureState(
                { source: 'Trees', id: targetTree.id },
                { hover: false }
            );
        targetTree = null;
        setTooltip();
    });

    map.on('mousemove', 'Landmarks', e => {
        if (e.features.length == 0) return;
        map.getCanvas().style.cursor = 'pointer';

        if (targetLandmark != null)  // remove hover from previous tree
            map.setFeatureState(
                { source: 'Landmarks', id: targetLandmark.id },
                { hover: false }
            );
        if (targetTree != null)  // override street tree hover
            map.setFeatureState(
                { source: 'Trees', id: targetTree.id },
                { hover: false }
            );

        targetLandmark = e.features[0];
        map.setFeatureState(
            { source: 'Landmarks', id: targetLandmark.id },
            { hover: true }
        );
        let name = targetLandmark.properties.name;
        if (targetLandmark.properties.type === 'multiple') name += ' (multiple)';
        setTooltip(targetLandmark.geometry.coordinates, `${name}`, true);
    });

    map.on('mouseleave', 'Landmarks', e => {
        map.getCanvas().style.cursor = 'default';
        if (targetLandmark != null)
            map.setFeatureState(
                { source: 'Landmarks', id: targetLandmark.id },
                { hover: false }
            );
            targetLandmark = null;
        setTooltip();
    });


    // click events
    map.on('click', 'Landmarks', e => {
        const id = e.features[0].properties.id;
        displayLandmarkCard(id);

        const rightPad = (window.innerWidth - currentCard.getBoundingClientRect().left) * 0.5;
        map.flyTo({
            center: e.features[0].geometry.coordinates,
            zoom: map.getZoom() > 16 ? map.getZoom() : 16,
            speed: 0.5,
            padding: {right: rightPad},  // center accounting for card
            essential: true
        });
    });
});


// fetch layer data and extract from pbf
const sourceCache = {};
async function fetchSourceData(source) {
    if (sourceCache[source] != null)
        return sourceCache[source];

    let blob = await fetch(source);
    blob = await blob.arrayBuffer();
    const data = await geobuf.decode(new Pbf(blob));

    sourceCache[source] = data;
    return data;
}


// handle tooltips
const tooltip = new GL.Popup({
    closeButton: false,
    closeOnClick: false,
    anchor: 'bottom',
    offset: [0, -5],
    className: 'tooltip',
    maxWidth: 'none'
});
function setTooltip(coords, text, isLandmark) {
    if (coords == null)  // clear tooltip
        return tooltip.remove();

    const scale = map.getZoom() / 21;
    tooltip.options.offset[1] = -scale * (isLandmark ? 40 : 10);
    tooltip.options.className = isLandmark ? 'tooltip landmark' : 'tooltip';
    tooltip.setLngLat(coords).setHTML(text).addTo(map);
}

// location lookup via osm nominatim localized to fremont
async function findAddress() {
    let query = $('#search').value;
    if (query.length === 0) query = $('#search').placeholder;
    if (query.length < 3) return;
    
    const params = new URLSearchParams({
        street: query,
        city: 'fremont',
        state: 'ca',
        country: 'usa',
        polygon_geojson: 1,
        format: 'json'
    });
    const nomiData = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
    const json = await nomiData.json();
    if (json.length < 1) return console.log('fail');

    const place = json[0];
    $('#search').value = '';
    $('#search').placeholder = query;
    map.flyTo({
        center: [place.lon, place.lat],
        zoom: 18,
        essential: true
    });
}
$('#search-submit').addEventListener('click', findAddress);
$('#search').addEventListener('keyup', e => {
    e.preventDefault();
    if (e.keyCode === 13) findAddress();
});

function closeCard() {
    currentLandmark = null;
    if (currentCard != null) currentCard.style.display = 'none';
}
$$('.card-close').forEach(e => e.addEventListener('click', closeCard));

// display a landmark tree card
let currentLandmark, currentCard;
const districts = {
    CEN: 'Centerville',
    CRL: 'Central',
    IRV: 'Irvington',
    MSJ: 'Mission San Jose',
    NIL: 'Niles',
    NFR: 'North Fremont',
    SFR: 'South Fremont',
    WMS: 'Warm Springs'
}
function displayLandmarkCard(id) {
    if (currentLandmark === id) return;
    closeCard();

    const data = landmarkData[id];
    $('#card-id').innerHTML = data.id;
    $('#card-name').innerHTML = data.name;
    $('#card-spec').innerHTML = data.spec;
    $('#card-addr').innerHTML = data.addr;
    $('#card-district').innerHTML = districts[data.id.split('-')[0]];
    $('#card-height').innerHTML = `${data.height} ft.`;
    $('#card-qty').innerHTML = data.qty;
    $('#card-spread').innerHTML = `${data.spread} ft.`;
    $('#card-nativeRange').innerHTML = data.nativeRange;
    $('#card-dbh').innerHTML = data.dbh;
    $('#card-lmDate').innerHTML = new Date(data.lmDate).toLocaleString(...localeOptions);

    // process description
    $('#card-desc').innerHTML = data.desc.split('\\n').map(p => {
        p = p.replaceAll('[', '<sup>[').replaceAll(']', ']</sup>');
        return `<p>${p}</p>`.replace(/\s(?!\S*\s)/, '&nbsp;'); // replaces last whitespace with nbsp to prevent orphans
    }).join('');

    // build photos
    const caption = data.caption.replace(/\s(?!\S*\s)/, '&nbsp;');
    $('#card-photos').innerHTML = `
        <div class='card-photo' style='--photo-src: url(landmarks/photos/${id}_L.jpg)' data-src='landmarks/photos/${id}_L.jpg'></div>
        <div class='card-photo captioned' style='--photo-src: url(landmarks/photos/${id}_S.jpg)' data-src='landmarks/photos/${id}_S.jpg' data-caption="${caption}"></div>
    `;
    // add click events
    $$('.card-photo').forEach(x => x.addEventListener('click', e => displayPhoto(e.currentTarget)));

    currentLandmark = id;
    currentCard = $('#landmark-card');
    $('#landmark-card').style.display = 'flex';
    $('#landmark-card .card-content').scrollTo(0, 0);
}

// create a full-view photo from a card-photo element
function displayPhoto(target) {
    $('#photo-modal').style.display = 'block';
    $('#photo-detail').innerHTML = `<img src='${target.dataset.src}'>`;
}
function closePhoto() {
    $('#photo-modal').style.display = 'none';
}
$('#photo-modal .modal-backdrop').addEventListener('click', closePhoto);

// show data attributions
function displayAttributions() {
    closeCard();

    currentCard = $('#attributions-card');
    $('#attributions-card').style.display = 'flex';
    $('#attributions-card .card-content').scrollTo(0, 0);
}
$('#attributions-btn').addEventListener('click', displayAttributions);