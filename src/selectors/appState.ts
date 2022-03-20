import { isString } from 'lodash';
import { TedState } from '../types/base';

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

  const lettersAtExactLocation: string[] = getLettersAtExactLocation(state);
  const lettersNotAtExactLocation: string[] = getLettersNotAtExactLocation(state);
  const lettersNotInWord = getLettersNotInWord(state);

  const allLettersAtExactLocation = lettersAtExactLocation.join('');
  const allLettersNotAtExactLocation = lettersNotAtExactLocation.join('');

  // User must enter some input
  if ((allLettersAtExactLocation.length + allLettersNotAtExactLocation.length + lettersNotInWord.length) === 0) {
    return 'Input required';
  }

  /*
    Letters not in word’ cannot contain any letters that are either in
      Letters in the word at known non-location’
      Letters in the word at their exact location’
  */
  const lettersNotInWordArray = lettersNotInWord.split('');
  for (const letterNotInWord of lettersNotInWordArray) {
    if (lettersAtExactLocation.indexOf(letterNotInWord) >= 0) {
      return 'Duplicate letter in exact location and letter not in word';
    }
    if (lettersNotAtExactLocation.indexOf(letterNotInWord) >= 0) {
      return 'Duplicate letter in non-exact location and letter not in word';
    }
  }

  /*
    Cannot have an entry in ‘Letters in the word at known non-location’ 
    at the same location as ‘Letters in the word at their exact location’
  */
  for (let i = 0; i <= 5; i++) {
    if (isString(lettersAtExactLocation[i]) && (lettersAtExactLocation[i].length > 0)) {
      if (lettersNotAtExactLocation[i].indexOf(lettersAtExactLocation[i]) >= 0) {
        return 'Letter at exact location in the same index as letter at not exact location';
      }
    }
  }
  // for (const letterAtExactLocation of lettersAtExactLocation) {
  //   if (lettersNotAtExactLocation.indexOf(letterAtExactLocation) >= 0) {
  //     return 'Letter at exact location in the same index as letter at not exact location';
  //   }
  // }

  return null;

};
