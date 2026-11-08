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

/* ---------- Footer year ---------- */
(function () {
    "use strict";

    var year = document.querySelector(".footer__year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }
})();

/* ---------- Scroll reveals ----------
   1. Headings marked data-split are broken into letters (screen
      readers still get the whole text from an aria-label).
   2. Anything with data-reveal or data-split fades in when it scrolls
      into view, once. The hero reveals right away on load.
   3. When a fade finishes, the attribute is removed so the element
      gets its normal hover transitions back. */
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function splitNode(node, counter) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
            if (child.nodeType === 3) {
                var parts = child.textContent.split(/(\s+)/);
                var frag = document.createDocumentFragment();

                parts.forEach(function (part) {
                    if (!part) {
                        return;
                    }

                    if (/^\s+$/.test(part)) {
                        frag.appendChild(document.createTextNode(" "));
                        return;
                    }

                    var word = document.createElement("span");
                    word.className = "split-word";

                    Array.prototype.forEach.call(part, function (letter) {
                        var ch = document.createElement("span");
                        ch.className = "split-char";
                        ch.style.setProperty("--char-index", counter.i);
                        counter.i += 1;
                        ch.textContent = letter;
                        word.appendChild(ch);
                    });

                    frag.appendChild(word);
                });

                child.parentNode.replaceChild(frag, child);
            } else if (child.nodeType === 1 && !child.classList.contains("about__title-chip")) {
                splitNode(child, counter);
            }
        });
    }

    var splits = document.querySelectorAll("[data-split]");

    splits.forEach(function (el) {
        var full = el.textContent.replace(/\s+/g, " ").trim();
        var decorative = el.getAttribute("aria-hidden") === "true";

        splitNode(el, { i: 0 });

        // Screen readers hear the heading as one phrase, not letters
        if (!decorative) {
            el.setAttribute("aria-label", full);
            Array.prototype.forEach.call(el.querySelectorAll(".split-word"), function (w) {
                w.setAttribute("aria-hidden", "true");
            });
        }
    });

    var items = document.querySelectorAll("[data-reveal], [data-split]");

    function finish(el) {
        el.addEventListener("transitionend", function done(event) {
            if (event.target === el && event.propertyName === "filter") {
                el.removeAttribute("data-reveal");
                el.removeAttribute("data-reveal-delay");
                el.removeEventListener("transitionend", done);
            }
        });
    }

    function reveal(el) {
        el.classList.add("is-revealed");

        if (el.hasAttribute("data-reveal")) {
            finish(el);
        }
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
        items.forEach(reveal);
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                reveal(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });

    // At the very bottom of the page, show anything that never got far
    // enough up the screen to trigger (like the footer's last row)
    window.addEventListener("scroll", function atBottom() {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
            items.forEach(function (el) {
                if (!el.classList.contains("is-revealed")) {
                    reveal(el);
                    observer.unobserve(el);
                }
            });
            window.removeEventListener("scroll", atBottom);
        }
    }, { passive: true });

    items.forEach(function (el) {
        // The hero plays on load instead of waiting for a scroll
        if (el.closest(".hero")) {
            requestAnimationFrame(function () {
                reveal(el);
            });
        } else {
            observer.observe(el);
        }
    });
})();
