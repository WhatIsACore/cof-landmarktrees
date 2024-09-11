fetch('data/layers/Trees.pbf')
    .then(res => res.arrayBuffer())
    .then(buf => geobuf.decode(new Pbf(buf)))
    .then(json => {
        const species = {}

        json.features.forEach(tree => {
            const spec = tree.properties.S;
            if (!spec) return;

            if (!species[spec]) species[spec] = 0;
            species[spec]++;
        });

        console.log(species);
    });