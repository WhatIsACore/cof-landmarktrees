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

// Return array of string values, or NULL if CSV string not well formed. https://stackoverflow.com/questions/8493195/
function csvToArray(text) {
    let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
    for (l of text) {
        if ('"' === l) {
            if (s && l === p) row[i] += l;
            s = !s;
        } else if (',' === l && s) l = row[++i] = '';
        else if ('\n' === l && s) {
            if ('\r' === p) row[i] = row[i].slice(0, -1);
            row = ret[++r] = [l = '']; i = 0;
        } else row[i] += l;
        p = l;
    }
    return ret;
};

// input: csv from landmark tree update spreadsheet
fetch('data/raw/Landmarks.csv')
.then(res => res.text())
.then(data => {
    let landmarks = {};
    let active = null;
    data = csvToArray(data);

    for (let row of data) {
        if (row.length < 2) continue;  // skip empty rows
        if (row[0] === "ID") continue;  // skip first row
        if (row[7].length < 1) continue;  // ignore removed trees / geometries
        if (row[0].length > 0) {  // new ID signals start of new landmark entry (which can contain one or more trees)
            let entry = {
                id: row[0],
                qty: row[2],
                addr: row[3],
                name: row[4],
                spec: row[5],
                page: +row[8],
                isNotable: row[9] === 'TRUE',
                height: row[11],
                spread: row[12],
                dbh: row[13],
                nativeRange: row[14],
                lmDate: row[15],
                photoDate: row[16],
                desc: row[17],
                caption: row[18],
                trees: []
            };
            active = entry;
            landmarks[entry.id] = entry;
        }
        active.trees.push({
            id: active.id,
            pid: row[1],
            coordinates: [row[6], row[7]]
        });
    }
    downloadObj(landmarks, 'landmarkData.json');  // landmarkData.json
    return landmarks;
})
.then(json => {  // convert to geojson
    const geojson = {
        type: 'FeatureCollection',
        name: 'Landmarks',
        features: []
    };
    let uid = 0;
    for (let id of Object.keys(json)) {
        const landmark = json[id];
        for (let i in landmark.trees) {
            const tree = landmark.trees[i];

            let type = 'normal';
            if (landmark.qty === 'multiple') type = 'multiple';
            if (landmark.isNotable) type = 'notable';

            geojson.features.push({  // create a new feature for each individual tree
                type: 'Feature',
                geometry: {type: 'Point', coordinates: tree.coordinates},
                properties: {
                    id: tree.id,
                    pid: tree.pid,
                    addr: landmark.addr,
                    name: landmark.name,
                    spec: landmark.spec,
                    page: landmark.page,
                    type: type
                },
                id: uid++
            });
        }
    };
    console.log(geojson);  // Landmarks.geojson
    return geojson;
})
.then(data => geobuf.encode(data, new Pbf()))  // encode in pbf
.then(data => downloadBlob(data, 'Landmarks.pbf'));  // final compressed data