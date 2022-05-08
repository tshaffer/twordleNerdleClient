import axios from 'axios';
import { TedState } from '../types';
import { setPossibleWords, addGuess, updateGuess, setGuesses, setPathOnServer } from '../models';
import { getGuesses, getPathOnServer } from '../selectors';

import { apiUrlFragment, serverUrl } from '../index';

export const cnAddGuess = () => {
  return (dispatch: any) => {
    dispatch(addGuess());
  };
};

export const cnUpdateGuess = (guessIndex: number, guess: string) => {
  return (dispatch: any) => {
    dispatch(updateGuess(guessIndex, guess));
  };
};

export const cnGetGuesses = (imageDataBase64: string): any => {
  return (dispatch: any, getState: any) => {
    const path = serverUrl + apiUrlFragment + 'getGuesses';
    const getWordsRequestBody: any = {
      imageDataBase64,
    };
    return axios.post(
      path,
      getWordsRequestBody,
    ).then((response) => {
      console.log(response);
      const guesses: string[] = response.data.guesses;
      dispatch(setGuesses(guesses));
    }).catch((error) => {
      console.log('error');
      console.log(error);
    });
  };
};

export const cnListWords = (): any => {
  return (dispatch: any, getState: any) => {
    
    const state: TedState = getState();
    const guesses = getGuesses(state);
    const pathOnServer = getPathOnServer(state);
    
    const path = serverUrl + apiUrlFragment + 'getWords';

    const getWordsRequestBody: any = {
      guesses,
      pathOnServer,
    };
    return axios.post(
      path,
      getWordsRequestBody,
    ).then((response) => {
      console.log(response);
      dispatch(setPossibleWords(response.data.words));
    }).catch((error) => {
      console.log('error');
      console.log(error);
    });
  };
};

export const cnUploadFile = (formData: FormData): any => {
  return (dispatch: any, getState: any) => {
    const path = serverUrl + apiUrlFragment + 'upload';
    axios.post(path, formData, {
    }).then((response) => {
      console.log(response);
      console.log(response.statusText);
      const guesses: string[] = response.data.guesses.guesses;
      dispatch(setGuesses(guesses));

      const file = response.data.file;
      const pathOnServer = file.path;
      dispatch(setPathOnServer(pathOnServer));
    });
  };
};