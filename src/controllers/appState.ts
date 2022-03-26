import axios from 'axios';
import { TedState } from '../types';
import { setFirstWord, setSecondWord, setPossibleWords } from '../models';
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

export const cnListWords = (): any => {
  return (dispatch: any, getState: any) => {
    console.log('cnListWords');
  };
};