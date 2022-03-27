import axios from 'axios';
import { TedState } from '../types';
import { setFirstWord, setSecondWord, setPossibleWords, setLetterAtLocation, setLettersNotAtLocation, setLettersNotInWord } from '../models';
import { getFirstWord, getSecondWord } from '../selectors';

import { apiUrlFragment, serverUrl } from '../index';
import { isNil } from 'lodash';

export const cnSetFirstWord = (
  firstWord: string,
): any => {
  return (dispatch: any) => {
    dispatch(setFirstWord(firstWord));
  };
};

export const cnSetSecondWord = (
  firstWord: string,
): any => {
  return (dispatch: any) => {
    dispatch(setSecondWord(firstWord));
  };
};

export const cnSetLetterAtLocation = (
  index: number,
  letterAtLocation: string,
): any => {
  return (dispatch: any) => {
    dispatch(setLetterAtLocation(index, letterAtLocation));
  };
};

export const cnSetLettersNotAtLocation = (
  index: number,
  lettersNotAtLocation: string,
): any => {
  return (dispatch: any) => {
    dispatch(setLettersNotAtLocation(index, lettersNotAtLocation));
  };
};

export const cnSetLettersNotInWord = (
  lettersNotInWord: string,
): any => {
  return (dispatch: any) => {
    dispatch(setLettersNotInWord(lettersNotInWord));
  };
};

export const cnListWords = (): any => {
  return (dispatch: any, getState: any) => {
    console.log('cnListWords');
  };
};