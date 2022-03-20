/* eslint-disable @typescript-eslint/ban-types */
import { Action } from 'redux';

export interface TedBaseAction extends Action {
  type: string;   // override Any - must be a string
  payload: {} | null;
}


export interface TedModelBaseAction<T> extends Action {
  type: string;   // override Any - must be a string
  payload: T;
  error?: boolean;
  meta?: {};
}

export interface TedPlaylistAction<T> extends TedBaseAction {
  payload: T;
}

export interface TedApiAction<T> extends TedBaseAction {
  payload: T;
}



