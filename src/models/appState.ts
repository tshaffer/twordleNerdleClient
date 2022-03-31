import { cloneDeep } from 'lodash';

import { AppState } from '../types';
import { TedModelBaseAction } from './baseAction';

// ------------------------------------
// Constants
// ------------------------------------
const SET_IMAGE_WIDTH = 'SET_IMAGE_WIDTH';
const SET_IMAGE_HEIGHT = 'SET_IMAGE_HEIGHT';
const ADD_GUESS = 'ADD_GUESS';
const UPDATE_GUESS = 'UPDATE_GUESS';
const SET_LETTER_AT_LOCATION = 'SET_LETTER_AT_LOCATION';
const SET_LETTERS_NOT_AT_LOCATION = 'ADD_LETTER_NOT_AT_LOCATION';
const SET_LETTERS_NOT_IN_WORD = 'SET_LETTERS_NOT_IN_WORD';
const SET_POSSIBLE_WORDS = 'SET_POSSIBLE_WORDS';

// ------------------------------------
// Actions
// ------------------------------------

export interface SetImageWidth {
  imageWidth: number;
}

export const setImageWidth = (
  imageWidth: number,
): any => {
  return {
    type: SET_IMAGE_WIDTH,
    payload: {
      imageWidth
    },
  };
};

export interface SetImageHeight {
  imageHeight: number;
}

export const setImageHeight = (
  imageHeight: number,
): any => {
  return {
    type: SET_IMAGE_HEIGHT,
    payload: {
      imageHeight
    },
  };
};


export const addGuess = (
): any => {
  return {
    type: ADD_GUESS,
  };
};


export interface UpdateGuess {
  guessIndex: number;
  guess: string;
}

export const updateGuess = (
  guessIndex: number,
  guess: string,
): any => {
  return {
    type: UPDATE_GUESS,
    payload: {
      guessIndex,
      guess
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
  imageWidth: -1,
  imageHeight: -1,
  guesses: [''],
  lettersAtExactLocation: ['', '', '', '', ''],
  lettersNotAtExactLocation: ['', '', '', '', ''],
  lettersNotInWord: '',
  possibleWords: [],
};

export const appStateReducer = (
  state: AppState = initialState,
  action: TedModelBaseAction<SetImageWidth & SetImageHeight & UpdateGuess & SetLetterAtLocation & SetLettersNotAtLocation & SetLettersNotInWord & SetPossibleWords>
): AppState => {
  switch (action.type) {
    case SET_IMAGE_WIDTH: {
      console.log('reducer: update imageWidth - ', action.payload.imageWidth);
      return { ...state, imageWidth: action.payload.imageWidth };
    }
    case SET_IMAGE_HEIGHT: {
      console.log('reducer: update imageHeight - ', action.payload.imageHeight);
      return { ...state, imageHeight: action.payload.imageHeight };
    }
    case ADD_GUESS: {
      const newState = cloneDeep(state);
      newState.guesses.push('');
      return newState;
    }
    case UPDATE_GUESS: {
      const newState = cloneDeep(state);
      newState.guesses[action.payload.guessIndex] = action.payload.guess;
      return newState;
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
