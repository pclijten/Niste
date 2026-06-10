// matching.js — Niste matchingalgoritme v3.1
//
// Dit bestand berekent matchscores tussen huishoudprofielen.
// Wordt aangeroepen vanuit admin.html. Schrijft resultaten naar /matches in Firestore.
//
// NIEUW IN v3.1 (geo-fix):
//   Afstanden worden berekend op basis van echte PC4-centroïden (zie pc4geo.js)
//   in plaats van postcodecijfer-vergelijking. De oude cijferlogica behandelde
//   het eerste postcodecijfer als "provincie" en de eerste twee als "gemeente";
//   beide aannames kloppen geografisch niet. "Tot 5 km" en "Tot 15 km" gaven
//   daardoor identieke resultaten. Nu zijn alle afstandswensen écht in km.
//   Bij een onbekende postcode valt het algoritme terug op de oude heuristiek.
//
// MATCHSCORE (0–100):
//   Geo-overlap         max 25 pts
//   Woning swap fit     max 35 pts
//   Mismatch signaal    max 20 pts
//   Verhuisbereidheid   ×-factor op inhoudelijke score (zie bereidheidFactor)
//   Energie / wensen    max  5 pts
//
// DREMPEL: score >= 40 → match opslaan
//
// Ontwerpprincipes (v3, gebaseerd op WoON 2024 + EIB Ouderenhuisvesting 2024):
//
//   1. Bereidheid werkt als vermenigvuldiger op de inhoudelijke fit, niet additief.
//      Twee enthousiaste maar niet-passende huishoudens horen geen match te zijn.
//
//   2. De LAAGSTE bereidheid van de twee weegt zwaarder dan het gemiddelde.
//      WoON 2024 bevestigt dat de minst bereidwillige partij (vrijwel altijd de
//      senior) de bottleneck is in een verhuisketen. Een gemiddelde verdoezelt dat.
//      Nieuwe formule: factor = 0.6 × bereid_laagste + 0.4 × bereid_hoogste
//      (beide genormaliseerd naar 0.70–1.15 range).
//
//   3. Dealbreaker bij eenzijdig zeer lage bereidheid (≤ 1). Als één partij
//      nauwelijks bereid is, is de kans op een echte verhuisbeweging minimaal —
//      ongeacht hoe bereid de ander is. Drempel: één partij ≤ 1 én de ander < 4.

import { pc4Distance } from './pc4geo.js';

// ─── ADMIN CONFIG (aanpasbaar via admin-interface) ────────────────────────────
// Drempelwaarden zijn initiële schattingen — worden bijgesteld op basis van
// pilotdata (Noord-Brabant 2026). Zie admin.html voor UI om deze aan te passen.
export const ADMIN_CONFIG = {
  MATCH_THRESHOLD:       40,   // minimale score om op te slaan
  DEALBREAKER_BEREID_MIN: 1,   // eenzijdig bereidheid ≤ dit = dealbreaker
  DEALBREAKER_OTHER_MIN:  4,   // tenzij andere partij ≥ dit
};

// ─── WONINGGROOTTE-RANGORDE ───────────────────────────────────────────────────
const OPP_RANK = {
  '< 50 m²':1, '50–75 m²':2, '75–100 m²':3, '100–125 m²':4,
  '125–150 m²':5, '150–175 m²':6, '175–200 m²':7, '> 200 m²':8,
};
function oppRank(h) { return OPP_RANK[h && h.oppervlak] || null; }

const WANTS_SMALLER = ['kleiner', 'gelijkvloers', 'appartement', 'zorg'];
const WANTS_BIGGER  = ['groter', 'grondgeb'];

// ─── GEO SCORE (max 25) ───────────────────────────────────────────────────────
// Op basis van echte afstand tussen PC4-centroïden (pc4geo.js).
// Schaal sluit aan op WoON 2024: de meeste senioren willen binnen de eigen
// kern of gemeente blijven — nabijheid weegt daarom progressief zwaar.
function geoScore(a, b) {
  if (!a.postcode || !b.postcode) return 0;
  if (a.postcode === b.postcode) return 25;        // zelfde PC4-gebied

  const km = pc4Distance(a.postcode, b.postcode);
  if (km === null) return geoScoreFallback(a, b);  // onbekende postcode

  if (km <= 2)  return 22;   // zelfde kern / aangrenzende wijk
  if (km <= 5)  return 18;   // zelfde of buurgemeente
  if (km <= 10) return 12;   // korte fietsafstand
  if (km <= 20) return 7;    // zelfde regio
  if (km <= 35) return 3;    // randgeval
  return 0;
}

// Oude cijferheuristiek, alleen als fallback bij een postcode die niet in de
// PC4-dataset voorkomt (bv. typefout die door validatie glipte).
function geoScoreFallback(a, b) {
  if (a.postcode.slice(0,2) === b.postcode.slice(0,2)) return 10;
  if (a.postcode.slice(0,1) === b.postcode.slice(0,1)) return 5;
  return 0;
}

// ─── LOCATIE WENS CHECK ───────────────────────────────────────────────────────
// Harde filter op de afstandswens van een deelnemer, nu in echte kilometers.
// "Zelfde gemeente" is benaderd als ≤ 7 km hemelsbreed: gemeentegrenzen volgen
// geen postcodecijfers, en 7 km dekt vrijwel elke Nederlandse gemeente vanuit
// de kern. Bewuste, gedocumenteerde proxy — exacte gemeente-mapping kan later
// via een PC4→gemeente-tabel (CBS) als de pilot daarom vraagt.
const LOCATIE_MAX_KM = {
  'Zelfde wijk':     2,
  'Zelfde gemeente': 7,
  'Tot 5 km':        5,
  'Tot 15 km':       15,
  'Tot 30 km':       30,
};

function locatieOk(a, b) {
  if (!a.gewenste_locatie) return true;
  if (a.gewenste_locatie === 'Heel Nederland') return true;
  if (!a.postcode || !b.postcode) return true;
  if (a.postcode === b.postcode) return true;      // zelfde PC4 voldoet altijd

  const maxKm = LOCATIE_MAX_KM[a.gewenste_locatie];
  if (maxKm === undefined) return true;            // onbekende wens → niet blokkeren

  const km = pc4Distance(a.postcode, b.postcode);
  if (km === null) {                               // fallback oude heuristiek
    const sameRegio = a.postcode.slice(0,2) === b.postcode.slice(0,2);
    const sameProv  = a.postcode.slice(0,1) === b.postcode.slice(0,1);
    return maxKm <= 7 ? sameRegio : sameProv;
  }
  return km <= maxKm;
}

// ─── HUISHOUDENSGROOTTE NAAR GETAL ────────────────────────────────────────────
const HH_SIZE = {
  'alleenstaand': 1, 'stel': 2, 'stel_kind': 3.5,
  'eenouder': 2.5, 'samen': 2,
};
function hhSize(h) { return HH_SIZE[h && h.huishoud_type] || null; }

// ─── RUIMTE PER PERSOON BONUS ────────────────────────────────────────────────
// Geeft bonus als de woningruil per saldo ruimtewinst oplevert voor degene
// die groter wil wonen — de kern van de woningmismatch propositie.
function ruimteWinstBonus(seeker, provider) {
  const rs = oppRank(seeker), rp = oppRank(provider);
  const sizeS = hhSize(seeker), sizeP = hhSize(provider);
  if (!rs || !rp || !sizeS || !sizeP) return 0;

  const ruimteS = rs / sizeS; // m²-rank per persoon, seeker
  const ruimteP = rp / sizeP; // m²-rank per persoon, provider

  if (WANTS_BIGGER.includes(seeker.gewenst_type) && ruimteP > ruimteS) return 8;
  if (WANTS_SMALLER.includes(seeker.gewenst_type) && ruimteP < ruimteS) return 5;
  return 0;
}

// ─── WONING SWAP FIT (max 35) ─────────────────────────────────────────────────
const SWAP_MATRIX = {
  groter:        ['vrijstaand','2kap','woonboerderij','hoekwoning'],
  kleiner:       ['appartement','tussenwoning','hoekwoning','boven_beneden'],
  gelijkvloers:  ['appartement','tussenwoning','boven_beneden','penthouse'],
  appartement:   ['appartement','penthouse','boven_beneden'],
  grondgeb:      ['tussenwoning','hoekwoning','2kap','vrijstaand','woonboerderij'],
  vergelijkbaar: ['tussenwoning','hoekwoning','2kap','vrijstaand','appartement','woonboerderij','boven_beneden'],
  zorg:          ['appartement','tussenwoning','hoekwoning','boven_beneden'],
  weet_niet:     [],
};

function oneWayFit(seeker, provider) {
  const want = seeker.gewenst_type;
  if (!want || !provider.woning_type) return 0;

  let pts = 0;
  const compatibleTypes = SWAP_MATRIX[want] || [];
  if (compatibleTypes.includes(provider.woning_type)) pts += 10;

  const rs = oppRank(seeker), rp = oppRank(provider);
  if (rs && rp) {
    if (WANTS_BIGGER.includes(want)  && rp >  rs) pts += 7;
    if (WANTS_SMALLER.includes(want) && rp <  rs) pts += 7;
    if (want === 'vergelijkbaar' && Math.abs(rp - rs) <= 1) pts += 5;
    if (WANTS_BIGGER.includes(want)  && rp <  rs) pts -= 4;
    if (WANTS_SMALLER.includes(want) && rp >  rs) pts -= 4;
  }
  return Math.max(0, pts);
}

function swapScore(a, b) {
  let score = oneWayFit(a, b) + oneWayFit(b, a);
  // Bonus als ruil ook per persoon ruimtewinst oplevert (huishoudensgrootte-factor)
  score += ruimteWinstBonus(a, b) + ruimteWinstBonus(b, a);
  if (a.woning_type && b.woning_type && a.gewenst_type && b.gewenst_type) score += 1;
  return Math.min(35, score);
}

// ─── MISMATCH SIGNAAL (max 20) ────────────────────────────────────────────────
function mismatchScore(a, b) {
  let score = 0;
  const deltaA = (a.kamers_totaal||0) - (a.kamers_gebruikt||0);
  const deltaB = (b.kamers_totaal||0) - (b.kamers_gebruikt||0);

  if (deltaA >= 2 && WANTS_BIGGER.includes(b.gewenst_type)) score += deltaA >= 3 ? 12 : 8;
  if (deltaB >= 2 && WANTS_BIGGER.includes(a.gewenst_type)) score += deltaB >= 3 ? 12 : 8;

  if (WANTS_SMALLER.includes(a.gewenst_type) && WANTS_BIGGER.includes(b.gewenst_type)) score += 5;
  if (WANTS_SMALLER.includes(b.gewenst_type) && WANTS_BIGGER.includes(a.gewenst_type)) score += 5;

  return Math.min(20, score);
}

// ─── VERHUISBEREIDHEID (vermenigvuldiger) ─────────────────────────────────────
// v3 — gebaseerd op WoON 2024 bottleneck-inzicht:
//
// De minst bereidwillige partij bepaalt in grote mate of een verhuisketen
// ook daadwerkelijk op gang komt. Een gemiddelde van beide bereidheden verdoezelt
// dat: een senior met bereidheid=1 en een gezin met bereidheid=5 geeft gemiddeld 3,
// wat een factor 0.93 oplevert — veel te optimistisch.
//
// Nieuwe aanpak: gewogen combinatie waarbij de laagste bereidheid 60% van de
// factor bepaalt en de hoogste 40%. Beide worden eerst vertaald naar hetzelfde
// 0.70–1.15 bereik als voorheen.
//
//   bereidheid 1 → deelscore 0.70
//   bereidheid 3 → deelscore 0.93
//   bereidheid 5 → deelscore 1.15
//
// Voorbeeld: senior bereid=1, gezin bereid=5:
//   Oud (gemiddelde): (1+5)/2 = 3 → factor 0.93
//   Nieuw (gewogen):  0.6×0.70 + 0.4×1.15 = 0.42 + 0.46 = 0.88
//   → realistischer: de senior-bottleneck weegt mee.
//
// Ontbrekende bereidheid → factor 0.85 (iets voorzichtiger dan v2's 0.90,
// want onbekend = niet bewezen bereid).

function bereidToScore(b) {
  // Vertaal bereidheid 1..5 naar factor 0.70..1.15
  return 0.70 + ((b - 1) / 4) * 0.45;
}

function bereidheidFactor(a, b) {
  const ba = a.verhuisbereidheid || 0;
  const bb = b.verhuisbereidheid || 0;
  if (!ba || !bb) return 0.85;   // onbekend: voorzichtig

  const laag  = Math.min(ba, bb);
  const hoog  = Math.max(ba, bb);
  return 0.6 * bereidToScore(laag) + 0.4 * bereidToScore(hoog);
}

// ─── ENERGIE / EXTRA WENSEN (max 5) ──────────────────────────────────────────
// LET OP: deze velden bestaan nog niet in de huidige intake. Tot ze toegevoegd
// zijn levert dit blok 0 punten op. De code blijft staan zodat het automatisch
// gaat tellen zodra de vragen er zijn.
function extraScore(a, b) {
  let score = 0;
  if (a.mob_verwacht && b.mob_verwacht) score += 2;
  const aGasloos = (a.gew_energie||[]).includes('gasloos');
  const bGasloos = (b.gew_energie||[]).includes('gasloos');
  if (aGasloos && bGasloos) score += 2;
  if (a.thuiswerken && b.thuiswerken) score += 1;
  return Math.min(5, score);
}

// ─── REJECTION-FEEDBACK ───────────────────────────────────────────────────────
function rejectionPenalty(a, b) {
  let penalty = 0;
  penalty += oneWayRejection(a, b);
  penalty += oneWayRejection(b, a);
  return Math.min(25, penalty);
}

function oneWayRejection(seeker, provider) {
  const sig = seeker && seeker._rejected_signals;
  if (!sig || typeof sig !== 'object') return 0;
  let p = 0;
  const w = (key) => Math.min(3, sig[key] || 0);

  const rs = oppRank(seeker), rp = oppRank(provider);
  if (rs && rp && rp > rs) p += w('te_groot') * 3;
  if (rs && rp && rp < rs) p += w('te_klein') * 3;
  if (provider.woning_type && sig['type:' + provider.woning_type]) {
    p += Math.min(3, sig['type:' + provider.woning_type]) * 3;
  }
  p += w('type') * 1;
  if (seeker.postcode && provider.postcode && seeker.postcode !== provider.postcode) {
    p += w('locatie') * 2;
  }
  p += w('energie') * 1;
  return p;
}

// ─── DEALBREAKERS ─────────────────────────────────────────────────────────────
// v3: eenzijdig zeer lage bereidheid is nu een expliciete dealbreaker.
//
// Rationale (WoON 2024): er verhuizen structureel minder senioren dan er zeggen
// te willen verhuizen. Bereidheid=1 bij één partij betekent in de praktijk dat
// de match niet leidt tot een verhuisbeweging, ongeacht hoe bereid de ander is.
// We blokkeren als één partij ≤ 1 heeft én de ander < 4 — ruimte voor het geval
// dat een zeer gemotiveerde partij (bereid=5) toch net genoeg trekkracht heeft.

function hasDealbreaker(a, b) {
  // Locatie-incompatibiliteit
  if (!locatieOk(a, b) || !locatieOk(b, a)) return true;

  // Beide willen groter → niemand levert de grote woning
  if (a.gewenst_type === 'groter' && b.gewenst_type === 'groter') return true;

  // Beide willen kleiner, gelijkvloers, etc. én woningen vergelijkbaar in grootte
  const bothSmaller = WANTS_SMALLER.includes(a.gewenst_type) && WANTS_SMALLER.includes(b.gewenst_type);
  if (bothSmaller) {
    const ra = oppRank(a), rb = oppRank(b);
    if (ra && rb && Math.abs(ra - rb) <= 1) return true;
    if ((!ra || !rb) && a.woning_type && a.woning_type === b.woning_type) return true;
  }

  // v2: beiden bereidheid ≤ 1 → geen animo
  if ((a.verhuisbereidheid||0) <= 1 && (b.verhuisbereidheid||0) <= 1) return true;

  // v3 (nieuw): eenzijdig zeer lage bereidheid is ook een dealbreaker,
  // tenzij de andere partij uitzonderlijk gemotiveerd is (bereid = 5).
  // Dit verwerkt de WoON 2024 bottleneck-bevinding in de dealbreaker-laag,
  // als extra vangnet naast de bereidheidFactor-demping.
  const ba = a.verhuisbereidheid || 0;
  const bb = b.verhuisbereidheid || 0;
  if (ba > 0 && bb > 0) {
    const laag = Math.min(ba, bb);
    const hoog = Math.max(ba, bb);
    if (laag <= 1 && hoog < 4) return true;
  }

  return false;
}

// ─── HOOFDFUNCTIE ─────────────────────────────────────────────────────────────
export function matchScore(a, b) {
  if (hasDealbreaker(a, b)) return { total: 0, breakdown: null };

  const geo    = geoScore(a, b);
  const swap   = swapScore(a, b);
  const mis    = mismatchScore(a, b);
  const extra  = extraScore(a, b);

  const inhoud  = geo + swap + mis + extra;
  const factor  = bereidheidFactor(a, b);
  let scaled    = inhoud * factor;

  const penalty = rejectionPenalty(a, b);
  let total = Math.round(scaled - penalty);
  if (total < 0)   total = 0;
  if (total > 100) total = 100;

  return {
    total,
    breakdown: {
      geo, swap, mis, extra,
      bereid: Math.round(inhoud * factor - inhoud),
      penalty,
      factor: Math.round(factor * 100) / 100,
    },
  };
}

// ─── ALLE PAREN BEREKENEN ─────────────────────────────────────────────────────
export function computeAllMatches(households, threshold = ADMIN_CONFIG.MATCH_THRESHOLD) {
  const results = [];

  for (let i = 0; i < households.length; i++) {
    for (let j = i + 1; j < households.length; j++) {
      const a = households[i];
      const b = households[j];
      if (a.id === b.id) continue;

      const { total, breakdown } = matchScore(a, b);
      if (total >= threshold) {
        results.push({
          id:          `${a.id}_${b.id}`,
          household_a: a.id,
          household_b: b.id,
          score:       total,
          breakdown,
          pc_a:        a.postcode || '—',
          pc_b:        b.postcode || '—',
          type_a:      a.woning_type || '—',
          type_b:      b.woning_type || '—',
          gewenst_a:   a.gewenst_type || '—',
          gewenst_b:   b.gewenst_type || '—',
          bereid_a:    a.verhuisbereidheid || 0,
          bereid_b:    b.verhuisbereidheid || 0,
          delta_a:     (a.kamers_totaal||0) - (a.kamers_gebruikt||0),
          delta_b:     (b.kamers_totaal||0) - (b.kamers_gebruikt||0),
          pilot:       a._pilot || 'noord-brabant-2026',
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// ─── SCORE LABEL ─────────────────────────────────────────────────────────────
export function scoreLabel(score) {
  if (score >= 75) return { label: 'Sterke match',    color: '#2A4A3E' };
  if (score >= 55) return { label: 'Goede match',     color: '#3D6B5C' };
  if (score >= 40) return { label: 'Mogelijke match', color: '#C49A4A' };
  return              { label: 'Geen match',           color: '#9A9A8E' };
}
