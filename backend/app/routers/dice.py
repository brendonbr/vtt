from fastapi import APIRouter
from pydantic import BaseModel
import random

router = APIRouter(prefix="/api/dice", tags=["dice"])

class DiceRoll(BaseModel):
    dice_type: str  # e.g., "d20", "d12", "d10", "d8", "d6", "d4"
    num_rolls: int = 1

@router.post("/roll")
async def roll_dice(roll: DiceRoll):
    """
    Roll dice based on the specified type and number of rolls.
    Example: {"dice_type": "d20", "num_rolls": 1}
    """
    # Parse dice type (e.g., "d20" -> 20)
    try:
        dice_value = int(roll.dice_type.replace("d", "").lower())
    except ValueError:
        return {"error": "Invalid dice type. Use format like 'd20', 'd12', etc."}
    
    if dice_value < 1:
        return {"error": "Dice value must be at least 1"}
    
    if roll.num_rolls < 1 or roll.num_rolls > 100:
        return {"error": "Number of rolls must be between 1 and 100"}
    
    rolls = [random.randint(1, dice_value) for _ in range(roll.num_rolls)]
    total = sum(rolls)
    
    return {
        "dice_type": roll.dice_type,
        "num_rolls": roll.num_rolls,
        "rolls": rolls,
        "total": total
    }

@router.get("/roll/{dice_type}/{num_rolls}")
async def roll_dice_get(dice_type: str, num_rolls: int = 1):
    """
    Roll dice via GET request.
    Example: /api/dice/roll/d20/1
    """
    return await roll_dice(DiceRoll(dice_type=dice_type, num_rolls=num_rolls))
