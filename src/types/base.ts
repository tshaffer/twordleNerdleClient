export const serverUrl = 'http://localhost:8000';
// export const serverUrl = 'https://tswordle.herokuapp.com';

export const apiUrlFragment = '/api/v1/';

export interface TedState {
  appState: AppState;
}

export interface AppState {
  guesses: string[];
  lettersAtExactLocation: string[],         // each item in the array represents the correct letter for that position
  lettersNotAtExactLocation: string[],      // each item in the array is a string of letters, where each letter is in the answer but not in that location
  lettersNotInWord: string,                 // each letter in the string represents a letter that is not in the word
  possibleWords: string[],                  // words returned by the server that fit the criteria above
}

export enum LetterAnswerType {
  NotInWord,
  InWordAtNonLocation,
  InWordAtExactLocation,
  Unknown,
}

export interface LetterAnswerValue {
  red: number;
  green: number;
  blue: number;
}

export const NotInWordValue: LetterAnswerValue = {
  red: 120,
  green: 124,
  blue: 126,
};

export const WhiteLetterValue: LetterAnswerValue = {
  red: 255,
  green: 255,
  blue: 255,
};

export const InWordAtNonLocationValue: LetterAnswerValue = {
  red: 201,
  green: 180,
  blue: 88,
};

export const InWordAtExactLocationValue: LetterAnswerValue = {
  red: 106,
  green: 170,
  blue: 100,
};

