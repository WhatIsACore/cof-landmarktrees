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

// input: csv from treeplotter export
fetch('data/raw/Trees.csv')
.then(res => res.text())
.then(async data => {
    data = data.split('\n').slice(1);  // break apart rows and skip first row

    const landmarkReq = await fetch('data/raw/Landmarks.csv');
    const landmarkText = await landmarkReq.text();
    const landmarkRows = landmarkText.split('\n').slice(1).map(x => x.split(','));
    const landmarkIds = landmarkRows.filter(x => x.length > 1 && x[1].length > 0).map(x => +x[1]);

    const trees = [];
    data.forEach(row => {
        row = row.replaceAll('"', '').split(',');

        if (row[5] !== 'Alive') return;  // skip if not alive

        const id = +row[0];  // skip if already included in landmark trees
        if (landmarkIds.indexOf(id) > -1) return;

        let addr = row[1].split(' ').map(x => {  // format address
            x = x.toLowerCase();
            if (short[x] != null) x = short[x];
            return x.charAt(0).toUpperCase() + x.slice(1);
        }).join(' ');

        trees.push({
            type: 'Feature',
            id: id,
            properties: {
                addr: addr,
                name: row[2],
                spec: row[3],
                dbh: row[4]
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