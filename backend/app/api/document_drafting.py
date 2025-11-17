from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import shutil
from datetime import datetime

from toolsnteams_previous.document_drafter import DocumentDrafter

router = APIRouter()

class DraftDocumentRequest(BaseModel):
    motion_type: str
    case_id: str
    data: dict # This will contain facts, theories, conflicts, etc.

@router.post("/draft-document", response_class=FileResponse)
async def draft_document_endpoint(request: DraftDocumentRequest):
    """
    Drafts a legal document based on the specified motion type and provided data.
    Returns the drafted document as a downloadable Word file.
    """
    drafter = DocumentDrafter()
    
    # Create a temporary file to save the document
    temp_dir = "temp_documents"
    os.makedirs(temp_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_name = f"{request.motion_type}_{request.case_id}_{timestamp}.docx"
    file_path = os.path.join(temp_dir, file_name)

    try:
        drafter.draft_legal_document(
            filepath=file_path,
            motion_type=request.motion_type,
            data=request.data
        )
        
        # Return the file as a download
        return FileResponse(
            path=file_path,
            filename=file_name,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during document drafting: {e}")
    finally:
        # Clean up the temporary file after sending
        # This needs to be handled carefully in FastAPI, as FileResponse might stream the file.
        # For simplicity, we'll clean up immediately, but in a production system,
        # you might want a background task for cleanup.
        if os.path.exists(file_path):
            os.remove(file_path)
        if not os.listdir(temp_dir): # Remove temp_dir if empty
            shutil.rmtree(temp_dir)
