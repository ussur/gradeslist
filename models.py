from app import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    student = db.relationship('Student', backref='user', lazy=True, uselist=False)
    roles = db.relationship('Role', secondary='user_roles')

    def __repr__(self):
        return '<User {}>'.format(self.username)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def is_student(self):
        return self.student is not None
    
    def is_admin(self):
        for role in self.roles:
            if role.name == 'admin':
                return True
        return False
    
    def is_head(self):
        for role in self.roles:
            if role.name == 'head':
                return True
        return False
    
    
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True)  
    
    def __repr__(self):
        return '<Role {}>'.format(self.name)
    
    
class UserRoles(db.Model):
    __tablename__ = 'user_roles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'))


class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), index=True)
    year = db.Column(db.Integer, index=True)
    group = db.Column(db.String(10), index=True) 
    grades = db.relationship('Grade', backref='student', lazy='dynamic', cascade="all, delete-orphan")
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))    
        
    def __repr__(self):
        return '<Student {}, {} курс, {} группа>'.format(self.name, self.year, self.group)  
    
    def get_grades(self, subject_id):
        grades = [grade for grade in self.grades if grade.subject_id == subject_id]
        return grades
        
class Subject(db.Model):
    __tablename__ = 'subjects'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), index=True)
    year = db.Column(db.Integer, index=True)
    term = db.Column(db.String(10), index=True)
    grades = db.relationship('Grade', backref='subject', lazy='dynamic', cascade="all, delete-orphan")
    
    
class Grade(db.Model):
    __tablename__ = 'grades'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    stage = db.Column(db.Integer, nullable=False)
    value = db.Column(db.String(10), nullable=False)   
    
def increment_year():
    students = Student.query.all()
    for student in students:
        if student.year == 4:
            db.session.delete(student)
        else:
            student.year += 1
        db.session.commit()