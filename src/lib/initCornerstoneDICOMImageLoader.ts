import dicomParser from "dicom-parser"
import * as cornerstone from "@cornerstonejs/core"
import cornerstoneDICOMImageLoader from "@cornerstonejs/dicom-image-loader"

const { preferSizeOverAccuracy, useNorm16Texture } =
  cornerstone.getConfiguration().rendering

export default function initCornerstoneDICOMImageLoader() {
  let maxWebWorkers = 1

  if (navigator.hardwareConcurrency) {
    maxWebWorkers = Math.min(navigator.hardwareConcurrency, 7)
  }

  cornerstoneDICOMImageLoader.configure({
    cornerstone,
    dicomParser,
    maxWebWorkers,
    decodeConfig: {
      convertFloatPixelDataToInt: false,
      use16BitDataType: preferSizeOverAccuracy || useNorm16Texture,
    },
  })
}
