document.addEventListener("DOMContentLoaded", function () {
    const loader = document.getElementById("loader");
    if (loader) {
        setTimeout(function() {
            loader.style.opacity = "0"; // Inițiază fade out-ul
        }, 500); // După 1.5 secunde începe fade-out-ul

        // După ce fade-ul s-a terminat, ascunde complet loader-ul
        setTimeout(function() {
            loader.style.display = "none"; // Ascunde loader-ul după fade
        }, 1000); // După 2.5 secunde (timpul complet pentru fade-out)
    }
});
