from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key'
# Configurare baze de date
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'  # Baza de date pentru utilizatori
app.config['SQLALCHEMY_BINDS'] = {
    'problems': 'sqlite:///problems.db'  # Baza de date pentru probleme
}
db = SQLAlchemy(app)

# Model pentru utilizatori
class User(db.Model):
    __tablename__ = 'users' 
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)

# Model pentru probleme (în baza de date separată)
class Problem(db.Model):
    __bind_key__ = 'problems'  # Specifică legătura pentru această clasă
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(255))  # Enuntul
    input_data = db.Column(db.String(255))   # Input
    output_data = db.Column(db.String(255))  # Output

# Model pentru soluții (în baza de date pentru probleme)
class Submission(db.Model):
    __bind_key__ = 'problems'  # set table name
    id = db.Column(db.Integer, primary_key=True) # id-ul soluției
    problem_id = db.Column(db.Integer, db.ForeignKey('problem.id'), nullable=False) # id-ul problemei
    source_code = db.Column(db.Text, nullable=False) # codul sursă al soluției
# Rute pentru aplicație
@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    problems = Problem.query.all()
    return render_template('index.html', problems=problems)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user is None:
            flash('Userul nu exista, fa-ti cont acum!', 'danger')
            return redirect(url_for('register'))
        elif user.password != password:
            flash('Parola gresita!', 'danger')
            return redirect(url_for('login'))
        session['user_id'] = user.id
        flash('Te-ai autentificat cu succes!', 'success')
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        # Verifică dacă utilizatorul există deja
        if User.query.filter_by(username=username).first():
            flash('Numele de utilizator este deja folosit!', 'danger')
            return redirect(url_for('register'))
        
        new_user = User(username=username, password=password)
        db.session.add(new_user)
        db.session.commit()
        flash('Cont creat cu succes!', 'success')
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/problem/<int:problem_id>', methods=['GET', 'POST'])
def problem(problem_id):
    problem = Problem.query.get(problem_id)
    if request.method == 'POST':
        source_code = request.form['source_code']
        new_submission = Submission(problem_id=problem.id, source_code=source_code)
        db.session.add(new_submission)
        db.session.commit()
        flash('Soluția a fost trimisă cu succes!', 'success')
        return redirect(url_for('index'))
    return render_template('problem.html', problem=problem)

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('Te-ai deconectat cu succes!', 'success')
    return redirect(url_for('login'))

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    with app.app_context():
        db.create_all()  # Crează tabelele pentru utilizatori și probleme
    # app.run(debug=True)
    app.run(host="0.0.0.0", port=port)
#my branch is here