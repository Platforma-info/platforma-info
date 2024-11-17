document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById("loader");
    const mainContent = document.getElementById("main-content");

    // Simulează un timeout pentru loader
    setTimeout(() => {
        loader.style.display = "none"; // Ascunde loader-ul
        mainContent.style.visibility = "visible"; // Arată conținutul principal
    }, 500); // Schimbă durata dacă e nevoie
});
