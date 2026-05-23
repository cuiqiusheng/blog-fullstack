from fastapi import Depends,FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import get_db

app = FastAPI(title='AI Service', version='0.1.0')


@app.get('/health')
def health(db: Session = Depends(get_db)):
    db.execute(text('SELECT 1')) # only check if database is connected
    return {'status': 'ok', 'database': 'connected'}