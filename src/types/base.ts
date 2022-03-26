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
