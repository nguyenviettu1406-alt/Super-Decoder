export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  VERY_HARD = 'VERY HARD'
}

export type ColorId = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'magenta';

export interface GameConfig {
  slots: number;
  availableColors: ColorId[];
  maxGuesses: number;
}

export interface Feedback {
  black: number; // Correct color, correct position
  white: number; // Correct color, wrong position
}

export interface HistoryEntry {
  guess: ColorId[];
  feedback: Feedback;
}

export enum GameState {
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
  MODE_COMPLETED = 'MODE_COMPLETED'
}

export type PlayerId = 1 | 2;

export enum GameMode {
  SINGLE = 'SINGLE',
  MULTI = 'MULTI'
}