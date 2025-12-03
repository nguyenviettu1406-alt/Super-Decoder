import { ColorId, Feedback } from './types';

export const generateSecretCode = (colors: ColorId[], length: number): ColorId[] => {
  const code: ColorId[] = [];
  const availableColors = [...colors];
  
  for (let i = 0; i < length; i++) {
    if (availableColors.length === 0) break;
    const randomIndex = Math.floor(Math.random() * availableColors.length);
    code.push(availableColors[randomIndex]);
    // Remove the selected color to ensure uniqueness
    availableColors.splice(randomIndex, 1);
  }
  return code;
};

export const calculateFeedback = (secret: ColorId[], guess: ColorId[]): Feedback => {
  let black = 0;
  let white = 0;

  const secretLeft: (ColorId | null)[] = [...secret];
  const guessLeft: (ColorId | null)[] = [...guess];

  // 1. Calculate Black Pegs (Exact Matches)
  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) {
      black++;
      secretLeft[i] = null; // Mark as matched
      guessLeft[i] = null;  // Mark as matched
    }
  }

  // 2. Calculate White Pegs (Color Match, Wrong Position)
  // We count frequencies of remaining items
  const secretFreq: Record<string, number> = {};
  secretLeft.forEach((color) => {
    if (color) {
      secretFreq[color] = (secretFreq[color] || 0) + 1;
    }
  });

  guessLeft.forEach((color) => {
    if (color && secretFreq[color] && secretFreq[color] > 0) {
      white++;
      secretFreq[color]--;
    }
  });

  return { black, white };
};