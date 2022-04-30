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
  cnGetGuesses,
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
import { isNil } from 'lodash';
import { SyntheticEvent } from 'react';
import { InWordAtExactLocationValue, InWordAtNonLocationValue, LetterAnswerType, NotInWordValue, WhiteLetterValue } from '../types';

interface ClipboardEvent<T = Element> extends SyntheticEvent<T, any> {
  clipboardData: DataTransfer;
}
export interface AppProps {
  guesses: string[];
  onGetGuesses: (imageDataBase64: string) => any;
  onUpdateGuess: (guessIndex: number, guess: string) => any;
  possibleWords: string[];
  inputError: string | null;
  onSetLetterAtLocation: (index: number, letterAtLocation: string,) => any;
  onSetLettersNotAtLocation: (index: number, lettersNotAtLocation: string) => any;
  onSetLettersNotInWord: (lettersNotInWord: string) => any;
  onListWords: (imageDataBase64: string) => any;
}

const App = (props: AppProps) => {

  const pixelOffsetFromEdge = 10;

  let wordleCanvas: HTMLCanvasElement;
  let imageDataBase64: string;
  let pastedBlob: any;


  const dimensionsRef = React.useRef({ imageWidth: -1, imageHeight: -1 });

  const [listWordsInvoked, setListWordsInvoked] = React.useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);

  const offsetFromPosition = (row: number, column: number): number => {
    const offset = (row * wordleCanvas.width * 4) + (column * 4);
    return offset;
  };

  // whiteAtImageDataRGBIndex
  //    length is canvas width * canvas height
  //    that is, there's one entry in this array for each set of image pixels (4 bytes) in imageDataRGB
  //    index into this array for a given rowIndex, columnIndex is therefore
  //        (rowIndex * canvasWidth) + columnIndex
  const buildWhiteAtImageDataRGBIndex = (imageDataRGB: Uint8ClampedArray): boolean[] => {

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

  const buildWhiteRows = (whiteAtImageDataRGBIndex: boolean[]): number[] => {

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
        whiteRows.push(rowIndex);
      }
    }

    return whiteRows;
  };

  const buildWhiteColumns = (whiteAtImageDataRGBIndex: boolean[]): number[] => {
    const whiteColumns: number[] = [];
    for (let columnIndex = 0; columnIndex < wordleCanvas.width; columnIndex++) {
      let allPixelsInColumnAreWhite = true;
      for (let rowIndex = pixelOffsetFromEdge; rowIndex < (wordleCanvas.height - (pixelOffsetFromEdge * 2)); rowIndex++) {
        // convert rowIndex, columnIndex into index into whiteAtImageDataRGBIndex
        const indexIntoWhiteAtImageDataRGBIndex = (rowIndex * wordleCanvas.width) + columnIndex;
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

  const convertWhiteRowsToBlack = (whiteRows: number[], imageDataRGB: Uint8ClampedArray) => {
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
  };

  const convertWhiteColumnsToBlack = (whiteColumns: number[], imageDataRGB: Uint8ClampedArray) => {
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
  };

  const getLettersNotInWord = (ctx: CanvasRenderingContext2D, guesses: string[], numRows: number, numColumns: number, pixelsPerColumn: number, pixelsPerRow: number): string => {

    let lettersNotInWord: string = '';

    const letterAnswerValues: LetterAnswerType[][] = [];
    const lettersAtExactLocation: string[] = ['', '', '', '', ''];
    const lettersNotAtExactLocation: string[] = ['', '', '', '', ''];

    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
      letterAnswerValues.push([]);
      const letterAnswersInRow = letterAnswerValues[rowIndex];
      for (let columnIndex = 0; columnIndex < numColumns; columnIndex++) {
        // console.log('row: ', rowIndex, 'column: ', columnIndex);
        const x = (columnIndex * pixelsPerColumn) + (pixelsPerColumn / 8);
        const y = (rowIndex * pixelsPerRow) + (pixelsPerRow / 8);
        // console.log('x = ', x, ', y = ', y);

        const imgData: ImageData = ctx.getImageData(x, y, 10, 10);

        const letterAnswerType: LetterAnswerType = getLetterAnswerType(imgData);

        letterAnswersInRow.push(letterAnswerType);

        const currentCharacter: string = guesses[rowIndex].charAt(columnIndex);

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

    return lettersNotInWord;
  };
  
  const convertBackgroundColorsToBlack = (imgData: Uint8ClampedArray) => {
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

  // invoked when the user clicks on List Words
  const processImageData = () => {

    wordleCanvas = document.getElementById('mycanvas') as HTMLCanvasElement;

    console.log('wordleCanvas dimensions: ', wordleCanvas.width, wordleCanvas.height);

    const ctx: CanvasRenderingContext2D = wordleCanvas.getContext('2d');

    const allImageData: ImageData = ctx.getImageData(0, 0, wordleCanvas.width, wordleCanvas.height);
    const imageDataRGB: Uint8ClampedArray = allImageData.data;

    const whiteAtImageDataRGBIndex: boolean[] = buildWhiteAtImageDataRGBIndex(imageDataRGB);

    // find all white rows
    const whiteRows: number[] = buildWhiteRows(whiteAtImageDataRGBIndex);

    // find all white columns
    const whiteColumns: number[] = buildWhiteColumns(whiteAtImageDataRGBIndex);

    // convert pixels to black in the white rows
    convertWhiteRowsToBlack(whiteRows, imageDataRGB);

    // convert pixels to black in the white columns
    convertWhiteColumnsToBlack(whiteColumns, imageDataRGB);

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

    const lettersNotInWord = getLettersNotInWord(ctx, enteredWords, numRows, numColumns, pixelsPerRow, pixelsPerColumn);
    props.onSetLettersNotInWord(lettersNotInWord);

    const wordleImageData: ImageData = ctx.getImageData(0, 0, wordleCanvas.width, wordleCanvas.height);

    convertBackgroundColorsToBlack(wordleImageData.data);

    ctx.putImageData(wordleImageData, 0, 0);

    // imageDataStr looks like
    //    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA.....
    imageDataBase64 = wordleCanvas.toDataURL();

    // imageDataStr can be plugged directly into request.json
  };


  const getGuesses = () => {

    wordleCanvas = document.getElementById('mycanvas') as HTMLCanvasElement;

    console.log('wordleCanvas dimensions: ', wordleCanvas.width, wordleCanvas.height);

    const ctx: CanvasRenderingContext2D = wordleCanvas.getContext('2d');
    const allImageData: ImageData = ctx.getImageData(0, 0, wordleCanvas.width, wordleCanvas.height);
    const imageDataRGB: Uint8ClampedArray = allImageData.data;

    const pixelOffsetFromEdge = 10;
    const whiteValue = 255;

    // whiteAtImageDataRGBIndex
    //    length is canvas width * canvas height
    //    that is, there's one entry in this array for each set of image pixels (4 bytes) in imageDataRGB
    //    index into this array for a given rowIndex, columnIndex is therefore
    //        (rowIndex * canvasWidth) + columnIndex

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
        whiteRows.push(rowIndex);
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

    for (let i = 0; i < imageDataRGB.length; i += 4) {
      const red = imageDataRGB[i];
      const green = imageDataRGB[i + 1];
      const blue = imageDataRGB[i + 2];
      const letterAnswerType: LetterAnswerType = getLetterAnswerTypeRgb(red, green, blue);
      if (letterAnswerType !== LetterAnswerType.Unknown) {
        imageDataRGB[i] = 0;
        imageDataRGB[i + 1] = 0;
        imageDataRGB[i + 2] = 0;
      }
    }

    ctx.putImageData(allImageData, 0, 0);

    // imageDataStr looks like
    //    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA.....
    imageDataBase64 = wordleCanvas.toDataURL();
  };

  const getLetterAnswerType = (imgData: ImageData): LetterAnswerType => {
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

  const isLetterWhite = (red: any, green: any, blue: any): boolean => {
    return (colorMatch(red, WhiteLetterValue.red) && colorMatch(green, WhiteLetterValue.green) && colorMatch(blue, WhiteLetterValue.blue));
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

      pastedBlob = blob;

      processPastedBlob(blob);
    }
  };

  const processPastedBlob = (blob: any) => {
    const fr = new FileReader();
    fr.onload = function () { // file is loaded
      const img = new Image;

      img.onload = function () {
        dimensionsRef.current = { imageWidth: img.width, imageHeight: img.height };
        console.log('img.width = ', img.width, 'img.height = ', img.height);
        console.log('dimensionsRef: ', dimensionsRef.current);

        processImageBlob(blob);
      };

      img.src = fr.result as any; // is the data URL because called with readAsDataURL
    };

    fr.readAsDataURL(blob);
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

  const handleGetGuesses = () => {
    getGuesses();
    props.onGetGuesses(imageDataBase64);
    setTimeout(function () {
      processPastedBlob(pastedBlob);
    }, 500);
  };

  const handleListWords = () => {
    if (isNil(props.inputError)) {
      processImageData();
      setListWordsInvoked(true);
      props.onListWords(imageDataBase64);
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
    <div
      onPaste={handleClipboardEvent}
    >
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
        <br />
        <canvas
          style={{ border: '1px solid grey' }}
          id='mycanvas'
        >
        </canvas>
        <br />
        <Button
          variant='contained'
          onClick={handleGetGuesses}
        >
          Get Guesses
        </Button>
        <br />
        {guesses}
        <br />
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
    onGetGuesses: cnGetGuesses,
    onUpdateGuess: cnUpdateGuess,
    onSetLetterAtLocation: cnSetLetterAtLocation,
    onSetLettersNotAtLocation: cnSetLettersNotAtLocation,
    onSetLettersNotInWord: cnSetLettersNotInWord,
    onListWords: cnListWords,
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

