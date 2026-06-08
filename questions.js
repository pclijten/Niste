// questions.js — Niste Wooncheck vragenconfig (v2)
//
// ─── TWEE MODI ──────────────────────────────────────────────────────────────
//   KORT  → snel kennismaken (~15 vragen). Toont alleen vragen met short: true.
//   LANG  → volledig profiel. Toont alle vragen.
//
//   De korte versie is een STRIKTE SUBSET van de lange: zelfde id's en dbField's.
//   Wie kort invult kan later naadloos "aanvullen naar volledig" zonder iets
//   opnieuw te doen — de matching gebruikt in beide gevallen dezelfde velden.
//
//   Filteren in je renderer:
//     const visible = QUESTIONS.filter(q => mode === 'lang' ? true : q.short);
//   Stappen voor de korte modus opnieuw nummeren:
//     de helper buildSteps(mode) onderaan dit bestand doet dat automatisch.
//
// ─── HOE GEBRUIK JE DIT BESTAND ──────────────────────────────────────────────
//   Vraag toevoegen   → object toevoegen aan QUESTIONS
//   Vraag verwijderen → object weghalen (Firestore-veld blijft intact)
//   In korte versie   → short: true toevoegen
//   Opties wijzigen   → options array aanpassen
//   Naar andere stap  → step getal aanpassen (0–6, lange-versie indeling)
//
// ─── VRAAGTYPEN ───────────────────────────────────────────────────────────────
//   postcode | tiles (g2/g3/g4) | chips (multi:true) | counter (maxRef)
//   toggle | scale (ends:[links,rechts]) | slider | textarea | computed_badge
//
// ─── CONDITIONEEL ─────────────────────────────────────────────────────────────
//   showIf: { key: 'andere_vraag_id', value: true }

// ─── STAP TITELS (lange versie) ───────────────────────────────────────────────
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
    desc:    'Een energieprofiel helpt ons te matchen op duurzaamheidswensen.',
  },
  {
    eyebrow: 'Stap 5 van 7 — Buurt &amp; beleving',
    title:   'Hoe <em>voelt</em> het hier?',
    desc:    'Subjectieve woonbeleving speelt een grote rol bij verhuisbereidheid. Geen goede of foute antwoorden.',
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

// Titels voor de KORTE versie (3 compacte stappen).
export const SHORT_STEP_TITLES = [
  {
    eyebrow: 'Stap 1 van 3 — Jouw woning nu',
    title:   'Waar woon je <em>nu</em>?',
    desc:    'Een paar basics. Geen adres — alleen wat nodig is voor een eerste match.',
  },
  {
    eyebrow: 'Stap 2 van 3 — Hoe past het?',
    title:   'Past je woning nog bij <em>je leven</em>?',
    desc:    'Niet wat je hebt, maar hoe goed het nog klopt.',
  },
  {
    eyebrow: 'Stap 3 van 3 — Wat zoek je?',
    title:   'In welke richting <em>denk je</em>?',
    desc:    'Nog niks concreets nodig. Een richting is genoeg.',
  },
];

// ─── VRAGENLIJST ──────────────────────────────────────────────────────────────
export const QUESTIONS = [

  // ══ STAP 0: Jouw woning ══════════════════════════════════════════════════════

  {
    id: 'postcode', step: 0, type: 'postcode',
    sectionLabel: 'Postcode (4 cijfers — wijk-niveau, geen straat)',
    dbField: 'postcode', optional: true,
    short: true, shortStep: 0,
    enrich: 'bag', // kan later met BAG/EP-online verrijkt worden op postcode
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
    short: true, shortStep: 0,
  },
  {
    id: 'oppervlak', step: 0, type: 'chips',
    sectionLabel: 'Woonoppervlak (gebruiksoppervlak)',
    options: ['< 50 m²','50–75 m²','75–100 m²','100–125 m²','125–150 m²','150–175 m²','175–200 m²','> 200 m²'],
    dbField: 'oppervlak', optional: true,
    short: true, shortStep: 0,
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
    enrich: 'bag',
  },
  {
    id: 'prijs_range', step: 0, type: 'chips',
    sectionLabel: 'Geschatte woningwaarde (indicatief)',
    sublabel: 'Helpt ons bepalen of een woningruil reëel is. Wordt nooit gedeeld met derden en is alleen zichtbaar voor Niste.',
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
    short: true, shortStep: 0,
  },
  {
    id: 'kamers_gebruikt', step: 1, type: 'counter',
    label: 'Dagelijks gebruikte kamers', sublabel: 'Hoeveel kamers gebruik je echt?',
    min: 1, max: 15, maxRef: 'kamers_totaal', default: 3,
    dbField: 'kamers_gebruikt', optional: true,
    short: true, shortStep: 0, // levert samen met kamers_totaal het mismatch-signaal
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
    id: 'gelijkvloers_nu', step: 1, type: 'toggle',
    label: 'Woning is (volledig) gelijkvloers bewoonbaar',
    sublabel: 'Slapen + badkamer op de begane grond mogelijk',
    dbField: 'gelijkvloers_nu', optional: true,
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
    showIf: { key: 'zolder', value: true },
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
    id: 'tuin_bestrating', step: 2, type: 'toggle',
    showIf: { key: 'tuin', value: true },
    label: 'Grotendeels bestraat', sublabel: 'Weinig of geen gras — relevant voor onderhoudslast',
    dbField: 'tuin_bestrating', optional: true,
  },
  // Samengevoegd: vijver/sproei/overkapping/verlichting waren losse toggles met
  // weinig matchwaarde. Nu één multi-chip "extra's" — scheelt 4 vragen.
  {
    id: 'tuin_extras', step: 2, type: 'chips', multi: true,
    sectionLabel: 'Extra’s in de tuin (optioneel)',
    showIf: { key: 'tuin', value: true },
    options: ['Vijver','Sproeisysteem','Overkapping/veranda','Buitenverlichting'],
    dbField: 'tuin_extras', optional: true,
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
  // Samengevoegd: carport + garage waren losse toggles.
  {
    id: 'parkeer_voorz', step: 2, type: 'chips', multi: true,
    showIf: { key: 'parkeer_eigen', value: true },
    sectionLabel: 'Parkeervoorzieningen',
    options: ['Carport','Garage'],
    dbField: 'parkeer_voorz', optional: true,
  },
  {
    id: 'schuur', step: 2, type: 'chips',
    sectionLabel: 'Schuur / berging / bijgebouw',
    options: ['Geen schuur','Klein (< 6 m²)','Middel (6–15 m²)','Groot (> 15 m²)'],
    dbField: 'schuur', optional: true,
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
    enrich: 'ep_online', // veelal af te leiden uit EP-online op postcode+huisnr
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
    id: 'laadpaal', step: 3, type: 'chips',
    sectionLabel: 'Laadpaal',
    options: [
      { value: 'ja',     label: 'Aanwezig' },
      { value: 'kan',    label: 'Eenvoudig te plaatsen' },
      { value: 'nee',    label: 'Niet aanwezig' },
    ],
    dbField: 'laadpaal', optional: true,
  },
  {
    id: 'isolatie', step: 3, type: 'chips', multi: true,
    sectionLabel: 'Isolatie — wat is aanwezig?',
    options: ['Dakisolatie','Spouwmuurisolatie','Vloerisolatie','Dubbel glas','HR++ glas','Triple glas'],
    dbField: 'isolatie', optional: true,
  },
  {
    id: 'vloerverwarming', step: 3, type: 'toggle',
    label: 'Vloerverwarming aanwezig', sublabel: 'Geheel of gedeeltelijk',
    dbField: 'vloerverwarming', optional: true,
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

  // ══ STAP 4: Buurt & beleving ═════════════════════════════════════════════════
  // Opgeschoond: dubbele constructen verwijderd.
  //   - 'licht' (scale) verwijderd → 'lichtinval' (tiles) blijft
  //   - 'geluidsoverlast' (scale) verwijderd → 'geluid' (tiles) blijft
  //   - 'rust' (scale) blijft (binnenshuis), los van buurt-geluid
  // 'emotie_vs_ratio' step-bug gefixt: hoort hier (stap 4), niet bij wensen.

  {
    id: 'buurt_type', step: 4, type: 'tiles', grid: 'g2',
    sectionLabel: 'Type buurt waar je nu woont',
    options: [
      { value: 'dorps',     label: 'Dorps / rustig',       icon: '🌳' },
      { value: 'suburb',    label: 'Woonwijk / gezin',     icon: '🏘️' },
      { value: 'stedelijk', label: 'Stedelijk / levendig', icon: '🏙️' },
      { value: 'landelijk', label: 'Landelijk / vrij',     icon: '🌾' },
    ],
    dbField: 'buurt_type', optional: true,
  },
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

  // ── NIEUW: functionele omgeving (matchbaar, niet alleen beleving) ──
  {
    id: 'voorz_nabij', step: 4, type: 'chips', multi: true,
    sectionLabel: 'Wat is nu op loop-/fietsafstand? (meerdere mogelijk)',
    sublabel: 'Voor matching belangrijker dan gevoel — vooral bij gelijkvloers/zorg',
    options: ['Supermarkt','Huisarts/apotheek','Ziekenhuis','OV-halte','Basisschool','Kinderopvang','Groen/park','Horeca/winkels centrum'],
    dbField: 'voorz_nabij', optional: true,
  },
  {
    id: 'auto_afh', step: 4, type: 'chips',
    sectionLabel: 'Hoe afhankelijk ben je van een auto?',
    sublabel: 'Bepaalt of een woning verder van voorzieningen haalbaar is',
    options: [
      { value: 'geen_auto', label: 'Geen auto' },
      { value: 'ov',        label: 'Vooral OV/fiets' },
      { value: 'mix',       label: 'Mix' },
      { value: 'auto',      label: 'Auto-afhankelijk' },
    ],
    dbField: 'auto_afh', optional: true,
  },
  {
    id: 'binding_locatie', step: 4, type: 'chips', multi: true,
    sectionLabel: 'Bindt iets je aan deze plek?',
    sublabel: 'Helpt ons begrijpen waarom je wel/niet uit de buurt wilt',
    options: ['Familie dichtbij','Mantelzorg geven','Mantelzorg ontvangen','Sociaal netwerk','Werk/school','Niks bijzonders'],
    dbField: 'binding_locatie', optional: true,
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
  {
    id: 'emotie_vs_ratio', step: 4, type: 'scale',
    sectionLabel: 'Emotie vs ratio',
    label: 'Als je eerlijk bent: blijf je hier uit gevoel of omdat het logisch is?',
    ends: ['Puur praktisch','Puur gevoel'],
    dbField: 'emotie_vs_ratio', optional: true,
  },
  {
    id: '_buurt_binding_badge', step: 4, type: 'computed_badge',
    compute: 'buurt_binding',
    dbField: null, optional: true,
  },
  {
    id: '_verhuisdrempel_badge', step: 5, type: 'computed_badge',
    compute: 'verhuisdrempel',
    dbField: null, optional: true,
  },
  {
    id: 'frictie_score', step: 4, type: 'scale',
    sectionLabel: 'Mismatch',
    label: 'Hoe goed past deze woning nog bij je leven?',
    sublabel: 'Niet wat je hebt — maar hoe goed het nog klopt',
    ends: ['Past totaal niet','Past perfect'],
    dbField: 'frictie_score', optional: true,
    short: true, shortStep: 1,
  },
  {
    id: 'trigger', step: 4, type: 'chips', multi: true,
    sectionLabel: 'Wat zou jou doen verhuizen?',
    options: [
      'Als er iets beters voorbij komt',
      'Als ik gelijkvloers kan wonen',
      'Als onderhoud minder wordt',
      'Als locatie beter is',
      'Als het financieel aantrekkelijk is',
      'Als gezinssituatie verandert',
      'Ik wil sowieso verhuizen',
    ],
    dbField: 'trigger', optional: true,
    short: true, shortStep: 1,
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
    short: true, shortStep: 1,
  },
  {
    id: 'leeftijd_cat', step: 5, type: 'chips',
    sectionLabel: 'Leeftijdscategorie hoofdbewoner',
    options: ['< 35 jaar','35–50 jaar','50–65 jaar','65–75 jaar','> 75 jaar'],
    dbField: 'leeftijd_cat', optional: true,
    short: true, shortStep: 1,
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
    short: true, shortStep: 1,
  },
  {
    id: 'woonlast_beleving', step: 5, type: 'scale',
    sectionLabel: 'Financieel',
    label: 'Hoe ervaar je je woonlasten?',
    ends: ['Zeer zwaar','Goed betaalbaar'],
    dbField: 'woonlast_beleving', optional: true,
  },
  {
    id: 'koop_huur', step: 5, type: 'chips',
    sectionLabel: 'Woon je in een koop- of huurwoning?',
    sublabel: 'Bepaalt welke doorstroomketen mogelijk is',
    options: [
      { value: 'koop',        label: 'Koopwoning' },
      { value: 'huur_corp',   label: 'Huur (corporatie)' },
      { value: 'huur_part',   label: 'Huur (particulier)' },
    ],
    dbField: 'koop_huur', optional: true,
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
      { value: 'kleiner',       label: 'Kleiner / passend', icon: '⬇️' },
      { value: 'gelijkvloers',  label: 'Gelijkvloers',       icon: '♿' },
      { value: 'groter',        label: 'Groter',             icon: '⬆️' },
      { value: 'appartement',   label: 'Appartement',        icon: '🏢' },
      { value: 'grondgeb',      label: 'Grondgebonden',      icon: '🏠' },
      { value: 'zorg',          label: 'Zorggeschikt',       icon: '🏥' },
      { value: 'weet_niet',     label: 'Weet ik nog niet',   icon: '🤷' },
    ],
    dbField: 'gewenst_type', optional: true,
    short: true, shortStep: 2,
  },
  {
    id: 'gewenst_woonmilieu', step: 6, type: 'tiles', grid: 'g2',
    sectionLabel: 'In wat voor omgeving wil je terecht?',
    sublabel: 'Mag gelijk zijn aan nu — dan weten we dat je in de buurt wilt blijven',
    options: [
      { value: 'dorps',     label: 'Dorps / rustig',       icon: '🌳' },
      { value: 'suburb',    label: 'Woonwijk',             icon: '🏘️' },
      { value: 'stedelijk', label: 'Stedelijk / levendig', icon: '🏙️' },
      { value: 'landelijk', label: 'Landelijk',            icon: '🌾' },
      { value: 'egal',      label: 'Maakt niet uit',       icon: '🤷' },
    ],
    dbField: 'gewenst_woonmilieu', optional: true,
    short: true, shortStep: 2,
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
    sublabel: 'Matching werkt alleen als we weten hoe ver u bereid bent te kijken. Hoe dichter bij, hoe relevanter de match.',
    options: ['Zelfde wijk','Zelfde gemeente','Tot 5 km','Tot 15 km','Tot 30 km','Heel Nederland'],
    dbField: 'gewenste_locatie', optional: true,
    short: true, shortStep: 2,
  },
  {
    id: 'voorz_wens', step: 6, type: 'chips', multi: true,
    sectionLabel: 'Wat moet in de nieuwe omgeving dichtbij zijn?',
    sublabel: 'De omgevings-tegenhanger van je must-haves',
    options: ['Supermarkt','Huisarts/apotheek','Ziekenhuis/zorg','OV-halte','Basisschool','Kinderopvang','Groen/park','Familie','Maakt niet uit'],
    dbField: 'voorz_wens', optional: true,
  },
  {
    id: 'musthaves', step: 6, type: 'chips', multi: true,
    sectionLabel: 'Must-haves in nieuwe woning',
    options: ['Tuin','Gelijkvloers','Lift','Garage/oprit','Stille buurt','Energiezuinig','Laadpaal','Zonnepanelen','Balkon/terras'],
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
    id: 'tradeoff_ruimte_locatie', step: 6, type: 'scale',
    sectionLabel: 'Wat vind je belangrijker?',
    label: 'Grootte van de woning vs betere locatie',
    ends: ['Grootte woning','Betere locatie'],
    dbField: 'tradeoff_ruimte_locatie', optional: true,
  },
  {
    id: 'tradeoff_rust_voorzieningen', step: 6, type: 'scale',
    label: 'Rust vs voorzieningen dichtbij',
    ends: ['Rust en ruimte','Alles dichtbij'],
    dbField: 'tradeoff_rust_voorzieningen', optional: true,
  },
  {
    id: 'tradeoff_onderhoud', step: 6, type: 'scale',
    label: 'Nieuw/onderhoudsarm vs karakter/ruimte',
    ends: ['Nieuw en makkelijk','Karakter en ruimte'],
    dbField: 'tradeoff_onderhoud', optional: true,
  },
  {
    id: 'opmerkingen', step: 6, type: 'textarea',
    sectionLabel: 'Aanvullende woonwensen (vrij veld, optioneel)',
    placeholder: 'Bijv. begane grond, dicht bij kleinkind, rustige straat, geen flat…',
    dbField: 'opmerkingen', optional: true,
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
//
// Geeft de zichtbare vragen voor een modus.
//   mode: 'kort' | 'lang'
export function getQuestions(mode = 'lang') {
  if (mode === 'kort') {
    return QUESTIONS
      .filter(q => q.short)
      .map(q => ({ ...q, step: q.shortStep })); // hernummer naar korte stappen
  }
  return QUESTIONS;
}

// Geeft de juiste staptitels voor een modus.
export function getStepTitles(mode = 'lang') {
  return mode === 'kort' ? SHORT_STEP_TITLES : STEP_TITLES;
}
