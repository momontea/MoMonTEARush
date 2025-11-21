export const BRAND_COLORS = {
  yellow: '#ffe115',
  red: '#ec061e',
  green: '#3a935e',
  black: '#231f20',
  white: '#ffffff',
  blue: '#3b82f6', // Shield
  cyan: '#06b6d4', // Ice/Frozen
  purple: '#a855f7' // Magnet
};

// DIFICULTAD AUMENTADA: Es mucho más difícil llegar a los premios altos.
export const REWARD_TIERS = {
  BRONZE: { name: 'BRONCE', minScore: 0, discount: '5%', color: '#CD7F32' },
  SILVER: { name: 'PLATA', minScore: 3000, discount: '10%', color: '#C0C0C0' },
  GOLD:   { name: 'ORO',   minScore: 8000, discount: '20%', color: '#FFD700' },
  DIAMOND:{ name: 'DIAMANTE',minScore: 15000, discount: 'BEBIDA GRATIS', color: '#b9f2ff' }
};

export const GAME_CONFIG = {
  baseSpawnRate: 650, 
  minSpawnRate: 180, // Velocidad máxima insana
  gravity: 7.5, 
  playerSpeed: 0.2, // Jugador más reactivo
  comboTimer: 1500, // Ventana de combo más estricta
  sugarRushDuration: 5000,
  powerUpDuration: 5000,
  freezeDuration: 2000, // Tiempo congelado
  penaltyScore: 500 // Puntos que pierdes por error
};

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  AI_REWARD = 'AI_REWARD'
}

export type PowerUpType = 'none' | 'magnet' | 'shield' | 'slow'; // 'ice' is an obstacle, not a powerup type state

export interface HighScore {
  score: number;
  date: string;
}