from app import db, User  # Asigură-te că importi corect baza de date și modelul User
from flask import Flask

# Inițializarea contextului aplicației
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
db.init_app(app)

with app.app_context():
    # Golește tabela de utilizatori
    db.session.query(User).delete()
    
    # Adaugă utilizatorul test cu parola test
    test_user = User(username="test", password="test")
    db.session.add(test_user)
    db.session.commit()

    print("Baza de date a fost resetată. A fost adăugat utilizatorul: test cu parola: test")
