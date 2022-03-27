import { cloneDeep } from 'lodash';

import { AppState } from '../types';
import { TedModelBaseAction } from './baseAction';

// ------------------------------------
// Constants
// ------------------------------------
const SET_FIRST_WORD = 'SET_FIRST_WORD';
const SET_SECOND_WORD = 'SET_SECOND_WORD';
const SET_POSSIBLE_WORDS = 'SET_POSSIBLE_WORDS';

// ------------------------------------
// Actions
// ------------------------------------

export interface SetFirstWord {
  firstWord: string,
}

export const setFirstWord = (
  firstWord: string,
): any => {
  return {
    type: SET_FIRST_WORD,
    payload: {
      firstWord,
    },
  };
};

export interface SetSecondWord {
  secondWord: string,
}

export const setSecondWord = (
  secondWord: string,
): any => {
  return {
    type: SET_SECOND_WORD,
    payload: {
      secondWord,
    },
  };
};

export interface SetPossibleWords {
  possibleWords: string[],
}

export const setPossibleWords = (
  possibleWords: string[],
): any => {
  return {
    type: SET_POSSIBLE_WORDS,
    payload: {
      possibleWords,
    },
  };
};

// ------------------------------------
// Reducer
// ------------------------------------

const initialState: AppState = {
  firstWord: '',
  secondWord: '',
  possibleWords: [],
};

export const appStateReducer = (
  state: AppState = initialState,
  action: TedModelBaseAction<SetFirstWord & SetSecondWord & SetPossibleWords>
): AppState => {
  switch (action.type) {
    case SET_FIRST_WORD: {
      return { ...state, firstWord: action.payload.firstWord };
    }
    case SET_SECOND_WORD: {
      return { ...state, secondWord: action.payload.secondWord };
    }
    case SET_POSSIBLE_WORDS: {
      return { ...state, possibleWords: action.payload.possibleWords };
    }
    default:
      return state;
  }
};
