import React, { useRef, useEffect, useCallback, useState } from 'react';

// Define game phases and actions
type GamePhase = 'idle' | 'openingStatement' | 'playerTurn' | 'opponentTurn' | 'closingStatement' | 'gameOver';
type PlayerAction = 'presentEvidence' | 'object' | 'crossExamine' | 'rest' | 'startTrial';

interface GameState {
  phase: GamePhase;
  playerHealth: number;
  opponentHealth: number;
  currentEvidence: string | null;
  log: string[];
  score: number;
  message: string;
  availableActions: PlayerAction[];
}

const MockTrialArena: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    phase: 'idle',
    playerHealth: 100,
    opponentHealth: 100,
    currentEvidence: null,
    log: [],
    score: 0,
    message: 'Welcome to the Mock Trial Arena! Press Enter to Start.',
    availableActions: ['startTrial'],
  });
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Retro game style colors
  const colors = {
    background: '#222034',
    ground: '#3f3f74',
    player: '#83769c',
    opponent: '#a06cd5',
    text: '#fbf236',
    border: '#5b6ee1',
    danger: '#ff4b8e',
    healthBar: '#00e4ff',
    healthBarBg: '#4a4a4a',
  };

  // Character positions (for drawing, not game logic)
  const playerPos = { x: 100, y: 350, width: 40, height: 60 };
  const opponentPos = { x: 660, y: 350, width: 40, height: 60 };
  const groundHeight = 50;

  // Function to draw game elements
  const drawGame = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Ground
    ctx.fillStyle = colors.ground;
    ctx.fillRect(0, ctx.canvas.height - groundHeight, ctx.canvas.width, groundHeight);

    // Player
    ctx.fillStyle = colors.player;
    ctx.fillRect(playerPos.x, playerPos.y - playerPos.height, playerPos.width, playerPos.height);

    // Opponent
    ctx.fillStyle = colors.opponent;
    ctx.fillRect(opponentPos.x, opponentPos.y - opponentPos.height, opponentPos.width, opponentPos.height);

    // Health Bars
    ctx.fillStyle = colors.healthBarBg;
    ctx.fillRect(50, 70, 200, 20); // Player Health Bar Background
    ctx.fillRect(ctx.canvas.width - 250, 70, 200, 20); // Opponent Health Bar Background

    ctx.fillStyle = colors.healthBar;
    ctx.fillRect(50, 70, state.playerHealth * 2, 20); // Player Health
    ctx.fillRect(ctx.canvas.width - 250, 70, state.opponentHealth * 2, 20); // Opponent Health

    ctx.font = '16px "Press Start 2P"';
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'left';
    ctx.fillText(`Player: ${state.playerHealth}%`, 50, 60);
    ctx.textAlign = 'right';
    ctx.fillText(`Opponent: ${state.opponentHealth}%`, ctx.canvas.width - 50, 60);

    // Score
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${state.score}`, ctx.canvas.width / 2, 40);

    // Game Message
    ctx.font = '20px "Press Start 2P"';
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'center';
    ctx.fillText(state.message, ctx.canvas.width / 2, ctx.canvas.height / 2 - 50);

    // Current Evidence (Placeholder)
    if (state.currentEvidence) {
      ctx.font = '14px "Press Start 2P"';
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'center';
      ctx.fillText(`Evidence: ${state.currentEvidence}`, ctx.canvas.width / 2, ctx.canvas.height / 2);
    }

    // Action Log (last few entries)
    ctx.font = '12px "Press Start 2P"';
    ctx.fillStyle = colors.text;
    ctx.textAlign = 'left';
    state.log.slice(-3).forEach((entry, index) => {
      ctx.fillText(entry, 20, ctx.canvas.height - 100 + (index * 20));
    });

    // Retro border
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }, [colors, playerPos, opponentPos, groundHeight]);

  // Function to communicate with backend
  const sendActionToBackend = useCallback(async (action: PlayerAction, payload?: any) => {
    setIsProcessingAction(true);
    try {
      let response;
      if (action === 'startTrial') {
        response = await fetch('/mock-trial/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        response = await fetch('/mock-trial/action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action, payload }),
        });
      }

      if (!response.ok) {
        throw new Error(`Backend call failed: ${response.statusText}`);
      }

      const newGameState = await response.json();
      setGameState(newGameState);

    } catch (err: any) {
      console.error('Error sending action to backend:', err);
      setGameState(prev => ({ ...prev, message: `Error: ${err.message}` }));
    } finally {
      setIsProcessingAction(false);
    }
  }, []); // Removed gameState from dependencies as it's updated by setGameState(newGameState)

  // Keyboard event listener for actions
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isProcessingAction || (gameState.phase as string) === 'gameOver') return;

      if (e.key === 'Enter' && gameState.phase === 'idle') {
        sendActionToBackend('startTrial');
      } else if (e.key === '1' && gameState.availableActions.includes('presentEvidence') && gameState.phase === 'playerTurn') {
        sendActionToBackend('presentEvidence');
      } else if (e.key === '2' && gameState.availableActions.includes('object') && gameState.phase === 'playerTurn') {
        sendActionToBackend('object');
      } else if ((e.key === 'r' || e.key === 'R') && gameState.phase === 'gameOver') {
        sendActionToBackend('startTrial'); // Restart the game by calling startTrial on backend
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, isProcessingAction, sendActionToBackend]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      drawGame(ctx, gameState);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, drawGame]);

  return (
    <div className="mock-trial-arena flex flex-col items-center justify-center bg-background-canvas rounded-xl overflow-hidden p-4">
      <canvas ref={canvasRef} className="border-4 border-border-default"></canvas>
      <div className="mt-4 flex space-x-4">
        {gameState.availableActions.includes('startTrial') && gameState.phase === 'idle' && (
          <button onClick={() => sendActionToBackend('startTrial')} className="c-btn shimmer-btn" disabled={isProcessingAction}>
            Start Trial (Enter)
          </button>
        )}
        {gameState.availableActions.includes('presentEvidence') && gameState.phase === 'playerTurn' && (
          <button onClick={() => sendActionToBackend('presentEvidence')} className="c-btn" disabled={isProcessingAction}>
            Present Evidence (1)
          </button>
        )}
        {gameState.availableActions.includes('object') && gameState.availableActions.includes('object') && gameState.phase === 'playerTurn' && (
          <button onClick={() => sendActionToBackend('object')} className="c-btn bg-accent-red" disabled={isProcessingAction}>
            Object (2)
          </button>
        )}
        {gameState.phase === 'gameOver' && (
          <button onClick={() => sendActionToBackend('startTrial')} className="c-btn bg-accent-blue" disabled={isProcessingAction}>
            Restart (R)
          </button>
        )}
      </div>
      <p className="text-text-secondary mt-2">Current Phase: {gameState.phase}</p>
    </div>
  );
};

export default MockTrialArena;
