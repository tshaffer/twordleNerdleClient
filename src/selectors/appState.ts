import { TedState } from '../types/base';

export const getImageWidth = (state: TedState): number => {
  console.log('getImageWidth: ', state.appState);
  return state.appState.imageWidth;
};

export const getImageHeight = (state: TedState): number => {
  console.log('getImageHeight: ', state.appState);
  return state.appState.imageHeight;
};

export const getGuesses = (state: TedState): string[] => {
  return state.appState.guesses;
};

export const getLettersAtExactLocation = (state: TedState): string[] => {
  return state.appState.lettersAtExactLocation;
};

export const getLettersNotAtExactLocation = (state: TedState): string[] => {
  return state.appState.lettersNotAtExactLocation;
};

export const getLettersNotInWord = (state: TedState): string => {
  return state.appState.lettersNotInWord;
};

export const getPossibleWords = (state: TedState): string[] => {
  return state.appState.possibleWords;
};

export const getInputError = (state: TedState): string | null => {
  return null;
};
