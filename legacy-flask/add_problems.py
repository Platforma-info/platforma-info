from app import app, db, Problem # Importă aplicația, baza de date și modelul Problem

# Adaugă problemele
problems = [
    Problem(description="Scrieți un program care citește un nume și afișează numele inversat.", input_data="Ana", output_data="anA"),
    Problem(description="Scrieți un program care calculează suma a două numere.", input_data="5, 7", output_data="12"),
    Problem(description="Scrieți un program care verifică dacă un număr este par sau impar.", input_data="4", output_data="par"),
    Problem(description="Scrieți un program care calculează suma cifrelor unui număr întreg dat.", input_data="123", output_data="6"),
    Problem(description="Scrieți un program care calculează factorialul unui număr întreg dat.", input_data="5", output_data="120"),
    Problem(description="Scrieți un program care verifică dacă un cuvânt dat este palindrom.", input_data="radar", output_data="Palindrom"),
    Problem(description="Scrieți un program care găsește cel mai mare număr dintr-o listă de numere.", input_data="3, 5, 1, 7", output_data="7"),
    Problem(description="Scrieți un program care inversează o listă de numere.", input_data="1, 2, 3", output_data="3, 2, 1"),
    Problem(description="Scrieți un program care verifică dacă un număr este prim.", input_data="13", output_data="Prim"),
    Problem(description="Scrieți un program care calculează media aritmetică a unei liste de numere.", input_data="4, 8, 6", output_data="6"),
    Problem(description="Scrieți un program care convertește grade Celsius în grade Fahrenheit.", input_data="0", output_data="32"),
    Problem(description="Scrieți un program care numără vocalele dintr-un text dat.", input_data="Hello World", output_data="3"),
    Problem(description="Scrieți un program care calculează suma numerelor impare dintr-o listă.", input_data="1, 2, 3, 4, 5", output_data="9"),
    Problem(description="Scrieți un program care află cea mai frecventă literă dintr-un text.", input_data="abracadabra", output_data="a"),
]

# Salvează problemele în baza de date
with app.app_context():  # Folosește contextul aplicației pentru a adăuga problemele
    db.session.query(Problem).delete()  # Șterge toate problemele existente
    db.session.commit()  # Comite ștergerea
    
    for problem in problems:
        db.session.add(problem)  # Adaugă fiecare problemă
    db.session.commit()  # Comite sesiunile pentru a salva modificările

    print("Problemele au fost rescrise cu succes!")
