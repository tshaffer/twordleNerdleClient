import { cloneDeep } from 'lodash';

import { AppState } from '../types';
import { TedModelBaseAction } from './baseAction';

// ------------------------------------
// Constants
// ------------------------------------
const SET_GUESSES = 'SET_GUESSES';
const ADD_GUESS = 'ADD_GUESS';
const UPDATE_GUESS = 'UPDATE_GUESS';
const SET_POSSIBLE_WORDS = 'SET_POSSIBLE_WORDS';
const SET_PATH_ON_SERVER = 'SET_PATH_ON_SERVER';

// ------------------------------------
// Actions
// ------------------------------------

export interface SetPathOnServer {
  pathOnServer: string;
}

export const setPathOnServer = (
  pathOnServer: string
): any => {
  return {
    type: SET_PATH_ON_SERVER,
    payload: {
      pathOnServer
    }
  };
};

export interface SetGuesses {
  guesses: string[],
}

export const setGuesses = (
  guesses: string[],
): any => {
  return {
    type: SET_GUESSES,
    payload: {
      guesses
    }
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
  guesses: [],
  possibleWords: [],
  pathOnServer: '',
};

export const appStateReducer = (
  state: AppState = initialState,
  action: TedModelBaseAction<SetGuesses & UpdateGuess  & SetPossibleWords & SetPathOnServer>
): AppState => {
  switch (action.type) {
    case SET_GUESSES: {
      return { ...state, guesses: action.payload.guesses };
    }
    case SET_PATH_ON_SERVER: {
      return { ...state, pathOnServer: action.payload.pathOnServer };
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
    case SET_POSSIBLE_WORDS: {
      return { ...state, possibleWords: action.payload.possibleWords };
    }
    default:
      return state;
  }
};
