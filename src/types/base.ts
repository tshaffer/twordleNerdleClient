// export const serverUrl = 'http://localhost:8000';
export const serverUrl = 'https://tswordle.herokuapp.com';

export const apiUrlFragment = '/api/v1/';

export interface TedState {
  appState: AppState;
}

export interface AppState {
  firstWord: string,
  secondWord: string,
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
