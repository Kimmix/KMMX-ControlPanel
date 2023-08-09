// Fading FavIcon
const favicon = document.querySelector('link[rel="icon"]')
document.addEventListener("visibilitychange", () => {
    const hidden = document.hidden
    favicon.setAttribute("href", `/favicon${hidden ? "-hidden" : ""}.png`)
})