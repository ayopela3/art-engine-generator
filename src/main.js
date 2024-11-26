const basePath = process.cwd()
const NETWORK = require(`${basePath}/constants/network.js`)
const fs = require('fs')
const sha1 = require('sha1')
const {createCanvas, loadImage} = require('canvas')

const buildDir = `${basePath}/build`
const layersDir = `${basePath}/layers`
const {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  text,
  namePrefix,
  network,
  solanaMetadata,
  gif,
} = require(`${basePath}/src/config.js`)
const canvas = createCanvas(format.width, format.height)
const ctx = canvas.getContext("2d")
ctx.imageSmoothingEnabled = format.smoothing
let metadataList = []
let attributesList = []
const dnaList = new Set()
const DNA_DELIMITER = "-"
const Giffer = require(`../modules/Giffer.js`)

let giffer = null

const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true })
  }
  fs.mkdirSync(buildDir)
  fs.mkdirSync(`${buildDir}/json`)
  fs.mkdirSync(`${buildDir}/images`)
  if (gif.export) {
    fs.mkdirSync(`${buildDir}/gifs`)
  }
}

const getRarityWeight = (str) => {
  const nameWithoutExtension = str.slice(0, -4)
  let nameWithoutWeight = Number(nameWithoutExtension.split(rarityDelimiter).pop())
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 1
  }
  return nameWithoutWeight
}

const cleanDna = (str) => {
  const withoutOptions = removeQueryStrings(str)
  return Number(withoutOptions.split(":").shift())
}

const cleanName = (str) => {
  const nameWithoutExtension = str.slice(0, -4)
  return nameWithoutExtension.split(rarityDelimiter).shift()
}

const getElements = (path) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((filename, index) => ({
      id: index,
      name: cleanName(filename),
      filename,
      path: `${path}${filename}`,
      weight: getRarityWeight(filename),
    }))
}

const layersSetup = (layersOrder) => {
  return layersOrder.map((layerObj, index) => ({
    id: index,
    elements: getElements(`${layersDir}/${layerObj.name}/`),
    name: layerObj.options?.displayName ?? layerObj.name,
    blend: layerObj.options?.blend ?? "source-over",
    opacity: layerObj.options?.opacity ?? 1,
    bypassDNA: layerObj.options?.bypassDNA ?? false,
  }))
}

const saveImage = (editionCount) => {
  // @ts-ignore
  fs.writeFileSync(`${buildDir}/images/${editionCount}.png`, canvas.toBuffer('image/png'))
}

const genColor = () => {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue}, 100%, ${background.brightness})`
}

const drawBackground = () => {
  ctx.fillStyle = background.static ? background.default : genColor()
  ctx.fillRect(0, 0, format.width, format.height)
}

const addMetadata = (dna, edition) => {
  const dateTime = Date.now()
  let tempMetadata = {
    name: `${namePrefix} #${edition}`,
    description,
    image: `${baseUri}/${edition}.png`,
    dna: sha1(dna),
    edition,
    date: dateTime,
    ...extraMetadata,
    attributes: attributesList,
    compiler: "",
  }
  if (network === NETWORK.sol) {
    tempMetadata = {
      ...tempMetadata,
      symbol: solanaMetadata.symbol,
      seller_fee_basis_points: solanaMetadata.seller_fee_basis_points,
      image: `image.png`,
      external_url: solanaMetadata.external_url,
      properties: {
        files: [{ uri: "image.png", type: "image/png" }],
        category: "image",
        creators: solanaMetadata.creators,
      },
    }
  }
  metadataList.push(tempMetadata)
  attributesList = []
}

const addAttributes = (element) => {
  const selectedElement = element.layer.selectedElement
  attributesList.push({
    trait_type: element.layer.name,
    value: selectedElement.name,
  })
}

const loadLayerImg = async (layer) => {
  const image = await loadImage(`${layer.selectedElement.path}`)
  return { layer, loadedImage: image }
}

const addText = (sig, x, y, size) => {
  ctx.fillStyle = text.color
  ctx.font = `${text.weight} ${size}pt ${text.family}`
  ctx.textBaseline = text.baseline
  ctx.textAlign = text.align
  ctx.fillText(sig, x, y)
}

const drawElement = (renderObject, index, layersLen) => {
  ctx.globalAlpha = renderObject.layer.opacity
  ctx.globalCompositeOperation = renderObject.layer.blend
  if (text.only) {
    addText(
      `${renderObject.layer.name}${text.spacer}${renderObject.layer.selectedElement.name}`,
      text.xGap,
      text.yGap * (index + 1),
      text.size
    )
  } else {
    ctx.drawImage(renderObject.loadedImage, 0, 0, format.width, format.height)
  }
  addAttributes(renderObject)
}

const constructLayerToDna = (dna = "", layers = []) => {
  return layers.map((layer, index) => {
    const selectedElement = layer.elements.find(
      (e) => e.id === cleanDna(dna.split(DNA_DELIMITER)[index])
    )
    return {
      name: layer.name,
      blend: layer.blend,
      opacity: layer.opacity,
      selectedElement,
    }
  })
}

const filterDNAOptions = (dna) => {
  const dnaItems = dna.split(DNA_DELIMITER)
  const filteredDNA = dnaItems.filter((element) => {
    const query = /(\?.*$)/
    const querystring = query.exec(element)
    if (!querystring) {
      return true
    }
    const options = querystring[1].split("&").reduce((r, setting) => {
      const keyPairs = setting.split("=")
      return { ...r, [keyPairs[0]]: keyPairs[1] }
    }, [])

    // @ts-ignore
    return options.bypassDNA
  })
  return filteredDNA.join(DNA_DELIMITER)
}

const removeQueryStrings = (dna) => {
  const query = /(\?.*$)/
  return dna.replace(query, "")
}

const isDnaUnique = (dnaList = new Set(), dna = "") => {
  const filteredDNA = filterDNAOptions(dna)
  return !dnaList.has(filteredDNA)
}

const createDna = (layers) => {
  const randNum = []
  layers.forEach((layer) => {
    let totalWeight = 0
    layer.elements.forEach((element) => {
      totalWeight += element.weight
    })
    let random = Math.floor(Math.random() * totalWeight)
    for (let i = 0; i < layer.elements.length; i++) {
      random -= layer.elements[i].weight
      if (random < 0) {
        randNum.push(
          `${layer.elements[i].id}:${layer.elements[i].filename}${
            layer.bypassDNA ? "?bypassDNA=true" : ""
          }`
        )
        break
      }
    }
  })
  return randNum.join(DNA_DELIMITER)
}

const writeMetaData = (data) => {
  fs.writeFileSync(`${buildDir}/json/_metadata.json`, data)
}

const saveMetaDataSingleFile = (editionCount) => {
  const metadata = metadataList.find((meta) => meta.edition === editionCount)
  if (debugLogs) {
    console.log(`Writing metadata for ${editionCount}: ${JSON.stringify(metadata)}`)
  }
  fs.writeFileSync(`${buildDir}/json/${editionCount}.json`, JSON.stringify(metadata, null, 2))
}

const shuffle = (array) => {
  let currentIndex = array.length
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
  }
  return array
}

const startCreating = async () => {
  let layerConfigIndex = 0
  let editionCount = 1
  let failedCount = 0
  let abstractedIndexes = []
  for (let i = network === NETWORK.sol ? 0 : 1; i <= layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo; i++) {
    abstractedIndexes.push(i)
  }
  if (shuffleLayerConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes)
  }
  if (debugLogs) {
    console.log("Editions left to create: ", abstractedIndexes)
  }
  while (layerConfigIndex < layerConfigurations.length) {
    const layers = layersSetup(layerConfigurations[layerConfigIndex].layersOrder)
    while (editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo) {
      const newDna = createDna(layers)
      if (isDnaUnique(dnaList, newDna)) {
        const results = constructLayerToDna(newDna, layers)
        const loadedElements = await Promise.all(results.map(loadLayerImg))
        if (debugLogs) {
          console.log("Clearing canvas")
        }
        ctx.clearRect(0, 0, format.width, format.height)
        if (gif.export) {
          giffer = new Giffer(canvas, ctx, `${buildDir}/gifs/${abstractedIndexes[0]}.gif`, gif.repeat, gif.quality, gif.delay)
          giffer.start()
        }
        if (background.generate) {
          drawBackground()
        }
        loadedElements.forEach((renderObject, index) => {
          drawElement(renderObject, index, layerConfigurations[layerConfigIndex].layersOrder.length)
          if (gif.export) {
            giffer.add()
          }
        })
        if (gif.export) {
          giffer.stop()
        }
        if (debugLogs) {
          console.log("Editions left to create: ", abstractedIndexes)
        }
        saveImage(abstractedIndexes[0])
        addMetadata(newDna, abstractedIndexes[0])
        saveMetaDataSingleFile(abstractedIndexes[0])
        console.log(`Created edition: ${abstractedIndexes[0]}, with DNA: ${sha1(newDna)}`)
        dnaList.add(filterDNAOptions(newDna))
        editionCount++
        abstractedIndexes.shift()
      } else {
        console.log("DNA exists!")
        failedCount++
        if (failedCount >= uniqueDnaTorrance) {
          console.log(`You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`)
          process.exit()
        }
      }
    }
    layerConfigIndex++
  }
  writeMetaData(JSON.stringify(metadataList, null, 2))
}

module.exports = { startCreating, buildSetup, getElements }
