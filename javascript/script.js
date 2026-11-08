/* =========================================================
   Candy World — homepage only
   ========================================================= */

/* ---------- Featured treats carousel ----------
   The cards sit in a scroll-snap track, so phones can swipe them.
   Every 5 seconds the track glides to the next set: 4 cards on
   desktop, 2 on tablets, 1 on phones. After the last set it goes
   back to the start. It pauses while hovered or focused, while
   off screen, when the pause button is pressed, and it never
   starts on its own for reduced-motion users. */
(function () {
    "use strict";

    var track = document.getElementById("treats-track");

    if (!track) {
        return;
    }

    var section = track.closest(".treats");
    var cards = Array.prototype.slice.call(track.children);
    var dotsWrap = section.querySelector(".treats__dots");
    var prevBtn = section.querySelector("[data-treats='prev']");
    var nextBtn = section.querySelector("[data-treats='next']");
    var pauseBtn = section.querySelector(".treats__pause");
    var pauseLabel = pauseBtn.querySelector(".visually-hidden");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var DELAY = 5000;
    var GLIDE = 1100;
    var glideFrame = null;
    var gliding = false;
    var timer = null;
    var userPaused = reduceMotion;
    var hovered = false;
    var focused = false;
    var onScreen = false;
    var perPage = 1;
    var pageCount = 1;
    var current = 0;
    var dots = [];

    function cardsPerPage() {
        var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        var width = cards[0].getBoundingClientRect().width + gap;
        return Math.max(1, Math.round((track.clientWidth - parseFloat(getComputedStyle(track).paddingLeft) * 2 + gap) / width));
    }

    function buildDots() {
        perPage = cardsPerPage();
        pageCount = Math.ceil(cards.length / perPage);
        dotsWrap.textContent = "";
        dots = [];

        for (var i = 0; i < pageCount; i += 1) {
            var dot = document.createElement("button");
            var first = i * perPage + 1;
            var last = Math.min(cards.length, first + perPage - 1);
            dot.type = "button";
            dot.className = "treats__dot";
            dot.setAttribute("aria-controls", "treats-track");
            dot.innerHTML = '<span class="visually-hidden">Show treats ' + (first === last ? first : first + " to " + last) + "</span>";
            dot.addEventListener("click", goTo.bind(null, i, true));
            dotsWrap.appendChild(dot);
            dots.push(dot);
        }

        markCurrent(pageFromScroll());
    }

    // Left edge of a card measured inside the track
    function cardLeft(index) {
        return cards[index].offsetLeft - parseFloat(getComputedStyle(track).paddingLeft);
    }

    function pageFromScroll() {
        var closest = 0;
        var best = Infinity;

        for (var i = 0; i < pageCount; i += 1) {
            var distance = Math.abs(cardLeft(i * perPage) - track.scrollLeft);

            if (distance < best) {
                best = distance;
                closest = i;
            }
        }

        // At the far right edge, the last set is showing
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) {
            closest = pageCount - 1;
        }

        return closest;
    }

    function markCurrent(page) {
        current = page;
        dots.forEach(function (dot, i) {
            if (i === page) {
                dot.setAttribute("aria-current", "true");
            } else {
                dot.removeAttribute("aria-current");
            }
        });
    }

    // Ease in and out, so each slide starts and lands softly
    function easeInOut(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function stopGlide() {
        cancelAnimationFrame(glideFrame);
        gliding = false;
        track.classList.remove("is-sliding");
    }

    // A slower, smoother glide than the browser's built-in smooth scroll
    function glideTo(left) {
        stopGlide();

        if (reduceMotion) {
            track.scrollLeft = left;
            return;
        }

        var start = track.scrollLeft;
        var distance = left - start;
        var startTime = null;

        gliding = true;
        track.classList.add("is-sliding");

        function step(now) {
            if (startTime === null) {
                startTime = now;
            }

            var progress = Math.min(1, (now - startTime) / GLIDE);
            track.scrollLeft = start + distance * easeInOut(progress);

            if (progress < 1) {
                glideFrame = requestAnimationFrame(step);
            } else {
                stopGlide();
            }
        }

        glideFrame = requestAnimationFrame(step);
    }

    function goTo(page, fromUser) {
        var target = (page + pageCount) % pageCount;
        glideTo(cardLeft(target * perPage));
        markCurrent(target);

        // A manual move restarts the 3-second clock
        if (fromUser) {
            restart();
        }
    }

    function shouldRun() {
        return !userPaused && !hovered && !focused && onScreen && !document.hidden;
    }

    function stop() {
        clearInterval(timer);
        timer = null;
    }

    function restart() {
        stop();

        if (shouldRun()) {
            timer = setInterval(function () {
                goTo(current + 1, false);
            }, DELAY);
        }
    }

    function setPaused(paused) {
        userPaused = paused;
        pauseBtn.setAttribute("aria-pressed", String(paused));
        pauseLabel.textContent = paused ? "Play the treat slideshow" : "Pause the treat slideshow";
        restart();
    }

    prevBtn.addEventListener("click", function () {
        goTo(current - 1, true);
    });

    nextBtn.addEventListener("click", function () {
        goTo(current + 1, true);
    });

    pauseBtn.addEventListener("click", function () {
        setPaused(!userPaused);
    });

    track.addEventListener("mouseenter", function () {
        hovered = true;
        restart();
    });

    track.addEventListener("mouseleave", function () {
        hovered = false;
        restart();
    });

    track.addEventListener("focusin", function () {
        focused = true;
        restart();
    });

    track.addEventListener("focusout", function (event) {
        if (!track.contains(event.relatedTarget)) {
            focused = false;
            restart();
        }
    });

    // Swiping counts as a manual move, and takes over from any glide
    track.addEventListener("touchstart", function () {
        stopGlide();
        stop();
    }, { passive: true });
    track.addEventListener("touchend", restart, { passive: true });

    // Keep the dots in sync while swiping or scrolling
    var scrollTick = false;

    track.addEventListener("scroll", function () {
        // During a glide the target dot is already marked
        if (!scrollTick && !gliding) {
            scrollTick = true;
            requestAnimationFrame(function () {
                scrollTick = false;
                markCurrent(pageFromScroll());
            });
        }
    }, { passive: true });

    document.addEventListener("visibilitychange", restart);

    if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
            onScreen = entries[0].isIntersecting;
            restart();
        }, { threshold: 0.3 }).observe(track);
    } else {
        onScreen = true;
    }

    // Rebuild the dots when the number of cards per set changes
    var resizeTimer = null;

    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (cardsPerPage() !== perPage) {
                buildDots();
                goTo(current, false);
            }
        }, 150);
    });

    buildDots();

    if (reduceMotion) {
        setPaused(true);
    } else {
        restart();
    }
})();

/* ---------- About tabs ----------
   Our Story / Our Mission / The Truck. Click or use the arrow keys,
   Home and End, following the standard ARIA tabs pattern. */
(function () {
    "use strict";

    var tablist = document.querySelector(".about__tabs");

    if (!tablist) {
        return;
    }

    var tabs = Array.prototype.slice.call(tablist.querySelectorAll("[role='tab']"));

    function select(tab, moveFocus) {
        tabs.forEach(function (other) {
            var selected = other === tab;
            other.setAttribute("aria-selected", String(selected));
            other.tabIndex = selected ? 0 : -1;
            document.getElementById(other.getAttribute("aria-controls")).hidden = !selected;
        });

        if (moveFocus) {
            tab.focus();
        }
    }

    tabs.forEach(function (tab, index) {
        tab.addEventListener("click", function () {
            select(tab, false);
        });

        tab.addEventListener("keydown", function (event) {
            var next = null;

            if (event.key === "ArrowRight") {
                next = tabs[(index + 1) % tabs.length];
            } else if (event.key === "ArrowLeft") {
                next = tabs[(index - 1 + tabs.length) % tabs.length];
            } else if (event.key === "Home") {
                next = tabs[0];
            } else if (event.key === "End") {
                next = tabs[tabs.length - 1];
            }

            if (next) {
                event.preventDefault();
                select(next, true);
            }
        });
    });
})();
