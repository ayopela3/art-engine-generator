const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const basePath = process.cwd();
const buildDir = path.join(basePath, "build");

// Import preview config
// @ts-ignore
const { preview } = require(path.join(basePath, "src/config.js"));

// read json data
const rawdata = fs.readFileSync(path.join(buildDir, "json", "_metadata.json"), "utf-8");
const metadataList= JSON.parse(rawdata);


const saveProjectPreviewImage = async (_data) => {
  // Extract from preview config
  const { thumbWidth, thumbPerRow, imageRatio, imageName } = preview;
  // Calculate height on the fly
  const thumbHeight = thumbWidth * imageRatio;
  // Prepare canvas
  const previewCanvasWidth = thumbWidth * thumbPerRow;
  const previewCanvasHeight = thumbHeight * Math.ceil(_data.length / thumbPerRow);
  // Shout from the mountain tops
  console.log(`Preparing a ${previewCanvasWidth}x${previewCanvasHeight} project preview with ${_data.length} thumbnails.`);

  // Initiate the canvas now that we have calculated everything
  const previewPath = path.join(buildDir, imageName);
  const previewCanvas = createCanvas(previewCanvasWidth, previewCanvasHeight);
  const previewCtx = previewCanvas.getContext("2d");

  // Iterate all NFTs and insert thumbnail into preview image
  // Don't want to rely on "edition" for assuming index
  for (let index = 0; index < _data.length; index++) {
    const nft = _data[index];
    const image = await loadImage(path.join(buildDir, "images", `${nft.edition}.png`));
    previewCtx.drawImage(
      image,
      thumbWidth * (index % thumbPerRow),
      thumbHeight * Math.trunc(index / thumbPerRow),
      thumbWidth,
      thumbHeight
    );
  }

  // Write Project Preview to file
  // @ts-ignore
  fs.writeFileSync(previewPath, previewCanvas.toBuffer("image/png"));
  console.log(`Project preview image located at: ${previewPath}`);
};

saveProjectPreviewImage(metadataList);
