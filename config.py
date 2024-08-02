import os
import urllib
 
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or "Random-secret-key"
   
    params = urllib.parse.quote_plus(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=PS-IN-LT-22307\\SQLEXPRESS;"
        "DATABASE=Omnichat;"
        "Trusted_Connection=yes;"
        "TrustServerCertificate=yes;"
    )
   
    SQLALCHEMY_DATABASE_URI = "sqlite:///app.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False