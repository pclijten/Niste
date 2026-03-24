// questions.js — Niste Wooncheck vragenconfig
//
// HOE GEBRUIK JE DIT BESTAND:
//   Vraag toevoegen  → één object toevoegen aan QUESTIONS array
//   Vraag verwijderen → object weghalen (Firestore-veld blijft intact voor bestaande profielen)
//   Opties wijzigen  → options array aanpassen
//   Naar andere stap → step getal aanpassen (0–6)
//   Volgorde wijzigen → volgorde in array aanpassen
//
// VRAAGTYPEN:
//   postcode         speciale postcode input (4 cijfers)
//   tiles            klikbare tegels met optioneel icon (grid: g2/g3/g4)
//   chips            horizontale pill buttons (multi: true voor meerdere)
//   counter          min/max teller (maxRef: 'andere_vraag_id' voor dynamisch max)
//   toggle           aan/uit schakelaar
//   scale            1–5 schaalvraag (ends: ['links label','rechts label'])
//   slider           schuifbalk 1–5 (voor verhuisbereidheid)
//   textarea         vrij tekstveld
//   computed_badge   automatisch berekende badge (geen dbField)
//
// CONDITIONEEL TONEN:
//   showIf: { key: 'andere_vraag_id', value: true }
//
// SECTIE-LABEL:
//   sectionLabel: 'Tekst boven de vraag'

// ─── STAP TITELS ──────────────────────────────────────────────────────────────
export const STEP_TITLES = [
  {
    eyebrow: 'Stap 1 van 7 — Jouw woning',
    title:   'Hoe ziet <em>jouw woning</em> eruit?',
    desc:    'Basics voor matching — vergelijkbaar met wat je op Funda invult.',
  },
  {
    eyebrow: 'Stap 2 van 7 — Indeling',
    title:   'Kamers &amp; <em>indeling</em>',
    desc:    'Hoe is de woning ingedeeld, en hoeveel gebruik je er eigenlijk van?',
  },
  {
    eyebrow: 'Stap 3 van 7 — Buitenruimte',
    title:   'Tuin, oprit &amp; <em>bijgebouwen</em>',
    desc:    'Alles rondom de woning — tuin, parkeren, schuur en opslag.',
  },
  {
    eyebrow: 'Stap 4 van 7 — Energie &amp; installaties',
    title:   'Energie &amp; <em>duurzaamheid</em>',
    desc:    'Een volledig energieprofiel helpt ons te matchen op duurzaamheidswensen.',
  },
  {
    eyebrow: 'Stap 5 van 7 — Gevoel &amp; beleving',
    title:   'Hoe <em>voelt</em> het hier?',
    desc:    'Omgevingspsychologisch onderzoek laat zien dat subjectieve woonbeleving een grote rol speelt bij verhuisbereidheid. Geen goede of foute antwoorden.',
  },
  {
    eyebrow: 'Stap 6 van 7 — Jouw situatie',
    title:   'Wie woont <em>hier</em>?',
    desc:    'Geen namen of adressen — alleen wat nodig is voor een goede match.',
  },
  {
    eyebrow: 'Stap 7 van 7 — Woonwensen',
    title:   'Wat zoek <em>jij</em>?',
    desc:    'Je hoeft niets concreets te hebben. Geef aan welke richting aanspreekt — dat is genoeg voor een eerste match.',
  },
];

// ─── VRAGENLIJST ──────────────────────────────────────────────────────────────
export const QUESTIONS = [

  // ══ STAP 0: Jouw woning ══════════════════════════════════════════════════════

  {
    id: 'postcode', step: 0, type: 'postcode',
    sectionLabel: 'Postcode (4 cijfers — wijk-niveau, geen straat)',
    dbField: 'postcode', optional: true,
  },
  {
    id: 'woning_type', step: 0, type: 'tiles', grid: 'g2',
    sectionLabel: 'Woningtype',
    options: [
      { value: 'tussenwoning',   label: 'Tussenwoning',        icon: '🏘️' },
      { value: 'hoekwoning',     label: 'Hoekwoning',          icon: '🏠' },
      { value: '2kap',           label: '2-onder-1-kap',       icon: '🏡' },
      { value: 'vrijstaand',     label: 'Vrijstaand',          icon: '🏰' },
      { value: 'appartement',    label: 'Appartement',         icon: '🏢' },
      { value: 'boven_beneden',  label: 'Boven-/benedenwoning',icon: '🏗️' },
      { value: 'penthouse',      label: 'Penthouse',           icon: '🌆' },
      { value: 'woonboerderij',  label: 'Woonboerderij',       icon: '🌾' },
    ],
    dbField: 'woning_type', optional: true,
  },
  {
    id: 'oppervlak', step: 0, type: 'chips',
    sectionLabel: 'Woonoppervlak (gebruiksoppervlak)',
    options: ['< 50 m²','50–75 m²','75–100 m²','100–125 m²','125–150 m²','150–175 m²','175–200 m²','> 200 m²'],
    dbField: 'oppervlak', optional: true,
  },
  {
    id: 'perceel', step: 0, type: 'chips',
    sectionLabel: 'Perceeloppervlak (incl. tuin, oprit, bijgebouwen)',
    options: ['Geen perceel','< 50 m²','50–100 m²','100–200 m²','200–400 m²','400–750 m²','> 750 m²'],
    dbField: 'perceel', optional: true,
  },
  {
    id: 'bouwjaar', step: 0, type: 'chips',
    sectionLabel: 'Bouwjaar',
    options: ['Vóór 1945','1945–1960','1960–1975','1975–1990','1990–2005','2005–2015','Na 2015'],
    dbField: 'bouwjaar', optional: true,
  },
  {
    id: 'prijs_range', step: 0, type: 'chips',
    sectionLabel: 'Geschatte woningwaarde (indicatief)',
    options: ['< €200k','€200–300k','€300–400k','€400–500k','€500–600k','€600–750k','€750k–€1M','> €1M'],
    dbField: 'prijs_range', optional: true,
  },

  // ══ STAP 1: Indeling ═════════════════════════════════════════════════════════

  {
    id: 'kamers_totaal', step: 1, type: 'counter',
    sectionLabel: 'Kamers &amp; ruimte',
    label: 'Totaal aantal kamers', sublabel: 'Incl. woonkamer',
    min: 1, max: 15, default: 4,
    dbField: 'kamers_totaal', optional: true,
  },
  {
    id: 'kamers_gebruikt', step: 1, type: 'counter',
    label: 'Dagelijks gebruikte kamers', sublabel: 'Hoeveel kamers gebruik je echt?',
    min: 1, max: 15, maxRef: 'kamers_totaal', default: 3,
    dbField: 'kamers_gebruikt', optional: true,
  },
  {
    id: 'slaapkamers', step: 1, type: 'counter',
    label: 'Slaapkamers',
    min: 0, max: 10, default: 3,
    dbField: 'slaapkamers', optional: true,
  },
  {
    id: 'badkamers', step: 1, type: 'counter',
    label: 'Badkamers',
    min: 0, max: 5, default: 1,
    dbField: 'badkamers', optional: true,
  },
  {
    id: 'toiletten', step: 1, type: 'counter',
    label: 'Toiletten', sublabel: 'Incl. in badkamer',
    min: 0, max: 6, default: 1,
    dbField: 'toiletten', optional: true,
  },
  {
    id: 'verdiepingen', step: 1, type: 'counter',
    label: 'Verdiepingen', sublabel: 'Boven begane grond',
    min: 0, max: 5, default: 1,
    dbField: 'verdiepingen', optional: true,
  },
  {
    id: '_mismatch_badge', step: 1, type: 'computed_badge',
    compute: 'mismatch',
    dbField: null, optional: true,
  },
  {
    id: 'zolder', step: 1, type: 'toggle',
    sectionLabel: 'Extra ruimte',
    label: 'Zolder aanwezig',
    dbField: 'zolder', optional: true,
  },
  {
    id: 'zolder_bwb', step: 1, type: 'toggle',
    label: 'Zolder bewoonbaar of te maken', sublabel: 'Potentieel extra kamer/kantoor',
    dbField: 'zolder_bwb', optional: true,
  },
  {
    id: 'kelder', step: 1, type: 'toggle',
    label: 'Kelder aanwezig',
    dbField: 'kelder', optional: true,
  },
  {
    id: 'aanbouw_poss', step: 1, type: 'toggle',
    label: 'Mogelijkheid voor aanbouw', sublabel: 'Op eigen terrein',
    dbField: 'aanbouw_poss', optional: true,
  },

  // ══ STAP 2: Buitenruimte ═════════════════════════════════════════════════════

  {
    id: 'tuin', step: 2, type: 'toggle',
    sectionLabel: 'Tuin',
    label: 'Tuin aanwezig',
    dbField: 'tuin', optional: true,
  },
  {
    id: 'tuin_grootte', step: 2, type: 'chips',
    sectionLabel: 'Tuingrootte',
    showIf: { key: 'tuin', value: true },
    options: ['< 20 m²','20–50 m²','50–100 m²','100–200 m²','200–400 m²','> 400 m²'],
    dbField: 'tuin_grootte', optional: true,
  },
  {
    id: 'tuin_type', step: 2, type: 'chips',
    sectionLabel: 'Type tuin',
    showIf: { key: 'tuin', value: true },
    options: [
      { value: 'achter',     label: 'Achtertuin' },
      { value: 'voor_achter',label: 'Voor + achter' },
      { value: 'rondom',     label: 'Rondom' },
      { value: 'dak',        label: 'Daktuin/terras' },
    ],
    dbField: 'tuin_type', optional: true,
  },
  {
    id: 'tuin_ond', step: 2, type: 'tiles', grid: 'g3',
    sectionLabel: 'Onderhoudsniveau tuin',
    showIf: { key: 'tuin', value: true },
    options: [
      { value: 'weinig',  label: 'Weinig onderhoud', icon: '🌿' },
      { value: 'gemid',   label: 'Gemiddeld',         icon: '🌳' },
      { value: 'veel',    label: 'Veel onderhoud',    icon: '🪴' },
    ],
    dbField: 'tuin_ond', optional: true,
  },
  {
    id: 'vijver', step: 2, type: 'toggle',
    sectionLabel: 'Bijzonderheden tuin',
    showIf: { key: 'tuin', value: true },
    label: 'Vijver aanwezig',
    dbField: 'vijver', optional: true,
  },
  {
    id: 'sproeisysteem', step: 2, type: 'toggle',
    showIf: { key: 'tuin', value: true },
    label: 'Automatisch sproeisysteem',
    dbField: 'sproeisysteem', optional: true,
  },
  {
    id: 'overkapping', step: 2, type: 'toggle',
    showIf: { key: 'tuin', value: true },
    label: 'Overkapping / veranda / pergola',
    dbField: 'overkapping', optional: true,
  },
  {
    id: 'buitenverlichting', step: 2, type: 'toggle',
    showIf: { key: 'tuin', value: true },
    label: 'Buitenverlichting',
    dbField: 'buitenverlichting', optional: true,
  },
  {
    id: 'tuin_bestrating', step: 2, type: 'toggle',
    showIf: { key: 'tuin', value: true },
    label: 'Grotendeels bestraat', sublabel: 'Weinig of geen gras — relevant voor onderhoudslast',
    dbField: 'tuin_bestrating', optional: true,
  },
  {
    id: 'parkeer_eigen', step: 2, type: 'toggle',
    sectionLabel: 'Parkeren op eigen perceel',
    label: 'Oprit of parkeerplaats op eigen terrein',
    dbField: 'parkeer_eigen', optional: true,
  },
  {
    id: 'parkeer_n', step: 2, type: 'counter',
    showIf: { key: 'parkeer_eigen', value: true },
    label: "Aantal auto's te parkeren", sublabel: 'Op eigen terrein',
    min: 1, max: 8, default: 1,
    dbField: 'parkeer_n', optional: true,
  },
  {
    id: 'carport', step: 2, type: 'toggle',
    showIf: { key: 'parkeer_eigen', value: true },
    label: 'Carport aanwezig',
    dbField: 'carport', optional: true,
  },
  {
    id: 'garage', step: 2, type: 'toggle',
    showIf: { key: 'parkeer_eigen', value: true },
    label: 'Garage aanwezig',
    dbField: 'garage', optional: true,
  },
  {
    id: 'schuur', step: 2, type: 'chips',
    sectionLabel: 'Schuur / berging / bijgebouw',
    options: ['Geen schuur','Klein (< 6 m²)','Middel (6–15 m²)','Groot (> 15 m²)'],
    dbField: 'schuur', optional: true,
  },
  {
    id: 'schuur_stroom', step: 2, type: 'toggle',
    label: 'Schuur heeft stroomaansluiting',
    dbField: 'schuur_stroom', optional: true,
  },
  {
    id: 'schuur_water', step: 2, type: 'toggle',
    label: 'Schuur heeft wateraansluiting',
    dbField: 'schuur_water', optional: true,
  },
  {
    id: 'opmerking_buiten', step: 2, type: 'textarea',
    sectionLabel: 'Opmerkingen buitenruimte (optioneel)',
    placeholder: 'Bijzonderheden over tuin, oprit of buitenruimte…',
    dbField: 'opmerking_buiten', optional: true,
  },

  // ══ STAP 3: Energie & installaties ═══════════════════════════════════════════

  {
    id: 'energielabel', step: 3, type: 'chips',
    sectionLabel: 'Energielabel',
    options: ['A+++','A++','A+','A','B','C','D','E','F','G','Onbekend'],
    dbField: 'energielabel', optional: true,
  },
  {
    id: 'verwarm', step: 3, type: 'tiles', grid: 'g3',
    sectionLabel: 'Verwarmingssysteem',
    options: [
      { value: 'cv',          label: 'CV-ketel',       icon: '🔥' },
      { value: 'warmtepomp',  label: 'Warmtepomp',     icon: '♻️' },
      { value: 'hybride',     label: 'Hybride WP',     icon: '⚡' },
      { value: 'stadsverw',   label: 'Stadsverwarming',icon: '🏙️' },
      { value: 'elektrisch',  label: 'Elektrisch',     icon: '🔌' },
      { value: 'anders',      label: 'Anders',         icon: '❓' },
    ],
    dbField: 'verwarm', optional: true,
  },
  {
    id: 'gasloos', step: 3, type: 'chips',
    sectionLabel: 'Gasloos',
    options: [
      { value: 'ja',    label: 'Volledig gasloos' },
      { value: 'deels', label: 'Deels gasloos' },
      { value: 'nee',   label: 'Nog op gas' },
    ],
    dbField: 'gasloos', optional: true,
  },
  {
    id: 'vloerverwarming', step: 3, type: 'toggle',
    label: 'Vloerverwarming aanwezig', sublabel: 'Geheel of gedeeltelijk',
    dbField: 'vloerverwarming', optional: true,
  },
  {
    id: 'zonnepanelen', step: 3, type: 'toggle',
    sectionLabel: 'Zonne-energie',
    label: 'Zonnepanelen aanwezig',
    dbField: 'zonnepanelen', optional: true,
  },
  {
    id: 'zp_n', step: 3, type: 'counter',
    showIf: { key: 'zonnepanelen', value: true },
    label: 'Aantal zonnepanelen',
    min: 1, max: 80, default: 10,
    dbField: 'zp_n', optional: true,
  },
  {
    id: 'thuisaccu', step: 3, type: 'toggle',
    label: 'Thuisaccu aanwezig', sublabel: 'Bijv. Tesla Powerwall, SMA, Enphase',
    dbField: 'thuisaccu', optional: true,
  },
  {
    id: 'laadpaal', step: 3, type: 'toggle',
    sectionLabel: 'Laadpaal',
    label: 'Laadpaal aanwezig', sublabel: 'Op oprit, in garage of carport',
    dbField: 'laadpaal', optional: true,
  },
  {
    id: 'laadpaal_poss', step: 3, type: 'toggle',
    label: 'Laadpaal eenvoudig te plaatsen', sublabel: 'Ruimte en aansluitpunt beschikbaar',
    dbField: 'laadpaal_poss', optional: true,
  },
  {
    id: 'isolatie', step: 3, type: 'chips', multi: true,
    sectionLabel: 'Isolatie — wat is aanwezig?',
    options: ['Dakisolatie','Spouwmuurisolatie','Vloerisolatie','Dubbel glas','HR++ glas','Triple glas'],
    dbField: 'isolatie', optional: true,
  },
  {
    id: 'kwh', step: 3, type: 'chips',
    sectionLabel: 'Gemiddeld elektriciteitsverbruik',
    options: ['< 1.500 kWh/jr','1.500–2.500 kWh/jr','2.500–4.000 kWh/jr','4.000–6.000 kWh/jr','> 6.000 kWh/jr','Onbekend'],
    dbField: 'kwh', optional: true,
  },
  {
    id: 'm3', step: 3, type: 'chips',
    sectionLabel: 'Gasverbruik (of n.v.t.)',
    options: ['N.v.t. (gasloos)','< 500 m³/jr','500–1.000 m³/jr','1.000–1.700 m³/jr','> 1.700 m³/jr','Onbekend'],
    dbField: 'm3', optional: true,
  },
  {
    id: 'domotica', step: 3, type: 'toggle',
    sectionLabel: 'Domotica &amp; slimme systemen',
    label: 'Domotica aanwezig',
    dbField: 'domotica', optional: true,
  },
  {
    id: 'dom_types', step: 3, type: 'chips', multi: true,
    showIf: { key: 'domotica', value: true },
    options: ['Slimme thermostaat','Slimme verlichting','Slimme stopcontacten','Zonnepaneel-app','Beveiligingssysteem','Rolluiken automatisch','Anders'],
    dbField: 'dom_types', optional: true,
  },

  // ══ STAP 4: Gevoel & beleving ════════════════════════════════════════════════

  {
    id: 'rust', step: 4, type: 'scale',
    sectionLabel: 'Beleving binnen',
    label: 'Rust &amp; stilte binnenshuis', sublabel: 'Hoe rustig is het in huis?',
    ends: ['Veel lawaai','Erg rustig'],
    dbField: 'rust', optional: true,
  },
  {
    id: 'ruimte', step: 4, type: 'scale',
    label: 'Ruimtelijk gevoel', sublabel: 'Voelt de woning ruim voor wat je nodig hebt?',
    ends: ['Erg benauwd','Erg ruim'],
    dbField: 'ruimte', optional: true,
  },
  {
    id: 'licht', step: 4, type: 'scale',
    label: 'Lichtinval', sublabel: 'Hoeveel daglicht heeft de woning?',
    ends: ['Donker','Licht en zonnig'],
    dbField: 'licht', optional: true,
  },
  {
    id: 'thuis', step: 4, type: 'scale',
    label: 'Thuisgevoel', sublabel: 'In hoeverre voelt dit als jouw thuis?',
    ends: ['Weinig thuisgevoel','Volledig thuis'],
    dbField: 'thuis', optional: true,
  },
  {
    id: 'onderhoudslast', step: 4, type: 'scale',
    label: 'Onderhoudslast woning', sublabel: 'Hoe zwaar weegt het onderhoud?',
    ends: ['Weinig moeite','Erg belastend'],
    dbField: 'onderhoudslast', optional: true,
  },
  {
    id: 'trap_last', step: 4, type: 'scale',
    label: 'Trapgebruik belastend', sublabel: 'Is de trap een last of geen probleem?',
    ends: ['Geen last','Erg belastend'],
    dbField: 'trap_last', optional: true,
  },
  {
    id: 'veilig', step: 4, type: 'scale',
    sectionLabel: 'Beleving buurt &amp; omgeving',
    label: 'Veiligheidsgevoel', sublabel: 'Hoe veilig voel jij je buiten en thuis?',
    ends: ['Onveilig','Erg veilig'],
    dbField: 'veilig', optional: true,
  },
  {
    id: 'sociaal', step: 4, type: 'scale',
    label: 'Sociale cohesie buurt', sublabel: 'Ken je je buren? Voelt de buurt verbonden?',
    ends: ['Anoniem','Hecht en verbonden'],
    dbField: 'sociaal', optional: true,
  },
  {
    id: 'groen', step: 4, type: 'scale',
    label: 'Groenbeleving omgeving', sublabel: 'Hoeveel natuur en groen is er direct buiten?',
    ends: ['Weinig groen','Veel groen'],
    dbField: 'groen', optional: true,
  },
  {
    id: 'bereikbaar', step: 4, type: 'scale',
    label: 'Bereikbaarheid voorzieningen', sublabel: 'Winkels, zorg, OV, scholen…',
    ends: ['Slecht bereikbaar','Prima bereikbaar'],
    dbField: 'bereikbaar', optional: true,
  },
  {
    id: 'geluidsoverlast', step: 4, type: 'scale',
    label: 'Geluidsoverlast van buiten', sublabel: 'Verkeer, buren, horeca…',
    ends: ['Geen overlast','Veel overlast'],
    dbField: 'geluidsoverlast', optional: true,
  },
  {
    id: 'privacy', step: 4, type: 'scale',
    label: 'Privacygevoel', sublabel: 'Hoe privé voel jij je in en om de woning?',
    ends: ['Weinig privacy','Veel privacy'],
    dbField: 'privacy', optional: true,
  },
  {
    id: 'geluid', step: 4, type: 'tiles', grid: 'g4',
    sectionLabel: 'Geluidsniveau buurt (overdag)',
    options: [
      { value: 'stil',   label: 'Stil',      icon: '🔇' },
      { value: 'rustig', label: 'Rustig',    icon: '🔈' },
      { value: 'gemid',  label: 'Gemiddeld', icon: '🔉' },
      { value: 'druk',   label: 'Druk',      icon: '🔊' },
    ],
    dbField: 'geluid', optional: true,
  },
  {
    id: 'lichtinval', step: 4, type: 'tiles', grid: 'g4',
    sectionLabel: 'Lichtinval (overall indruk)',
    options: [
      { value: 'zonnig', label: 'Erg licht',  icon: '☀️' },
      { value: 'licht',  label: 'Licht',      icon: '🌤' },
      { value: 'gemid',  label: 'Gemiddeld',  icon: '⛅' },
      { value: 'donker', label: 'Donker',     icon: '🌑' },
    ],
    dbField: 'lichtinval', optional: true,
  },
  {
    id: 'energie_geeft', step: 4, type: 'textarea',
    sectionLabel: 'Wat geeft jou energie in deze woning? (optioneel)',
    placeholder: 'Bijv. de tuin, de buurt, de ruimte, de rust…',
    dbField: 'energie_geeft', optional: true,
  },
  {
    id: 'missing', step: 4, type: 'textarea',
    sectionLabel: 'Wat mis je, of wat stoort je? (optioneel)',
    placeholder: 'Bijv. te groot, trap, drukke straat, slecht geïsoleerd…',
    dbField: 'missing', optional: true,
  },

  // ══ STAP 5: Jouw situatie ════════════════════════════════════════════════════

  {
    id: 'huishoud_type', step: 5, type: 'tiles', grid: 'g2',
    sectionLabel: 'Huishoudsituatie',
    options: [
      { value: 'alleenstaand', label: 'Alleenstaand',         icon: '🧍' },
      { value: 'stel',         label: 'Stel zonder kinderen', icon: '👫' },
      { value: 'stel_kind',    label: 'Stel met kinderen',    icon: '👨‍👩‍👧' },
      { value: 'eenouder',     label: 'Eenoudergezin',        icon: '👩‍👧' },
      { value: 'samen',        label: 'Samenwonend (anders)', icon: '🏠' },
    ],
    dbField: 'huishoud_type', optional: true,
  },
  {
    id: 'leeftijd_cat', step: 5, type: 'chips',
    sectionLabel: 'Leeftijdscategorie hoofdbewoner',
    options: ['< 35 jaar','35–50 jaar','50–65 jaar','65–75 jaar','> 75 jaar'],
    dbField: 'leeftijd_cat', optional: true,
  },
  {
    id: 'woonduur', step: 5, type: 'chips',
    sectionLabel: 'Hoe lang woon je hier al?',
    options: ['< 2 jaar','2–5 jaar','5–10 jaar','10–20 jaar','> 20 jaar'],
    dbField: 'woonduur', optional: true,
  },
  {
    id: 'thuiswerken', step: 5, type: 'toggle',
    sectionLabel: 'Werk &amp; leefstijl',
    label: 'Thuiswerken (geheel of gedeeltelijk)', sublabel: 'Relevant voor behoefte aan werkkamer',
    dbField: 'thuiswerken', optional: true,
  },
  {
    id: 'huisdieren', step: 5, type: 'toggle',
    label: 'Huisdieren aanwezig', sublabel: 'Relevant voor tuin en buurt',
    dbField: 'huisdieren', optional: true,
  },
  {
    id: 'mob_nu', step: 5, type: 'toggle',
    sectionLabel: 'Mobiliteit',
    label: 'Mobiliteitsbeperkingen nu aanwezig', sublabel: 'Bijv. rolstoel, rollator, beperkt ter been',
    dbField: 'mob_nu', optional: true,
  },
  {
    id: 'mob_verwacht', step: 5, type: 'toggle',
    label: 'Mobiliteitsbeperking te verwachten', sublabel: 'Binnen 5–10 jaar — relevant voor gelijkvloers wonen',
    dbField: 'mob_verwacht', optional: true,
  },
  {
    id: 'verhuisbereidheid', step: 5, type: 'slider',
    sectionLabel: 'Verhuisbereidheid — hoe open sta je voor verandering?',
    min: 1, max: 5, default: 3,
    endLabels: ['Zeker niet','Actief zoekend'],
    descriptions: ['Zeker niet verhuizen','Waarschijnlijk niet','Misschien, als het klopt','Open voor verhuizing','Actief op zoek'],
    dbField: 'verhuisbereidheid', optional: true,
  },
  {
    id: 'situatie_vrij', step: 5, type: 'textarea',
    sectionLabel: 'Bijzondere omstandigheden (optioneel)',
    placeholder: 'Bijv. zorgsituatie, scheiding, terugkeer vanuit buitenland, mantelzorg…',
    dbField: 'situatie_vrij', optional: true,
  },

  // ══ STAP 6: Woonwensen ═══════════════════════════════════════════════════════

  {
    id: 'gewenst_type', step: 6, type: 'tiles', grid: 'g2',
    sectionLabel: 'Gewenst woningtype',
    options: [
      { value: 'vergelijkbaar', label: 'Vergelijkbaar',      icon: '↔️' },
      { value: 'kleiner',       label: 'Kleiner',            icon: '⬇️' },
      { value: 'gelijkvloers',  label: 'Gelijkvloers',       icon: '♿' },
      { value: 'groter',        label: 'Groter',             icon: '⬆️' },
      { value: 'appartement',   label: 'Appartement',        icon: '🏢' },
      { value: 'grondgeb',      label: 'Grondgebonden',      icon: '🏠' },
      { value: 'zorg',          label: 'Zorggeschikt',       icon: '🏥' },
      { value: 'weet_niet',     label: 'Weet ik nog niet',   icon: '🤷' },
    ],
    dbField: 'gewenst_type', optional: true,
  },
  {
    id: 'gew_opp', step: 6, type: 'chips',
    sectionLabel: 'Gewenst woonoppervlak (minimaal)',
    options: ['Maakt niet uit','> 50 m²','> 75 m²','> 100 m²','> 125 m²','> 150 m²','> 200 m²'],
    dbField: 'gew_opp', optional: true,
  },
  {
    id: 'gewenste_locatie', step: 6, type: 'chips',
    sectionLabel: 'Zoekradius',
    options: ['Zelfde wijk','Zelfde gemeente','Tot 5 km','Tot 15 km','Tot 30 km','Heel Nederland'],
    dbField: 'gewenste_locatie', optional: true,
  },
  {
    id: 'musthaves', step: 6, type: 'chips', multi: true,
    sectionLabel: 'Must-haves in nieuwe woning',
    options: ['Tuin','Gelijkvloers','Lift','Garage/oprit','Stille buurt','Nabij OV','Nabij scholen','Nabij zorg','Energiezuinig','Laadpaal','Zonnepanelen','Balkon/terras'],
    dbField: 'musthaves', optional: true,
  },
  {
    id: 'gew_energie', step: 6, type: 'chips', multi: true,
    sectionLabel: 'Gewenst energieprofiel nieuwe woning',
    options: [
      { value: 'egal',     label: 'Maakt niet uit' },
      { value: 'gasloos',  label: 'Gasloos' },
      { value: 'label_a',  label: 'Min. label A' },
      { value: 'zp',       label: 'Zonnepanelen' },
      { value: 'lp',       label: 'Laadpaal mogelijk' },
    ],
    dbField: 'gew_energie', optional: true,
  },
  {
    id: 'gew_tuin', step: 6, type: 'chips',
    sectionLabel: 'Tuin in nieuwe woning',
    options: [
      { value: 'egal',      label: 'Maakt niet uit' },
      { value: 'klein_ok',  label: 'Klein is prima' },
      { value: 'groot',     label: 'Liefst groot' },
      { value: 'balkon',    label: 'Balkon/terras ok' },
      { value: 'geen',      label: 'Geen tuin nodig' },
    ],
    dbField: 'gew_tuin', optional: true,
  },
  {
    id: 'redenen', step: 6, type: 'chips', multi: true,
    sectionLabel: 'Redenen om te verhuizen (meerdere mogelijk)',
    options: ['Te groot geworden','Te klein','Gelijkvloers wonen','Dichter bij familie','Dichter bij voorzieningen','Lagere woonlasten','Andere buurt','Zorggeschikte woning','Meer buitenruimte','Werklocatie veranderd','Leefbaarheid buurt','Anders'],
    dbField: 'redenen', optional: true,
  },
  {
    id: 'opmerkingen', step: 6, type: 'textarea',
    sectionLabel: 'Aanvullende woonwensen (vrij veld, optioneel)',
    placeholder: 'Bijv. begane grond, dicht bij kleinkind, rustige straat, geen flat…',
    dbField: 'opmerkingen', optional: true,
  },
];
