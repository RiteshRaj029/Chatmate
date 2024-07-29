from flask import Flask
from config import Config
from models import db
from flask_migrate import Migrate
from flask_login import LoginManager
from routes.auth import bp as auth_bp
from routes.chat import bp as chat_bp
from routes.history import bp as history_bp



app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
migrate = Migrate(app, db)
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.init_app(app)


from models.user import User

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

app.register_blueprint(auth_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(history_bp)


if __name__ == '__main__':
    app.run(debug=True)