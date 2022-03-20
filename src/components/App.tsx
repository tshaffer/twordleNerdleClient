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
  cnSetLetterAtLocation,
  cnSetLettersNotAtLocation,
  cnSetLettersNotInWord,
  cnListWords,
} from '../controllers';

import {
  getLettersAtExactLocation,
  getLettersNotAtExactLocation,
  getLettersNotInWord,
  getPossibleWords,
  getInputError,
} from '../selectors';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import { isNil, isString } from 'lodash';
import { SyntheticEvent } from 'react';

interface ClipboardEvent<T = Element> extends SyntheticEvent<T, any> {
  clipboardData: DataTransfer;
}
export interface AppProps {
  lettersAtExactLocation: string[];
  lettersNotAtExactLocation: string[];
  lettersNotInWord: string;
  possibleWords: string[];
  inputError: string | null;
  onSetLetterAtLocation: (index: number, letterAtLocation: string,) => any;
  onSetLettersNotAtLocation: (index: number, lettersNotAtLocation: string) => any;
  onSetLettersNotInWord: (lettersNotInWord: string) => any;
  onListWords: () => any;
}

const App = (props: AppProps) => {

  const [listWordsInvoked, setListWordsInvoked] = React.useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);

  React.useEffect(() => {
    init();
  }, []);

  const init = () => {
    console.log('app init invoked');
  };

  const getLetterAtExactLocation = (index: number): string => {
    return props.lettersAtExactLocation[index];
  };

  const getLettersNotAtExactLocation = (index: number): string => {
    return props.lettersNotAtExactLocation[index];
  };

  const setLetterAtLocationHelper = (index: number, value: string) => {
    props.onSetLetterAtLocation(index, value);
  };

  const setLettersNotAtLocationHelper = (index: number, value: string) => {
    props.onSetLettersNotAtLocation(index, value);
  };

  const handleLettersNotInWordChanged = (event: any) => {
    console.log('new value');
    console.log(event.target.value);
    props.onSetLettersNotInWord(event.target.value);
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
    };

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
      const canvas: any = document.getElementById('mycanvas');
      const ctx = canvas.getContext('2d');

      // Create an image to render the blob on the canvas
      const img = new Image();

      // Once the image loads, render the img on the canvas
      img.onload = function () {
        // Update dimensions of the canvas with the dimensions of the image
        canvas.width = 996;
        canvas.height = 800;

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
    console.log(event.target.value);
  };

  const renderLetterInWordAtExactLocation = (index: number) => {
    return (
      <TextField
        id={'letterInWordAtExactLocation' + index.toString()}
        key={'letterInWordAtExactLocation' + index.toString()}
        style={{ width: '42px' }}
        inputProps={{ maxLength: 1 }}
        variant='outlined'
        value={getLetterAtExactLocation(index)}
        onChange={() => setLetterAtLocationHelper(index, (event.target as any).value)}
      />

    );
  };

  const renderLettersInWordAtExactLocation = () => {
    const lettersInWordAtExactLocation = [];
    for (let i = 0; i < 5; i++) {
      lettersInWordAtExactLocation.push(renderLetterInWordAtExactLocation(i));
    }
    return lettersInWordAtExactLocation;
  };

  const renderLetterInWordKnownNonLocation = (index: number) => {
    return (
      <TextField
        id={'letterInWordAtKnownNonLocation' + index.toString()}
        key={'letterInWordAtKnownNonLocation' + index.toString()}
        style={{ width: '74px' }}
        inputProps={{ maxLength: 5 }}
        variant='outlined'
        value={getLettersNotAtExactLocation(index)}
        onChange={() => setLettersNotAtLocationHelper(index, (event.target as any).value)}
      />
    );
  };

  const renderLettersInWordKnownNonLocation = () => {
    const lettersInWordKnownNonLocation = [];
    for (let i = 0; i < 5; i++) {
      lettersInWordKnownNonLocation.push(renderLetterInWordKnownNonLocation(i));
    }
    return lettersInWordKnownNonLocation;
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

  const lettersInWordAtExactLocation = renderLettersInWordAtExactLocation();
  const lettersInWordKnownNonLocation = renderLettersInWordKnownNonLocation();
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
        Letters in the word at their exact location:
        {lettersInWordAtExactLocation}
        <br />
        Letters in the word at known non-location:
        {lettersInWordKnownNonLocation}
        <br />
        Letters not in the word:
        <TextField
          id='notInWord'
          style={{ width: '260px' }}
          inputProps={{ maxLength: 25 }}
          variant='outlined'
          value={props.lettersNotInWord}
          onChange={handleLettersNotInWordChanged}
        />
        <br />
        <Button
          variant='contained'
          onClick={handleListWords}
        >
          List words
        </Button>
        {wordListElement}

        <input
          value='Paste here'
          onPaste={handleClipboardEvent}
          onChange={handleInputChanged}
        />

        <canvas
          style={{ border: '1px solid grey' }}
          id='mycanvas'
        >
        </canvas>
      </Box>
    </div>
  );
};

function mapStateToProps(state: any) {
  return {
    lettersAtExactLocation: getLettersAtExactLocation(state),
    lettersNotAtExactLocation: getLettersNotAtExactLocation(state),
    lettersNotInWord: getLettersNotInWord(state),
    possibleWords: getPossibleWords(state),
    inputError: getInputError(state),
  };
}

const mapDispatchToProps = (dispatch: any) => {
  return bindActionCreators({
    onSetLetterAtLocation: cnSetLetterAtLocation,
    onSetLettersNotAtLocation: cnSetLettersNotAtLocation,
    onSetLettersNotInWord: cnSetLettersNotInWord,
    onListWords: cnListWords,
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

