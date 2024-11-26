const fs = require('fs');
const { layerConfigurations } = require('../src/config');
const { getElements } = require('../src/main');

const basePath = process.cwd();
const layersDir = `${basePath}/layers`;

// read json data
const rawdata = fs.readFileSync(
  `${basePath}/build/json/_metadata.json`,
  "utf-8"
);
const data = JSON.parse(rawdata);
const editionSize = data.length;

const rarityData = {};

// initialize layers to chart
layerConfigurations.forEach((config) => {
  const layers = config.layersOrder;

  layers.forEach((layer) => {
    const elementsForLayer = [];
    const elements = getElements(`${layersDir}/${layer.name}/`);
    elements.forEach((element) => {
      const rarityDataElement = {
        trait: element.name,
        weight: element.weight.toFixed(0),
        occurrence: 0, // initialize at 0
      };
      elementsForLayer.push(rarityDataElement);
    });
    // @ts-ignore
    const layerName = layer.options?.displayName ?? layer.name;
    // don't include duplicate layers
    if (!rarityData[layerName]) {
      // add elements for each layer to chart
      rarityData[layerName] = elementsForLayer;
    }
  });
});

// fill up rarity chart with occurrences from metadata
data.forEach(
  (element) => {
    const attributes = element.attributes;
    attributes.forEach((attribute) => {
      const traitType = attribute.trait_type;
      const value = attribute.value;

      const rarityDataTraits = rarityData[traitType];
      rarityDataTraits.forEach((rarityDataTrait) => {
        if (rarityDataTrait.trait === value) {
          // keep track of occurrences
          // @ts-ignore
          rarityDataTrait.occurrence++;
        }
      });
    });
  }
);

// convert occurrences to occurrence string
for (const layer in rarityData) {
  for (const attribute in rarityData[layer]) {
    // get chance
    const chance = (
      ((rarityData[layer][attribute].occurrence) / editionSize) *
      100
    ).toFixed(2);

    // show two decimal places in percent
    rarityData[layer][
      attribute
    ].occurrence = `${rarityData[layer][attribute].occurrence} in ${editionSize} editions (${chance} %)`;
  }
}

// print out rarity data
for (const layer in rarityData) {
  console.log(`Trait type: ${layer}`);
  rarityData[layer].forEach((trait) => {
    console.log(trait);
  });
  console.log();
}
