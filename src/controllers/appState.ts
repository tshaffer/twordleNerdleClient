import axios from 'axios';
import { TedState } from '../types';
import { setFirstWord, setSecondWord, setPossibleWords, setLetterAtLocation, setLettersNotAtLocation, setLettersNotInWord } from '../models';
import { getFirstWord, getLettersAtExactLocation, getLettersNotAtExactLocation, getLettersNotInWord, getSecondWord } from '../selectors';

import { apiUrlFragment, serverUrl } from '../index';
import { isNil } from 'lodash';

export const cnSetFirstWord = (
  firstWord: string,
): any => {
  return (dispatch: any) => {
    dispatch(setFirstWord(firstWord));
  };
};

export const cnSetSecondWord = (
  firstWord: string,
): any => {
  return (dispatch: any) => {
    dispatch(setSecondWord(firstWord));
  };
};

export const cnSetLetterAtLocation = (
  index: number,
  letterAtLocation: string,
): any => {
  return (dispatch: any) => {
    dispatch(setLetterAtLocation(index, letterAtLocation));
  };
};

export const cnSetLettersNotAtLocation = (
  index: number,
  lettersNotAtLocation: string,
): any => {
  return (dispatch: any) => {
    dispatch(setLettersNotAtLocation(index, lettersNotAtLocation));
  };
};

export const cnSetLettersNotInWord = (
  lettersNotInWord: string,
): any => {
  return (dispatch: any) => {
    dispatch(setLettersNotInWord(lettersNotInWord));
  };
};

export const cnListWords = (): any => {
  return (dispatch: any, getState: any) => {

    const candidateLettersAtLocation: string[][] = [];

    const tedState: TedState = getState();
    const lettersAtExactLocation: string[] = getLettersAtExactLocation(tedState);
    const lettersNotAtExactLocation: string[] = getLettersNotAtExactLocation(tedState);
    const lettersNotInWord: string = getLettersNotInWord(tedState);
    const arrayOfLettersNotInWord: string[] = lettersNotInWord.split('');

    for (let i = 0; i < 5; i++) {
      candidateLettersAtLocation[i] = [];

      console.log('Candidate letters at location ' + i);

      // check to see if there's an exact letter at this location
      if (lettersAtExactLocation[i] !== '') {

        candidateLettersAtLocation[i].push(lettersAtExactLocation[i]);

        console.log('Exact letter at location: ' + candidateLettersAtLocation[i]);

      } else {

        // initialize to include all characters
        for (let j = 0; j < 26; j++) {
          candidateLettersAtLocation[i].push(String.fromCharCode(j + 97));
        }

        let candidateLettersAtThisLocation: string[] = candidateLettersAtLocation[i];

        // eliminate lettersNotInWord
        for (let j = 0; j < arrayOfLettersNotInWord.length; j++) {
          const letterNotInWord: string = arrayOfLettersNotInWord[j];
          candidateLettersAtThisLocation = candidateLettersAtThisLocation.filter(item => item !== letterNotInWord);
        }
        console.log(candidateLettersAtThisLocation);


        // eliminate lettersNotAtExactLocation
        const lettersNotAtThisLocation: string = lettersNotAtExactLocation[i];
        if (!isNil(lettersNotAtThisLocation)) {
          const arrayOfLettersNotAtThisLocation: string[] = lettersNotAtThisLocation.split('');
          for (let j = 0; j < arrayOfLettersNotAtThisLocation.length; j++) {
            const letterNotAtThisLocation: string = arrayOfLettersNotAtThisLocation[j];
            candidateLettersAtThisLocation = candidateLettersAtThisLocation.filter(item => item !== letterNotAtThisLocation);
          }
        }
        console.log(candidateLettersAtThisLocation);

        candidateLettersAtLocation[i] = candidateLettersAtThisLocation;
      }
    }

    const lettersSomewhereInWord: string[] = [];
    lettersNotAtExactLocation.forEach((lettersNotAtThisLocation: string) => {
      if (!isNil(lettersNotAtThisLocation)) {
        const lettersNotAtThisLocationArray = lettersNotAtThisLocation.split('');
        if (!isNil(lettersNotAtThisLocationArray)) {
          lettersNotAtThisLocationArray.forEach((letterNotAtThisLocation: string) => {
            if (lettersSomewhereInWord.indexOf(letterNotAtThisLocation)) {
              lettersSomewhereInWord.push(letterNotAtThisLocation)
            }
          });
        }
      }
    });

    console.log('lettersSomewhereInWord');
    console.log(lettersSomewhereInWord);

    const path = serverUrl + apiUrlFragment + 'getWords';

    const getWordsRequestBody: any = {
      candidateLettersAtLocation,
      lettersSomewhereInWord,
    };
    return axios.post(
      path,
      getWordsRequestBody,
    ).then((response) => {
      console.log(response);
      dispatch(setPossibleWords(response.data.words));
    }).catch((error) => {
      console.log('error');
      console.log(error);
    });
  };
};

