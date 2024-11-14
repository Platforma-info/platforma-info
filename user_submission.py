# Problema 1: Inversarea unui nume
def main():
    # Citește numele de la utilizator
    name = input("Introdu numele: ")

    # Inversăm numele
    reversed_name = name[::-1]

    # Afișăm rezultatul
    print("Numele inversat este:", reversed_name)

# Apelăm funcția principală
if __name__ == "__main__":
    main()
