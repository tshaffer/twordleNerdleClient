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
import { LetterAnswerType } from '../types';
import {
  buildWhiteAtImageDataRGBIndex,
  convertWhiteColumnsToBlack,
  convertWhiteRowsToBlack,
  getLetterAnswerType,
  getWhiteColumns,
  getWhiteRows,
  convertBackgroundColorsToBlack,
} from '../utilities';

import { SyntheticEvent } from 'react';
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

  let wordleCanvas: HTMLCanvasElement;
  let imageDataBase64: string;
  let pastedBlob: any;

  const dimensionsRef = React.useRef({ imageWidth: -1, imageHeight: -1 });

  const [listWordsInvoked, setListWordsInvoked] = React.useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);

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

  // invoked when the user clicks on List Words
  const processImageData = () => {

    wordleCanvas = document.getElementById('mycanvas') as HTMLCanvasElement;

    console.log('wordleCanvas dimensions: ', wordleCanvas.width, wordleCanvas.height);

    const ctx: CanvasRenderingContext2D = wordleCanvas.getContext('2d');

    const allImageData: ImageData = ctx.getImageData(0, 0, wordleCanvas.width, wordleCanvas.height);
    const imageDataRGB: Uint8ClampedArray = allImageData.data;

    const whiteAtImageDataRGBIndex: boolean[] = buildWhiteAtImageDataRGBIndex(imageDataRGB);

    const whiteRows: number[] = getWhiteRows(wordleCanvas.width, whiteAtImageDataRGBIndex);

    const whiteColumns: number[] = getWhiteColumns(wordleCanvas.width, wordleCanvas.height, whiteAtImageDataRGBIndex);

    convertWhiteRowsToBlack(wordleCanvas.width, whiteRows, imageDataRGB);

    convertWhiteColumnsToBlack(wordleCanvas.width, wordleCanvas.height, whiteColumns, imageDataRGB);

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

    const whiteAtImageDataRGBIndex: boolean[] = buildWhiteAtImageDataRGBIndex(imageDataRGB);

    const pixelOffsetFromEdge = 10;
    const whiteValue = 255;

    const whiteRows: number[] = getWhiteRows(wordleCanvas.width, whiteAtImageDataRGBIndex);

    const whiteColumns: number[] = getWhiteColumns(wordleCanvas.width, wordleCanvas.height, whiteAtImageDataRGBIndex);

    convertWhiteRowsToBlack(wordleCanvas.width, whiteRows, imageDataRGB);

    convertWhiteColumnsToBlack(wordleCanvas.width, wordleCanvas.height, whiteColumns, imageDataRGB);

    ctx.putImageData(allImageData, 0, 0);

    convertBackgroundColorsToBlack(imageDataRGB);

    ctx.putImageData(allImageData, 0, 0);

    imageDataBase64 = wordleCanvas.toDataURL();
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
      // setTimeout(function () {
      //   processPastedBlob(pastedBlob);
      // }, 500);
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

