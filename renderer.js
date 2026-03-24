// renderer.js — Niste vraag-renderer
//
// Dit bestand weet HOE vragen getekend worden, maar niet WELKE vragen er zijn.
// Alle onderdelen zijn pure functies die HTML strings teruggeven.
// Event handlers refereren aan window.N (opgezet in intake.html).
//
// BEREKENDE BADGES — voeg hier nieuwe compute-functies toe:
const COMPUTED = {
  mismatch(state) {
    const delta = (state.kamers_totaal ?? 4) - (state.kamers_gebruikt ?? 3);
    if (delta < 2) return null;
    return `⚡ ${delta} kamer${delta > 1 ? 's' : ''} ongebruikt — sterk matchsignaal voor matching`;
  },
};

// ─── ENKELVOUDIGE VRAAGRENDERERS ──────────────────────────────────────────────

function rPostcode(q, state) {
  const v = (state[q.id] || '').replace(/\D/g, '').slice(0, 4);
  return `<input class="field" type="text" inputmode="numeric" maxlength="4"
    placeholder="bijv. 5737" value="${v}"
    oninput="N.si('${q.id}',this.value.replace(/\\D/g,'').slice(0,4))">`;
}

function rTiles(q, state) {
  const grid = q.grid || 'g2';
  const items = q.options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    const ic = typeof o === 'object' ? (o.icon || '') : '';
    const sel = (state[q.id] ?? '') === v;
    return `<div class="tile${sel ? ' sel' : ''}" onclick="N.tc('${q.id}','${v}',false)">
      ${ic ? `<span class="ti">${ic}</span>` : ''}<span>${l}</span>
    </div>`;
  }).join('');
  return `<div class="tg ${grid}">${items}</div>`;
}

function rChips(q, state) {
  const multi = q.multi || false;
  const items = q.options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    const sel = multi
      ? (state[q.id] || []).includes(v)
      : (state[q.id] ?? '') === v;
    return `<div class="chip${sel ? ' sel' : ''}" onclick="N.tc('${q.id}','${v}',${multi})">${l}</div>`;
  }).join('');
  return `<div class="cr">${items}</div>`;
}

function rCounter(q, state) {
  const maxVal = q.maxRef ? (state[q.maxRef] ?? q.max) : q.max;
  const v = Math.min(state[q.id] ?? q.default ?? 0, maxVal);
  return `<div class="crow">
    <div>
      <div class="clabel">${q.label}</div>
      ${q.sublabel ? `<div class="csub">${q.sublabel}</div>` : ''}
    </div>
    <div class="cctrl">
      <button class="cbtn" onclick="N.ct('${q.id}',-1,${q.min ?? 0},${maxVal})"
        ${v <= (q.min ?? 0) ? 'disabled' : ''}>−</button>
      <span class="cval">${v}</span>
      <button class="cbtn" onclick="N.ct('${q.id}',1,${q.min ?? 0},${maxVal})"
        ${v >= maxVal ? 'disabled' : ''}>+</button>
    </div>
  </div>`;
}

function rToggle(q, state) {
  const on = state[q.id] === true;
  return `<div class="trow">
    <div>
      <div class="tlabel">${q.label}</div>
      ${q.sublabel ? `<div class="tsub">${q.sublabel}</div>` : ''}
    </div>
    <button class="tog${on ? ' on' : ''}" onclick="N.tt('${q.id}')" aria-pressed="${on}"></button>
  </div>`;
}

function rScale(q, state) {
  const v = state[q.id] ?? 0;
  const btns = [1, 2, 3, 4, 5].map(n =>
    `<button class="scbtn${v === n ? ' sel' : ''}" onclick="N.sc('${q.id}',${n})">${n}</button>`
  ).join('');
  return `<div class="scblock">
    <div class="scq">${q.label}</div>
    ${q.sublabel ? `<div class="scsub">${q.sublabel}</div>` : ''}
    <div class="scrow">${btns}</div>
    <div class="sc-ends"><span>${q.ends[0]}</span><span>${q.ends[1]}</span></div>
  </div>`;
}

function rSlider(q, state) {
  const v = state[q.id] ?? q.default ?? 3;
  const pct = ((v - 1) / (q.max - q.min) * 100).toFixed(0);
  const descsJson = JSON.stringify(q.descriptions);
  return `<div class="sw">
    <div class="sl-labels"><span>${q.endLabels[0]}</span><span>${q.endLabels[1]}</span></div>
    <input type="range" id="sli-${q.id}" min="${q.min}" max="${q.max}" step="1"
      style="--pct:${pct}%" value="${v}"
      oninput="N.sl('${q.id}',this.value,${descsJson})">
    <div class="slval" id="slv-${q.id}">${v}/${q.max}</div>
    <div class="sldesc" id="sld-${q.id}">${q.descriptions[v - 1]}</div>
  </div>`;
}

function rTextarea(q, state) {
  const v = (state[q.id] || '').replace(/"/g, '&quot;');
  return `<textarea class="field" placeholder="${q.placeholder || ''}"
    oninput="N.si('${q.id}',this.value)">${state[q.id] || ''}</textarea>`;
}

function rComputedBadge(q, state) {
  const fn = COMPUTED[q.compute];
  const msg = fn ? fn(state) : null;
  return msg ? `<div class="mm-badge">${msg}</div>` : '';
}

// ─── DISPATCHER ───────────────────────────────────────────────────────────────

function renderQuestion(q, state) {
  switch (q.type) {
    case 'postcode':       return rPostcode(q, state);
    case 'tiles':          return rTiles(q, state);
    case 'chips':          return rChips(q, state);
    case 'counter':        return rCounter(q, state);
    case 'toggle':         return rToggle(q, state);
    case 'scale':          return rScale(q, state);
    case 'slider':         return rSlider(q, state);
    case 'textarea':       return rTextarea(q, state);
    case 'computed_badge': return rComputedBadge(q, state);
    default:               return `<!-- onbekend type: ${q.type} -->`;
  }
}

// ─── STAP RENDERER ────────────────────────────────────────────────────────────
// Rendert alle vragen voor één stap, inclusief groepering en sectie-labels.

export function renderStep(stepIndex, questions, state, stepMeta) {
  const meta = stepMeta[stepIndex];

  // Filter: alleen vragen voor deze stap én waarvan showIf geldig is
  const visible = questions.filter(q => {
    if (q.step !== stepIndex) return false;
    if (!q.showIf) return true;
    const sv = state[q.showIf.key];
    const target = q.showIf.value;
    // Boolean toggles: undefined → false
    const actual = sv === undefined ? (typeof target === 'boolean' ? false : undefined) : sv;
    return actual === target;
  });

  let html = `
    <div class="ey">${meta.eyebrow}</div>
    <h1 class="st">${meta.title}</h1>
    <p class="sd">${meta.desc}</p>
    <div class="skip-notice">💡 Alle vragen zijn optioneel. Hoe meer je invult, hoe beter de match.</div>
  `;

  // Groepeer aaneengesloten counters en toggles in een wrapper-div
  // zodat ze visueel als lijst worden weergegeven
  let openGroup = null; // 'counter' | 'toggle' | null

  function closeGroup() {
    if (openGroup) { html += '</div>'; openGroup = null; }
  }

  for (const q of visible) {
    // Sectie-label sluit open groep
    if (q.sectionLabel) {
      closeGroup();
      html += `<div class="sl">${q.sectionLabel}</div>`;
    }

    // Groep-logica
    if (q.type === 'counter') {
      if (openGroup !== 'counter') { closeGroup(); html += '<div class="cnt-grp">'; openGroup = 'counter'; }
    } else if (q.type === 'toggle') {
      if (openGroup !== 'toggle') { closeGroup(); html += '<div class="tog-grp">'; openGroup = 'toggle'; }
    } else {
      closeGroup();
    }

    html += renderQuestion(q, state);
  }

  closeGroup();
  return html;
}

// ─── VOLLEDIGHEID BEREKENING ──────────────────────────────────────────────────
// Berekent percentage op basis van ingevulde dbFields

export function calcCompleteness(questions, state) {
  const fields = questions
    .filter(q => q.dbField)
    .map(q => q.dbField);

  const filled = fields.filter(f => {
    const v = state[f];
    if (v === undefined || v === null || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });

  return Math.round((filled.length / fields.length) * 100);
}

// ─── SAMENVATTING VOOR RESULTAATSCHERM ────────────────────────────────────────

export function buildSummary(questions, state) {
  const summaryFields = [
    'woning_type','oppervlak','bouwjaar','energielabel','prijs_range',
    'kamers_totaal','kamers_gebruikt','tuin','tuin_grootte',
    'parkeer_eigen','garage','schuur',
    'verwarm','gasloos','zonnepanelen','laadpaal',
    'huishoud_type','leeftijd_cat','woonduur',
    'gewenst_type','gewenste_locatie',
  ];

  return summaryFields.map(field => {
    const q = questions.find(x => x.dbField === field);
    if (!q) return null;
    const raw = state[field];
    if (raw === undefined || raw === null || raw === '') return null;

    // Resolve label voor tiles/chips met value/label objecten
    let display = raw;
    if (q.options && typeof raw === 'string') {
      const opt = q.options.find(o => (typeof o === 'object' ? o.value : o) === raw);
      if (opt) display = typeof opt === 'object' ? opt.label : opt;
    }
    if (typeof raw === 'boolean') display = raw ? 'Ja' : 'Nee';

    return { key: q.sectionLabel || q.label || field, val: display };
  }).filter(Boolean);
}
