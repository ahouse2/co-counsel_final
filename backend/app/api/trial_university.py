from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/trial-university", tags=["Trial University"])

class Lesson(BaseModel):
    id: str
    title: str
    summary: str
    progress: int
    icon: str
    video_url: Optional[str] = None # Added video_url for the video player

# In-memory lesson data (for demonstration purposes)
lessons_db: List[Lesson] = [
    {
        "id": '1',
        "title": 'Introduction to Legal Discovery',
        "summary": 'Understand the basics of evidence collection and its importance.',
        "progress": 75,
        "icon": 'fa-solid fa-magnifying-glass',
        "video_url": 'https://www.youtube.com/embed/dQw4w9WgXcQ' # Placeholder YouTube video
    },
    {
        "id": '2',
        "title": 'Crafting Compelling Arguments',
        "summary": 'Develop persuasive legal arguments and presentation skills.',
        "progress": 50,
        "icon": 'fa-solid fa-gavel',
        "video_url": 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        "id": '3',
        "title": 'Navigating Courtroom Procedures',
        "summary": 'Learn the intricacies of courtroom etiquette and procedures.',
        "progress": 25,
        "icon": 'fa-solid fa-scale-balanced',
        "video_url": 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        "id": '4',
        "title": 'AI in Legal Research',
        "summary": 'Leverage AI tools for efficient and comprehensive legal research.',
        "progress": 90,
        "icon": 'fa-solid fa-robot',
        "video_url": 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
        "id": '5',
        "title": 'Ethical Considerations in AI Law',
        "summary": 'Explore the ethical implications of AI in the legal profession.',
        "progress": 10,
        "icon": 'fa-solid fa-book',
        "video_url": 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
]

@router.get("/lessons", response_model=List[Lesson])
async def get_all_lessons():
    """
    Retrieves a list of all available lessons in Trial University.
    """
    return lessons_db

@router.get("/lessons/{lesson_id}", response_model=Lesson)
async def get_lesson_by_id(lesson_id: str):
    """
    Retrieves a specific lesson by its ID.
    """
    lesson = next((lesson for lesson in lessons_db if lesson.id == lesson_id), None)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson
