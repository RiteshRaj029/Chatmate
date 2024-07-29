import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or "Random-secret-key"
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///app.db'
    SQlALCHEMY_TRACK_MODIFICATIONS = False