from datetime import datetime
from extensions import db

class ChatHistory(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable = False)
    message = db.Column(db.Text, nullable = False)
    response = db.Column(db.Text, nullable = False)
    image = db.Column(db.Text, nullable = True) #base64 image
    timestamp = db.Column(db.DateTime, index = True, default = datetime.utcnow)
