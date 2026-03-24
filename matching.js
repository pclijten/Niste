// matching.js — Niste matchingalgoritme
//
// Dit bestand berekent matchscores tussen huishoudprofielen.
// Wordt aangeroepen vanuit admin.html. Schrijft resultaten naar /matches in Firestore.
//
// MATCHSCORE (0–100):
//   Geo-overlap         max 25 pts
//   Woning swap fit     max 35 pts
//   Mismatch signaal    max 20 pts
//   Verhuisbereidheid   max 15 pts
//   Energie / wensen    max  5 pts
//
// DREMPEL: score >= 40 → match opslaan

// ─── GEO SCORE (max 25) ───────────────────────────────────────────────────────
// We werken alleen met 4-cijferige postcode.
// Zelfde postcode = 25, beide hebben postcode maar verschillend = 5, geen postcode = 0

function geoScore(a, b) {
  if (!a.postcode || !b.postcode) return 0;
  if (a.postcode === b.postcode) return 25;

  // Directe buren: eerste 2 cijfers gelijk (zelfde regio) → 10 pts
  if (a.postcode.slice(0,2) === b.postcode.slice(0,2)) return 10;

  // Eerste cijfer gelijk (zelfde provincie-gebied) → 5 pts
  if (a.postcode.slice(0,1) === b.postcode.slice(0,1)) return 5;

  return 0;
}

// ─── LOCATIE WENS CHECK ───────────────────────────────────────────────────────
// Controleert of de gewenste locatie van A compatible is met de postcode van B
function locatieOk(a, b) {
  if (!a.gewenste_locatie) return true; // geen voorkeur = alles ok
  if (!a.postcode || !b.postcode) return true;

  const samePc   = a.postcode === b.postcode;
  const sameRegio = a.postcode.slice(0,2) === b.postcode.slice(0,2);
  const sameProv  = a.postcode.slice(0,1) === b.postcode.slice(0,1);

  switch (a.gewenste_locatie) {
    case 'Zelfde wijk':     return samePc;
    case 'Zelfde gemeente': return sameRegio;
    case 'Tot 5 km':        return sameRegio;
    case 'Tot 15 km':       return sameProv;
    case 'Tot 30 km':       return sameProv;
    case 'Heel Nederland':  return true;
    default:                return true;
  }
}

// ─── WONING SWAP FIT (max 35) ─────────────────────────────────────────────────
// Centrale vraag: past de huidige woning van A bij de wens van B, én vice versa?

// Mapping: welke huidige woningtypes passen bij welke gewenste types
const SWAP_MATRIX = {
  // Iemand wil groter → past bij iemand in een grote woning
  groter:        ['vrijstaand','2kap','woonboerderij','hoekwoning'],
  // Iemand wil kleiner of gelijkvloers → past bij iemand in een kleine/midden woning
  kleiner:       ['appartement','tussenwoning','hoekwoning','boven_beneden'],
  gelijkvloers:  ['appartement','tussenwoning','hoekwoning','boven_beneden'],
  // Iemand wil appartement → past bij iemand die in appartement woont (ruil)
  appartement:   ['appartement','penthouse','boven_beneden'],
  // Grondgebonden → past bij iemand in grondgebonden
  grondgeb:      ['tussenwoning','hoekwoning','2kap','vrijstaand','woonboerderij'],
  // Vergelijkbaar of zorggeschikt → breed
  vergelijkbaar: ['tussenwoning','hoekwoning','2kap','vrijstaand','appartement','woonboerderij'],
  zorg:          ['appartement','tussenwoning','hoekwoning'],
  weet_niet:     [], // geen bonus, maar ook geen malus
};

function swapScore(a, b) {
  let score = 0;

  // A's huidige woning past bij B's wens
  if (b.gewenst_type && a.woning_type) {
    const compatible = SWAP_MATRIX[b.gewenst_type] || [];
    if (compatible.includes(a.woning_type)) score += 15;
  }

  // B's huidige woning past bij A's wens
  if (a.gewenst_type && b.woning_type) {
    const compatible = SWAP_MATRIX[a.gewenst_type] || [];
    if (compatible.includes(b.woning_type)) score += 15;
  }

  // Bonus: beide hebben duidelijke typen én wensen ingevuld
  if (a.woning_type && b.woning_type && a.gewenst_type && b.gewenst_type) {
    score += 5;
  }

  return Math.min(35, score);
}

// ─── MISMATCH SIGNAAL (max 20) ────────────────────────────────────────────────
// De kamerdelta is het sterkste matchsignaal in het systeem.
// Als A veel kamers over heeft én B wil groter → sterke match

function mismatchScore(a, b) {
  let score = 0;

  const deltaA = (a.kamers_totaal||0) - (a.kamers_gebruikt||0);
  const deltaB = (b.kamers_totaal||0) - (b.kamers_gebruikt||0);

  // A heeft overruimte, B wil groter
  if (deltaA >= 2 && ['groter','grondgeb'].includes(b.gewenst_type)) {
    score += deltaA >= 3 ? 12 : 8;
  }
  // B heeft overruimte, A wil groter
  if (deltaB >= 2 && ['groter','grondgeb'].includes(a.gewenst_type)) {
    score += deltaB >= 3 ? 12 : 8;
  }

  // Complementair patroon: A wil kleiner (heeft wellicht grote woning), B wil groter
  if (['kleiner','gelijkvloers','appartement'].includes(a.gewenst_type) &&
      ['groter','grondgeb'].includes(b.gewenst_type)) {
    score += 5;
  }
  if (['kleiner','gelijkvloers','appartement'].includes(b.gewenst_type) &&
      ['groter','grondgeb'].includes(a.gewenst_type)) {
    score += 5;
  }

  return Math.min(20, score);
}

// ─── VERHUISBEREIDHEID (max 15) ───────────────────────────────────────────────
function bereidheidScore(a, b) {
  const ba = a.verhuisbereidheid || 0;
  const bb = b.verhuisbereidheid || 0;
  if (!ba || !bb) return 0;
  // Gemiddelde bereidheid × 3 (max 5 × 3 = 15)
  return Math.round(((ba + bb) / 2) * 3);
}

// ─── ENERGIE / EXTRA WENSEN (max 5) ──────────────────────────────────────────
function extraScore(a, b) {
  let score = 0;
  // Beide mobiliteitsbeperkingen verwacht → beide baat bij gelijkvloers
  if (a.mob_verwacht && b.mob_verwacht) score += 2;
  // Beide gasloos voorkeur
  const aWantGasloos = (a.gew_energie||[]).includes('gasloos');
  const bWantGasloos = (b.gew_energie||[]).includes('gasloos');
  if (aWantGasloos && bWantGasloos) score += 2;
  // Beide thuiswerken → werkkamer is must-have
  if (a.thuiswerken && b.thuiswerken) score += 1;
  return Math.min(5, score);
}

// ─── DEALBREAKERS ─────────────────────────────────────────────────────────────
// Als een dealbreaker van toepassing is → match score = 0
function hasDealbreaker(a, b) {
  // Locatie-incompatibiliteit: beide kanten
  if (!locatieOk(a, b) || !locatieOk(b, a)) return true;

  // Beide willen groter → geen match (niemand biedt de grote woning)
  if (['groter','grondgeb'].includes(a.gewenst_type) &&
      ['groter','grondgeb'].includes(b.gewenst_type)) return true;

  // Beide willen kleiner → geen match
  if (['kleiner','gelijkvloers','appartement'].includes(a.gewenst_type) &&
      ['kleiner','gelijkvloers','appartement'].includes(b.gewenst_type)) return true;

  // Bereidheid te laag bij beiden (beiden op 1)
  if ((a.verhuisbereidheid||0) <= 1 && (b.verhuisbereidheid||0) <= 1) return true;

  return false;
}

// ─── HOOFDFUNCTIE: bereken matchscore tussen twee profielen ──────────────────
export function matchScore(a, b) {
  if (hasDealbreaker(a, b)) return { total: 0, breakdown: null };

  const geo     = geoScore(a, b);
  const swap    = swapScore(a, b);
  const mis     = mismatchScore(a, b);
  const bereid  = bereidheidScore(a, b);
  const extra   = extraScore(a, b);
  const total   = geo + swap + mis + bereid + extra;

  return {
    total,
    breakdown: { geo, swap, mis, bereid, extra },
  };
}

// ─── ALLE PAREN BEREKENEN ─────────────────────────────────────────────────────
// Geeft alle paren terug met score >= drempel, gesorteerd op score desc
export function computeAllMatches(households, threshold = 40) {
  const results = [];

  for (let i = 0; i < households.length; i++) {
    for (let j = i + 1; j < households.length; j++) {
      const a = households[i];
      const b = households[j];

      // Sla matching met jezelf over (zou niet moeten voorkomen maar voor zekerheid)
      if (a.id === b.id) continue;

      const { total, breakdown } = matchScore(a, b);
      if (total >= threshold) {
        results.push({
          id:          `${a.id}_${b.id}`,
          household_a: a.id,
          household_b: b.id,
          score:       total,
          breakdown,
          // Geanonimiseerde context voor admin-overzicht
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
  if (score >= 75) return { label: 'Sterke match',   color: '#2A4A3E' };
  if (score >= 55) return { label: 'Goede match',    color: '#3D6B5C' };
  if (score >= 40) return { label: 'Mogelijke match',color: '#C49A4A' };
  return              { label: 'Geen match',          color: '#9A9A8E' };
}
