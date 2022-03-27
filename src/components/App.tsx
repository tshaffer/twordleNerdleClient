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
  cnSetFirstWord,
  cnSetSecondWord,
  cnListWords,
} from '../controllers';

import {
  getFirstWord,
  getSecondWord,
  getPossibleWords,
  getInputError,
} from '../selectors';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import { isNil } from 'lodash';
import { SyntheticEvent } from 'react';
import { InWordAtExactLocationValue, InWordAtNonLocationValue, LetterAnswerType, NotInWordValue } from '../types';

interface ClipboardEvent<T = Element> extends SyntheticEvent<T, any> {
  clipboardData: DataTransfer;
}
export interface AppProps {
  firstWord: string;
  secondWord: string;
  onSetFirstWord: (lettersNotInWord: string) => any;
  onSetSecondWord: (lettersNotInWord: string) => any;
  possibleWords: string[];
  inputError: string | null;
  onListWords: () => any;
}

const App = (props: AppProps) => {

  let wordleCanvas: HTMLCanvasElement;

  const [listWordsInvoked, setListWordsInvoked] = React.useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);

  React.useEffect(() => {
    init();
  }, []);

  const init = () => {
    console.log('app init invoked');
  };

  const handleFirstWordChanged = (event: any) => {
    console.log('new value');
    console.log(event.target.value);
    props.onSetFirstWord(event.target.value);
  };

  const handleSecondWordChanged = (event: any) => {
    console.log('new value');
    console.log(event.target.value);
    props.onSetSecondWord(event.target.value);
  };


  const handleListWords = () => {
    if (isNil(props.inputError)) {
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

  const retrieveImageFromClipboardAsBlob = (pasteEvent, callback) => {

    if (pasteEvent.clipboardData == false) {
      if (typeof (callback) == 'function') {
        callback(undefined);
      }
    }

    const items = pasteEvent.clipboardData.items;

    if (items == undefined) {
      if (typeof (callback) == 'function') {
        callback(undefined);
      }
    }

    for (let i = 0; i < items.length; i++) {
      // Skip content if not image
      if (items[i].type.indexOf('image') == -1) continue;
      // Retrieve image on clipboard as blob
      const blob = items[i].getAsFile();

      if (typeof (callback) == 'function') {
        callback(blob);
      }
    }
  };

  const processImageBlob = (imageBlob) => {
    console.log('processImageBlob');
    console.log(imageBlob);

    if (imageBlob) {
      wordleCanvas = document.getElementById('mycanvas') as HTMLCanvasElement;
      const ctx: CanvasRenderingContext2D = wordleCanvas.getContext('2d');

      // Create an image to render the blob on the canvas
      const img = new Image();

      // Once the image loads, render the img on the canvas
      img.onload = function () {
        // Update dimensions of the canvas with the dimensions of the image
        wordleCanvas.width = 996;
        wordleCanvas.height = 800;

        // Draw the image
        ctx.drawImage(img, 0, 0);
      };

      // Crossbrowser support for URL
      const URLObj = window.URL || window.webkitURL;

      // Creates a DOMString containing a URL representing the object given in the parameter
      // namely the original Blob
      img.src = URLObj.createObjectURL(imageBlob);
    }
  };

  const handleClipboardEvent = (e: ClipboardEvent<HTMLInputElement>) => {
    // Do something
    console.log('handleClipboardEvent invoked');
    retrieveImageFromClipboardAsBlob(e, processImageBlob);
  };

  const handleInputChanged = (event: any) => {
    console.log('handleInputChanged invoked');
  };

  const handleGetImageData = () => {
    console.log('wordleCanvas dimensions: ', wordleCanvas.width, wordleCanvas.height);
    // wordleCanvas dimensions:  996 800

    const letterAnswerValues: LetterAnswerType[][] = [];

    const imageWidth = 996;
    const imageHeight = 400;

    const numRows = 2;
    const numColumns = 5;

    const pixelsPerColumn = imageWidth / numColumns;
    const pixelsPerRow = imageHeight / numRows;

    const ctx: CanvasRenderingContext2D = wordleCanvas.getContext('2d');

    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
      letterAnswerValues.push([]);
      const letterAnswersInRow = letterAnswerValues[rowIndex];
      for (let columnIndex = 0; columnIndex < numColumns; columnIndex++) {
        const x = (columnIndex * pixelsPerColumn) + (pixelsPerColumn / 8);
        const y = (rowIndex * pixelsPerRow) + (pixelsPerRow / 8);
        console.log('x = ', x, ', y = ', y);

        const imgData: ImageData = ctx.getImageData(x, y, 10, 10);

        const i = 0;
        const red = imgData.data[i];
        const green = imgData.data[i + 1];
        const blue = imgData.data[i + 2];
        const alpha = imgData.data[i + 3];

        const letterAnswerType: LetterAnswerType = getLetterAnswerType(imgData);
        console.log('red: ', red);
        console.log('green: ', green);
        console.log('blue: ', blue);
        console.log('alpha: ', alpha);

        letterAnswersInRow.push(letterAnswerType);
      }
    }

    console.log('letterAnswerValues');
    console.log(letterAnswerValues);
  };

  const getLetterAnswerType = (imgData: any): LetterAnswerType => {
    if (isLetterAtExactLocation(imgData.data[0], imgData.data[1], imgData.data[2])) {
      return LetterAnswerType.InWordAtExactLocation;
    } else if (isLetterNotAtExactLocation(imgData.data[0], imgData.data[1], imgData.data[2])) {
      return LetterAnswerType.InWordAtNonLocation;
    } else if (isLetterNotInWord(imgData.data[0], imgData.data[1], imgData.data[2])) {
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
        First word:
        <TextField
          id='firstWord'
          style={{ width: '260px' }}
          inputProps={{ maxLength: 25 }}
          variant='outlined'
          value={props.firstWord}
          onChange={handleFirstWordChanged}
        />
        <br />
        Second word:
        <TextField
          id='secondWord'
          style={{ width: '260px' }}
          inputProps={{ maxLength: 25 }}
          variant='outlined'
          value={props.secondWord}
          onChange={handleSecondWordChanged}
        />
        <br />
        <input
          value='Paste here'
          onPaste={handleClipboardEvent}
          onChange={handleInputChanged}
        />
        <Button
          variant='contained'
          onClick={handleGetImageData}
        >
          Get Image Data
        </Button>

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
    firstWord: getFirstWord(state),
    secondWord: getSecondWord(state),
    possibleWords: getPossibleWords(state),
    inputError: getInputError(state),
  };
}

const mapDispatchToProps = (dispatch: any) => {
  return bindActionCreators({
    onSetFirstWord: cnSetFirstWord,
    onSetSecondWord: cnSetSecondWord,
    onListWords: cnListWords,
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
