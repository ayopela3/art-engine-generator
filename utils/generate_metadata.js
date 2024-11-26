import fs from "fs";
import path from "path";
import { createCanvas, loadImage, Image } from "canvas";
import { format, namePrefix, description, baseUri } from "../src/config";
import { Console } from "console";

const basePath = process.cwd();
const buildDir = `${basePath}/build/json`;
const inputDir = `${basePath}/build/images`;
const console = new Console(process.stdout, process.stderr);
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
const metadataList = [];

const buildSetup = ()=> {
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
};

const getImages = (_dir) => {
  try {
    return fs
      .readdirSync(_dir)
      .filter((item) => {
        const extension = path.extname(`${_dir}${item}`);
        return extension === ".png" || extension === ".jpg";
      })
      .map((i) => ({
        filename: i,
        path: `${_dir}/${i}`,
      }));
  } catch {
    return null;
  }
};

const loadImgData = async (_imgObject) => {
  const image = await loadImage(`${_imgObject.path}`);
  return { imgObject: _imgObject, loadedImage: image };
};

const draw = (_imgObject) => {
  const w = canvas.width;
  const h = canvas.height;
  ctx.drawImage(_imgObject.loadedImage, 0, 0, w, h);
};

const addRarity = () => {
  const w = canvas.width;
  const h = canvas.height;
  let i = -4;
  let count = 0;
  const imgdata = ctx.getImageData(0, 0, w, h);
  const rgb = imgdata.data;
  const newRgb = { r: 0, g: 0, b: 0 };
  const tolerance = 15;
  const rareColorBase = "NOT a Hot Dog";
  const rareColor = [
    { name: "Hot Dog", rgb: { r: 192, g: 158, b: 131 } },
    { name: "Hot Dog", rgb: { r: 128, g: 134, b: 90 } },
    { name: "Hot Dog", rgb: { r: 113, g: 65, b: 179 } },
    { name: "Hot Dog", rgb: { r: 162, g: 108, b: 67 } },
  ];

  while ((i += 10 * 4) < rgb.length) {
    ++count;
    newRgb.r += rgb[i];
    newRgb.g += rgb[i + 1];
    newRgb.b += rgb[i + 2];
  }

  newRgb.r = ~~(newRgb.r / count);
  newRgb.g = ~~(newRgb.g / count);
  newRgb.b = ~~(newRgb.b / count);

  let rarity = rareColorBase;

  rareColor.forEach((color) => {
    if (isNeighborColor(newRgb, color.rgb, tolerance)) {
      rarity = color.name;
    }
  });

  console.log(newRgb);
  console.log(rarity);

  return [
    {
      trait_type: "average color",
      value: `rgb(${newRgb.r},${newRgb.g},${newRgb.b})`,
    },
    {
      trait_type: "What is this?",
      value: rarity,
    },
    {
      trait_type: "date",
      value: randomIntFromInterval(1500, 1900),
    },
  ];
};

const randomIntFromInterval = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const isNeighborColor = (
  color1,
  color2,
  tolerance,
) => {
  return (
    Math.abs(color1.r - color2.r) <= tolerance &&
    Math.abs(color1.g - color2.g) <= tolerance &&
    Math.abs(color1.b - color2.b) <= tolerance
  );
};

const saveMetadata = (_loadedImageObject) => {
  const shortName = _loadedImageObject.imgObject.filename.replace(
    /\.[^/.]+$/,
    ""
  );

  const tempAttributes = addRarity();

  const tempMetadata = {
    name: `${namePrefix} #${shortName}`,
    description: description,
    image: `${baseUri}/${shortName}.png`,
    edition: Number(shortName),
    attributes: tempAttributes,
    compiler: "custom art engine compiler",
  };
  fs.writeFileSync(
    `${buildDir}/${shortName}.json`,
    JSON.stringify(tempMetadata, null, 2)
  );
  metadataList.push(tempMetadata);
};

const writeMetaData = (_data) => {
  fs.writeFileSync(`${buildDir}/_metadata.json`, _data);
};

const startCreating = async () => {
  const images = getImages(inputDir);
  if (images == null) {
    console.log("Please generate collection first.");
    return;
  }
  const loadedImageObjects = images.map((imgObject) => loadImgData(imgObject));
  const loadedImageObjectArray = await Promise.all(loadedImageObjects);
  loadedImageObjectArray.forEach((loadedImageObject) => {
    draw(loadedImageObject);
    saveMetadata(loadedImageObject);
    console.log(
      `Created metadata for image: ${loadedImageObject.imgObject.filename}`
    );
  });
  writeMetaData(JSON.stringify(metadataList, null, 2));
};

buildSetup();
startCreating();
