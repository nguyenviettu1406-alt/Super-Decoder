import { ColorId, Difficulty, GameConfig } from './types';

export const COLORS: Record<ColorId, { bg: string; border: string; glow: string }> = {
  red: { bg: 'bg-red-500', border: 'border-red-600', glow: 'shadow-red-500/50' },
  green: { bg: 'bg-green-500', border: 'border-green-600', glow: 'shadow-green-500/50' },
  blue: { bg: 'bg-blue-500', border: 'border-blue-600', glow: 'shadow-blue-500/50' },
  yellow: { bg: 'bg-yellow-400', border: 'border-yellow-500', glow: 'shadow-yellow-400/50' },
  purple: { bg: 'bg-purple-500', border: 'border-purple-600', glow: 'shadow-purple-500/50' },
  orange: { bg: 'bg-orange-500', border: 'border-orange-600', glow: 'shadow-orange-500/50' },
  cyan: { bg: 'bg-cyan-400', border: 'border-cyan-500', glow: 'shadow-cyan-400/50' },
  magenta: { bg: 'bg-pink-500', border: 'border-pink-600', glow: 'shadow-pink-500/50' },
};

export const DIFFICULTY_CONFIG: Record<Difficulty, GameConfig> = {
  [Difficulty.EASY]: {
    slots: 3,
    availableColors: ['red', 'green', 'blue', 'yellow'],
    maxGuesses: 10,
  },
  [Difficulty.MEDIUM]: {
    slots: 4,
    availableColors: ['red', 'green', 'blue', 'yellow', 'purple'],
    maxGuesses: 10,
  },
  [Difficulty.HARD]: {
    slots: 4,
    availableColors: ['red', 'green', 'blue', 'yellow', 'purple', 'orange'],
    maxGuesses: 10,
  },
  [Difficulty.VERY_HARD]: {
    slots: 4,
    availableColors: ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'cyan'],
    maxGuesses: 10,
  },
};