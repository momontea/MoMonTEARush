import React, { useState, useEffect, useCallback } from 'react';
import { GameState, HighScore } from './constants';
import { MainMenu } from './components/MainMenu';
import { GameCanvas } from './components/GameCanvas';
import { BaristaAI } from './components/BaristaAI';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    // Load high score
    const saved = localStorage.getItem('momon_highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setCurrentScore(0);
  };

  // UseCallback ensures this function reference stays stable, preventing GameCanvas from re-mounting
  const handleGameOver = useCallback((score: number) => {
    setCurrentScore(score);
    setHighScore(prev => {
        if (score > prev) {
            localStorage.setItem('momon_highscore', score.toString());
            return score;
        }
        return prev;
    });
    setGameState(GameState.AI_REWARD);
  }, []);

  const goHome = () => {
    setGameState(GameState.MENU);
  };

  return (
    <div className="w-full h-screen bg-momon-yellow overflow-hidden font-sans select-none">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-momon-green"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-momon-red transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {gameState === GameState.MENU && (
        <MainMenu onStart={startGame} highScore={highScore} />
      )}

      {gameState === GameState.PLAYING && (
        <GameCanvas onGameOver={handleGameOver} />
      )}

      {gameState === GameState.AI_REWARD && (
        <BaristaAI score={currentScore} onHome={goHome} />
      )}
    </div>
  );
};

export default App;