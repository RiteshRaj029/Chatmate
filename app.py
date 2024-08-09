from flask import Flask, session
from config import Config
from flask_migrate import Migrate
from extensions import db, login_manager 
from routes.auth import bp as auth_bp
from routes.chat import bp as chat_bp
from routes.history import bp as history_bp
from models.user import User

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
migrate = Migrate(app, db)
login_manager.login_view = 'auth.login'
login_manager.init_app(app)

# @app.before_first_request
# def create_tables():
#     db.create_all()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

app.register_blueprint(auth_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(history_bp)

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
