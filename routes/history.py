from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models import ChatHistory

bp = Blueprint('history', __name__, url_prefix='/history')
@login_required
def get_history():
    histories = ChatHistory.query.filter_by(user_id = current_user.id).all()
    return jsonify([{
        'id': history.id,
        'message': history.message,
        'response': history.response,
        'timestamp': history.timestamp
    } for history in histories])