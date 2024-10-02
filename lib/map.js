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

const formatLargeNumber = n => n.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");  // add commas

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
    maxZoom: 18,
    maxPitch: 60,
    maxBounds: [
        [LONGITUDE - 0.5, LATITUDE - 0.2],
        [LONGITUDE + 0.5, LATITUDE + 0.2]
    ],
    attributionControl: false,
    validateStyle: false
});

const LAYERS = Object.keys(LAYERDATA);

// fetch source data, extract from pbf, add to map
async function addPbfSource(source) {
    let blob = await fetch(`data/layers/${source}`);
    blob = await blob.arrayBuffer();
    const json = await geobuf.decode(new Pbf(blob));

    map.addSource(source, {
        type: 'geojson',
        data: json
    });

    // delete data copy to optimize memory
    delete map.getSource(source)._data;
    delete map.getSource(source)._options.data;

    // if trees, update count
    if (source === 'Trees.pbf')
        $('#nTrees').innerText = formatLargeNumber(json.features.length);
    if (source === 'Landmarks.pbf')
        $('#nLandmarkTrees').innerText = formatLargeNumber(json.features.length) + '+';
}

async function loadBackgroundLayer(id, layer) {
    return {
        id: id,
        ...layer.options
    }
}

const sourcePromises = {};
async function loadGeojsonLayer(id, layer) {
    if (layer.images)  // if images, load them first
    await Promise.all(
        layer.images.map(i =>
            new Promise(async resolve => {
                let image = await map.loadImage(`assets/${i.source}`);
                map.addImage(i.name, image.data);
                resolve();
            })
        )
    );

    if (!sourcePromises[layer.source])  // load the source if it hasn't already been requested
        sourcePromises[layer.source] = addPbfSource(layer.source);

    await sourcePromises[layer.source];    // wait for source to be fully loaded

    return {
        id: id,
        source: layer.source,
        ...layer.options
    };
}

let landmarkData;
let speciesHash;
map.on('load', () => {
    assignMapListeners();
    loadLayers();

    // load landmark tree information
    fetch('data/landmark-info.json').then(res => res.json()).then(json => landmarkData = json);

    // load species hash information
    fetch('data/species-hash.json').then(res => res.json()).then(json => speciesHash = json);
});

async function loadLayers() {
    // load in sources and create layers in order asynchronously
    LAYERS.forEach(async name => {
        const layerInfo = LAYERDATA[name];
        let layer;
        if (layerInfo.options.type === 'background') layer = await loadBackgroundLayer(name, layerInfo);
        if (layerInfo.source) layer = await loadGeojsonLayer(name, layerInfo);

        // determine the next loaded layer to maintain proper ordering
        let nextLoadedLayer = null;
        for (let i = LAYERS.indexOf(name) + 1; i < LAYERS.length; i++) {
            let name = LAYERS[i];
            if (map.getLayer(name)) {
                nextLoadedLayer = name;
                break;
            }
        }

        map.addLayer(layer, nextLoadedLayer);
    });
}

let targetTree, targetLandmark;  // track currently targeted (hovered) tree for actions
function assignMapListeners() {
    // tree hover interactions
    map.on('mousemove', 'Trees', e => {
        if (e.features.length == 0) return;

        map.getCanvas().style.cursor = 'pointer';

        if (targetTree)  // remove hover from previous tree
            map.setFeatureState(
                { source: 'Trees.pbf', id: targetTree.id },
                { hover: false }
            );

        targetTree = e.features[0];
        map.setFeatureState(
            { source: 'Trees.pbf', id: targetTree.id },
            { hover: true }
        );
        let name = speciesHash[targetTree.properties.S][0];
        name = name.replace(/\b\w/g, c => c.toUpperCase());  // capitalize words
        if (name.length < 1) name = 'unknown';

        setTooltip(targetTree.geometry.coordinates, `${name}`);
    });

    map.on('mouseleave', 'Trees', e => {
        map.getCanvas().style.cursor = 'default';
        if (targetTree)
            map.setFeatureState(
                { source: 'Trees.pbf', id: targetTree.id },
                { hover: false }
            );
        targetTree = null;
        setTooltip();
    });

    map.on('mousemove', 'Landmarks', e => {
        if (e.features.length == 0) return;
        map.getCanvas().style.cursor = 'pointer';

        if (targetLandmark)  // remove hover from previous tree
            map.setFeatureState(
                { source: 'Landmarks.pbf', id: targetLandmark.id },
                { hover: false }
            );
        if (targetTree)  // override street tree hover
            map.setFeatureState(
                { source: 'Trees.pbf', id: targetTree.id },
                { hover: false }
            );

        targetLandmark = e.features[0];
        map.setFeatureState(
            { source: 'Landmarks.pbf', id: targetLandmark.id },
            { hover: true }
        );
        let name = targetLandmark.properties.name;
        if (targetLandmark.properties.type === 'multiple') name += ' (multiple)';
        setTooltip(targetLandmark.geometry.coordinates, `${name}`, true);
    });

    map.on('mouseleave', 'Landmarks', e => {
        map.getCanvas().style.cursor = 'default';
        if (targetLandmark)
            map.setFeatureState(
                { source: 'Landmarks.pbf', id: targetLandmark.id },
                { hover: false }
            );
            targetLandmark = null;
        setTooltip();
    });


    // click events
    map.on('click', 'Trees', e => {
        const tree = e.features[0];
        displayStreetTreeCard(tree);
    });
    map.on('click', 'Landmarks', e => {
        const id = e.features[0].properties.id;
        displayLandmarkCard(id);

        const rightPad = (window.innerWidth - currentCard.getBoundingClientRect().left) * 0.5;
        map.flyTo({
            center: e.features[0].geometry.coordinates,
            zoom: map.getZoom() > 15 ? map.getZoom() : 15,
            speed: 0.5,
            padding: {right: rightPad},  // center accounting for card
            essential: true
        });
    });
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
    if (!coords)  // clear tooltip
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

let currentCard;
function closeCard() {
    currentStreetTree = null;
    currentLandmark = null;
    if (currentCard) currentCard.style.display = 'none';
}
$$('.card-close').forEach(e => e.addEventListener('click', closeCard));

// display a street tree card
let currentStreetTree;
function displayStreetTreeCard(tree) {
    if (currentStreetTree && currentStreetTree.id === tree.id) return;
    closeCard();

    // display species info
    $('#street-tree-card .card-info').style.display = 'none';
    $('#street-tree-card .card-table-right').style.display = 'none';
    const spec = speciesHash[tree.properties.S];
    let slug = spec[1].toLowerCase();
    slug = slug.replaceAll(' spp.', '');  // remove generic spp.
    slug = slug.replaceAll(' ssp.', '');  // common misspelling of spp.
    slug = slug.replace(/\s*var\..*/, '');  // remove variety
    slug = slug.replace(/\s*'[^']*'/g, '');  // remove cultivar

    requestSpeciesData(slug).then(data => {
        if (!data) return;

        $('#street-tree-card .card-desc-wrapper').style.display = 'none';
        $('#street-tree-card .card-info').style.display = 'block';

        $('#street-tree-card .card-info-spec').innerText = slug.charAt(0).toUpperCase() + slug.slice(1);
        $('#street-tree-card .card-info-family').innerText = data.family;
        $('#street-tree-card .card-info-nativeRange').innerText = data.range;

        if (data.leaf) {
            $('#street-tree-card .card-table-right').style.display = 'block';
            $('#street-tree-card .card-table-right').innerHTML = `
                <div class='card-leaf' style='--photo-src: url(${data.leaf})'></div>
            `;
        }
        if (data.desc) {
            $('#street-tree-card .card-desc-wrapper').style.display = 'block';
            $('#street-tree-card .card-desc').innerHTML = data.desc.replace(/\s(?!\S*\s)/, '&nbsp;'); // replaces last whitespace with nbsp to prevent orphans;
        }
    });

    // display tree info
    $('#street-tree-card .card-id').innerText = tree.id;
    $('#street-tree-card .card-name').innerText = spec[0];
    $('#street-tree-card .card-spec').innerText = spec[1];
    $('#street-tree-card .card-addr').innerText = tree.properties.A;

    currentStreetTree = tree;
    currentCard = $('#street-tree-card');
    $('#street-tree-card').style.display = 'flex';
    $('#street-tree-card .card-content').scrollTo(0, 0);
}
async function requestSpeciesData(slug) {
    slug = slug.replaceAll(' ', '-');  // spaces to dashes
    
    const res = await fetch(`data/species/${slug}.json`);
    const json = await res.json();
    return json;
}

// display a landmark tree card
let currentLandmark;
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
    $('#landmark-card .card-id').innerText = data.id;
    $('#landmark-card .card-name').innerText = data.name;
    $('#landmark-card .card-spec').innerText = data.spec;
    $('#landmark-card .card-addr').innerText = data.addr;
    $('#landmark-card .card-district').innerText = districts[data.id.split('-')[0]] + ' District';
    $('#landmark-card .card-height').innerText = `${data.height} ft.`;
    $('#landmark-card .card-qty').innerText = data.qty;
    $('#landmark-card .card-spread').innerText = `${data.spread} ft.`;
    $('#landmark-card .card-nativeRange').innerText = data.nativeRange;
    $('#landmark-card .card-dbh').innerText = data.dbh;
    $('#landmark-card .card-lmDate').innerText = new Date(data.lmDate).toLocaleString(...localeOptions);

    // process description
    $('#landmark-card .card-desc').innerHTML = data.desc.split('\\n').map(p => {
        p = p.replaceAll('[', '<sup>[').replaceAll(']', ']</sup>');
        return `<p>${p}</p>`.replace(/\s(?!\S*\s)/, '&nbsp;'); // replaces last whitespace with nbsp to prevent orphans
    }).join('');

    // build photos
    const caption = data.caption.replace(/\s(?!\S*\s)/, '&nbsp;');
    $('#landmark-card .card-photos').innerHTML = `
        <div class='card-photo' style='--photo-src: url(assets/landmark-photos/${id}_L.jpg)' data-src='assets/landmark-photos/${id}_L.jpg'></div>
        <div class='card-photo captioned' style='--photo-src: url(assets/landmark-photos/${id}_S.jpg)' data-src='assets/landmark-photos/${id}_S.jpg' data-caption="${caption}"></div>
    `;
    // add click events
    $$('#landmark-card .card-photo').forEach(x => x.addEventListener('click', e => displayPhoto(e.currentTarget)));

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