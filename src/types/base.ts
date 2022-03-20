// export const serverUrl = 'http://localhost:8000';
export const serverUrl = 'https://tswordle.herokuapp.com';

export const apiUrlFragment = '/api/v1/';

export interface TedState {
  appState: AppState;
}

export interface AppState {
  lettersAtExactLocation: string[],         // each item in the array represents the correct letter for that position
  lettersNotAtExactLocation: string[],      // each item in the array is a string of letters, where each letter is in the answer but not in that location
  lettersNotInWord: string,                 // each letter in the string represents a letter that is not in the word
  possibleWords: string[],                  // words returned by the server that fit the criteria above
}
