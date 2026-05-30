from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
from models import SessionLocal, Admin, Student, Grade, Base, engine
import hashlib
from pydantic import BaseModel
from typing import List, Optional

class GradeSchema(BaseModel):
    id: int
    course_name: str
    grade: int
    class Config:
        orm_mode = True

class StudentSchema(BaseModel):
    id: int
    student_id: str
    first_name: str
    last_name: str
    grades: List[GradeSchema] = []
    class Config:
        orm_mode = True

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "Student Grades API is running"}

@router.post("/login")
def login(username: str, password: str, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.username == username).first()
    hashed_input = hashlib.sha256(password.encode()).hexdigest()
    if not admin or admin.hashed_password != hashed_input:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Login successful"}

@router.get("/students")
def get_students(db: Session = Depends(get_db)):
    return db.query(Student).all()

@router.get("/students/{student_id}", response_model=StudentSchema)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.post("/students/{student_id}/grades")
def add_grade(
    student_id: int, course_name: str, grade: int, db: Session = Depends(get_db)
):
    new_grade = Grade(student_id=student_id, course_name=course_name, grade=grade)
    db.add(new_grade)
    db.commit()
    return {"message": "Grade added"}

from s3_utils import list_s3_files, S3_BUCKET

@router.get("/s3-files")
def get_s3_files():
    if not S3_BUCKET:
        return {"message": "S3_BUCKET environment variable not set", "files": []}
    files = list_s3_files(S3_BUCKET)
    return {"bucket": S3_BUCKET, "files": files}

# Include router twice: with and without /api prefix for ALB support
app.include_router(router)
app.include_router(router, prefix="/api")

from seed import seed_db

@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    seed_db()
