// ── Hero video autoplay fallback (Safari) ────────────────────
const heroVideo = document.querySelector(".hero-video");
if (heroVideo) {
  heroVideo.muted = true;
  heroVideo.setAttribute("playsinline", "");
  heroVideo.setAttribute("webkit-playsinline", "");

  const tryPlay = () => heroVideo.play().catch(() => {});

  // Tentative immédiate
  tryPlay();

  // Dès que la vidéo est prête
  heroVideo.addEventListener("canplay", tryPlay, { once: true });

  // Fallback : premier geste de l'utilisateur sur la page
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

// ── Créneaux dynamiques (filtrage par discipline) ────────────
const slotsSection = document.getElementById("slots-section");
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
