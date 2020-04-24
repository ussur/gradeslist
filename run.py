from app import app, db
from models import User, Student, Subject, Grade, Role, UserRoles


@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'User': User, 'Student': Student, 'Subject': Subject, 'Grade': Grade, 'Role': Role, 'UserRoles': UserRoles}


if __name__ == '__main__':
    app.run()