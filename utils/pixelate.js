import fs from "fs";
import path from "path";
import {
  createCanvas,
  loadImage,
  Canvas,
  CanvasRenderingContext2D,
} from "canvas";
import { format, pixelFormat } from "../src/config";
import console from "console";

const basePath = process.cwd();
const buildDir = `${basePath}/build/pixel_images`;
const inputDir = `${basePath}/build/images`;
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");

const buildSetup = () => {
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

const loadImgData = async (
  _imgObject) => {
  const image = await loadImage(`${_imgObject.path}`);
  return { imgObject: _imgObject, loadedImage: image };
};

const draw = (_imgObject) => {
  const size = pixelFormat.ratio;
  const w = canvas.width * size;
  const h = canvas.height * size;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(_imgObject.loadedImage, 0, 0, w, h);
  ctx.drawImage(canvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
};

const saveImage = (_loadedImageObject) => {
  fs.writeFileSync(
    `${buildDir}/${_loadedImageObject.imgObject.filename}`,
    canvas.toBuffer("image/png")
  );
};

const startCreating = async () => {
  const images = getImages(inputDir);
  if (images === null) {
    console.log("Please generate collection first.");
    return;
  }
  const loadedImageObjects = images.map((imgObject) => loadImgData(imgObject));
  const loadedImageObjectArray = await Promise.all(loadedImageObjects);
  loadedImageObjectArray.forEach((loadedImageObject) => {
    draw(loadedImageObject);
    saveImage(loadedImageObject);
    console.log(`Pixelated image: ${loadedImageObject.imgObject.filename}`);
  });
};

buildSetup();
startCreating();
