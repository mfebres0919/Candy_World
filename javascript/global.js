/* =========================================================
   Candy World Drinks N' Treats — shared behavior
   ========================================================= */

/* ---------- Navigation ----------
   The hamburger opens the menu panel and Services opens its dropdown
   (click on any screen, hover on desktop). Escape and outside clicks
   close everything, and the header gets a shadow once the page scrolls. */
(function () {
    "use strict";

    var header = document.querySelector(".site-header");

    if (!header) {
        return;
    }

    var toggle = header.querySelector(".nav__toggle");
    var dropItem = header.querySelector(".nav__item--dropdown");
    var dropToggle = header.querySelector(".nav__drop-toggle");
    var desktop = window.matchMedia("(min-width: 1024px)");
    var hoverable = window.matchMedia("(hover: hover)");
    var closeTimer = null;

    function setDropdown(open) {
        if (!dropItem) {
            return;
        }

        clearTimeout(closeTimer);
        dropItem.classList.toggle("is-open", open);
        dropToggle.setAttribute("aria-expanded", String(open));
    }

    function setMenu(open) {
        header.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.querySelector(".visually-hidden").textContent = open ? "Close menu" : "Open menu";

        // Collapse the Services submenu after the menu has faded out,
        // so the card doesn't jump in height while it closes
        if (!open && dropItem && dropItem.classList.contains("is-open")) {
            if (desktop.matches) {
                setDropdown(false);
            } else {
                setTimeout(function () {
                    if (!header.classList.contains("is-open")) {
                        setDropdown(false);
                    }
                }, 650);
            }
        }
    }

    toggle.addEventListener("click", function () {
        setMenu(!header.classList.contains("is-open"));
    });

    if (dropItem) {
        dropToggle.addEventListener("click", function () {
            setDropdown(!dropItem.classList.contains("is-open"));
        });

        dropItem.addEventListener("mouseenter", function () {
            if (desktop.matches && hoverable.matches) {
                setDropdown(true);
            }
        });

        dropItem.addEventListener("mouseleave", function () {
            if (desktop.matches && hoverable.matches) {
                closeTimer = setTimeout(function () {
                    setDropdown(false);
                }, 180);
            }
        });

        // Close the dropdown when keyboard focus leaves it
        dropItem.addEventListener("focusout", function (event) {
            if (!dropItem.contains(event.relatedTarget)) {
                setDropdown(false);
            }
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }

        if (dropItem && dropItem.classList.contains("is-open")) {
            setDropdown(false);
            dropToggle.focus();
        } else if (header.classList.contains("is-open")) {
            setMenu(false);
            toggle.focus();
        }
    });

    document.addEventListener("click", function (event) {
        if (!header.contains(event.target)) {
            setMenu(false);
        }
    });

    // Reset the mobile menu when the screen grows to desktop
    desktop.addEventListener("change", function () {
        setMenu(false);
    });

    var ticking = false;

    function updateScrolled() {
        ticking = false;
        header.classList.toggle("is-scrolled", window.scrollY > 40);
    }

    window.addEventListener("scroll", function () {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(updateScrolled);
        }
    }, { passive: true });

    updateScrolled();
})();

/* ---------- Back to top ----------
   Shows the button once the visitor has scrolled past most of the first screen. */
(function () {
    "use strict";

    var button = document.querySelector(".back-to-top");

    if (!button) {
        return;
    }

    var ticking = false;

    function update() {
        ticking = false;
        button.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.6);
    }

    window.addEventListener("scroll", function () {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });

    update();
})();
