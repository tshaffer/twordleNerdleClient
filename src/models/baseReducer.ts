/** @module Model:base */

import { combineReducers } from 'redux';
import { TedState } from '../types';
import { appStateReducer } from './appState';

// -----------------------------------------------------------------------
// Reducers
// -----------------------------------------------------------------------
export const rootReducer = combineReducers<TedState>({
  appState: appStateReducer,
});

// -----------------------------------------------------------------------
// Validators
// -----------------------------------------------------------------------

