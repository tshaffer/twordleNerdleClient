import {
  InWordAtExactLocationValue,
  InWordAtNonLocationValue,
  LetterAnswerType,
  NotInWordValue,
  WhiteLetterValue
} from '../types';

const pixelOffsetFromEdge = 10;

export const getLetterAnswerType = (imgData: ImageData): LetterAnswerType => {
  if (isLetterAtExactLocation(imgData.data[0], imgData.data[1], imgData.data[2])) {
    return LetterAnswerType.InWordAtExactLocation;
  } else if (isLetterNotAtExactLocation(imgData.data[0], imgData.data[1], imgData.data[2])) {
    return LetterAnswerType.InWordAtNonLocation;
  } else if (isLetterNotInWord(imgData.data[0], imgData.data[1], imgData.data[2])) {
    return LetterAnswerType.NotInWord;
    // } else if (!isLetterWhite(imgData.data[0], imgData.data[1], imgData.data[2])) {
    //   console.log('letter unknown but not white: ', imgData.data[0], imgData.data[1], imgData.data[2]);
  }
  return LetterAnswerType.Unknown;
};

const getLetterAnswerTypeRgb = (red: any, green: any, blue: any): LetterAnswerType => {
  if (isLetterAtExactLocation(red, green, blue)) {
    return LetterAnswerType.InWordAtExactLocation;
  } else if (isLetterNotAtExactLocation(red, green, blue)) {
    return LetterAnswerType.InWordAtNonLocation;
  } else if (isLetterNotInWord(red, green, blue)) {
    return LetterAnswerType.NotInWord;
    // } else if (!isLetterWhite(red, green, blue)) {
    //   console.log('letter unknown but not white: ', red, green, blue);
  }
  return LetterAnswerType.Unknown;
};

const acceptableColorValueDifference = 2;

const colorMatch = (actualColor: number, targetColor: number): boolean => {
  return (Math.abs(actualColor - targetColor) < acceptableColorValueDifference);
};

const isLetterAtExactLocation = (red: any, green: any, blue: any): boolean => {
  return (colorMatch(red, InWordAtExactLocationValue.red) && colorMatch(green, InWordAtExactLocationValue.green) && colorMatch(blue, InWordAtExactLocationValue.blue));
};

const isLetterNotAtExactLocation = (red: any, green: any, blue: any): boolean => {
  return (colorMatch(red, InWordAtNonLocationValue.red) && colorMatch(green, InWordAtNonLocationValue.green) && colorMatch(blue, InWordAtNonLocationValue.blue));
};

const isLetterNotInWord = (red: any, green: any, blue: any): boolean => {
  return (colorMatch(red, NotInWordValue.red) && colorMatch(green, NotInWordValue.green) && colorMatch(blue, NotInWordValue.blue));
};

// whiteAtImageDataRGBIndex
//    length is canvas width * canvas height
//    that is, there's one entry in this array for each set of image pixels (4 bytes) in imageDataRGB
//    index into this array for a given rowIndex, columnIndex is therefore
//        (rowIndex * canvasWidth) + columnIndex
export const buildWhiteAtImageDataRGBIndex = (imageDataRGB: Uint8ClampedArray): boolean[] => {

  const whiteValue = 255;

  const whiteAtImageDataRGBIndex: boolean[] = [];

  for (let imageDataIndex = 0; imageDataIndex < imageDataRGB.length; imageDataIndex += 4) {
    const red = imageDataRGB[imageDataIndex];
    const green = imageDataRGB[imageDataIndex + 1];
    const blue = imageDataRGB[imageDataIndex + 2];
    if (red === whiteValue && green == whiteValue && blue === whiteValue) {
      whiteAtImageDataRGBIndex.push(true);
    } else {
      whiteAtImageDataRGBIndex.push(false);
    }
  }
  return whiteAtImageDataRGBIndex;
};

export const getWhiteRows = (canvasWidth: number, whiteAtImageDataRGBIndex: boolean[]): number[] => {

  const whiteRows: number[] = [];

  for (let rowIndex = 0; rowIndex < canvasWidth; rowIndex++) {
    let allPixelsInRowAreWhite = true;
    for (let columnIndex = pixelOffsetFromEdge; columnIndex < (canvasWidth - (pixelOffsetFromEdge * 2)); columnIndex++) {
      // convert rowIndex, columnIndex into index into whiteAtImageDataRGBIndex
      const indexIntoWhiteAtImageDataRGBIndex = (rowIndex * canvasWidth) + columnIndex;
      if (!whiteAtImageDataRGBIndex[indexIntoWhiteAtImageDataRGBIndex]) {
        allPixelsInRowAreWhite = false;
        // break here if the code just breaks the inner loop
      }
    }
    if (allPixelsInRowAreWhite) {
      whiteRows.push(rowIndex);
    }
  }

  return whiteRows;
};

export const getWhiteColumns = (canvasWidth: number, canvasHeight: number, whiteAtImageDataRGBIndex: boolean[]): number[] => {
  const whiteColumns: number[] = [];
  for (let columnIndex = 0; columnIndex < canvasWidth; columnIndex++) {
    let allPixelsInColumnAreWhite = true;
    for (let rowIndex = pixelOffsetFromEdge; rowIndex < (canvasHeight - (pixelOffsetFromEdge * 2)); rowIndex++) {
      // convert rowIndex, columnIndex into index into whiteAtImageDataRGBIndex
      const indexIntoWhiteAtImageDataRGBIndex = (rowIndex * canvasWidth) + columnIndex;
      if (!whiteAtImageDataRGBIndex[indexIntoWhiteAtImageDataRGBIndex]) {
        allPixelsInColumnAreWhite = false;
        // TEDTODO - break here
      }
    }
    if (allPixelsInColumnAreWhite) {
      whiteColumns.push(columnIndex);
    }
  }
  return whiteColumns;
};

export const convertWhiteRowsToBlack = (canvasWidth: number, whiteRows: number[], imageDataRGB: Uint8ClampedArray) => {
  for (let rowIndex = 0; rowIndex < whiteRows.length; rowIndex++) {
    const whiteRowIndex = whiteRows[rowIndex];
    const rowStartIndex = whiteRowIndex * canvasWidth * 4;
    for (let columnIndex = 0; columnIndex < canvasWidth; columnIndex++) {
      const columnOffset = columnIndex * 4;
      imageDataRGB[rowStartIndex + columnOffset] = 0;
      imageDataRGB[rowStartIndex + columnOffset + 1] = 0;
      imageDataRGB[rowStartIndex + columnOffset + 2] = 0;
    }
  }
};

export const convertWhiteColumnsToBlack = (canvasWidth: number, canvasHeight: number,whiteColumns: number[], imageDataRGB: Uint8ClampedArray) => {
  for (let indexIntoWhiteColumns = 0; indexIntoWhiteColumns < whiteColumns.length; indexIntoWhiteColumns++) {
    const whiteColumnIndex = whiteColumns[indexIntoWhiteColumns];
    // const columnStartIndex = whiteColumnIndex * wordleCanvas.height * 4;
    for (let rowIndex = 0; rowIndex < canvasHeight; rowIndex++) {
      const offset = offsetFromPosition(canvasWidth, rowIndex, whiteColumnIndex);
      // const columnOffset = columnIndex * 4;
      imageDataRGB[offset] = 0;
      imageDataRGB[offset + 1] = 0;
      imageDataRGB[offset + 2] = 0;
    }
  }
};

const offsetFromPosition = (canvasWidth: number, row: number, column: number): number => {
  const offset = (row * canvasWidth * 4) + (column * 4);
  return offset;
};

export const convertBackgroundColorsToBlack = (imgData: Uint8ClampedArray) => {
  for (let i = 0; i < imgData.length; i += 4) {
    const red = imgData[i];
    const green = imgData[i + 1];
    const blue = imgData[i + 2];
    const letterAnswerType: LetterAnswerType = getLetterAnswerTypeRgb(red, green, blue);
    if (letterAnswerType !== LetterAnswerType.Unknown) {
      imgData[i] = 0;
      imgData[i + 1] = 0;
      imgData[i + 2] = 0;
    }
  }
};


