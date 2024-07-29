from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from models import ChatHistory

bp = Blueprint('history', __name__, url_prefix='/history')

@bp.route('/', methods = ['GET'])
@login_required
def get_history():
    histories = ChatHistory.query.filter_by(user_id = current_user.id).all()
    return jsonify([{
        'id': history.id,
        'message': history.response,
        'timestamp': history.timestamp
    } for history in histories])