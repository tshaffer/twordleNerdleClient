import { cloneDeep } from 'lodash';

import { AppState } from '../types';
import { TedModelBaseAction } from './baseAction';

// ------------------------------------
// Constants
// ------------------------------------
const SET_FIRST_WORD = 'SET_FIRST_WORD';
const SET_SECOND_WORD = 'SET_SECOND_WORD';
const SET_LETTER_AT_LOCATION = 'SET_LETTER_AT_LOCATION';
const SET_LETTERS_NOT_AT_LOCATION = 'ADD_LETTER_NOT_AT_LOCATION';
const SET_LETTERS_NOT_IN_WORD = 'SET_LETTERS_NOT_IN_WORD';
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

export interface SetLetterAtLocation {
  index: number;
  letterAtLocation: string;
}

export const setLetterAtLocation = (
  index: number,
  letterAtLocation: string,
): any => {
  return {
    type: SET_LETTER_AT_LOCATION,
    payload: {
      index,
      letterAtLocation,
    },
  };
};

export interface SetLettersNotAtLocation {
  index: number;
  lettersNotAtLocation: string;
}

export const setLettersNotAtLocation = (
  index: number,
  lettersNotAtLocation: string,
): any => {
  return {
    type: SET_LETTERS_NOT_AT_LOCATION,
    payload: {
      index,
      lettersNotAtLocation,
    },
  };
};

export interface SetLettersNotInWord {
  lettersNotInWord: string,
}

export const setLettersNotInWord = (
  lettersNotInWord: string,
): any => {
  return {
    type: SET_LETTERS_NOT_IN_WORD,
    payload: {
      lettersNotInWord,
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
  lettersAtExactLocation: ['', '', '', '', ''],
  lettersNotAtExactLocation: ['', '', '', '', ''],
  lettersNotInWord: '',
  possibleWords: [],
};

export const appStateReducer = (
  state: AppState = initialState,
  action: TedModelBaseAction<SetFirstWord & SetSecondWord & SetLetterAtLocation & SetLettersNotAtLocation & SetLettersNotInWord & SetPossibleWords>
): AppState => {
  switch (action.type) {
    case SET_FIRST_WORD: {
      return { ...state, firstWord: action.payload.firstWord };
    }
    case SET_SECOND_WORD: {
      return { ...state, secondWord: action.payload.secondWord };
    }
    case SET_LETTER_AT_LOCATION: {
      const newState = cloneDeep(state);
      newState.lettersAtExactLocation[action.payload.index] = action.payload.letterAtLocation;
      return newState;
    }
    case SET_LETTERS_NOT_AT_LOCATION: {
      const newState = cloneDeep(state);
      newState.lettersNotAtExactLocation[action.payload.index] = action.payload.lettersNotAtLocation;
      return newState;
    }
    case SET_LETTERS_NOT_IN_WORD: {
      return { ...state, lettersNotInWord: action.payload.lettersNotInWord };
    }
    case SET_POSSIBLE_WORDS: {
      return { ...state, possibleWords: action.payload.possibleWords };
    }
    default:
      return state;
  }
};
