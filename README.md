# Platformă de Codare

Această platformă de codare permite utilizatorilor să rezolve probleme de programare și să își trimită soluțiile. Aplicația este construită folosind Flask și utilizează o bază de date SQLite pentru a gestiona utilizatorii și problemele de programare.

https://platformainfo.koyeb.app/
## Funcționalități

1. **Autentificare și Înregistrare**:
   - Utilizatorii pot să își creeze un cont prin intermediul paginii de înregistrare.
   - La autentificare, aplicația verifică dacă numele de utilizator și parola sunt corecte. Dacă utilizatorul există deja, se va afișa un mesaj corespunzător.

2. **Vizualizarea Problemelor**:
   - După autentificare, utilizatorii sunt redirecționați către pagina principală, unde pot vedea o listă cu problemele de programare disponibile.
   - Fiecare problemă are un enunț, un input așteptat și un output așteptat.

3. **Trimiterea Soluțiilor**:
   - Utilizatorii pot accesa o pagină dedicată fiecărei probleme, unde pot citi enunțul și pot introduce soluția lor într-un formular.
   - Odată ce soluția este trimisă, aplicația o salvează în baza de date pentru a putea fi evaluată ulterior.

4. **Deconectare**:
   - Utilizatorii pot ieși din contul lor oricând prin intermediul butonului de deconectare, fiind redirecționați către pagina de autentificare.

## Structura Aplicației

- **app.py**: Fișierul principal al aplicației, care conține toate rutele și logica aplicației.
- **models.py**: Definește modelele pentru utilizatori, probleme și trimiterea soluțiilor (acesta poate fi inclus în `app.py`).
- **templates/**: Director care conține fișierele HTML pentru interfața utilizator.
- **static/**: Director care conține fișierele CSS pentru stilizarea aplicației.

## Baze de Date

Aplicația folosește două baze de date:
1. **users.db**: Baza de date pentru gestionarea utilizatorilor.
2. **problems.db**: Baza de date pentru stocarea problemelor de programare.

Fiecare bază de date este gestionată separat prin SQLAlchemy.

## Cum Funcționează

1. La deschiderea aplicației, utilizatorii sunt redirecționați către pagina de login.
2. Utilizatorii se pot înregistra sau se pot autentifica.
3. Odată autentificați, pot vizualiza problemele disponibile și pot trimite soluții pentru acestea.
4. Aplicația va verifica și salva soluțiile trimise.

## Concluzie

Această platformă de codare este un exemplu simplu de gestionare a utilizatorilor și problemelor prin intermediul Flask și SQLAlchemy. Este o bază bună pentru dezvoltarea ulterioară a unei aplicații mai complexe, care ar putea include evaluarea automată a soluțiilor trimise sau funcționalități suplimentare pentru utilizatori.
