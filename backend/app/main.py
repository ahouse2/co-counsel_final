from fastapi import FastAPI, HTTPException

app = FastAPI(title="Co-Counsel API", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ingest")
def ingest():
    raise HTTPException(status_code=501, detail="Not implemented: ingestion pipeline")


@app.get("/query")
def query(q: str):
    raise HTTPException(status_code=501, detail="Not implemented: hybrid retrieval")


@app.get("/timeline")
def timeline():
    raise HTTPException(status_code=501, detail="Not implemented: timeline API")


@app.get("/graph/neighbor")
def graph_neighbor(id: str):
    raise HTTPException(status_code=501, detail="Not implemented: graph neighbor API")

