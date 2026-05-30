import hashlib
from models import Base, engine, Admin, Student, Grade, SessionLocal


def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if not db.query(Admin).first():
        hashed_password = hashlib.sha256("adminpassword".encode()).hexdigest()
        admin = Admin(username="admin", hashed_password=hashed_password)
        db.add(admin)

    for i in range(1, 11):
        if not db.query(Student).filter(Student.student_id == f"S{i:03}").first():
            student = Student(
                student_id=f"S{i:03}",
                first_name=f"Student {i}",
                last_name="Studentic",
                email=f"studentic{i}@example.com",
            )
            db.add(student)
            db.commit()

            grade = Grade(student_id=student.id, course_name="Math", grade=80 + i)
            db.add(grade)

    db.commit()
    db.close()
    print("Database seeded!")


if __name__ == "__main__":
    seed_db()
