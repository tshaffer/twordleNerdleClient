/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import {
  cnAddGuess,
  cnUpdateGuess,
  cnListWords,
  cnSetLetterAtLocation,
  cnSetLettersNotAtLocation,
  cnSetLettersNotInWord,
} from '../controllers';

import {
  getPossibleWords,
  getInputError,
  getGuesses,
} from '../selectors';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import { isNil, isUndefined } from 'lodash';
import { SyntheticEvent } from 'react';
import { InWordAtExactLocationValue, InWordAtNonLocationValue, LetterAnswerType, NotInWordValue } from '../types';
import _ = require('lodash');

interface ClipboardEvent<T = Element> extends SyntheticEvent<T, any> {
  clipboardData: DataTransfer;
}
export interface AppProps {
  guesses: string[];
  onAddGuess: () => any;
  onUpdateGuess: (guessIndex: number, guess: string) => any;
  possibleWords: string[];
  inputError: string | null;
  onSetLetterAtLocation: (index: number, letterAtLocation: string,) => any;
  onSetLettersNotAtLocation: (index: number, lettersNotAtLocation: string) => any;
  onSetLettersNotInWord: (lettersNotInWord: string) => any;
  onListWords: () => any;
}

interface PixelPosition {
  row: number;
  column: number;
}

const App = (props: AppProps) => {

  let wordleCanvas: HTMLCanvasElement;

  const dimensionsRef = React.useRef({ imageWidth: -1, imageHeight: -1 });

  const [listWordsInvoked, setListWordsInvoked] = React.useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);

  const positionFromOffset = (offset: number): PixelPosition => {
    const pixelIndex = Math.trunc(offset / 4);
    const row = Math.trunc(pixelIndex / wordleCanvas.width);
    const pixelOffset = offset - (row * wordleCanvas.width * 4);
    const column = Math.trunc(pixelOffset / 4);
    return { row, column };
  };

  const offsetFromPosition = (row: number, column: number): number => {
    const offset = (row * wordleCanvas.width * 4) + (column * 4);
    return offset;
  };

  // invoked when the user clicks on List Words
  const processImageData = () => {

    wordleCanvas = document.getElementById('mycanvas') as HTMLCanvasElement;

    console.log('wordleCanvas dimensions: ', wordleCanvas.width, wordleCanvas.height);

    const ctx: CanvasRenderingContext2D = wordleCanvas.getContext('2d');

    const allImageData: ImageData = ctx.getImageData(0, 0, wordleCanvas.width, wordleCanvas.height);
    const imageDataRGB: Uint8ClampedArray = allImageData.data;

    const whiteValue = 255;

    // whiteAtImageDataRGBIndex
    //    length is canvas width * canvas height
    //    that is, there's one entry in this array for each set of image pixels (4 bytes) in imageDataRGB
    //    index into this array for a given rowIndex, columnIndex is therefore
    //        (rowIndex * canvasWidth) + columnIndex

    const whiteAtImageDataRGBIndex: boolean[] = [];

    let whiteCount = 0;
    for (let imageDataIndex = 0; imageDataIndex < imageDataRGB.length; imageDataIndex += 4) {
      const red = imageDataRGB[imageDataIndex];
      const green = imageDataRGB[imageDataIndex + 1];
      const blue = imageDataRGB[imageDataIndex + 2];
      if (red === whiteValue && green == whiteValue && blue === whiteValue) {
        whiteAtImageDataRGBIndex.push(true);
        whiteCount++;
      } else {
        whiteAtImageDataRGBIndex.push(false);
      }
    }

    console.log('whiteCount');
    console.log(whiteCount);

    console.log('whiteAtImageDataRGBIndex');
    console.log(whiteAtImageDataRGBIndex);

    const pixelOffsetFromEdge = 10;

    // find all white rows
    const whiteRows: number[] = [];
    for (let rowIndex = 0; rowIndex < wordleCanvas.height; rowIndex++) {
      let allPixelsInRowAreWhite = true;
      for (let columnIndex = pixelOffsetFromEdge; columnIndex < (wordleCanvas.width - (pixelOffsetFromEdge * 2)); columnIndex++) {
        // convert rowIndex, columnIndex into index into whiteAtImageDataRGBIndex
        const indexIntoWhiteAtImageDataRGBIndex = (rowIndex * wordleCanvas.width) + columnIndex;
        if (!whiteAtImageDataRGBIndex[indexIntoWhiteAtImageDataRGBIndex]) {
          allPixelsInRowAreWhite = false;
          // break here if the code just breaks the inner loop
        }
      }
      if (allPixelsInRowAreWhite) {
        console.log('allPixelsInRowAreWhite', rowIndex);
        whiteRows.push(rowIndex);

        // 
      }
    }

    // find all white columns
    const whiteColumns: number[] = [];
    for (let columnIndex = 0; columnIndex < wordleCanvas.width; columnIndex++) {
      let allPixelsInColumnAreWhite = true;
      for (let rowIndex = pixelOffsetFromEdge; rowIndex < (wordleCanvas.height - (pixelOffsetFromEdge * 2)); rowIndex++) {
        // convert rowIndex, columnIndex into index into whiteAtImageDataRGBIndex
        const indexIntoWhiteAtImageDataRGBIndex = (rowIndex * wordleCanvas.width) + columnIndex;
        if (!whiteAtImageDataRGBIndex[indexIntoWhiteAtImageDataRGBIndex]) {
          allPixelsInColumnAreWhite = false;
          // break here if the code just breaks the inner loop
        }
      }
      if (allPixelsInColumnAreWhite) {
        console.log('allPixelsInColumnAreWhite', columnIndex);
        whiteColumns.push(columnIndex);
      }
    }

    // convert pixels to black in the white rows
    for (let rowIndex = 0; rowIndex < whiteRows.length; rowIndex++) {
      const whiteRowIndex = whiteRows[rowIndex];
      const rowStartIndex = whiteRowIndex * wordleCanvas.width * 4;
      for (let columnIndex = 0; columnIndex < wordleCanvas.width; columnIndex++) {
        const columnOffset = columnIndex * 4;
        imageDataRGB[rowStartIndex + columnOffset] = 0;
        imageDataRGB[rowStartIndex + columnOffset + 1] = 0;
        imageDataRGB[rowStartIndex + columnOffset + 2] = 0;
      }
    }

    // convert pixels to black in the white columns
    for (let indexIntoWhiteColumns = 0; indexIntoWhiteColumns < whiteColumns.length; indexIntoWhiteColumns++) {
      const whiteColumnIndex = whiteColumns[indexIntoWhiteColumns];
      // const columnStartIndex = whiteColumnIndex * wordleCanvas.height * 4;
      for (let rowIndex = 0; rowIndex < wordleCanvas.height; rowIndex++) {
        const offset = offsetFromPosition(rowIndex, whiteColumnIndex);
        // const columnOffset = columnIndex * 4;
        imageDataRGB[offset] = 0;
        imageDataRGB[offset + 1] = 0;
        imageDataRGB[offset + 2] = 0;
      }
    }

    ctx.putImageData(allImageData, 0, 0);

    const enteredWords: string[] = [];
    for (let i = 0; i < props.guesses.length; i++) {
      if (props.guesses[i] !== '') {
        enteredWords.push(props.guesses[i]);
      }
    }

    const numRows = enteredWords.length;
    const numColumns = 5;

    const pixelsPerColumn = dimensionsRef.current.imageWidth / numColumns;
    const pixelsPerRow = dimensionsRef.current.imageHeight / numRows;

    const letterAnswerValues: LetterAnswerType[][] = [];
    const lettersAtExactLocation: string[] = ['', '', '', '', ''];
    const lettersNotAtExactLocation: string[] = ['', '', '', '', ''];
    let lettersNotInWord: string = '';

    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
      letterAnswerValues.push([]);
      const letterAnswersInRow = letterAnswerValues[rowIndex];
      for (let columnIndex = 0; columnIndex < numColumns; columnIndex++) {
        // console.log('row: ', rowIndex, 'column: ', columnIndex);
        const x = (columnIndex * pixelsPerColumn) + (pixelsPerColumn / 8);
        const y = (rowIndex * pixelsPerRow) + (pixelsPerRow / 8);
        // console.log('x = ', x, ', y = ', y);

        const imgData: ImageData = ctx.getImageData(x, y, 10, 10);

        // const i = 0;
        // const red = imgData.data[i];
        // const green = imgData.data[i + 1];
        // const blue = imgData.data[i + 2];
        // const alpha = imgData.data[i + 3];

        const letterAnswerType: LetterAnswerType = getLetterAnswerType(imgData);
        // console.log('red: ', red, 'green: ', green, 'blue: ', blue, 'alpha: ', alpha);

        letterAnswersInRow.push(letterAnswerType);

        const currentCharacter: string = enteredWords[rowIndex].charAt(columnIndex);

        switch (letterAnswerType) {
          case LetterAnswerType.InWordAtExactLocation:
            lettersAtExactLocation[columnIndex] = currentCharacter;
            props.onSetLetterAtLocation(columnIndex, currentCharacter);
            break;
          case LetterAnswerType.InWordAtNonLocation:
            lettersNotAtExactLocation[columnIndex] = lettersNotAtExactLocation[columnIndex] + currentCharacter;
            props.onSetLettersNotAtLocation(columnIndex, lettersNotAtExactLocation[columnIndex]);
            break;
          case LetterAnswerType.NotInWord:
          default:
            lettersNotInWord = lettersNotInWord + currentCharacter;
            break;
        }
      }
    }

    props.onSetLettersNotInWord(lettersNotInWord);

    // console.log('letterAnswerValues');
    // console.log(letterAnswerValues);
    // console.log(lettersAtExactLocation);
    // console.log(lettersNotAtExactLocation);
    // console.log(lettersNotInWord);

    const wordleImageData: ImageData = ctx.getImageData(0, 0, wordleCanvas.width, wordleCanvas.height);

    const imgData = wordleImageData.data;
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

    ctx.putImageData(wordleImageData, 0, 0);

    const imageDataStr: string = wordleCanvas.toDataURL();
    console.log(imageDataStr);

    // imageDataStr can be plugged directly into request.json
  };



  // console.log(wordleImageData);

  // let unknowns = 0;
  // let knowns = 0;

  // const unknownsByRowNumber: any = {};
  // const unknownsByColumnNumber: any = {};

  // const imgData = wordleImageData.data;
  // for (let i = 0; i < imgData.length; i += 4) {
  //   const red = imgData[i];
  //   const green = imgData[i + 1];
  //   const blue = imgData[i + 2];
  //   const letterAnswerType: LetterAnswerType = getLetterAnswerTypeRgb(red, green, blue);
  //   // if (letterAnswerType === LetterAnswerType.Unknown) {
  //   //   console.log('unknown: ', red, green, blue);
  //   // }
  //   if (letterAnswerType !== LetterAnswerType.Unknown) {
  //     knowns++;
  //     imgData[i] = 0;
  //     imgData[i + 1] = 0;
  //     imgData[i + 2] = 0;
  //   } else {

  //     unknowns++;

  //     const pixelIndex = Math.trunc(i / 4);

  //     const rowNumber = Math.trunc(pixelIndex / wordleCanvas.width);

  //     const pixelOffset = i - (rowNumber * wordleCanvas.width * 4);
  //     const columnNumber = Math.trunc(pixelOffset / 4);

  //     const rowKey = rowNumber.toString();
  //     if (isNil(unknownsByRowNumber[rowKey])) {
  //       unknownsByRowNumber[rowKey] = 0;
  //     }
  //     unknownsByRowNumber[rowKey]++;

  //   if (unknownsByRowNumber[rowKey] === wordleCanvas.width) {
  //     const rowStartIndex = rowNumber * wordleCanvas.width * 4;
  //     for (let j = 0; j < (wordleCanvas.width * 4); j += 4) {
  //       imgData[rowStartIndex + j] = 0;
  //       imgData[rowStartIndex + j + 1] = 0;
  //       imgData[rowStartIndex + j + 2] = 0;
  //     }
  //   }

  //   const columnKey = columnNumber.toString();
  //   if (isNil(unknownsByColumnNumber[rowKey])) {
  //     unknownsByColumnNumber[columnKey] = 0;
  //   }
  //   unknownsByColumnNumber[columnKey]++;
  // }
  // }

  // const magicNumber = 400;

  // for (const key in unknownsByColumnNumber) {
  //   if (Object.prototype.hasOwnProperty.call(unknownsByColumnNumber, key)) {
  //     const unknowns = unknownsByColumnNumber[key];
  //     if (!isNil(unknowns) && unknowns > magicNumber) {
  //       const columnNumber = parseInt(key, 10);
  //       console.log('convert rows in ', columnNumber, ' to black');

  //       // number of rows = wordleCanvas.height
  //       for (let rowIndex = 0; rowIndex < wordleCanvas.height; rowIndex++) {
  //         const index = (rowIndex * wordleCanvas.width * 4) + (columnNumber * 4);
  //         imgData[index] = 0;
  //         imgData[index + 1] = 0;
  //         imgData[index + 2] = 0;
  //       }
  //     }
  //   }
  // }

  // console.log('unknownsByRowNumber', unknownsByRowNumber);
  // console.log('unknownsByColumnNumber', unknownsByColumnNumber);

  // ctx.putImageData(wordleImageData, 0, 0);

  // };

  const getLetterAnswerType = (imgData: ImageData): LetterAnswerType => {
    if (isLetterAtExactLocation(imgData.data[0], imgData.data[1], imgData.data[2])) {
      return LetterAnswerType.InWordAtExactLocation;
    } else if (isLetterNotAtExactLocation(imgData.data[0], imgData.data[1], imgData.data[2])) {
      return LetterAnswerType.InWordAtNonLocation;
    } else if (isLetterNotInWord(imgData.data[0], imgData.data[1], imgData.data[2])) {
      return LetterAnswerType.NotInWord;
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
    }
    return LetterAnswerType.Unknown;
  };

  const isLetterAtExactLocation = (red: any, green: any, blue: any): boolean => {
    return ((red === InWordAtExactLocationValue.red) && (green === InWordAtExactLocationValue.green) && (blue === InWordAtExactLocationValue.blue));
  };

  const isLetterNotAtExactLocation = (red: any, green: any, blue: any): boolean => {
    return ((red === InWordAtNonLocationValue.red) && (green === InWordAtNonLocationValue.green) && (blue === InWordAtNonLocationValue.blue));
  };

  const isLetterNotInWord = (red: any, green: any, blue: any): boolean => {
    return ((red === NotInWordValue.red) && (green === NotInWordValue.green) && (blue === NotInWordValue.blue));
  };

  const updateGuess = (guessIndex: number, guessValue: string) => {
    props.onUpdateGuess(guessIndex, guessValue);
  };


  // invoked on paste event
  const retrieveImageFromClipboardAsBlob = (pasteEvent) => {

    if (pasteEvent.clipboardData == false) {
      processImageBlob(undefined);
    }

    const items = pasteEvent.clipboardData.items;

    if (items == undefined) {
      processImageBlob(undefined);
    }

    for (let i = 0; i < items.length; i++) {
      // Skip content if not image
      if (items[i].type.indexOf('image') == -1) continue;
      // Retrieve image on clipboard as blob
      const blob = items[i].getAsFile();

      const fr = new FileReader();
      fr.onload = function () { // file is loaded
        const img = new Image;

        img.onload = function () {
          // setImageWidth(img.width);
          // setImageHeight(img.height);
          dimensionsRef.current = { imageWidth: img.width, imageHeight: img.height };
          console.log('img.width = ', img.width, 'img.height = ', img.height);
          console.log('dimensionsRef: ', dimensionsRef.current);

          processImageBlob(blob);
        };

        img.src = fr.result as any; // is the data URL because called with readAsDataURL
      };

      fr.readAsDataURL(blob);
    }
  };

  // invoked after pasted image data is loaded
  const processImageBlob = (imageBlob) => {

    if (imageBlob) {
      wordleCanvas = document.getElementById('mycanvas') as HTMLCanvasElement;
      const ctx: CanvasRenderingContext2D = wordleCanvas.getContext('2d');

      // Create an image to render the blob on the canvas
      const img = new Image();

      // Once the image loads, render the img on the canvas
      img.onload = function () {

        // Update dimensions of the canvas with the dimensions of the image
        // wordleCanvas.width = props.imageWidth;
        // wordleCanvas.height = props.imageHeight;
        wordleCanvas.width = dimensionsRef.current.imageWidth;
        wordleCanvas.height = dimensionsRef.current.imageHeight;

        // Draw the image
        console.log('dimensionsRef: ', dimensionsRef.current);
        ctx.drawImage(img, 0, 0);
      };

      // Crossbrowser support for URL
      const URLObj = window.URL || window.webkitURL;

      // Creates a DOMString containing a URL representing the object given in the parameter
      // namely the original Blob
      img.src = URLObj.createObjectURL(imageBlob);
    }
  };

  const handleAddGuess = () => {
    props.onAddGuess();
  };

  const handleListWords = () => {
    if (isNil(props.inputError)) {
      processImageData();
      setListWordsInvoked(true);
      props.onListWords();
    } else {
      console.log('Error: ' + props.inputError);
      setErrorDialogOpen(true);
    }
  };

  const handleCloseErrorDialog = () => {
    setErrorDialogOpen(false);
  };

  const handleClipboardEvent = (e: ClipboardEvent<HTMLInputElement>) => {
    retrieveImageFromClipboardAsBlob(e);
  };

  const handleInputChanged = (event: any) => {
    console.log('handleInputChanged invoked');
  };

  const renderGuess = (guess: string, guessIndex: number) => {
    return (
      <div>
        <TextField
          id={'guessIndex' + guessIndex.toString()}
          key={'guessIndex' + guessIndex.toString()}
          style={{ width: '86px' }}
          inputProps={{ maxLength: 5 }}
          variant='standard'
          value={guess}
          onChange={() => updateGuess(guessIndex, (event.target as any).value)}
        />
        <br />
      </div>
    );
  };

  const renderGuesses = () => {
    return props.guesses.map((guess: string, index: number) => {
      return renderGuess(guess, index);
    });
  };

  const renderWord = (word: string) => {
    return (
      <ListItem key={word}>
        <ListItemText key={word}>
          {word}
        </ListItemText>
      </ListItem>
    );
  };

  const renderWordList = () => {

    if (props.possibleWords.length > 0) {
      return props.possibleWords.map((possibleWord: string) => {
        return renderWord(possibleWord);
      });
    } else {
      return (
        <ListItem>
          <ListItemText>
            None
          </ListItemText>
        </ListItem>
      );
    }
  };

  const renderWordListElement = () => {
    if (!listWordsInvoked) {
      return null;
    }
    const wordList = renderWordList();
    return (
      <Paper style={{ maxHeight: '100%', overflow: 'auto' }}>
        <List
          subheader={<ListSubheader>Possible words</ListSubheader>}
        >
          {wordList}
        </List>
      </Paper>
    );

  };

  const guesses = renderGuesses();

  const wordListElement = renderWordListElement();

  return (
    <div>
      <Dialog
        open={errorDialogOpen}
        onClose={handleCloseErrorDialog}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>
          {'Input Error'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            {props.inputError}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseErrorDialog}>Close</Button>
          <Button onClick={handleCloseErrorDialog} autoFocus>
            Agree
          </Button>
        </DialogActions>
      </Dialog>
      <Box
        component='form'
        sx={{
          '& > :not(style)': { m: 1, width: '25ch' },
        }}
        noValidate
        autoComplete='off'
      >
        Guesses
        <br />
        {guesses}
        <br />
        <Button
          variant='contained'
          onClick={handleAddGuess}
        >
          Add Guess
        </Button>
        <br />
        <input
          value='Paste here'
          onPaste={handleClipboardEvent}
          onChange={handleInputChanged}
        />
        <br />
        <canvas
          style={{ border: '1px solid grey' }}
          id='mycanvas'
        >
        </canvas>
        <br />
        <Button
          variant='contained'
          onClick={handleListWords}
        >
          List words
        </Button>
        {wordListElement}
        <br />
      </Box>
    </div>
  );
};

function mapStateToProps(state: any) {
  return {
    guesses: getGuesses(state),
    possibleWords: getPossibleWords(state),
    inputError: getInputError(state),
  };
}

const mapDispatchToProps = (dispatch: any) => {
  return bindActionCreators({
    onAddGuess: cnAddGuess,
    onUpdateGuess: cnUpdateGuess,
    onSetLetterAtLocation: cnSetLetterAtLocation,
    onSetLettersNotAtLocation: cnSetLettersNotAtLocation,
    onSetLettersNotInWord: cnSetLettersNotInWord,
    onListWords: cnListWords,
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

