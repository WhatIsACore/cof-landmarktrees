const downloadBlob = (data, fileName) => {
    let a = document.createElement('a');
    const url = URL.createObjectURL(new Blob([data]));
    a.download = fileName;
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url));
}

fetch('data/raw/Trees-processed.geojson')
    .then(data => data.json())
    .then(data => geobuf.encode(data, new Pbf()))
    .then(data => downloadBlob(data, 'Trees.pbf'));

fetch('data/layers/Trees.pbf')
    .then(data => data.arrayBuffer())
    .then(data => geobuf.decode(new Pbf(data)))
    .then(console.log);