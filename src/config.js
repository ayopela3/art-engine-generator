const NETWORK = require('../constants/network')
const network = NETWORK.eth;

// General metadata for Ethereum
const namePrefix = "Redtoastr's Collection";
const description = "This is a scam collection of eyeballs lol";
const baseUri = "ipfs://NewUriToReplace";

/**
 * Metadata configuration for Solana blockchain.
 *
 * @typedef {Object} SolanaMetadata
 * @property {string} symbol - The symbol for the token.
 * @property {number} seller_fee_basis_points - The percentage fee taken from secondary market sales (1000 = 10%).
 * @property {string} external_url - The external URL associated with the token.
 * @property {Array.<Creator>} creators - An array of creator objects.
 *
 * @typedef {Object} Creator
 * @property {string} address - The Solana address of the creator.
 * @property {number} share - The share percentage of the creator.
 */

/**
 * @type {SolanaMetadata}
 */
const solanaMetadata = {
  symbol: "CGT", // Define the symbol for the token
  seller_fee_basis_points: 1000, // Define how much % you want from secondary market sales 1000 = 10%
  external_url: "https://www.yoursitename.com",
  creators: [
    {
      address: "iGABja1WrDcJhHHS9PfK7NjxvhYPS3h22ydutLLTMsL", // Solana address of the creator
      share: 100,
    },
  ],
};

// If you have selected Solana then the collection starts from 0 automatically
const layerConfigurations = [
  {
    growEditionSizeTo: 25, // The number of images to generate
    layersOrder: [
      { name: "Background" },
      { name: "layer-1" },
      { name: "layer-2" },
      { name: "layer-3" },
      { name: "Shine" },
    ],
  },
];

const shuffleLayerConfigurations = false;

const debugLogs = false;

const format = {
  width: 512,
  height: 512,
  smoothing: false,
};

const gif = {
  export: false,
  repeat: 0,
  quality: 100,
  delay: 500,
};

const text = {
  only: false,
  color: "#ffffff",
  size: 20,
  xGap: 40,
  yGap: 40,
  align: "left",
  baseline: "top",
  weight: "regular",
  family: "Courier",
  spacer: " => ",
};

const pixelFormat = {
  ratio: 2 / 128,
};

const background = {
  generate: true,
  brightness: "80%",
  static: false,
  default: "#000000",
};

const extraMetadata = {};

const rarityDelimiter = "#";

const uniqueDnaTorrance = 10000;

const preview = {
  thumbPerRow: 5,
  thumbWidth: 50,
  imageRatio: format.height / format.width,
  imageName: "preview.png",
};

const preview_gif = {
  numberOfImages: 5,
  order: "ASC", // ASC, DESC, MIXED
  repeat: 0,
  quality: 100,
  delay: 500,
  imageName: "preview.gif",
};

module.exports = {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  preview,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  pixelFormat,
  text,
  namePrefix,
  network,
  solanaMetadata,
  gif,
  preview_gif,
};
