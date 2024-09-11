function downloadObj(exportObj, exportName) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    const anchor = document.createElement('a');
    anchor.href = dataStr;
    anchor.download = exportName + ".json";
    anchor.click();
    anchor.remove();
}
const downloadBlob = (data, fileName) => {
    let a = document.createElement('a');
    const url = URL.createObjectURL(new Blob([data]));
    a.download = fileName;
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url));
}

const short = {  // preformatting table
    street: 'st',
    road: 'rd',
    drive: 'dr',
    lane: 'ln',
    circle: 'cir',
    avenue: 'ave',
    boulevard: 'blvd',
    parkway: 'pkwy',
    freeway: 'fwy',
    terrace: 'ter',
    court: 'ct',
    commons: 'cmns',
    common: 'cmn',
    square: 'sq',
    place: 'pl'
}

function hashSpec(name, spec) {
    if (!name) name = '';
    if (!spec) spec = '';
    return name.trim() + '%' + spec.trim();
}

// input: csv from treeplotter export
fetch('data/Trees.csv')
.then(res => res.text())
.then(async data => {
    data = data.split('\n').slice(1);  // break apart rows and skip first row

    // first pass - split rows and index species
    const specTable = {};
    for (let i in data) {
        data[i] = data[i].replaceAll('"', '').split(',');
        row = data[i];

        const hash = hashSpec(row[2], row[3]);
        if (!specTable[hash]) specTable[hash] = 0;
        specTable[hash]++;
    }

    // sort species table to rank species
    const rankToSpec = Object.keys(specTable).sort((a, b) => specTable[b] - specTable[a]);
    downloadObj(rankToSpec.map(s => s.split('%')), 'species-hash.json');  // species-hash.json

    // create reverse index of ranked species
    const specToRank = {};
    for (let i in rankToSpec)
        specToRank[rankToSpec[i]] = +i;

    // get landmarked pids to skip over those trees
    const landmarkReq = await fetch('data/Landmarks.csv');
    const landmarkText = await landmarkReq.text();
    const landmarkRows = landmarkText.split('\n').slice(1).map(x => x.split(','));
    const landmarkIds = landmarkRows.filter(x => x.length > 1 && x[1].length > 0).map(x => +x[1]);

    let trees = [];
    data.forEach(row => {
        const id = +row[0];  // skip if already included in landmark trees
        if (landmarkIds.indexOf(id) > -1) return;

        if (row[5] !== 'Alive') return;  // skip if not alive

        // find index of species
        const hash = hashSpec(row[2], row[3]);
        const index = specToRank[hash];

        let addr = row[1].split(' ').map(x => {  // format address
            x = x.toLowerCase();
            if (short[x] != null) x = short[x];
            return x.charAt(0).toUpperCase() + x.slice(1);
        }).join(' ');

        trees.push({
            type: 'Feature',
            id: id,
            properties: {
                A: addr,  // address
                S: index,  // species index
                D: +row[4]  // dbh
            },
            geometry: {
                type: 'Point',
                coordinates: [row[7], row[8]]
            }
        });
    });
    const geojson = {
        type: 'FeatureCollection',
        name: 'Trees',
        features: trees
    };

    console.log(geojson);  // Trees.geojson
    return geojson;
})
.then(data => geobuf.encode(data, new Pbf()))  // encode in pbf
.then(data => downloadBlob(data, 'Trees.pbf'));  // final compressed data