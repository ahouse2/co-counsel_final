from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import random
import time

router = APIRouter(prefix="/mock-trial", tags=["Mock Trial Arena"])

# Define game phases and actions
type GamePhase = 'idle' | 'openingStatement' | 'playerTurn' | 'opponentTurn' | 'closingStatement' | 'gameOver';
type PlayerAction = 'presentEvidence' | 'object' | 'crossExamine' | 'rest' | 'startTrial';

class GameState(BaseModel):
    phase: GamePhase
    playerHealth: int
    opponentHealth: int
    currentEvidence: Optional[str]
    log: List[str]
    score: int
    message: str
    availableActions: List[PlayerAction]
    # Add more fields as needed for legal theories, case context, etc.

class GameActionRequest(BaseModel):
    action: PlayerAction
    payload: Optional[Dict[str, Any]] = None

# In-memory game state
current_game_state: GameState = GameState(
    phase='idle',
    playerHealth=100,
    opponentHealth=100,
    currentEvidence=None,
    log=[],
    score=0,
    message='Welcome to the Mock Trial Arena! Press Enter to Start.',
    availableActions=['startTrial'],
)

@router.post("/start", response_model=GameState)
async def start_mock_trial():
    """
    Initializes a new mock trial simulation.
    """
    global current_game_state
    current_game_state = GameState(
        phase='openingStatement',
        playerHealth=100,
        opponentHealth=100,
        currentEvidence=None,
        log=['Trial started. Opening statements begin!'],
        score=0,
        message='Opening statements begin!',
        availableActions=['presentEvidence', 'object'], # Initial player actions
    )
    return current_game_state

@router.post("/action", response_model=GameState)
async def perform_game_action(request: GameActionRequest):
    """
    Processes a player action and returns the updated game state, including opponent's response.
    """
    global current_game_state

    if current_game_state.phase == 'gameOver':
        raise HTTPException(status_code=400, detail="Game is over. Start a new trial.")
    if request.action not in current_game_state.availableActions:
        raise HTTPException(status_code=400, detail=f"Action '{request.action}' not available in current phase.")

    # Process player's action
    if request.action == 'presentEvidence':
        damage = random.randint(10, 20)
        current_game_state.opponentHealth = max(0, current_game_state.opponentHealth - damage)
        current_game_state.score += damage
        current_game_state.currentEvidence = request.payload.get('evidence_id', f'Exhibit {random.randint(1, 100)}') if request.payload else f'Exhibit {random.randint(1, 100)}'
        current_game_state.log.append(f"Player: Presented evidence '{current_game_state.currentEvidence}'. Opponent HP -{damage}")
        current_game_state.message = f"You presented evidence! Opponent took {damage} damage."
        current_game_state.phase = 'opponentTurn'
    elif request.action == 'object':
        current_game_state.log.append("Player: Objected.")
        current_game_state.message = "You objected! Opponent is thinking..."
        current_game_state.phase = 'opponentTurn'
    elif request.action == 'rest':
        current_game_state.log.append("Player: Rested.")
        current_game_state.message = "You rested. Opponent is thinking..."
        current_game_state.phase = 'opponentTurn'
    # Add more player actions here

    # Simulate opponent's turn (AI Agent Logic Placeholder)
    if current_game_state.phase == 'opponentTurn':
        # TODO: Integrate a more sophisticated AI agent here that analyzes current_game_state
        # and legal theories to decide its action.
        time.sleep(1) # Simulate AI thinking time

        opponent_action_choice = random.choice(['crossExamine', 'rest']) # Current simple random AI
        if opponent_action_choice == 'crossExamine':
            damage = random.randint(5, 15)
            current_game_state.playerHealth = max(0, current_game_state.playerHealth - damage)
            current_game_state.score -= damage // 2 # Penalize player score for taking damage
            current_game_state.log.append(f"Opponent: Cross-examined. Player HP -{damage}")
            current_game_state.message = f"Opponent cross-examined! You took {damage} damage."
        else: # rest
            current_game_state.log.append("Opponent: Rested.")
            current_game_state.message = "Opponent rested."
        
        current_game_state.phase = 'playerTurn'
        current_game_state.availableActions = ['presentEvidence', 'object', 'rest'] # Reset player actions

    # Check for game over conditions
    if current_game_state.playerHealth <= 0 or current_game_state.opponentHealth <= 0:
        current_game_state.phase = 'gameOver'
        current_game_state.message = "You Lost the Case!" if current_game_state.playerHealth <= 0 else "You Won the Case!"
        current_game_state.availableActions = [] # No actions when game is over

    return current_game_state

@router.get("/state", response_model=GameState)
async def get_game_state():
    """
    Retrieves the current state of the mock trial simulation.
    """
    return current_game_state

@router.post("/evaluate", response_model=Dict[str, Any])
async def evaluate_game_state(payload: Dict[str, Any]):
    """
    Evaluates the current game state or a specific action against legal theories.
    This is a placeholder for integrating LegalTheoryEngine or other AI evaluation.
    """
    # TODO: Integrate LegalTheoryEngine here
    # Example: engine = LegalTheoryEngine(); evaluation = engine.evaluate_state(payload)
    print(f"Evaluating payload: {payload}")
    return {"evaluation_result": "Placeholder for AI legal theory evaluation."}
