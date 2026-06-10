# Niste — Wijzigingen 10 juni 2026 (investor-readiness fixes)

## Wat is er veranderd

### 1. NIEUW: `pc4geo.js` — echte afstanden (98 KB)
PC4-centroïden voor alle 4.073 Nederlandse postcodegebieden + haversine-afstandsberekening.
Bron: peterarends/Nederlandse-viercijferige-postcode-pc4-naar-geolocatie (MIT, gebaseerd op BAG).
Bevat géén persoonsgegevens — alleen publieke gebiedszwaartepunten.

### 2. GEWIJZIGD: `matching.js` → v3.1 (geo-fix)
- `geoScore()` werkt nu op echte kilometers: zelfde PC4 = 25 pt, ≤2 km = 22,
  ≤5 km = 18, ≤10 km = 12, ≤20 km = 7, ≤35 km = 3.
- `locatieOk()`: "Tot 5/15/30 km" zijn nu écht 5/15/30 km (waren voorheen
  identiek door de postcodecijfer-heuristiek). "Zelfde gemeente" is benaderd
  als ≤7 km — gedocumenteerde proxy, later vervangbaar door een CBS
  PC4→gemeente-tabel.
- Onbekende postcode → automatische fallback naar de oude cijferlogica.
- Getest: Aarle-Rixtel (5735) × Helmond (5701) = 3,6 km → match (63);
  zelfde profiel × Amsterdam (1011, 112 km) → correct gefilterd.

### 3. NIEUW: `firestore.rules` — server-side beveiliging
De ADMIN_EMAILS-lijst in admin.html was alleen client-side zichtbaar en
beschermde niets. Deze rules zijn de échte beveiliging:
- Deelnemers lezen/schrijven uitsluitend hun eigen users/households/messages.
- Matches: alleen zichtbaar voor de twee betrokken huishoudens + admin;
  deelnemers mogen alleen `user_feedback` bijwerken.
- Threads (anonieme chat): alleen voor participants; berichten zijn
  onveranderlijk voor deelnemers (moderatiespoor); alleen admin opent threads.
- Admin via geverifieerd e-mailadres (pclijten@ / eplijten@gmail.com).
- Default deny op alles wat niet expliciet is toegestaan.

⚠️ DEPLOYEN VEREIST — dit gaat niet automatisch mee met GitHub Pages:
   Firebase Console → Firestore Database → Rules → inhoud van firestore.rules
   plakken → Publish. Test daarna met de Rules Playground:
   - household lezen als andere user → DENY
   - eigen household lezen → ALLOW
   - match lezen als household_a → ALLOW

### 4. GEWIJZIGD: `dashboard.html` — AVG-bug bij accountverwijdering
De verwijderflow zocht matches op een veld `userId` dat niet bestaat
(matches gebruiken `household_a`/`household_b`). Gevolg: matches werden
nooit gewist bij accountverwijdering. Nu worden beide kanten opgevraagd
en verwijderd. Tevens `noindex` toegevoegd.

### 5. SEO/Social: meta descriptions + Open Graph op alle publieke pagina's
index, over, lvi_model, onderbouwing, privacy, aanmelden, intake hebben nu:
- unieke meta description (belangrijk vóór de LinkedIn-serie: shares tonen
  nu een nette preview i.p.v. een kale link)
- og:title/description/url/locale + twitter card + canonical URL
admin.html en dashboard.html: `noindex, nofollow`.

### 6. Opgeruimd & gerepareerd
- VERWIJDERD: `intakeoud.html`, `questionsoud.js`, `rendereroud.js`
  (legacy, stond live op productie). Verwijder ze ook uit de GitHub-repo.
- `robots.txt`: aanmelden.html is niet langer geblokkeerd — dat is je
  wervingspagina en het doel van de LinkedIn-CTA.
- `sitemap.xml`: aanmelden.html toegevoegd, lastmod bijgewerkt.
- Google Analytics: script laadde met placeholder-ID `G-XXXXXXXXXX` terwijl
  de config `G-G76HYMMP86` gebruikte — nu consistent op alle 8 pagina's.

## Deploy-checklist
1. Alle bestanden uit deze map naar de GitHub-repo (root) — overschrijven.
2. De drie *oud-bestanden uit de repo VERWIJDEREN (git rm).
3. `firestore.rules` publiceren in de Firebase Console (zie punt 3 hierboven).
4. Na deploy testen:
   - https://niste.nl in de LinkedIn Post Inspector → preview moet titel +
     beschrijving tonen
   - admin.html: matching draaien → scores moeten nu afstandsgevoelig zijn
   - dashboard als testdeelnemer: eigen profiel zichtbaar, andermans niet

## Nog open (volgende sessies)
- Cloud Function voor matching + e-mailnotificaties (lost ook de
  e-mailopslag-architectuurvraag op)
- Funnel-instrumentatie met events (wooncheck gestart/afgerond/opt-in)
- Koude-start messaging in dashboard ("X huishoudens in jouw gebied")
- Keten-view in admin (doorstroomketens handmatig koppelen)
