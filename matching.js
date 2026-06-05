// matching.js — Niste matchingalgoritme
//
// Dit bestand berekent matchscores tussen huishoudprofielen.
// Wordt aangeroepen vanuit admin.html. Schrijft resultaten naar /matches in Firestore.
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
// Belangrijk ontwerpprincipe (gewijzigd t.o.v. v1):
//   Verhuisbereidheid geeft niet langer "gratis" punten. Twee enthousiaste
//   maar niet-passende huishoudens horen geen match te zijn. Bereidheid werkt nu
//   als vermenigvuldiger op de inhoudelijke fit (geo+swap+mismatch+extra): hoge
//   bereidheid versterkt een echte match, lage bereidheid dempt 'm.

// ─── WONINGGROOTTE-RANGORDE ───────────────────────────────────────────────────
// Gebruikt om "groter/kleiner" écht te toetsen i.p.v. alleen op woningtype te gokken.
const OPP_RANK = {
  '< 50 m²':1, '50–75 m²':2, '75–100 m²':3, '100–125 m²':4,
  '125–150 m²':5, '150–175 m²':6, '175–200 m²':7, '> 200 m²':8,
};
function oppRank(h) { return OPP_RANK[h && h.oppervlak] || null; }

// Richtingcategorieën van een woonwens
const WANTS_SMALLER = ['kleiner', 'gelijkvloers', 'appartement', 'zorg'];
const WANTS_BIGGER  = ['groter', 'grondgeb'];

// ─── GEO SCORE (max 25) ───────────────────────────────────────────────────────
// We werken alleen met 4-cijferige postcode.
function geoScore(a, b) {
  if (!a.postcode || !b.postcode) return 0;
  if (a.postcode === b.postcode) return 25;
  // Zelfde regio: eerste 2 cijfers gelijk → 10 pts
  if (a.postcode.slice(0,2) === b.postcode.slice(0,2)) return 10;
  // Zelfde provincie-gebied: eerste cijfer gelijk → 5 pts
  if (a.postcode.slice(0,1) === b.postcode.slice(0,1)) return 5;
  return 0;
}

// ─── LOCATIE WENS CHECK ───────────────────────────────────────────────────────
function locatieOk(a, b) {
  if (!a.gewenste_locatie) return true;
  if (!a.postcode || !b.postcode) return true;

  const samePc    = a.postcode === b.postcode;
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
// Centrale vraag: kan de woning van A de wens van B vervullen, én vice versa?
// v2: richtinggevoelig. We toetsen niet alleen woningtype maar ook of de
// werkelijke grootte (oppervlak/kamers) klopt met de richting van de wens.

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

// Beoordeelt of de woning van 'provider' past bij de wens van 'seeker'.
// Geeft 0–17 punten voor één richting.
function oneWayFit(seeker, provider) {
  const want = seeker.gewenst_type;
  if (!want || !provider.woning_type) return 0;

  let pts = 0;

  // (a) Woningtype past bij de wens volgens de matrix
  const compatibleTypes = SWAP_MATRIX[want] || [];
  if (compatibleTypes.includes(provider.woning_type)) pts += 10;

  // (b) Grootte-richting klopt — alleen toetsen als beide oppervlak hebben
  const rs = oppRank(seeker), rp = oppRank(provider);
  if (rs && rp) {
    if (WANTS_BIGGER.includes(want)  && rp >  rs) pts += 7;   // wil groter, provider is groter
    if (WANTS_SMALLER.includes(want) && rp <  rs) pts += 7;   // wil kleiner, provider is kleiner
    if (want === 'vergelijkbaar' && Math.abs(rp - rs) <= 1) pts += 5;
    // verkeerde richting: lichte malus zodat een type-match niet misleidt
    if (WANTS_BIGGER.includes(want)  && rp <  rs) pts -= 4;
    if (WANTS_SMALLER.includes(want) && rp >  rs) pts -= 4;
  }
  return Math.max(0, pts);
}

function swapScore(a, b) {
  let score = oneWayFit(a, b) + oneWayFit(b, a);   // beide richtingen, elk max 17
  // Bonus: beide hebben type én wens ingevuld (volledigheid)
  if (a.woning_type && b.woning_type && a.gewenst_type && b.gewenst_type) score += 1;
  return Math.min(35, score);
}

// ─── MISMATCH SIGNAAL (max 20) ────────────────────────────────────────────────
// De kamerdelta is het sterkste matchsignaal: overruimte bij de één,
// ruimtebehoefte bij de ander.
function mismatchScore(a, b) {
  let score = 0;
  const deltaA = (a.kamers_totaal||0) - (a.kamers_gebruikt||0);
  const deltaB = (b.kamers_totaal||0) - (b.kamers_gebruikt||0);

  // A heeft overruimte, B wil groter
  if (deltaA >= 2 && WANTS_BIGGER.includes(b.gewenst_type)) score += deltaA >= 3 ? 12 : 8;
  // B heeft overruimte, A wil groter
  if (deltaB >= 2 && WANTS_BIGGER.includes(a.gewenst_type)) score += deltaB >= 3 ? 12 : 8;

  // Complementair patroon: de één wil kleiner, de ander groter
  if (WANTS_SMALLER.includes(a.gewenst_type) && WANTS_BIGGER.includes(b.gewenst_type)) score += 5;
  if (WANTS_SMALLER.includes(b.gewenst_type) && WANTS_BIGGER.includes(a.gewenst_type)) score += 5;

  return Math.min(20, score);
}

// ─── VERHUISBEREIDHEID (vermenigvuldiger, niet additief) ──────────────────────
// v2: bereidheid geeft geen losse punten meer. Het schaalt de inhoudelijke score.
// Gemiddelde bereidheid 1..5 → factor 0.7 .. 1.15.
//   1 → 0.70  (sterk dempen)
//   3 → ~0.93
//   5 → 1.15  (versterken)
// Ontbrekende bereidheid → neutrale factor 0.9 (lichte voorzichtigheid).
function bereidheidFactor(a, b) {
  const ba = a.verhuisbereidheid || 0;
  const bb = b.verhuisbereidheid || 0;
  if (!ba || !bb) return 0.9;
  const gem = (ba + bb) / 2;           // 1..5
  return 0.70 + ((gem - 1) / 4) * 0.45; // lineair 0.70→1.15
}

// ─── ENERGIE / EXTRA WENSEN (max 5) ──────────────────────────────────────────
// LET OP: deze velden (mob_verwacht, gew_energie, thuiswerken) bestaan nog niet
// in de huidige intake. Tot ze toegevoegd zijn levert dit blok 0 punten op.
// De code blijft staan zodat het automatisch gaat tellen zodra de vragen er zijn.
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
// Het dashboard slaat per huishouden op welke kenmerken het al eens afwees:
//   household._rejected_signals = { te_groot: 2, locatie: 1, 'type:appartement': 1, ... }
// We gebruiken dat om de score van een NIEUWE, vergelijkbare match te dempen,
// zodat iemand niet steeds hetzelfde soort match krijgt dat hij al afwees.
//
// We kijken vanuit BEIDE huishoudens: als A vaak "te groot" afwees en B's woning
// is (relatief) groot, dan verlagen we. De malus schaalt met hoe vaak iets is
// afgewezen (meer afwijzingen = sterker signaal), met een plafond.

function rejectionPenalty(a, b) {
  let penalty = 0;
  penalty += oneWayRejection(a, b);  // hoe A eerder afwees, t.o.v. B
  penalty += oneWayRejection(b, a);  // en omgekeerd
  return Math.min(25, penalty);      // nooit meer dan 25 punten dempen
}

function oneWayRejection(seeker, provider) {
  const sig = seeker && seeker._rejected_signals;
  if (!sig || typeof sig !== 'object') return 0;
  let p = 0;
  const w = (key) => Math.min(3, sig[key] || 0); // tel max 3 afwijzingen per reden

  const rs = oppRank(seeker), rp = oppRank(provider);
  // "te groot" eerder afgewezen én provider is groter dan seeker
  if (rs && rp && rp > rs) p += w('te_groot') * 3;
  // "te klein" eerder afgewezen én provider is kleiner
  if (rs && rp && rp < rs) p += w('te_klein') * 3;
  // woningtype eerder expliciet afgewezen
  if (provider.woning_type && sig['type:' + provider.woning_type]) {
    p += Math.min(3, sig['type:' + provider.woning_type]) * 3;
  }
  // "verkeerd woningtype" in het algemeen vaak afgewezen → lichte algemene malus
  p += w('type') * 1;
  // locatie eerder afgewezen én niet exact dezelfde postcode
  if (seeker.postcode && provider.postcode && seeker.postcode !== provider.postcode) {
    p += w('locatie') * 2;
  }
  // "energie/onderhoud" afgewezen → kleine generieke malus (geen energiedata om op te toetsen)
  p += w('energie') * 1;
  return p;
}

// ─── DEALBREAKERS ─────────────────────────────────────────────────────────────
// v2: richtinggevoelig en grootte-bewust i.p.v. grove categoriegroepen.
function hasDealbreaker(a, b) {
  // Locatie-incompatibiliteit (een van beide kanten)
  if (!locatieOk(a, b) || !locatieOk(b, a)) return true;

  // Beide willen (strikt) groter → niemand levert de grote woning
  if (a.gewenst_type === 'groter' && b.gewenst_type === 'groter') return true;

  // Beide willen kleiner/gelijkvloers/appartement én woningen verschillen
  // niet of nauwelijks in grootte → geen zinvolle ruil.
  const bothSmaller = WANTS_SMALLER.includes(a.gewenst_type) && WANTS_SMALLER.includes(b.gewenst_type);
  if (bothSmaller) {
    const ra = oppRank(a), rb = oppRank(b);
    // Alleen dealbreaker als we grootte kennen én ze (vrijwel) gelijk zijn.
    if (ra && rb && Math.abs(ra - rb) <= 1) return true;
    // Zonder grootte-info: alleen blokkeren als ook woningtype gelijk is.
    if ((!ra || !rb) && a.woning_type && a.woning_type === b.woning_type) return true;
  }

  // Bereidheid bij beiden minimaal (allebei 1) → geen animo
  if ((a.verhuisbereidheid||0) <= 1 && (b.verhuisbereidheid||0) <= 1) return true;

  return false;
}

// ─── HOOFDFUNCTIE: bereken matchscore tussen twee profielen ──────────────────
export function matchScore(a, b) {
  if (hasDealbreaker(a, b)) return { total: 0, breakdown: null };

  const geo    = geoScore(a, b);
  const swap   = swapScore(a, b);
  const mis    = mismatchScore(a, b);
  const extra  = extraScore(a, b);

  // Inhoudelijke fit (zonder bereidheid)
  const inhoud = geo + swap + mis + extra;

  // Bereidheid schaalt de inhoudelijke fit
  const factor = bereidheidFactor(a, b);
  let scaled   = inhoud * factor;

  // Rejection-feedback dempt vergelijkbare, eerder afgewezen matches
  const penalty = rejectionPenalty(a, b);
  let total = Math.round(scaled - penalty);
  if (total < 0) total = 0;
  if (total > 100) total = 100;

  return {
    total,
    breakdown: {
      geo, swap, mis, extra,
      // 'bereid' tonen we als afgeleide bijdrage zodat de admin-UI (die bd.bereid
      // verwacht) blijft werken: het verschil dat de factor maakte.
      bereid: Math.round(inhoud * factor - inhoud),
      penalty,
      factor: Math.round(factor * 100) / 100,
    },
  };
}

// ─── ALLE PAREN BEREKENEN ─────────────────────────────────────────────────────
export function computeAllMatches(households, threshold = 40) {
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
