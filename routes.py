from flask import render_template, flash, url_for, redirect, request, jsonify, session
from app import app, db
from models import Student, User, Subject, Role, Grade
from werkzeug.urls import url_parse
from functools import wraps


def login_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if session.get('user_id') is None:
            flash('Для просмотра данной страницы необходимо войти')
            return redirect(url_for('login'))
        else:
            return func(*args, **kwargs)
    return wrapper

@app.route('/')
@app.route('/index')
@login_required
def index():
    current_user = User.query.filter_by(id=session['user_id']).first()
    grades = []
    if current_user is not None and current_user.is_student():
        grades = current_user.student.grades
    return render_template("index.html",
        title = 'Главная',
        grades = grades,
        current_term = app.config['CURRENT_TERM'],
        current_user=current_user)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if session.get('user_id') is not None:
        return redirect(url_for('index'))
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password') 
        user = User.query.filter_by(username=username).first()
        if user is None or not user.check_password(password):
            flash('Неверное имя пользователя или пароль')
            return redirect(url_for('login'))
        session['user_id'] = user.id
        next_page = request.args.get('next')
        if not next_page or url_parse(next_page).netloc != '':
            next_page = url_for('index')
        return redirect(next_page)  
    return render_template('login.html', title='Вход')

@app.route('/logout')
@login_required
def logout():
    session.pop('user_id', None)
    return redirect(url_for('index'))

@app.route('/subjects', methods=['GET', 'POST'])
@login_required
def subjects():
    current_user = User.query.filter_by(id=session['user_id']).first()
    return render_template("subjects.html",
        title = 'Предметы',
        current_user=current_user)

@app.route('/students', methods=['GET', 'POST'])
@login_required
def students(): 
    current_user = User.query.filter_by(id=session['user_id']).first()
    return render_template("students.html",
        title = 'Предметы',
        current_user=current_user)

@app.route('/subjects_ajax', methods=['POST'])
@login_required
def subjects_ajax():
    subjects = Subject.query.all()  
    data = [{
        'id': subject.id,
        'name': subject.name,
        'year': subject.year,
        'term': subject.term
        } for subject in subjects
    ]
    return jsonify({'data': data})

@app.route('/add_subject', methods=['POST'])
@login_required
def add_subject():
    new_subject = Subject(name='', year=None, term='')
    db.session.add(new_subject)
    db.session.commit()
    return jsonify(status="success", id=new_subject.id)  

@app.route('/edit_subject', methods=['POST'])
@login_required
def edit_subject():
    data = request.get_json()
    subject = Subject.query.filter_by(id=data['id']).first_or_404()
    subject.name = data['name'].strip()
    subject.year = data['year'].strip()
    subject.term = data['term'].strip()
    db.session.commit()
    return jsonify(status="success", data=data) 

@app.route('/delete_subjects', methods=['POST'])
@login_required
def delete_subjects():
    ids = request.get_json()['ids']
    data=[]
    for id in ids:
        subject = Subject.query.filter_by(id=id).first_or_404()
        for grade in subject.grades:
            db.session.delete(grade)
        db.session.delete(subject)
        data.append(id)
    db.session.commit()
    return jsonify(status="success", data=data, ids=ids)

@app.route('/students_ajax', methods=['POST'])
@login_required
def students_ajax():
    students = Student.query.all()  
    data = [{
        'id': student.id,
        'name': student.name,
        'year': student.year,
        'group': student.group
        } for student in students
    ]
    return jsonify({'data': data})     

@app.route('/add_student', methods=['POST'])
@login_required
def add_student():
    new_student = Student(name='', year=None, group='')
    db.session.add(new_student)
    db.session.commit()
    user = User(username=new_student.id)
    new_student.user = user
    user.set_password(str(new_student.id))
    student_role = Role.query.filter_by(name='student').first()
    if not student_role:
        student_role = Role(name='student')
        db.session.add(student_role)    
    user.roles = [ student_role, ]
    db.session.add(user)
    db.session.commit()
    return jsonify(status="success", id=new_student.id)  

@app.route('/edit_student', methods=['POST'])
@login_required
def edit_student():
    data = request.get_json()
    student = Student.query.filter_by(id=data['id']).first_or_404()
    student.name = data['name'].strip()
    student.year = data['year'].strip()
    student.group = data['group'].strip()
    db.session.commit()
    return jsonify(status="success", data=data) 

@app.route('/student_validate', methods=['POST'])
@login_required
def student_validate():
    id = request.get_json()['id']
    return jsonify(status="success") 

@app.route('/delete_students', methods=['POST'])
@login_required
def delete_students():
    ids = request.get_json()['ids']
    for id in ids:
        student = Student.query.filter_by(id=id).first_or_404()
        if student.user:
            db.session.delete(student.user)
        for grade in student.grades:
            db.session.delete(grade)
        db.session.delete(student)
    db.session.commit()
    return jsonify(status="success")  

@app.route('/grades_ajax', methods=['POST'])
@login_required
def grades_ajax():
    selects = request.get_json()
    if not selects:
        return jsonify({'data': []})
    students = Student.query.filter_by(year=selects['year'], group=selects['group']) 
    data = [] 
    for student in students:
        student_data = {}
        student_data['student_id'] = student.id
        student_data['student_name'] = student.name
        for grade in student.get_grades(int(selects['subject_id'])):
            student_data[str(grade.stage)] = grade.value
        data.append(student_data)
    return jsonify({'data': data})


@app.route('/student_grades_ajax', methods=['POST'])
@login_required
def student_grades_ajax():
    data = []
    current_user = User.query.filter_by(id=session['user_id']).first()
    student = current_user.student
    #subjects = Subject.query.filter_by(year=student.year, term=str(app.config['CURRENT_TERM']))
    subjects = Subject.query.filter_by(year=student.year)
    for subject in subjects:
        subject_grades = {}
        subject_grades['subject_name'] = subject.name
        for grade in student.get_grades(subject.id):
            subject_grades[str(grade.stage)] = grade.value
        data.append(subject_grades)
    return jsonify({'data': data})

@app.route('/edit_grade', methods=['POST'])
@login_required
def edit_grade():
    data = request.get_json()
    subject_id = data['subject_id']
    student_id = data['student_id']
    stage = data['stage']
    value = data[stage].strip()
    grade = Grade.query.filter_by(subject_id=subject_id, student_id=student_id, stage=stage).first()
    if grade:
        if value == '':
            db.session.delete(grade)
        else:
            grade.value = value
    else:
        if value == '':
            return jsonify(status="fail")
        grade = Grade(subject_id=subject_id, student_id=student_id, stage=stage, value=value)  
        db.session.add(grade)
    db.session.commit()
    return jsonify(status="success") 

@app.route('/delete_grades', methods=['POST'])
@login_required
def delete_grades():
    data = request.get_json()
    for item in data:
        subject_id = item['subject_id']
        student_id = item['student_id']
        stage = item['stage']
        grade = Grade.query.filter_by(subject_id=subject_id, student_id=student_id, stage=stage).first_or_404()
        db.session.delete(grade)
    db.session.commit()
    return jsonify(status="success", data=data) 
    
@app.route('/groups_ajax', methods=['POST'])
@login_required
def groups_ajax():
    groups = db.session.query(Student.group).distinct()
    data = [group for group in groups]
    return jsonify({'data': sorted(data)})
    
@app.route('/years_ajax', methods=['POST'])
@login_required
def years_ajax():
    years = db.session.query(Student.year).distinct()
    data = [year for year in years]
    return jsonify({'data': sorted(data)})