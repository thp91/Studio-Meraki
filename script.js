// ── Hero video autoplay fallback (Safari) ────────────────────
const heroVideo = document.querySelector(".hero-video");
if (heroVideo) {
  heroVideo.muted = true;
  heroVideo.setAttribute("playsinline", "");
  heroVideo.setAttribute("webkit-playsinline", "");

  const tryPlay = () => heroVideo.play().catch(() => {});
  tryPlay();
  heroVideo.addEventListener("canplay", tryPlay, { once: true });

  const playOnInteraction = () => {
    heroVideo.play().catch(() => {});
    document.removeEventListener("click", playOnInteraction);
    document.removeEventListener("touchstart", playOnInteraction);
    document.removeEventListener("keydown", playOnInteraction);
    document.removeEventListener("scroll", playOnInteraction);
  };

  document.addEventListener("click", playOnInteraction, { passive: true });
  document.addEventListener("touchstart", playOnInteraction, { passive: true });
  document.addEventListener("keydown", playOnInteraction, { passive: true });
  document.addEventListener("scroll", playOnInteraction, { passive: true });
}

// ── Lenis smooth scroll ───────────────────────────────────────
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// ── Ancres nav → scroll Lenis ────────────────────────────────
const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const revealItems = document.querySelectorAll(".reveal");
const reservationForm = document.querySelector("[data-reservation-form]");
const guardianField = document.querySelector("[data-guardian-field]");
const participantOptions = document.querySelectorAll("[data-participant-option]");
const formConfirmation = document.querySelector("[data-form-confirmation]");

const syncHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", (e) => {
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");

    const href = link.getAttribute("href");
    const target = href && href.startsWith("#") ? document.querySelector(href) : null;
    if (target) {
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80 });
    }
  });
});

// ── Reveal on scroll ─────────────────────────────────────────
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item) => observer.observe(item));

// ── Rendu dynamique depuis courses.json ──────────────────────
const TEACHERS = { laura: "Laura", presci: "Préscilla", both: "Laura & Préscilla" };
const DAY_SHORT = { Lundi: "Lun", Mardi: "Mar", Mercredi: "Mer", Jeudi: "Jeu", Vendredi: "Ven", Samedi: "Sam" };

function slotDisplayLabel(reservationValue) {
  const m = reservationValue.match(/^(\w+) - (.+) - (\d{2}:\d{2})$/);
  if (!m) return reservationValue;
  return `${DAY_SHORT[m[1]] || m[1]} · ${m[2]} · ${m[3]}`;
}

function renderPlanning(slots) {
  const grid = document.getElementById("planning-grid");
  if (!grid) return;

  const byDay = new Map();
  slots.forEach((s) => {
    if (!byDay.has(s.day)) byDay.set(s.day, { order: s.dayOrder, slots: [] });
    byDay.get(s.day).slots.push(s);
  });

  const sorted = [...byDay.entries()].sort((a, b) => a[1].order - b[1].order);

  grid.innerHTML = sorted
    .map(([day, { slots: ds }]) => {
      const classes = ds
        .map((s) => {
          const label = s.label || s.discipline.replace(/ \(.*\)$/, "");
          const teacher = TEACHERS[s.teacher] || s.teacher;
          return (
            `<div class="class ${s.cssClass}${s.isFull ? " is-full" : ""}" data-slot-id="${s.id}">` +
            `<strong>${label}</strong><small>${s.level}</small>` +
            `<span>${s.timeStart} - ${s.timeEnd}</span>` +
            `<em class="teacher-tag ${s.teacher}">${teacher}</em>` +
            (s.isFull ? '<span class="full-badge">Complet</span>' : "") +
            `</div>`
          );
        })
        .join("");
      return `<div class="day"><h3>${day}</h3>${classes}</div>`;
    })
    .join("");
}

function renderSlots(slots, disciplineOrder) {
  const discBox = document.getElementById("discipline-checkboxes-container");
  const slotsBox = document.getElementById("slots-container");
  if (!discBox && !slotsBox) return;

  const reservable = slots.filter((s) => s.inReservation && s.reservationGroup);
  const byGroup = {};
  reservable.forEach((s) => {
    (byGroup[s.reservationGroup] ||= []).push(s);
  });
  const orderedGroups = disciplineOrder.filter((d) => byGroup[d]);

  if (discBox) {
    discBox.innerHTML = orderedGroups
      .map(
        (g) =>
          `<label class="checkbox-option"><input type="checkbox" name="disciplines" value="${g}"><span>${g}</span></label>`
      )
      .join("");
  }

  if (slotsBox) {
    slotsBox.innerHTML = orderedGroups
      .map((g) => {
        const groupLabel = g.replace(/ \(.*\)$/, "");
        const items = byGroup[g]
          .map(
            (s) =>
              `<label class="checkbox-option${s.isFull ? " checkbox-option--full" : ""}">` +
              `<input type="checkbox" name="slots" value="${s.reservationValue}"${s.isFull ? " disabled" : ""}>` +
              `<span>${slotDisplayLabel(s.reservationValue)}${s.isFull ? " <em>· Complet</em>" : ""}</span>` +
              `</label>`
          )
          .join("");
        return (
          `<div class="slot-group" data-slot-group="${g}" style="display:none">` +
          `<p class="slot-group-label">${groupLabel}</p>` +
          `<div class="discipline-checkboxes">${items}</div>` +
          `</div>`
        );
      })
      .join("");
  }

  bindSyncSlots();
}

function bindSyncSlots() {
  const slotsEmptyHint = document.getElementById("slots-empty-hint");
  const disciplineCheckboxes = document.querySelectorAll('[name="disciplines"]');
  const slotGroups = document.querySelectorAll("[data-slot-group]");

  const syncSlots = () => {
    const selected = new Set(
      [...disciplineCheckboxes].filter((cb) => cb.checked).map((cb) => cb.value)
    );
    let anyVisible = false;
    slotGroups.forEach((group) => {
      const visible = selected.has(group.dataset.slotGroup);
      group.style.display = visible ? "flex" : "none";
      if (!visible) {
        group.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
          cb.checked = false;
        });
      }
      if (visible) anyVisible = true;
    });
    if (slotsEmptyHint) slotsEmptyHint.style.display = anyVisible ? "none" : "";
  };

  disciplineCheckboxes.forEach((cb) => cb.addEventListener("change", syncSlots));
  syncSlots();
}

async function loadCourses() {
  const grid = document.getElementById("planning-grid");
  const slotsBox = document.getElementById("slots-container");
  if (!grid && !slotsBox) return;

  try {
    const res = await fetch("/data/courses.json");
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    renderPlanning(data.slots);
    renderSlots(data.slots, data.disciplineOrder || []);
  } catch {
    if (grid) grid.innerHTML = "<p style='padding:1rem;opacity:.5'>Planning temporairement indisponible.</p>";
  }
}

loadCourses();

// ── Formulaire réservation ───────────────────────────────────
const syncGuardianField = () => {
  if (!guardianField) return;
  const selected = document.querySelector("[data-participant-option]:checked");
  const needsGuardian = selected && selected.value !== "adulte";
  guardianField.classList.toggle("is-hidden", !needsGuardian);
  guardianField.querySelector("input").required = needsGuardian;
};

participantOptions.forEach((option) => {
  option.addEventListener("change", syncGuardianField);
});

syncGuardianField();

// ── Soumission formulaire contact ────────────────────────────
const contactForm = document.querySelector("[data-contact-form]");
const contactConfirmation = document.querySelector("[data-contact-confirmation]");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector("[type=submit]");
    btn.disabled = true;
    btn.textContent = "Envoi…";
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: new FormData(contactForm),
      });
      const json = await res.json();
      if (json.success) {
        contactConfirmation.textContent = "✓ Message envoyé ! Nous vous répondrons très vite.";
        contactConfirmation.style.color = "#4caf82";
        contactForm.reset();
      } else {
        contactConfirmation.textContent = "Une erreur est survenue. Merci de réessayer ou d'écrire directement à mail.studiomeraki@gmail.com";
        contactConfirmation.style.color = "#e57373";
      }
    } catch {
      contactConfirmation.textContent = "Une erreur est survenue. Merci de réessayer.";
      contactConfirmation.style.color = "#e57373";
    }
    btn.disabled = false;
    btn.textContent = "Envoyer";
  });
}

// ── Soumission formulaire réservation ────────────────────────
if (reservationForm) {
  reservationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = reservationForm.querySelector("[type=submit]");
    btn.disabled = true;
    btn.textContent = "Envoi…";
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: new FormData(reservationForm),
      });
      const json = await res.json();
      if (json.success) {
        formConfirmation.textContent = "✓ Demande envoyée ! Nous vous recontactons rapidement pour confirmer.";
        formConfirmation.style.color = "#4caf82";
        reservationForm.reset();
        syncGuardianField();
      } else {
        formConfirmation.textContent = "Une erreur est survenue. Merci de réessayer ou d'écrire à mail.studiomeraki@gmail.com";
        formConfirmation.style.color = "#e57373";
      }
    } catch {
      formConfirmation.textContent = "Une erreur est survenue. Merci de réessayer.";
      formConfirmation.style.color = "#e57373";
    }
    btn.disabled = false;
    btn.textContent = "Envoyer la demande";
  });
}
