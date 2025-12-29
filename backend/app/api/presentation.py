"""
Presentation API - Endpoints for managing trial presentation playlists
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.presentation import Presentation

router = APIRouter()

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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.post("", response_model=PresentationResponse, summary="Create a new presentation")
async def create_presentation(data: PresentationCreate, db: Session = Depends(get_db)):
    """Create a new trial presentation playlist."""
    presentation = Presentation(
        name=data.name,
        case_id=data.case_id,
        items=[item.model_dump() for item in data.items]
    )
    db.add(presentation)
    db.commit()
    db.refresh(presentation)
    return presentation

@router.get("", response_model=List[PresentationResponse], summary="List all presentations")
async def list_presentations(case_id: Optional[str] = None, db: Session = Depends(get_db)):
    """List all presentations, optionally filtered by case_id."""
    query = db.query(Presentation)
    if case_id:
        query = query.filter(Presentation.case_id == case_id)
    return query.all()

@router.get("/{presentation_id}", response_model=PresentationResponse, summary="Get a presentation")
async def get_presentation(presentation_id: str, db: Session = Depends(get_db)):
    """Get a specific presentation by ID."""
    presentation = db.query(Presentation).filter(Presentation.id == presentation_id).first()
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
    return presentation

@router.put("/{presentation_id}", response_model=PresentationResponse, summary="Update a presentation")
async def update_presentation(presentation_id: str, data: PresentationUpdate, db: Session = Depends(get_db)):
    """Update an existing presentation."""
    presentation = db.query(Presentation).filter(Presentation.id == presentation_id).first()
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
    
    if data.name is not None:
        presentation.name = data.name
    if data.items is not None:
        presentation.items = [item.model_dump() for item in data.items]
    
    presentation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(presentation)
    return presentation

@router.delete("/{presentation_id}", summary="Delete a presentation")
async def delete_presentation(presentation_id: str, db: Session = Depends(get_db)):
    """Delete a presentation."""
    presentation = db.query(Presentation).filter(Presentation.id == presentation_id).first()
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
    
    db.delete(presentation)
    db.commit()
    return {"status": "deleted", "id": presentation_id}

@router.post("/{presentation_id}/reorder", response_model=PresentationResponse, summary="Reorder items")
async def reorder_items(presentation_id: str, item_order: List[str], db: Session = Depends(get_db)):
    """Reorder items in a presentation by document IDs."""
    presentation = db.query(Presentation).filter(Presentation.id == presentation_id).first()
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
    
    items = presentation.items
    
    # Create a mapping of document_id to item
    item_map = {item["document_id"]: item for item in items}
    
    # Reorder based on provided order
    new_items = []
    for i, doc_id in enumerate(item_order):
        if doc_id in item_map:
            item = item_map[doc_id].copy()
            item["order"] = i
            new_items.append(item)
    
    # Explicitly assign to trigger SQLAlchemy change detection for JSON types if needed
    # (though typically reassigning the whole list works)
    presentation.items = new_items
    presentation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(presentation)
    return presentation
