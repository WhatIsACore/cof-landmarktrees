// count species, and number of species with descriptions

async function run(n) {
    const req = await fetch('local-tools/download-trefle/data/species-descriptions.json');
    const speciesDescs = await req.json();
    if (!n) n = 10000000000;

    // index species descriptions
    let nSpecies = 0;
    const speciesIndex = {};
    for (let i in speciesDescs)
        speciesIndex[i] = nSpecies++;

    fetch('data/layers/Trees.pbf')
        .then(res => res.arrayBuffer())
        .then(buf => geobuf.decode(new Pbf(buf)))
        .then(json => {
            const species = {};
            const slugs = {};

            json.features.forEach(tree => {
                const spec = tree.properties.S;
                if (spec == null) return;

                if (!species[spec]) species[spec] = 0;
                species[spec]++;
            });

            let describedTrees = 0;
            let totalTrees = json.features.length;
            
            Object.keys(species).forEach(s => {
                const slug = buildSlug(speciesHash[s][1]);

                if (!slugs[slug]) slugs[slug] = 0;  // sort into slug
                slugs[slug] += species[s];

                if (speciesDescs[slug] && speciesIndex[slug] < n) describedTrees += species[s];  // described trees
                nSpecies++;
            });

            const mostPlantedSpecies = Object.keys(slugs).map(x => [x, slugs[x], (slugs[x] / totalTrees * 100).toFixed(3) + '%']).sort((a, b) => b[1] - a[1]);

            console.log(`described trees: ${describedTrees} / ${totalTrees} (${(describedTrees / totalTrees * 100).toFixed(3)}%)`);
            console.log(mostPlantedSpecies);
        });
}

function buildSlug(s) {
    let slug = s.toLowerCase();
    slug = slug.replaceAll(' spp.', '');  // remove generic spp.
    slug = slug.replaceAll(' ssp.', '');  // common misspelling of spp.
    slug = slug.replace(/\s*var\..*/, '');  // remove variety
    slug = slug.replace(/\s*'[^']*'/g, '');  // remove cultivar
    slug = slug.replaceAll(' ', '-');  // spaces to dashes
    return slug;
}

run();