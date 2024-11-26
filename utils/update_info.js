import * as fs from "fs";
import NETWORK from "../constants/network";
import {
  baseUri,
  description,
  namePrefix,
  network,
  solanaMetadata,
} from "../src/config";


// read json data
const rawdata = fs.readFileSync(
  `${process.cwd()}/build/json/_metadata.json`
);
const data = JSON.parse(rawdata.toString());

data.forEach((item) => {
  if (network === NETWORK.sol) {
    item.name = `${namePrefix} #${item.edition}`;
    item.description = description;
    item.creators = solanaMetadata.creators;
  } else {
    item.name = `${namePrefix} #${item.edition}`;
    item.description = description;
    item.image = `${baseUri}/${item.edition}.png`;
  }
  fs.writeFileSync(
    `${process.cwd()}/build/json/${item.edition}.json`,
    JSON.stringify(item, null, 2)
  );
});

fs.writeFileSync(
  `${process.cwd()}/build/json/_metadata.json`,
  JSON.stringify(data, null, 2)
);

if (network === NETWORK.sol) {
  console.log(`Updated description for images to ===> ${description}`);
  console.log(`Updated name prefix for images to ===> ${namePrefix}`);
  console.log(
    `Updated creators for images to ===> ${JSON.stringify(
      solanaMetadata.creators
    )}`
  );
} else {
  console.log(`Updated baseUri for images to ===> ${baseUri}`);
  console.log(`Updated description for images to ===> ${description}`);
  console.log(`Updated name prefix for images to ===> ${namePrefix}`);
}
