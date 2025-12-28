"""
Presentation API - Endpoints for managing trial presentation playlists
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

router = APIRouter()

# In-memory storage for presentations (would be database in production)
_presentations: Dict[str, Dict[str, Any]] = {}


class PresentationItem(BaseModel):
    document_id: str
    order: int
    notes: Optional[str] = None


class PresentationCreate(BaseModel):
    name: str
    case_id: str
    items: List[PresentationItem] = []


class PresentationUpdate(BaseModel):
    name: Optional[str] = None
    items: Optional[List[PresentationItem]] = None


class PresentationResponse(BaseModel):
    id: str
    name: str
    case_id: str
    items: List[PresentationItem]
    created_at: str
    updated_at: str


@router.post("", response_model=PresentationResponse, summary="Create a new presentation")
async def create_presentation(data: PresentationCreate):
    """Create a new trial presentation playlist."""
    presentation_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    presentation = {
        "id": presentation_id,
        "name": data.name,
        "case_id": data.case_id,
        "items": [item.model_dump() for item in data.items],
        "created_at": now,
        "updated_at": now
    }
    
    _presentations[presentation_id] = presentation
    return presentation


@router.get("", response_model=List[PresentationResponse], summary="List all presentations")
async def list_presentations(case_id: Optional[str] = None):
    """List all presentations, optionally filtered by case_id."""
    presentations = list(_presentations.values())
    if case_id:
        presentations = [p for p in presentations if p["case_id"] == case_id]
    return presentations


@router.get("/{presentation_id}", response_model=PresentationResponse, summary="Get a presentation")
async def get_presentation(presentation_id: str):
    """Get a specific presentation by ID."""
    if presentation_id not in _presentations:
        raise HTTPException(status_code=404, detail="Presentation not found")
    return _presentations[presentation_id]


@router.put("/{presentation_id}", response_model=PresentationResponse, summary="Update a presentation")
async def update_presentation(presentation_id: str, data: PresentationUpdate):
    """Update an existing presentation."""
    if presentation_id not in _presentations:
        raise HTTPException(status_code=404, detail="Presentation not found")
    
    presentation = _presentations[presentation_id]
    
    if data.name is not None:
        presentation["name"] = data.name
    if data.items is not None:
        presentation["items"] = [item.model_dump() for item in data.items]
    
    presentation["updated_at"] = datetime.utcnow().isoformat()
    return presentation


@router.delete("/{presentation_id}", summary="Delete a presentation")
async def delete_presentation(presentation_id: str):
    """Delete a presentation."""
    if presentation_id not in _presentations:
        raise HTTPException(status_code=404, detail="Presentation not found")
    
    del _presentations[presentation_id]
    return {"status": "deleted", "id": presentation_id}


@router.post("/{presentation_id}/reorder", response_model=PresentationResponse, summary="Reorder items")
async def reorder_items(presentation_id: str, item_order: List[str]):
    """Reorder items in a presentation by document IDs."""
    if presentation_id not in _presentations:
        raise HTTPException(status_code=404, detail="Presentation not found")
    
    presentation = _presentations[presentation_id]
    items = presentation["items"]
    
    # Create a mapping of document_id to item
    item_map = {item["document_id"]: item for item in items}
    
    # Reorder based on provided order
    new_items = []
    for i, doc_id in enumerate(item_order):
        if doc_id in item_map:
            item = item_map[doc_id].copy()
            item["order"] = i
            new_items.append(item)
    
    presentation["items"] = new_items
    presentation["updated_at"] = datetime.utcnow().isoformat()
    return presentation
