
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

// DIFICULTAD AUMENTADA Y NUEVOS RANGOS
export const REWARD_TIERS = {
  // Menos de 3500 puntos
  NOVICE: { name: 'PRINCIPIANTE', minScore: 0, discount: '0%', color: '#71717a' }, 
  // 3500 - 7499
  BRONZE: { name: 'BRONCE', minScore: 3500, discount: '5%', color: '#CD7F32' },
  // 7500 - 10499
  SILVER: { name: 'PLATA', minScore: 7500, discount: '10%', color: '#C0C0C0' },
  // 10500 - 14999
  GOLD:   { name: 'ORO',   minScore: 10500, discount: '20%', color: '#FFD700' },
  // 15000+
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
  penaltyScore: 500, // Puntos que pierdes por error
  
  // DOPAMINE / JUICE CONFIG (CORREGIDO: SALTO)
  nearMissDistance: 70,
  bounceHeight: 20, // Píxeles que salta el vaso (Sin deformar)
  bounceDuration: 150
};

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  AI_REWARD = 'AI_REWARD'
}

export type PowerUpType = 'none' | 'magnet' | 'shield' | 'slow';

export interface HighScore {
  score: number;
  date: string;
}
