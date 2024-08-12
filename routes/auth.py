from flask import Blueprint, render_template, redirect, url_for, flash, request,session
from flask_login import login_user, login_required, logout_user, current_user
from forms.auth_forms import LoginForm, SignupForm
from models.user import User
from models import db, User
from extensions import db

bp = Blueprint('auth', __name__)

@bp.route('/login', methods=['GET', 'POST'])
def login():
    # form = LoginForm()
    # if form.validate_on_submit():
    #     user = User.query.filter_by(email = form.email.data).first()
    #     if user is None or not user.check_password(form.password.data):
    #         flash('Invalid email or password')
    #         return redirect(url_for('auth.login'))
    #     login_user(user, remember=form.remember_me.data)
    #     return redirect(url_for('chat.index'))
    # return render_template('login1.html', form = form)

    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        if not email or not password:
            flash('Please fill out both fields')
            return redirect(url_for('auth.login'))

        user = User.query.filter_by(email=email).first()

        if user is None or not user.check_password(password):
            flash('Invalid email or password')
            return redirect(url_for('auth.login'))

        login_user(user)
        
        flash('Login successful!')
        return redirect(url_for('chat.chat'))  # Redirect to the chat page after successful login

    return render_template('login1.html')

@bp.route('/signup', methods=['GET', 'POST'])
def signup():
    # form = SignupForm()
    # if form.validate_on_submit():
    #     user = User(
    #         name = form.name.data,
    #         email = form.email.data,
    #         phone_number = form.phone_number.data
    #     )

    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        mobile = request.form.get('mobile')
        password = request.form.get('password')

        if not name or not email or not mobile or not password:
            flash('Please fill out all fields')
            return redirect(url_for('auth.signup'))

        existing_user = User.query.filter((User.email == email) | (User.mobile == mobile)).first()
        if existing_user:
            flash('User with this email or mobile number already exists')
            return redirect(url_for('auth.signup'))

        new_user = User(name=name, email=email, mobile=mobile)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        flash('User Signed Up')
        return redirect(url_for('auth.login'))
    return render_template('Register.html')

@bp.route('/logout')
@login_required
def logout():
    logout_user()
    session.clear()
    return redirect(url_for('auth.login'))