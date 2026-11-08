/* Runs in <head> before the page paints: marks that JavaScript is on,
   so the fade-ins can start hidden without a flash of content. */
document.documentElement.classList.add("js");
