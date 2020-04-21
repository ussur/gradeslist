import os
basedir = os.path.abspath(os.path.dirname(__file__))

class Config(object):
    DEBUG = False
    TESTING = False
    DEV_MODE = os.environ.get('MODE') or False
    LOG_TO_STDOUT = os.environ.get('LOG_TO_STDOUT') or False
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'abvgvYLk_gradeslist7152'

    CURRENT_TERM = os.environ.get('CURRENT_TERM') or 1


class ProductionConfig(Config):
    DATABASE_URI = 'postgres://oycqotmteodpva:6fc411b46a8c759606e13ff755e399a4ea3abed9b5b88e03f3ea0591b7477744@ec2-54-75-229-28.eu-west-1.compute.amazonaws.com:5432/d8gulgkvi1tnq2'


class DevelopmentConfig(Config):
    DEBUG = True