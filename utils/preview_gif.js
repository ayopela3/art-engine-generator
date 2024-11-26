import {
  createCanvas,
  loadImage,
  Canvas,
  CanvasRenderingContext2D,
} from "canvas";
import * as fs from "fs";
import * as path from "path";
import { format, preview_gif } from "../src/config";
import Giffer from "../modules/Giffer";

const basePath = process.cwd();
const buildDir = path.join(basePath, "build");
const imageDir = path.join(buildDir, "images");
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");

const loadImg = async (_img) => {
  const loadedImage = await loadImage(_img);
  // @ts-ignore
  return { loadedImage };
};

// read image paths
const imageList = fs
  .readdirSync(imageDir)
  .map((file) => loadImg(path.join(imageDir, file)));

const saveProjectPreviewGIF = async (
  _data
)=> {
  const { numberOfImages, order, repeat, quality, delay, imageName } =
    preview_gif;
  const { width, height } = format;
  const previewCanvasWidth = width;
  const previewCanvasHeight = height;

  if (_data.length < numberOfImages) {
    console.log(
      `You do not have enough images to create a gif with ${numberOfImages} images.`
    );
    return;
  }

  console.log(
    `Preparing a ${previewCanvasWidth}x${previewCanvasHeight} project preview with ${_data.length} images.`
  );
  const previewPath = path.join(buildDir, imageName);

  ctx.clearRect(0, 0, width, height);

  // @ts-ignore
  const giffer = new Giffer(canvas, ctx, previewPath, repeat, quality, delay);
  giffer.start();

  const renderObjectArray = await Promise.all(_data);

  if (order === "DESC") {
    renderObjectArray.reverse();
  } else if (order === "MIXED") {
    renderObjectArray.sort(() => Math.random() - 0.5);
  }

  const limitedRenderObjectArray =
    numberOfImages > 0
      ? renderObjectArray.slice(0, numberOfImages)
      : renderObjectArray;

  limitedRenderObjectArray.forEach((renderObject) => {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    ctx.drawImage(
      // @ts-ignore
      renderObject.loadedImage,
      0,
      0,
      previewCanvasWidth,
      previewCanvasHeight
    );
    giffer.add();
  });

  giffer.stop();
};

saveProjectPreviewGIF(imageList);
