import os
basedir = os.path.abspath(os.path.dirname(__file__))

class Config(object):
    DEBUG = False
    TESTING = False
    DEV_MODE = os.environ.get('MODE') or False
    LOG_TO_STDOUT = os.environ.get('LOG_TO_STDOUT') or False
    
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'db/app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'abvgvYLk_gradeslist7152'
    
    CURRENT_TERM = 1