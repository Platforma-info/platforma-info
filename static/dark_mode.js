document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("dark-mode-toggle");

    // Schimbă tema și salvează preferința în localStorage
    toggle.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark");
        toggle.textContent = isDark ? "🌞" : "🌙";
        fetch("/toggle-dark-mode", { method: "POST" });
    });
});
document.getElementById('dark-mode-toggle').addEventListener('click', () => {
    fetch('/toggle-dark-mode', {
        method: 'POST',
    })
    .then(() => {
        // Reîncarcă pagina pentru a aplica tema schimbată
        window.location.reload();
    })
    .catch((error) => console.error('Eroare la comutarea temei:', error));
});
