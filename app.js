/* =========================================================
   Caisses d'Obus — calcul des charges excédentaires
   Tout tourne dans le téléphone, sans serveur.

   Règle :
     total obus            = caisses × 6
     excédent par obus     = 6 − charge demandée
     charges excédentaires = total obus × (6 − charge demandée)
     charges conservées    = total obus × charge demandée
   ========================================================= */
(function () {
  "use strict";

  const OBUS_PAR_CAISSE = 6;    // fixe
  const CHARGES_PAR_OBUS = 6;   // jauge fixe
  const CAISSES_MAX = 999;
  const CLE_STOCKAGE = "caisses-obus:v2";

  const etatDefaut = () => ({ caisses: 0, niveau: 1, p1: 0, p2: 0 });
  let etat = charger();
  let sauvegardeAvantReinit = null;

  const $ = (id) => document.getElementById(id);
  const el = {
    caisses: $("caisses"),
    plus: $("plus"),
    moins: $("moins"),
    niveaux: $("niveaux"),
    jauge: $("jauge").children,
    total: $("total"),
    detailTotal: $("detail-total"),
    niveauAffiche: $("niveau-affiche"),
    detailNiveau: $("detail-niveau"),
    excedent: $("points"),
    detailExcedent: $("detail-points"),
    detailConserve: $("detail-conserve"),
    reinit: $("reinit"),
    toast: $("toast"),
    annuler: $("annuler"),
    etat: $("etat-hors-ligne"),
    p1: $("p1"),
    p2: $("p2"),
    compteP1: $("compte-p1"),
    compteP2: $("compte-p2"),
    annulerP1: $("annuler-p1"),
    annulerP2: $("annuler-p2"),
    reste: $("reste"),
    resteBloc: $("reste-bloc"),
    resteUnite: $("reste-unite"),
    bilan: $("bilan"),
    bilanP1: $("bilan-p1"),
    bilanP2: $("bilan-p2"),
    bilanExcedent: $("bilan-excedent"),
  };

  /* ---------- Calcul ---------- */
  function calculer(e) {
    const totalObus = e.caisses * OBUS_PAR_CAISSE;
    const excedentParObus = CHARGES_PAR_OBUS - e.niveau;
    return {
      totalObus,
      excedentParObus,
      excedent: totalObus * excedentParObus,
      conservees: totalObus * e.niveau,
      reste: Math.max(0, totalObus - e.p1 - e.p2),
    };
  }

  const nf = new Intl.NumberFormat("fr-FR");
  const fmt = (n) => nf.format(n);
  const pluriel = (n, mot) => `${fmt(n)} ${mot}${n > 1 ? "s" : ""}`;

  /* ---------- Rendu ---------- */
  let dernier = null;

  function rendre() {
    const r = calculer(etat);

    el.caisses.textContent = fmt(etat.caisses);
    // On ne peut pas retirer une caisse dont les obus ont déjà été tirés
    el.moins.disabled = etat.caisses <= 0 || (etat.caisses - 1) * OBUS_PAR_CAISSE < etat.p1 + etat.p2;
    el.plus.disabled = etat.caisses >= CAISSES_MAX;

    for (const b of el.niveaux.querySelectorAll("button")) {
      const actif = Number(b.dataset.niveau) === etat.niveau;
      b.setAttribute("aria-checked", String(actif));
      b.tabIndex = actif ? 0 : -1;
    }
    // Jauge : vert = charges conservées, rouge = charges en trop
    Array.from(el.jauge).forEach((seg, i) => {
      seg.classList.toggle("on", i < etat.niveau);
      seg.classList.toggle("trop", i >= etat.niveau);
    });

    el.total.textContent = fmt(r.totalObus);
    el.detailTotal.textContent = `${pluriel(etat.caisses, "caisse")} × ${OBUS_PAR_CAISSE} obus`;

    el.niveauAffiche.innerHTML = `${etat.niveau}<small>/${CHARGES_PAR_OBUS}</small>`;
    el.detailNiveau.textContent = r.excedentParObus === 0
      ? "aucune en trop"
      : `${r.excedentParObus} en trop par obus`;

    el.excedent.textContent = fmt(r.excedent);
    el.detailExcedent.textContent =
      `${fmt(r.totalObus)} obus × (${CHARGES_PAR_OBUS} − ${etat.niveau}) = ${fmt(r.totalObus)} × ${r.excedentParObus}`;
    el.detailConserve.textContent = `Charges conservées : ${fmt(r.conservees)}`;

    if (dernier !== null && dernier !== r.excedent) {
      el.excedent.classList.remove("pulse");
      void el.excedent.offsetWidth;
      el.excedent.classList.add("pulse");
    }
    dernier = r.excedent;

    // Tirs par pièce
    const vide = r.reste === 0;
    el.compteP1.textContent = fmt(etat.p1);
    el.compteP2.textContent = fmt(etat.p2);
    el.p1.disabled = vide;
    el.p2.disabled = vide;
    el.annulerP1.disabled = etat.p1 === 0;
    el.annulerP2.disabled = etat.p2 === 0;
    el.reste.textContent = fmt(r.reste);
    el.resteBloc.classList.toggle("vide", vide);

    const bilanVisible = vide && r.totalObus > 0;
    el.bilan.hidden = !bilanVisible;
    if (bilanVisible) {
      el.bilanP1.textContent = fmt(etat.p1);
      el.bilanP2.textContent = fmt(etat.p2);
      el.bilanExcedent.textContent = fmt(r.excedent);
    }
  }

  /* ---------- Mise à jour + sauvegarde ---------- */
  const borne = (v, min, max) => Math.min(max, Math.max(min, Math.round(Number(v) || 0)));

  function maj(modif) {
    modif(etat);
    etat.caisses = borne(etat.caisses, 0, CAISSES_MAX);
    etat.niveau = borne(etat.niveau, 1, CHARGES_PAR_OBUS);
    const total = etat.caisses * OBUS_PAR_CAISSE;
    etat.p1 = borne(etat.p1, 0, total);
    etat.p2 = borne(etat.p2, 0, total - etat.p1);
    try { localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat)); } catch (_) {}
    rendre();
  }

  function charger() {
    const base = etatDefaut();
    try {
      const lu = JSON.parse(localStorage.getItem(CLE_STOCKAGE) || "null");
      if (!lu) return base;
      return {
        caisses: Number.isFinite(lu.caisses) ? lu.caisses : base.caisses,
        niveau: Number.isFinite(lu.niveau) ? lu.niveau : base.niveau,
        p1: Number.isFinite(lu.p1) ? lu.p1 : 0,
        p2: Number.isFinite(lu.p2) ? lu.p2 : 0,
      };
    } catch (_) {
      return base;
    }
  }

  /* ---------- Appui long avec accélération ---------- */
  function appuiRepete(bouton, action) {
    let minuterie = null;
    let repetitions = 0;

    const arreter = () => {
      clearTimeout(minuterie);
      minuterie = null;
      bouton.classList.remove("appuye");
    };
    const boucle = () => {
      repetitions++;
      action(repetitions > 25 ? 10 : 1);
      minuterie = setTimeout(boucle, repetitions > 10 ? 45 : 110);
    };

    bouton.addEventListener("pointerdown", (ev) => {
      if (bouton.disabled) return;
      ev.preventDefault();
      bouton.classList.add("appuye");
      repetitions = 0;
      action(1);
      minuterie = setTimeout(boucle, 420);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((t) => bouton.addEventListener(t, arreter));
    bouton.addEventListener("contextmenu", (e) => e.preventDefault());
    bouton.addEventListener("click", (ev) => { if (ev.detail === 0) action(1); }); // VoiceOver / clavier
  }

  /* ---------- Événements ---------- */
  appuiRepete(el.plus, (pas) => maj((e) => { e.caisses += pas; }));
  appuiRepete(el.moins, (pas) => maj((e) => { e.caisses -= pas; }));

  el.niveaux.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-niveau]");
    if (b) maj((e) => { e.niveau = Number(b.dataset.niveau); });
  });

  /* Tirs : 1 appui = 1 obus. Bloqué quand il ne reste plus d'obus. */
  function tir(piece) {
    if (calculer(etat).reste <= 0) return;
    maj((e) => { e[piece] += 1; });
  }
  el.p1.addEventListener("click", () => tir("p1"));
  el.p2.addEventListener("click", () => tir("p2"));
  el.annulerP1.addEventListener("click", () => maj((e) => { e.p1 -= 1; }));
  el.annulerP2.addEventListener("click", () => maj((e) => { e.p2 -= 1; }));

  let minuterieToast = null;
  el.reinit.addEventListener("click", () => {
    sauvegardeAvantReinit = { ...etat };
    maj((e) => { e.caisses = 0; e.niveau = 1; e.p1 = 0; e.p2 = 0; });
    el.toast.hidden = false;
    clearTimeout(minuterieToast);
    minuterieToast = setTimeout(() => { el.toast.hidden = true; sauvegardeAvantReinit = null; }, 5000);
  });
  el.annuler.addEventListener("click", () => {
    if (sauvegardeAvantReinit) {
      const s = sauvegardeAvantReinit;
      maj((e) => { e.caisses = s.caisses; e.niveau = s.niveau; e.p1 = s.p1; e.p2 = s.p2; });
    }
    sauvegardeAvantReinit = null;
    el.toast.hidden = true;
    clearTimeout(minuterieToast);
  });

  /* ---------- Hors ligne ---------- */
  function afficherEtatReseau() {
    el.etat.textContent = navigator.onLine
      ? "Sauvegarde automatique"
      : "Mode hors ligne · sauvegarde automatique";
  }
  window.addEventListener("online", afficherEtatReseau);
  window.addEventListener("offline", afficherEtatReseau);
  afficherEtatReseau();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    });
  }

  rendre();
})();
