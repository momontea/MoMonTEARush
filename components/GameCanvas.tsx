
import React, { useRef, useEffect, useState } from 'react';
import { BRAND_COLORS, GAME_CONFIG, PowerUpType, REWARD_TIERS } from '../constants';
import { Shield, Zap, Snowflake } from 'lucide-react';
import { AudioService } from '../services/audioService';

interface GameCanvasProps {
  onGameOver: (score: number) => void;
}

interface Item {
  x: number;
  y: number;
  type: 'boba' | 'fruit' | 'leaf' | 'bad' | 'ice' | 'gold' | 'magnet' | 'shield';
  fruitType?: number; 
  speed: number;
  size: number;
  id: number;
  rotation: number;
  rotSpeed: number;
  passed?: boolean; 
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface FloatingText {
    x: number;
    y: number;
    text: string;
    life: number;
    color: string;
    scale: number;
    vx: number; 
    vy: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // UI State
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType>('none');
  const [isFrozen, setIsFrozen] = useState(false);
  const [sugarRush, setSugarRush] = useState(false);
  const [nextTier, setNextTier] = useState<{name: string, score: number, percent: number} | null>(null);

  // Game Loop State
  const state = useRef({
    isPlaying: true,
    lastTime: 0,
    lastUiSync: 0,
    spawnTimer: 0,
    score: 0,
    lives: 3,
    combo: 0,
    comboTimer: 0,
    
    powerUp: 'none' as PowerUpType,
    powerUpTimer: 0,
    frozenTimer: 0,
    sugarRush: false,
    sugarRushTimer: 0,
    sugarRushCharge: 0,
    
    bounceTimer: 0,

    // Logical Dimensions (CSS Pixels)
    width: 360, 
    height: 800,
    dpr: 1, // Device Pixel Ratio
    
    playerX: 0,
    targetX: 0,
    playerWidth: 100, // Larger cup for mobile
    playerHeight: 120,
    shake: 0,
    bgPulse: 0,
    
    items: [] as Item[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
  });

  const requestRef = useRef<number>(0);

  const getNextTierInfo = (currentScore: number) => {
      if (currentScore < REWARD_TIERS.BRONZE.minScore) 
          return { name: REWARD_TIERS.BRONZE.name, score: REWARD_TIERS.BRONZE.minScore, prev: 0 };
      if (currentScore < REWARD_TIERS.SILVER.minScore) 
          return { name: REWARD_TIERS.SILVER.name, score: REWARD_TIERS.SILVER.minScore, prev: REWARD_TIERS.BRONZE.minScore };
      if (currentScore < REWARD_TIERS.GOLD.minScore) 
          return { name: REWARD_TIERS.GOLD.name, score: REWARD_TIERS.GOLD.minScore, prev: REWARD_TIERS.SILVER.minScore };
      if (currentScore < REWARD_TIERS.DIAMOND.minScore) 
          return { name: REWARD_TIERS.DIAMOND.name, score: REWARD_TIERS.DIAMOND.minScore, prev: REWARD_TIERS.GOLD.minScore };
      return { name: 'MAX', score: currentScore, prev: 0 };
  };

  const createParticles = (x: number, y: number, color: string, count: number = 5, explosion: boolean = false) => {
    if (state.current.particles.length > 60) return; 
    const speed = explosion ? 25 : 15;
    for (let i = 0; i < count; i++) {
      state.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        life: 1.0,
        color,
        size: Math.random() * 8 + 3
      });
    }
  };

  const addFloatingText = (x: number, y: number, text: string, color: string, size: 'sm'|'md'|'lg' = 'md') => {
      const baseVx = (Math.random() - 0.5) * 5;
      const baseVy = -8 - Math.random() * 5;
      state.current.floatingTexts.push({
          x, y, text, color, 
          life: 1.0, 
          scale: size === 'lg' ? 1.5 : size === 'md' ? 1.0 : 0.7,
          vx: baseVx,
          vy: baseVy
      });
  };

  // --- DRAWING LOGIC ---
  const drawCup = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const s = state.current;
    const now = Date.now();

    // BOUNCE LOGIC (PURE TRANSLATION)
    let bounceY = 0;
    if (s.bounceTimer > 0) {
        const t = 1 - (s.bounceTimer / GAME_CONFIG.bounceDuration);
        bounceY = -Math.sin(t * Math.PI) * GAME_CONFIG.bounceHeight;
    }

    const shakeX = (Math.random() - 0.5) * s.shake;
    const shakeY = (Math.random() - 0.5) * s.shake;
    if (s.shake > 0) s.shake *= 0.9;

    const drawX = x + shakeX;
    const drawY = y + shakeY + bounceY; 
    const centerX = drawX + w/2;
    
    // --- POWER UP VISUALS ---
    if (s.powerUp === 'magnet') {
        ctx.save();
        const pulseSpeed = now / 200;
        const pulseSize = Math.sin(pulseSpeed) * 10;
        const warningFlicker = (s.powerUpTimer < 1500 && Math.floor(now / 100) % 2 === 0) ? 0.2 : 0.6; 

        ctx.beginPath();
        ctx.arc(centerX, drawY + h/2, w * 0.8 + pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = BRAND_COLORS.purple;
        ctx.globalAlpha = warningFlicker * 0.3;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(centerX, drawY + h/2, w * 0.6 - pulseSize, 0, Math.PI * 2);
        ctx.strokeStyle = BRAND_COLORS.purple;
        ctx.lineWidth = 4;
        ctx.globalAlpha = warningFlicker;
        ctx.setLineDash([10, 10]); 
        ctx.stroke();
        ctx.restore();
    }

    // Frozen Effect
    if (s.frozenTimer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(6, 182, 212, 0.5)'; 
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.fillRect(drawX - 10, drawY - 10, w + 20, h + 20);
        ctx.strokeRect(drawX - 10, drawY - 10, w + 20, h + 20);
        ctx.restore();
    }

    // --- THE MOMON LOGO CUP ---
    ctx.save();
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = BRAND_COLORS.black;

    // 1. The Lid (Yellow)
    ctx.fillStyle = BRAND_COLORS.yellow;
    ctx.beginPath();
    ctx.ellipse(centerX, drawY, w/2 + 5, 15, 0, 0, Math.PI*2);
    ctx.fill();
    
    // FLAT LEAF
    ctx.fillStyle = BRAND_COLORS.green;
    ctx.beginPath();
    const leafW = 40;
    const leafH = 8; 
    ctx.moveTo(centerX - leafW, drawY); 
    ctx.bezierCurveTo(centerX - leafW/2, drawY - leafH, centerX + leafW/2, drawY - leafH, centerX + leafW, drawY); 
    ctx.bezierCurveTo(centerX + leafW/2, drawY + leafH, centerX - leafW/2, drawY + leafH, centerX - leafW, drawY); 
    ctx.fill();
    
    ctx.beginPath();
    ctx.strokeStyle = '#1a472e'; 
    ctx.lineWidth = 2;
    ctx.moveTo(centerX - leafW + 5, drawY);
    ctx.lineTo(centerX + leafW - 5, drawY);
    ctx.stroke();

    ctx.strokeStyle = BRAND_COLORS.black;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(centerX, drawY, w/2 + 5, 15, 0, 0, Math.PI*2);
    ctx.stroke();

    // 2. The Cup Body
    ctx.fillStyle = s.sugarRush ? '#ff00ff' : BRAND_COLORS.red;
    if (s.sugarRush) {
        const hue = (now / 2) % 360;
        ctx.fillStyle = `hsl(${hue}, 90%, 60%)`;
    }
    
    ctx.beginPath();
    const bottomY = drawY + h;
    const topW = w;
    const bottomW = w * 0.7;
    
    ctx.moveTo(centerX - topW/2, drawY);
    ctx.lineTo(centerX + topW/2, drawY);
    ctx.lineTo(centerX + bottomW/2, bottomY - 15);
    ctx.quadraticCurveTo(centerX + bottomW/2, bottomY, centerX + bottomW/2 - 15, bottomY);
    ctx.lineTo(centerX - bottomW/2 + 15, bottomY);
    ctx.quadraticCurveTo(centerX - bottomW/2, bottomY, centerX - bottomW/2, bottomY - 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. The Eye
    const eyeY = drawY + h * 0.35;
    const eyeSize = w * 0.35;
    
    ctx.fillStyle = BRAND_COLORS.white;
    ctx.beginPath();
    ctx.arc(centerX, eyeY, eyeSize, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    // Iris
    let lookX = 0;
    let lookY = 0;
    if (s.items.length > 0) {
         const nearest = s.items.reduce((prev, curr) => (curr.y > prev.y ? curr : prev));
         lookX = (nearest.x - centerX) * 0.05;
         lookY = (nearest.y - eyeY) * 0.05;
    }
    lookX = Math.max(-10, Math.min(10, lookX));
    lookY = Math.max(-10, Math.min(10, lookY));

    ctx.fillStyle = BRAND_COLORS.green;
    ctx.beginPath();
    ctx.arc(centerX + lookX, eyeY + lookY, eyeSize * 0.7, 0, Math.PI*2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = BRAND_COLORS.black;
    ctx.beginPath();
    ctx.arc(centerX + lookX, eyeY + lookY, eyeSize * 0.35, 0, Math.PI*2);
    ctx.fill();

    // Glint
    ctx.fillStyle = BRAND_COLORS.white;
    ctx.beginPath();
    ctx.arc(centerX + lookX - 5, eyeY + lookY - 5, eyeSize * 0.1, 0, Math.PI*2);
    ctx.fill();

    // 4. Mouth
    ctx.lineWidth = 4;
    ctx.beginPath();
    const mouthY = drawY + h * 0.75;
    
    if (s.frozenTimer > 0) {
        ctx.moveTo(centerX - 10, mouthY);
        ctx.lineTo(centerX - 5, mouthY + 5);
        ctx.lineTo(centerX, mouthY);
        ctx.lineTo(centerX + 5, mouthY + 5);
        ctx.lineTo(centerX + 10, mouthY);
    } else if (s.lives === 1) {
         ctx.arc(centerX, mouthY, 5, 0, Math.PI*2);
    } else {
        ctx.arc(centerX, mouthY, 10, 0.1 * Math.PI, 0.9 * Math.PI);
    }
    ctx.stroke();
    ctx.restore();

    // --- OVERLAY VISUALS ---
    if (s.powerUp === 'shield') {
        ctx.save();
        const rotateSpeed = now / 500;
        const warningAlpha = (s.powerUpTimer < 1500 && Math.floor(now / 100) % 2 === 0) ? 0.1 : 0.4; 

        const cx = drawX + w/2;
        const cy = drawY + h/2;

        ctx.fillStyle = BRAND_COLORS.blue;
        ctx.globalAlpha = warningAlpha;
        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.85, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#93c5fd'; 
        ctx.lineWidth = 5;
        ctx.globalAlpha = 0.8;
        ctx.translate(cx, cy);
        ctx.rotate(rotateSpeed);
        ctx.beginPath();
        ctx.setLineDash([20, 15]);
        ctx.arc(0, 0, w * 0.85, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
  };

  const drawItem = (ctx: CanvasRenderingContext2D, item: Item) => {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.rotation);
    
    if (item.type === 'ice') {
        ctx.fillStyle = '#a5f3fc'; ctx.strokeStyle = '#0891b2'; ctx.lineWidth = 2;
        ctx.fillRect(-item.size/2, -item.size/2, item.size, item.size); ctx.strokeRect(-item.size/2, -item.size/2, item.size, item.size);
        ctx.fillStyle = 'white'; ctx.globalAlpha = 0.5; ctx.fillRect(-item.size/2 + 5, -item.size/2 + 5, item.size/2, 5); ctx.globalAlpha = 1.0;
    }
    else if (item.type === 'magnet' || item.type === 'shield') {
        ctx.fillStyle = item.type === 'magnet' ? BRAND_COLORS.purple : BRAND_COLORS.blue;
        ctx.beginPath(); ctx.arc(0, 0, item.size/2, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = 'white'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(item.type === 'magnet' ? 'U' : 'S', 0, 0);
    }
    else if (item.type === 'boba' || item.type === 'gold') {
      ctx.fillStyle = item.type === 'gold' ? '#FFD700' : BRAND_COLORS.black;
      if (item.type === 'gold') { ctx.shadowBlur = 15; ctx.shadowColor = '#FFD700'; }
      ctx.beginPath(); ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(-item.size/4, -item.size/4, item.size/5, 0, Math.PI * 2); ctx.fill();
    } 
    else if (item.type === 'fruit') {
      const s = item.size;
      const fType = item.fruitType || 0;
      if (fType === 0) { // Strawberry
          ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(0, s/2); ctx.bezierCurveTo(-s/1.5, -s/3, -s/2, -s/2, 0, -s/2); ctx.bezierCurveTo(s/2, -s/2, s/1.5, -s/3, 0, s/2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = BRAND_COLORS.green; ctx.beginPath(); ctx.moveTo(0, -s/2); ctx.lineTo(-8, -s/2-8); ctx.lineTo(-3, -s/2); ctx.lineTo(0, -s/2-10); ctx.lineTo(3, -s/2); ctx.lineTo(8, -s/2-8); ctx.fill();
      } else if (fType === 1) { // Lemon
          ctx.fillStyle = '#fef08a'; ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0,s/2,0,Math.PI*2); ctx.fill(); ctx.stroke();
      } else if (fType === 2) { // Orange
          ctx.fillStyle = '#fdba74'; ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0,s/2,0,Math.PI*2); ctx.fill(); ctx.stroke();
      } else if (fType === 3) { // Kiwi
          ctx.fillStyle = '#bef264'; ctx.strokeStyle = '#854d0e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0,s/2,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0,0,s/6,s/8,0,0,Math.PI*2); ctx.fill();
      } else if (fType === 4) { // Peach
          ctx.fillStyle = '#fca5a5'; ctx.strokeStyle = '#be123c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0,0,s/2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(0,-s/2); ctx.quadraticCurveTo(s/4,0,0,s/2); ctx.stroke();
          ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.ellipse(5, -s/2, 8, 4, -Math.PI/4, 0, Math.PI*2); ctx.fill();
      } else { // Blueberry
          ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(0,0,s/2,0,Math.PI*2); ctx.fill();
          ctx.fillStyle = '#1e3a8a'; ctx.beginPath(); ctx.rect(-3, -3, 6, 6); ctx.fill();
      }
    } 
    else if (item.type === 'leaf') {
        ctx.fillStyle = BRAND_COLORS.green; ctx.strokeStyle = '#1a472e'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -item.size/2); ctx.quadraticCurveTo(item.size/2, 0, 0, item.size/2); ctx.quadraticCurveTo(-item.size/2, 0, 0, -item.size/2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -item.size/2 + 5); ctx.lineTo(0, item.size/2 - 5); ctx.lineWidth = 1; ctx.stroke();
        
    } else if (item.type === 'bad') {
        ctx.fillStyle = '#4b5563'; ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2;
        ctx.beginPath(); const spikes = 8;
        for(let i=0; i<spikes*2; i++) { const angle = (Math.PI * i) / spikes; const r = (i % 2 === 0) ? item.size/2 : item.size/4; ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(-6, -4, 3, 0, Math.PI*2); ctx.arc(6, -4, 3, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  };

  const spawnItem = (width: number, currentScore: number, isRush: boolean) => {
    const fruitType = Math.floor(Math.random() * 6);
    // INCREASED SIZE FOR MOBILE VISIBILITY
    const baseSize = 45; 
    
    const baseItem = {
        x: Math.random() * (width - 60) + 30,
        y: -70,
        id: Date.now() + Math.random(),
        rotation: Math.random() * Math.PI,
        fruitType,
        rotSpeed: (Math.random() - 0.5) * 0.2
    };

    if (isRush) {
        return {
            ...baseItem,
            type: Math.random() > 0.8 ? 'fruit' : 'gold',
            speed: GAME_CONFIG.gravity * 2.5, 
            size: 55, // Bigger rush items
        } as Item;
    }

    const rand = Math.random();
    let type: Item['type'] = 'boba';
    let speed = GAME_CONFIG.gravity;
    let size = 45; // Bigger standard items
    const difficultyLevel = Math.floor(currentScore / 2000);
    const speedMultiplier = 1 + (difficultyLevel * 0.15);
    
    const isHardcore = currentScore > 9000;

    if (isHardcore) {
        if (rand > 0.99) { type = Math.random() > 0.5 ? 'magnet' : 'shield'; speed *= 0.9; size = 55; }
        else if (rand > 0.97) { type = 'gold'; speed *= 1.8; size = 50; } 
        else if (rand > 0.85) { type = 'ice'; speed *= 1.3 * speedMultiplier; size = 50; } 
        else if (rand > 0.65) { type = 'bad'; speed *= 1.2 * speedMultiplier; size = 55; } 
        else if (rand > 0.50) { type = 'fruit'; speed *= 1.4; size = 50; }
        else if (rand > 0.40) { type = 'leaf'; speed *= 1.1; size = 40; }
    } 
    else {
        if (rand > 0.99) { type = Math.random() > 0.5 ? 'magnet' : 'shield'; speed *= 0.9; size = 55; }
        else if (rand > 0.97) { type = 'gold'; speed *= 1.8; size = 50; } 
        else if (rand > 0.92 - (difficultyLevel * 0.02)) { type = 'ice'; speed *= 1.2 * speedMultiplier; size = 50; }
        else if (rand > 0.80 - (difficultyLevel * 0.03)) { type = 'bad'; speed *= 1.1 * speedMultiplier; size = 55; }
        else if (rand > 0.65) { type = 'fruit'; speed *= 1.3; size = 50; }
        else if (rand > 0.5) { type = 'leaf'; speed *= 1.0; size = 40; }
    }

    speed *= speedMultiplier;
    if (isHardcore) speed *= 1.3;
    speed = Math.min(speed, 35); 

    return { ...baseItem, type, speed, size } as Item;
  };

  const gameLoop = (time: number) => {
    const s = state.current;
    if (!s.isPlaying) return;

    const dt = Math.min(time - s.lastTime, 60); 
    s.lastTime = time;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) {
        requestRef.current = requestAnimationFrame(gameLoop);
        return;
    }

    try {
        // Logic Updates
        if (s.powerUp !== 'none') {
            s.powerUpTimer -= dt;
            if (s.powerUpTimer <= 0) s.powerUp = 'none';
        }
        if (s.frozenTimer > 0) s.frozenTimer -= dt;
        if (s.bounceTimer > 0) s.bounceTimer -= dt; 

        if (s.sugarRush) {
            s.sugarRushTimer -= dt;
            if (s.sugarRushTimer <= 0) {
                s.sugarRush = false;
                s.sugarRushCharge = 0;
                AudioService.setRushMode(false); 
                s.items = []; 
            }
        }

        if (s.frozenTimer <= 0) {
            s.playerX += (s.targetX - s.playerX) * GAME_CONFIG.playerSpeed;
            s.playerX = Math.max(0, Math.min(s.playerX, s.width - s.playerWidth));
        }

        s.spawnTimer += dt;
        
        let currentSpawnRate = Math.max(GAME_CONFIG.minSpawnRate, GAME_CONFIG.baseSpawnRate - (s.score * 0.05));
        if (s.score > 9000) currentSpawnRate = 120; 
        if (s.sugarRush) currentSpawnRate = 60; 

        if (s.spawnTimer > currentSpawnRate) {
            s.items.push(spawnItem(s.width, s.score, s.sugarRush));
            s.spawnTimer = 0;
        }

        // --- CRITICAL FIX: PLAYER POSITION ---
        // Use a fixed offset from the bottom logic coordinate, not dynamic calculation per frame
        // This ensures it stays above mobile nav bars
        const playerY = s.height - s.playerHeight - 80; 
        
        const hitbox = { 
            x: s.playerX + 15, 
            y: playerY + 10, 
            w: s.playerWidth - 30, 
            h: 60 
        };
        const centerX = s.playerX + s.playerWidth/2;
        const centerY = playerY + s.playerHeight/2;

        // Collision Loop
        for (let i = s.items.length - 1; i >= 0; i--) {
            const item = s.items[i];
            
            if (s.powerUp === 'magnet' && !['bad', 'ice'].includes(item.type) && item.y > 50) {
                const dx = centerX - item.x;
                const dy = centerY - item.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 500) {
                    item.x += (dx / dist) * 15;
                    item.y += (dy / dist) * 15;
                } else {
                    item.y += item.speed * (dt / 16);
                }
            } else {
                item.y += item.speed * (dt / 16);
            }
            item.rotation += item.rotSpeed;

            let hit = false;
            if (item.x + item.size/2 > hitbox.x && item.x - item.size/2 < hitbox.x + hitbox.w &&
                item.y + item.size/2 > hitbox.y && item.y - item.size/2 < hitbox.y + hitbox.h) {
                hit = true;
            }

            if (!hit && !item.passed && item.y > hitbox.y && item.y < hitbox.y + hitbox.h) {
                const dx = Math.abs(item.x - centerX);
                if (dx < hitbox.w + GAME_CONFIG.nearMissDistance && (item.type === 'bad' || item.type === 'ice')) {
                    item.passed = true;
                    s.score += 50;
                    addFloatingText(centerX, playerY - 80, "¡CASI!", "#ffa500", 'sm');
                }
            }

            if (hit) {
                s.items.splice(i, 1);
                s.bounceTimer = GAME_CONFIG.bounceDuration;
                
                if (item.type === 'bad') {
                    if (s.powerUp === 'shield') {
                        s.powerUp = 'none';
                        AudioService.playBad();
                        createParticles(item.x, item.y, BRAND_COLORS.blue, 15, true);
                        s.shake = 15;
                        addFloatingText(s.playerX, playerY - 50, "¡ESCUDO ROTO!", BRAND_COLORS.blue, 'lg');
                    } else if (!s.sugarRush) {
                        s.lives -= 1;
                        s.shake = 40; 
                        s.combo = 0;
                        s.sugarRushCharge = 0;
                        const penalty = Math.min(s.score, GAME_CONFIG.penaltyScore);
                        s.score -= penalty;
                        
                        AudioService.playBad(); 
                        createParticles(item.x, item.y, '#555555', 20, true);
                        addFloatingText(s.playerX, playerY - 80, "¡AUCH!", "#FF0000", 'lg');
                        addFloatingText(s.playerX, playerY - 40, `-${penalty}`, "#FF0000", 'lg');
                        
                        if (s.lives <= 0) {
                            s.isPlaying = false;
                            AudioService.stopMusic();
                            onGameOver(s.score);
                            return; 
                        }
                    }
                } 
                else if (item.type === 'ice') {
                    if (s.powerUp === 'shield') {
                         s.powerUp = 'none';
                         AudioService.playBad(); 
                         addFloatingText(s.playerX, playerY - 50, "¡BLOQUEADO!", BRAND_COLORS.blue, 'md');
                    } else if (!s.sugarRush) {
                        s.frozenTimer = GAME_CONFIG.freezeDuration;
                        AudioService.playFreeze(); 
                        createParticles(item.x, item.y, '#06b6d4', 20, true);
                        addFloatingText(s.playerX + 20, playerY - 50, "¡CONGELADO!", "#06b6d4", 'lg');
                        s.combo = 0;
                    }
                }
                else if (['magnet', 'shield'].includes(item.type)) {
                    s.powerUp = item.type as PowerUpType;
                    s.powerUpTimer = GAME_CONFIG.powerUpDuration;
                    AudioService.playPowerUp();
                    createParticles(item.x, item.y, '#FFFFFF', 20, true);
                    s.score += 100;
                    const text = item.type === 'magnet' ? '¡IMÁN!' : '¡ESCUDO!';
                    addFloatingText(s.playerX + 20, playerY - 50, text, "#A020F0", 'lg');
                } 
                else {
                    let points = 10;
                    let color = BRAND_COLORS.black;
                    let rushCharge = 2;

                    if (item.type === 'fruit') { points = 50; color = '#ef4444'; rushCharge = 5; }
                    if (item.type === 'leaf') { points = 20; color = BRAND_COLORS.green; rushCharge = 3; }
                    if (item.type === 'gold') { points = 100; color = '#FFD700'; rushCharge = 10; }

                    s.combo += 1;
                    s.comboTimer = GAME_CONFIG.comboTimer;
                    
                    if (!s.sugarRush) {
                        s.sugarRushCharge = Math.min(100, s.sugarRushCharge + rushCharge);
                        if (s.sugarRushCharge >= 100) {
                            s.sugarRush = true;
                            s.sugarRushTimer = GAME_CONFIG.sugarRushDuration;
                            AudioService.setRushMode(true);
                            addFloatingText(s.width/2, s.height/2, "¡MODO FIEBRE!", "#FF00FF", 'lg');
                            if (s.lives < 3) s.lives++;
                        }
                    }

                    const multiplier = s.sugarRush ? 3 : (1 + Math.floor(s.combo / 10) * 0.5);
                    const pts = Math.floor(points * multiplier);
                    s.score += pts;
                    
                    AudioService.playCollect(s.combo);
                    createParticles(item.x, item.y, color, 6);
                    const txtSize = s.combo > 10 ? 'lg' : 'md';
                    addFloatingText(item.x, item.y - 20, `+${pts}`, color, txtSize);
                }
            } else if (item.y > s.height + 50) {
                s.items.splice(i, 1);
                if (!['bad', 'ice', 'magnet', 'shield'].includes(item.type) && !s.sugarRush && s.frozenTimer <= 0 && s.powerUp !== 'magnet') {
                    if (s.combo > 0) s.combo = 0;
                }
            }
        }

        for (let i = s.particles.length - 1; i >= 0; i--) {
            const p = s.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5; 
            p.life -= 0.03;
            if (p.life <= 0) s.particles.splice(i, 1);
        }

        for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
            const t = s.floatingTexts[i];
            t.x += t.vx;
            t.y += t.vy;
            t.vy += 0.2;
            t.life -= 0.02;
            if (t.life > 0.8) t.scale += 0.1;
            else t.scale = Math.max(0, t.scale - 0.01);
            if (t.life <= 0) s.floatingTexts.splice(i, 1);
        }

        if (s.comboTimer > 0) s.comboTimer -= dt;
        if (s.comboTimer <= 0 && s.combo > 0) s.combo = 0;
        s.bgPulse += 0.02 + (s.combo * 0.01); 

        // --- RENDER PHASE ---
        // 1. Clear Canvas using Physical Dimensions
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset scale to clear correctly
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 2. Scale Context for Logical Drawing
        ctx.scale(s.dpr, s.dpr);

        // 3. Draw Background
        if (s.frozenTimer > 0) {
             ctx.fillStyle = '#ecfeff';
             ctx.fillRect(0,0,s.width, s.height);
             ctx.strokeStyle = '#a5f3fc';
             ctx.lineWidth = 20;
             ctx.strokeRect(0,0,s.width,s.height);
        } else if (s.sugarRush) {
            const hue = (Date.now() / 5) % 360;
            ctx.fillStyle = `hsla(${hue}, 80%, 90%, 0.3)`;
            ctx.fillRect(0, 0, s.width, s.height);
        } else {
            const pulseSize = 100 + Math.sin(s.bgPulse) * (10 + s.combo*2);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(s.width/2, s.height/2, pulseSize, 0, Math.PI*2);
            ctx.fill();
        }

        // 4. Draw Game Objects (in logical pixels)
        drawCup(ctx, s.playerX, playerY, s.playerWidth, s.playerHeight);
        s.items.forEach(item => drawItem(ctx, item));
        
        s.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });

        s.floatingTexts.forEach(t => {
            ctx.save();
            ctx.globalAlpha = t.life;
            ctx.fillStyle = t.color;
            const fontSize = 24 * t.scale;
            ctx.font = `900 ${fontSize}px Verdana`;
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 4;
            ctx.lineJoin = 'round';
            const tx = t.x - (ctx.measureText(t.text).width/2);
            ctx.strokeText(t.text, tx, t.y);
            ctx.fillText(t.text, tx, t.y);
            ctx.restore();
        });

        if (time - s.lastUiSync > 100) { 
            setScore(s.score);
            setLives(s.lives);
            setCombo(s.combo);
            setActivePowerUp(s.powerUp);
            setIsFrozen(s.frozenTimer > 0);
            setSugarRush(s.sugarRush);
            
            const tierInfo = getNextTierInfo(s.score);
            if (tierInfo.name !== 'MAX') {
                const range = tierInfo.score - tierInfo.prev;
                const current = s.score - tierInfo.prev;
                const pct = Math.max(0, Math.min(100, (current / range) * 100));
                setNextTier({ name: tierInfo.name, score: tierInfo.score, percent: pct });
            } else {
                setNextTier(null);
            }
            s.lastUiSync = time;
        }

    } catch (e) {
        console.error(e);
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const handleInput = (clientX: number) => {
    if (state.current.frozenTimer > 0) return; 
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Input is already in CSS pixels (Logical), so we match it to the Logical width
    const x = clientX - rect.left;
    state.current.targetX = x - state.current.playerWidth / 2;
  };

  const onTouchMove = (e: React.TouchEvent) => {
      e.preventDefault(); 
      handleInput(e.touches[0].clientX);
  };
  const onMouseMove = (e: React.MouseEvent) => handleInput(e.clientX);
  const onTouchStart = (e: React.TouchEvent) => {
      handleInput(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current && canvasRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            // 1. Set Canvas Physical Resolution (Internal)
            canvasRef.current.width = width * dpr;
            canvasRef.current.height = height * dpr;
            
            // 2. Set Canvas CSS Size (Display)
            canvasRef.current.style.width = `${width}px`;
            canvasRef.current.style.height = `${height}px`;

            // 3. Update Game Logic Dimensions (Logical)
            state.current.width = width;
            state.current.height = height;
            state.current.dpr = dpr;

            // 4. Reset Player Position
            if (state.current.playerX === 0) {
                 state.current.playerX = width/2 - state.current.playerWidth/2;
                 state.current.targetX = width/2 - state.current.playerWidth/2;
            }
        }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    state.current.lastTime = performance.now();
    state.current.isPlaying = true;
    state.current.score = 0;
    state.current.lives = 3;
    state.current.items = [];
    state.current.particles = [];
    state.current.floatingTexts = [];
    state.current.sugarRushCharge = 0;
    state.current.frozenTimer = 0;
    
    AudioService.startMusic();

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(requestRef.current);
        state.current.isPlaying = false;
        AudioService.stopMusic();
    };
  }, [onGameOver]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-momon-yellow touch-none select-none">
      
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none select-none z-20">
        <div className="flex flex-col items-start gap-2">
            <div className="bg-white border-4 border-momon-black rounded-xl px-4 py-2 shadow-[4px_4px_0px_0px_rgba(35,31,32,1)] min-w-[120px] transition-transform duration-100 origin-top-left" style={{ transform: combo > 10 ? 'scale(1.1)' : 'scale(1)' }}>
                <span className={`text-3xl font-black tracking-tighter block ${sugarRush ? 'text-momon-red animate-pulse' : 'text-momon-black'}`}>
                    {score.toLocaleString()}
                </span>
                {nextTier && (
                    <div className="w-full mt-1">
                        <div className="flex justify-between text-[8px] font-bold text-gray-500 mb-0.5 uppercase">
                            <span>Meta: {nextTier.name}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                             <div className="h-full bg-momon-green transition-all duration-300" style={{ width: `${nextTier.percent}%` }}></div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex flex-col gap-1 items-start">
                {activePowerUp === 'magnet' && (
                    <div className="bg-purple-100 border-2 border-purple-600 px-2 py-1 rounded-full flex items-center gap-1 animate-bounce">
                         <Zap size={14} className="text-purple-600"/> <span className="text-[10px] font-black text-purple-600">IMÁN</span>
                    </div>
                )}
                {activePowerUp === 'shield' && (
                    <div className="bg-blue-100 border-2 border-blue-600 px-2 py-1 rounded-full flex items-center gap-1 animate-bounce">
                         <Shield size={14} className="text-blue-600"/> <span className="text-[10px] font-black text-blue-600">ESCUDO</span>
                    </div>
                )}
                {isFrozen && (
                    <div className="bg-cyan-100 border-2 border-cyan-500 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-lg">
                         <Snowflake size={16} className="text-cyan-600"/> <span className="text-xs font-black text-cyan-600">¡CONGELADO!</span>
                    </div>
                )}
            </div>

            {combo > 1 && (
                <div className={`bg-momon-red text-white px-3 py-1 rounded-full border-2 border-momon-black font-bold text-sm ${combo > 8 ? 'animate-pulse scale-110 ring-4 ring-yellow-400' : 'animate-bounce'}`}>
                    {combo}x COMBO!
                </div>
            )}
        </div>

        <div className="flex flex-col items-end gap-2">
            <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-8 h-8 rounded-full border-4 border-momon-black transition-all duration-300 transform ${
                            i < lives ? 'bg-momon-red scale-100' : 'bg-gray-300 scale-75'
                        }`}
                    />
                ))}
            </div>
            <div className={`w-32 h-5 bg-white border-4 border-momon-black rounded-full overflow-hidden relative mt-1 ${sugarRush ? 'scale-110 shadow-lg shadow-yellow-400' : ''}`}>
                <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-yellow-400 transition-all duration-200"
                    style={{ width: `${state.current.sugarRushCharge}%` }}
                />
                {sugarRush && <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white tracking-widest bg-black/20 animate-pulse">¡FIEBRE!</span>}
            </div>
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
         {score > 14000 && score < 15000 && (
             <span className="text-4xl font-black text-momon-red animate-pulse whitespace-nowrap drop-shadow-[0_4px_0_#fff]">¡CASI LLEGAS!</span>
         )}
      </div>
      
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none cursor-crosshair active:cursor-grabbing"
        onMouseMove={onMouseMove}
        onTouchMove={onTouchMove}
        onTouchStart={onTouchStart}
      />
    </div>
  );
};
