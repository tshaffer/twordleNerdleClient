import { TedState } from '../types/base';

export const getFirstWord = (state: TedState): string => {
  return state.appState.firstWord;
};

export const getSecondWord = (state: TedState): string => {
  return state.appState.secondWord;
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
