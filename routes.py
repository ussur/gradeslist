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
                           title='Главная',
                           grades=grades,
                           current_term=app.config['CURRENT_TERM'],
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
                           title='Предметы',
                           current_user=current_user)


@app.route('/students', methods=['GET', 'POST'])
@login_required
def students():
    current_user = User.query.filter_by(id=session['user_id']).first()
    return render_template("students.html",
                           title='Предметы',
                           current_user=current_user)


@app.route('/api/subjects', methods=['GET'])
@login_required
def subjects_get():
    subjects_all = Subject.query.all()
    data = [{
        'id': subject.id,
        'name': subject.name,
        'year': subject.year,
        'term': subject.term
        } for subject in subjects_all
    ]
    return jsonify({'data': data})


@app.route('/api/subjects', methods=['POST'])
@login_required
def subjects_add():
    new_subject = Subject(name="", year=None, term="")
    db.session.add(new_subject)
    db.session.commit()
    return jsonify(status="success", id=new_subject.id)


@app.route('/api/subjects', methods=['PUT'])
@login_required
def subjects_update():
    data = request.get_json()
    subject = Subject.query.filter_by(id=data['id']).first_or_404()
    subject.name = data['name'].strip()
    subject.year = data['year'].strip()
    subject.term = data['term'].strip()
    db.session.commit()
    return jsonify(status="success", data=data)


@app.route('/api/subjects', methods=['DELETE'])
@login_required
def subjects_delete():
    ids = request.get_json()['ids']
    for id in ids:
        subject = Subject.query.filter_by(id=id).first_or_404()
        for grade in subject.grades:
            db.session.delete(grade)
        db.session.delete(subject)
    db.session.commit()
    return jsonify(status="success")


@app.route('/api/students', methods=['GET'])
@login_required
def students_ajax():
    students_all = Student.query.all()
    data = [{
        'id': student.id,
        'name': student.name,
        'year': student.year,
        'group': student.group
        } for student in students_all
    ]
    return jsonify({'data': data})     


@app.route('/api/students', methods=['POST'])
@login_required
def student_add():
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


@app.route('/api/students', methods=['PUT'])
@login_required
def student_update():
    data = request.get_json()
    student = Student.query.filter_by(id=data['id']).first_or_404()
    student.name = data['name'].strip()
    student.year = data['year'].strip()
    student.group = data['group'].strip()
    db.session.commit()
    return jsonify(status="success", data=data)


@app.route('/api/students', methods=['DELETE'])
@login_required
def students_delete():
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


@app.route('/api/grades', methods=['POST'])
@login_required
def grades_get():
    params = request.get_json()
    if not params:
        return jsonify({'data': []})
    students_filtered = Student.query.filter_by(year=params['year'],
                                                group=params['group'])
    data = []
    for student in students_filtered:
        student_data = {
            'student_id': student.id,
            'student_name': student.name
        }
        for grade in student.get_grades(int(params['subject_id'])):
            student_data[str(grade.stage)] = grade.value
        data.append(student_data)
    return jsonify({'data': data})


@app.route('/api/grades/current', methods=['GET'])
@login_required
def grades_get_current():
    data = []
    current_user = User.query.filter_by(id=session['user_id']).first()
    student = current_user.student
    #subjects = Subject.query.filter_by(year=student.year, term=str(app.config['CURRENT_TERM']))
    subjects_filtered = Subject.query.filter_by(year=student.year)
    for subject in subjects_filtered:
        subject_grades = {'subject_name': subject.name}
        for grade in student.get_grades(subject.id):
            subject_grades[str(grade.stage)] = grade.value
        data.append(subject_grades)
    return jsonify({'data': data})


@app.route('/api/grades', methods=['PUT'])
@login_required
def grade_update():
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


@app.route('/api/grades', methods=['DELETE'])
@login_required
def grades_delete():
    data = request.get_json()
    for item in data:
        subject_id = item['subject_id']
        student_id = item['student_id']
        stage = item['stage']
        grade = Grade.query.filter_by(subject_id=subject_id, student_id=student_id, stage=stage).first_or_404()
        db.session.delete(grade)
    db.session.commit()
    return jsonify(status="success", data=data) 


@app.route('/api/groups', methods=['GET'])
@login_required
def groups_get():
    groups = db.session.query(Student.group).distinct()
    return jsonify({'data': sorted(groups)})


@app.route('/api/years', methods=['GET'])
@login_required
def years_get():
    years = db.session.query(Student.year).distinct()
    return jsonify({'data': sorted(years)})
