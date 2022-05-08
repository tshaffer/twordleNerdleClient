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
  cnUploadFile,
} from '../controllers';

import {
  getPossibleWords,
  getInputError,
  getGuesses,
} from '../selectors';
import { List, ListItem, ListItemText, ListSubheader, Paper } from '@mui/material';
import { isNil } from 'lodash';
import {
  buildWhiteAtImageDataRGBIndex,
  convertWhiteColumnsToBlack,
  convertWhiteRowsToBlack,
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
  onListWords: (imageDataBase64: string) => any;
  onUploadFile: (formData: FormData) => any;
}

const App = (props: AppProps) => {

  let wordleCanvas: HTMLCanvasElement;
  let imageDataBase64: string;

  const [selectedFile, setSelectedFile] = React.useState(null);
  const [listWordsInvoked, setListWordsInvoked] = React.useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);

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

    const wordleImageData: ImageData = ctx.getImageData(0, 0, wordleCanvas.width, wordleCanvas.height);

    convertBackgroundColorsToBlack(wordleImageData.data);

    ctx.putImageData(wordleImageData, 0, 0);

    // imageDataStr looks like
    //    data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA.....
    imageDataBase64 = wordleCanvas.toDataURL();

    // imageDataStr can be plugged directly into request.json
  };

  const updateGuess = (guessIndex: number, guessValue: string) => {
    props.onUpdateGuess(guessIndex, guessValue);
  };

  const handleFileChangeHandler = (e: any) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadFile = () => {
    console.log('uploadFile: ', selectedFile);
    const data = new FormData();
    data.append('file', selectedFile);
    props.onUploadFile(data);
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
        <input type="file" name="file" onChange={handleFileChangeHandler}/>
        <br />
        <button type="button" onClick={handleUploadFile}>Upload</button> 
        <br />
        <canvas
          style={{ border: '1px solid grey' }}
          id='mycanvas'
        >
        </canvas>
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
    onListWords: cnListWords,
    onUploadFile: cnUploadFile,
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

