from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
import os
import subprocess
import time
import locale

app = Flask(__name__)
app.secret_key = 'your_secret_key'
# Configurare baze de date
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'  # Baza de date pentru utilizatori
app.config['SQLALCHEMY_BINDS'] = {
    'problems': 'sqlite:///problems.db'  # Baza de date pentru probleme
}
db = SQLAlchemy(app)
locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
# Model pentru utilizatori
class User(db.Model):
    __tablename__ = 'users' 
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
class Problem(db.Model):
    __tablename__ = 'problem'
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(255))
    input_data = db.Column(db.String(255))
    output_data = db.Column(db.String(255))

# Modelul pentru Submission
class Submission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    problem_id = db.Column(db.Integer, db.ForeignKey('problem.id'), nullable=False)
    source_code = db.Column(db.Text, nullable=False)
    result = db.Column(db.String(255))
    problem = db.relationship('Problem', backref=db.backref('submissions', lazy=True))

# Rute pentru aplicație
@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    problems = Problem.query.all()
    print(problems)  # Verifică dacă problemele sunt încărcate corect
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
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('Te-ai deconectat cu succes!', 'success')
    return redirect(url_for('login'))
def evaluate_code(user_code, expected_output):
    file_name = "user_submission.py"
    try:
        # Creăm un fișier temporar pentru codul utilizatorului
        with open(file_name, "w", encoding="utf-8") as f:
            f.write(user_code)
        
        # Rulăm codul utilizatorului folosind subprocess și captăm rezultatul
        result = subprocess.run(
            ["python3", file_name],
            capture_output=True,
            text=True,
            timeout=5  # Timeout pentru execuție
        )
        
        # Verificăm dacă rezultatul coincide cu rezultatul așteptat
        if result.stdout.strip() == expected_output.strip():
            return "Corect! Răspunsul este exact."
        else:
            return f"Greșit! Ai obținut '{result.stdout.strip()}', dar se aștepta '{expected_output}'."

    except subprocess.TimeoutExpired:
        return "Codul tău a rulat prea mult timp și a fost oprit."
    except Exception as e:
        return f"Eroare în rularea codului: {e}"
    finally:
        # Ștergem fișierul temporar
        if os.path.exists(file_name):
            os.remove(file_name)

# Funcția care procesează trimiterea unei soluții
@app.route('/problem/<int:problem_id>', methods=['GET', 'POST'])
def problem(problem_id):
    problem = Problem.query.get(problem_id)
    result = ""
    if request.method == 'POST':
        source_code = request.form['source_code']
        
        if not source_code.strip():
            flash('Soluția nu poate fi goală!', 'error')
            return redirect(url_for('problem', problem_id=problem_id))
        
        result = evaluate_code(source_code, problem.output_data)  # Execută evaluarea

        new_submission = Submission(problem_id=problem.id, source_code=source_code, result=result)
        db.session.add(new_submission)
        db.session.commit()
        
        flash(result, 'info')  # Afișează rezultatul ca mesaj flash
    
    return render_template('problem.html', problem=problem, result=result)
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    with app.app_context():
        db.create_all()  # Crează tabelele pentru utilizatori și probleme
    # app.run(debug=True)
    app.run(host="0.0.0.0", port=port)

#my branch is here