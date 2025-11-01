// Cool Numbers Detection System
// Detects memes, palindromes, sequences, repeating digits, and special numbers

export type CoolNumberType = 'meme' | 'palindrome' | 'sequence' | 'repeating' | 'milestone';
export type CoolNumberRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface CoolNumberResult {
  isCool: boolean;
  type?: CoolNumberType;
  rarity?: CoolNumberRarity;
  name?: string;
  description?: string;
  emoji?: string;
  coinsReward?: number;
}

// Meme numbers with their metadata
const MEME_NUMBERS: Record<number, { name: string; description: string; emoji: string; rarity: CoolNumberRarity; coins: number }> = {
  69: { name: 'Nice', description: 'The legendary number', emoji: '😏', rarity: 'legendary', coins: 500 },
  420: { name: 'Blaze It', description: 'Light it up!', emoji: '🌿', rarity: 'legendary', coins: 500 },
  1337: { name: 'Leet', description: 'Elite hacker vibes', emoji: '💻', rarity: 'epic', coins: 300 },
  777: { name: 'Lucky Seven', description: 'Jackpot!', emoji: '🎰', rarity: 'epic', coins: 300 },
  666: { name: 'Number of the Beast', description: 'Evil has arrived', emoji: '😈', rarity: 'rare', coins: 200 },
  80085: { name: 'Calculator Classic', description: 'Upside down classic', emoji: '🔢', rarity: 'rare', coins: 250 },
  8008: { name: 'Mini Calculator', description: 'The shorter version', emoji: '📟', rarity: 'common', coins: 100 },
  1234: { name: 'Counting Up', description: 'Simple sequence', emoji: '🔢', rarity: 'common', coins: 100 },
  9999: { name: 'Almost There', description: 'So close to 10k!', emoji: '💯', rarity: 'rare', coins: 200 },
  404: { name: 'Not Found', description: 'Error: Clicks not found', emoji: '❌', rarity: 'common', coins: 50 },
  100: { name: 'Century', description: 'First hundred!', emoji: '💯', rarity: 'common', coins: 50 },
  1000: { name: 'Thousand', description: 'Four digits strong', emoji: '🎯', rarity: 'rare', coins: 150 },
  10000: { name: 'Ten Thousand', description: 'Five digit club', emoji: '🚀', rarity: 'epic', coins: 400 },
  100000: { name: 'One Hundred K', description: 'Six digits baby!', emoji: '💎', rarity: 'legendary', coins: 1000 },
  1000000: { name: 'ONE MILLION', description: 'The big one!', emoji: '👑', rarity: 'mythic', coins: 5000 },
  42: { name: 'Answer to Everything', description: 'Don\'t panic!', emoji: '🌌', rarity: 'rare', coins: 150 },
  360: { name: 'No Scope', description: 'MLG Pro', emoji: '🎯', rarity: 'common', coins: 75 },
  911: { name: 'Emergency', description: 'Call for help!', emoji: '🚨', rarity: 'common', coins: 50 },
  1488: { name: 'Censored', description: 'Better not say...', emoji: '🔒', rarity: 'rare', coins: 0 }, // No reward for this one
  3.14: { name: 'Pi', description: 'Mathematical beauty', emoji: '🥧', rarity: 'epic', coins: 300 },
};

// Check if number is a palindrome
function isPalindrome(num: number): boolean {
  if (num < 10) return false;
  const str = num.toString();
  return str === str.split('').reverse().join('');
}

// Check if number has repeating digits (like 111, 2222, 55555)
function hasRepeatingDigits(num: number): boolean {
  if (num < 11) return false;
  const str = num.toString();
  if (str.length < 2) return false;
  
  // Check if all digits are the same
  const firstDigit = str[0];
  return str.split('').every(digit => digit === firstDigit);
}

// Check if number is a sequence (ascending or descending)
function isSequence(num: number): { isSequence: boolean; ascending?: boolean } {
  if (num < 123) return { isSequence: false };
  
  const str = num.toString();
  if (str.length < 3) return { isSequence: false };
  
  let ascending = true;
  let descending = true;
  
  for (let i = 1; i < str.length; i++) {
    const diff = parseInt(str[i]) - parseInt(str[i - 1]);
    
    if (diff !== 1) ascending = false;
    if (diff !== -1) descending = false;
  }
  
  if (ascending) return { isSequence: true, ascending: true };
  if (descending) return { isSequence: true, ascending: false };
  
  return { isSequence: false };
}

// Check if number is a milestone (round number)
function isMilestone(num: number): boolean {
  if (num < 100) return false;
  
  const str = num.toString();
  // Check if it's like 100, 1000, 10000, etc. (1 followed by zeros)
  if (/^10+$/.test(str)) return true;
  
  // Check if it's a round number divisible by major powers (5000, 25000, 50000, etc.)
  if (num >= 1000 && num % 1000 === 0) return true;
  if (num >= 5000 && num % 5000 === 0) return true;
  if (num >= 10000 && num % 10000 === 0) return true;
  
  return false;
}

// Main detection function
export function detectCoolNumber(num: number): CoolNumberResult {
  // Check meme numbers first (highest priority)
  if (MEME_NUMBERS[num]) {
    const meme = MEME_NUMBERS[num];
    return {
      isCool: true,
      type: 'meme',
      rarity: meme.rarity,
      name: meme.name,
      description: meme.description,
      emoji: meme.emoji,
      coinsReward: meme.coins,
    };
  }
  
  // Check for repeating digits (like 111, 2222, 77777)
  if (hasRepeatingDigits(num)) {
    const digitCount = num.toString().length;
    let rarity: CoolNumberRarity = 'common';
    let coins = 50;
    
    if (digitCount >= 6) {
      rarity = 'mythic';
      coins = 1000;
    } else if (digitCount >= 5) {
      rarity = 'legendary';
      coins = 500;
    } else if (digitCount >= 4) {
      rarity = 'epic';
      coins = 250;
    } else if (digitCount >= 3) {
      rarity = 'rare';
      coins = 100;
    }
    
    return {
      isCool: true,
      type: 'repeating',
      rarity,
      name: `All ${num.toString()[0]}s`,
      description: `${digitCount} repeating digits!`,
      emoji: '🔄',
      coinsReward: coins,
    };
  }
  
  // Check for palindromes
  if (isPalindrome(num)) {
    const digitCount = num.toString().length;
    let rarity: CoolNumberRarity = 'common';
    let coins = 75;
    
    if (digitCount >= 7) {
      rarity = 'mythic';
      coins = 1500;
    } else if (digitCount >= 6) {
      rarity: 'legendary';
      coins = 750;
    } else if (digitCount >= 5) {
      rarity = 'epic';
      coins = 300;
    } else if (digitCount >= 4) {
      rarity = 'rare';
      coins = 150;
    }
    
    return {
      isCool: true,
      type: 'palindrome',
      rarity,
      name: 'Palindrome',
      description: 'Reads the same backwards!',
      emoji: '🔃',
      coinsReward: coins,
    };
  }
  
  // Check for sequences
  const seqCheck = isSequence(num);
  if (seqCheck.isSequence) {
    const digitCount = num.toString().length;
    let rarity: CoolNumberRarity = 'common';
    let coins = 100;
    
    if (digitCount >= 7) {
      rarity = 'legendary';
      coins = 800;
    } else if (digitCount >= 6) {
      rarity = 'epic';
      coins = 400;
    } else if (digitCount >= 5) {
      rarity = 'rare';
      coins = 200;
    }
    
    return {
      isCool: true,
      type: 'sequence',
      rarity,
      name: seqCheck.ascending ? 'Ascending Sequence' : 'Descending Sequence',
      description: `${digitCount} digits in order!`,
      emoji: seqCheck.ascending ? '📈' : '📉',
      coinsReward: coins,
    };
  }
  
  // Check for milestones
  if (isMilestone(num)) {
    let rarity: CoolNumberRarity = 'rare';
    let coins = 200;
    
    if (num >= 1000000) {
      rarity = 'mythic';
      coins = 5000;
    } else if (num >= 100000) {
      rarity = 'legendary';
      coins = 1000;
    } else if (num >= 10000) {
      rarity = 'epic';
      coins = 500;
    }
    
    return {
      isCool: true,
      type: 'milestone',
      rarity,
      name: `${num.toLocaleString()} Milestone`,
      description: 'Round number achieved!',
      emoji: '🎯',
      coinsReward: coins,
    };
  }
  
  return {
    isCool: false,
  };
}

// Get rarity color for UI
export function getRarityColor(rarity: CoolNumberRarity): string {
  switch (rarity) {
    case 'common':
      return '#94a3b8'; // gray
    case 'rare':
      return '#3b82f6'; // blue
    case 'epic':
      return '#a855f7'; // purple
    case 'legendary':
      return '#f59e0b'; // orange
    case 'mythic':
      return '#ec4899'; // pink
    default:
      return '#ffffff';
  }
}

// Get rarity text with emoji
export function getRarityText(rarity: CoolNumberRarity): string {
  switch (rarity) {
    case 'common':
      return '⚪ Common';
    case 'rare':
      return '🔵 Rare';
    case 'epic':
      return '🟣 Epic';
    case 'legendary':
      return '🟠 Legendary';
    case 'mythic':
      return '🔴 Mythic';
    default:
      return rarity;
  }
}

