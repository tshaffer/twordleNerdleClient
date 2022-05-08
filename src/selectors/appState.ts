import { TedState } from '../types/base';

export const getGuesses = (state: TedState): string[] => {
  return state.appState.guesses;
};

export const getPossibleWords = (state: TedState): string[] => {
  return state.appState.possibleWords;
};

export const getInputError = (state: TedState): string | null => {
  return null;
};

export const getPathOnServer = (state: TedState): string => {
  return state.appState.pathOnServer;
};
