# Namens-Puzzle – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Startseite von benjaminbaumsc.github.io durch ein Physik-Spielzeug ersetzen. Zwölf 3D-Scrabble-Steine (BENJAMIN BAUM) liegen auf einer Blaupause, rasten in eine Feldreihe ein, und drei versteckte Geheimnisse lösen Animationen aus.

**Architecture:** Statische Seite ohne Build-Schritt. Spielregeln, Layout und Eingabe-Erkennung sind reine ES-Module ohne DOM und werden mit `node --test` getestet. Matter.js simuliert die Steine in 2D (Pixel-Koordinaten, y nach unten), Three.js rendert sie als 3D-Körper auf einem transparenten Canvas über einem CSS-Blaupausen-Hintergrund. Comic-Wörter, Schriftfeld, Dreh-Hinweis und Belohnungen laufen als HTML/CSS-Overlay.

**Tech Stack:** HTML, CSS, ES-Module · Three.js 0.169.0 (jsDelivr, Import-Map) · Matter.js 0.20.0 (cdnjs, klassisches Script, global `Matter`) · Node 22 `node:test` für die Unit-Tests (keine npm-Abhängigkeit).

**Spec:** `docs/superpowers/specs/2026-10-16-name-puzzle-design.md`. Die Executors lesen Spec und Plan zusammen. Farben, Texte und Verhalten stehen im Spec und werden hier nicht wiederholt, sofern der Plan sie nicht festlegt.

## Global Constraints

- Keine weiteren Dependencies außer Three.js `0.169.0` und Matter.js `0.20.0`, keine Web-Fonts, kein npm, kein Build.
- CDN-URLs (geprüft am 16.10.2026, HTTP 200):
  - `https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js`
  - `https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/` (Addons, z. B. `geometries/RoundedBoxGeometry.js`)
  - `https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js`
- Kein Ton, kein Tracking, keine Links oder Kontaktdaten, kein Hinweistext auf die Geheimnisse.
- Texte exakt wie im Spec: `FIG. 2 — SPIELFELD, SCHNITT A–A`, `PROJ: BENJAMINBAUMSC`, `DWG: THE CAKE IS A LIE`, `REV: 0.1 · BL. 1/1`, `KLACK!`, `PLOPP!`, `Hallo, Freund.`, `the cake was a lie`, `FIG. 3 — BITTE DREHEN`.
- Code, Identifier, Kommentare und Commit-Messages auf Englisch. Commits ohne Co-Authored-By.
- `/helupoc/` bleibt unverändert (verifiziert: Es referenziert nichts aus dem Root).
- Push nur auf den Feature-Branch `claude/github-io-page-ideas-a951e6`. Merge auf `main`, also das Live-Deployment, nur mit Benjamins OK.
- Lokaler Server für Browser-Tests: `python3 -m http.server 8765` im Repo-Root. ES-Module laufen nicht über `file://`. Für Browser-Tests Claude in Chrome verwenden, nicht den eingebauten Browser.

## Review Focus

1. **Wort bleibt liegen:** BENNI liegt nach der Belohnung weiter in der Reihe. Die Belohnung darf nicht in jedem Frame erneut feuern, sondern erst wieder, wenn das Wort neu gebildet wird. Abgedeckt durch einen Test in Task 1 (`createWordWatcher`).
2. **Fenstergröße ändern oder Handy drehen mit eingerasteten Steinen:** Eingerastete Steine bleiben in ihrem Feld, freie Steine bleiben im Bild. Abgedeckt durch einen Layout-Test in Task 2 und einen manuellen Schritt in Task 4.
3. **Stein mit voller Wucht nach oben oder seitlich geworfen:** Der Stein kommt zurück. Abgedeckt durch einen Test in Task 2 (`isOutside`) und einen manuellen Schritt in Task 3.
4. **Eingaben während einer Belohnung** (Ziehen, Konami-Tasten, Antippen): Sie werden ignoriert und zählen danach nicht mit. Abgedeckt durch einen Test in Task 1 (`reset`) und einen manuellen Schritt in Task 5.
5. **Tab im Hintergrund, danach zurück:** Kein Physik-Sprung und kein Durchtunneln des Bodens. Der Delta-Wert wird auf ≤ 1000/60 ms begrenzt. Abgedeckt durch einen Test in Task 2 (`clampDelta`).

---

### Task 1: Reine Spielregeln (Config, Wörter, Einrasten, Konami)

**Files:**
- Create: `js/config.js`, `js/rules.js`, `tests/rules.test.js`, `.gitignore`

**Interfaces:**
- Produces (`js/config.js`):
  - `TILES: {id: number, letter: string, points: number}[]`: zwölf Einträge in der Reihenfolge B E N J A M I N B A U M, `id` 0–11, Punkte A 1, B 3, E 1, I 1, J 6, M 3, N 1, U 1
  - `FIELD_COUNT = 15`
  - `FIELD_PREMIUMS: ('TW'|'DW'|'TL'|'DL'|null)[]` = TW bei 0, 7, 14 · DL bei 3, 11 · sonst `null`
  - `SECRET_WORDS = ['BENNI', 'NINJA']`
  - `KONAMI_SEQUENCE = ['up','up','down','down','left','right','left','right']`, `KONAMI_TAIL = ['B','A']`, `KONAMI_TIMEOUT_MS = 5000`
  - `MAX_FIELD_SIZE = 64`, `MIN_HIT_SIZE = 40`, `SNAP_MAX_SPEED`, `SNAP_CAPTURE_HEIGHT` (Faktor der Feldgröße oberhalb der Bodenlinie). Die Werte wählt der Builder.
- Produces (`js/rules.js`):
  - `findWord(fieldLetters: (string|null)[], words: string[]) -> {word: string, start: number} | null`
  - `createWordWatcher(words: string[]) -> {update(fieldLetters): string|null}`: liefert ein Wort nur in dem Update, in dem es entsteht
  - `pickSnapField({x, y, speed}, fieldRects: {x,y,w,h}[], occupied: boolean[], floorY: number) -> number`: Feldindex oder `-1`
  - `createKonamiDetector() -> {pushDirection(dir: string, now: number): void, pushTap(letter: string, now: number): boolean, reset(): void}`: `pushTap` gibt `true` zurück, wenn der Code komplett ist
  - `swipeDirection(dx: number, dy: number, minDistance = 30) -> 'up'|'down'|'left'|'right'|null`

- [ ] **Step 1: Write the failing tests** in `tests/rules.test.js` (`node:test`, `node:assert/strict`):
  - `findWord`: `[null,'B','E','N','N','I',null,…]` → `{word:'BENNI', start:1}` · ein Wort am Rand (Start 0 bzw. Ende 14) wird gefunden · `['B','E','N','N','I','A',null,…]` → `null` (BENNIA) · `['N','I','N','J','A',null,…]` → `{word:'NINJA', start:0}` · eine Lücke im Wort → `null` · leere Reihe → `null`
  - `createWordWatcher`: ein Update mit BENNI → `'BENNI'`, dasselbe Array noch einmal → `null`, I entfernen → `null`, I zurück → `'BENNI'`
  - `pickSnapField` (Felder 50 px, `floorY = 300`, Feldoberkante = `floorY`): Center über Feld 2, langsam → `2` · gleiche Position mit `speed` über `SNAP_MAX_SPEED` → `-1` · Feld 2 belegt → `-1` · Center neben der Reihe → `-1` · Center höher als `SNAP_CAPTURE_HEIGHT × Feldgröße` über `floorY` → `-1`
  - `createKonamiDetector`: volle Sequenz, dann `pushTap('B')` → `false`, `pushTap('A')` → `true` · `'up','up','up','down','down',…` (drittes `up` zu viel) wird trotzdem erkannt · Tap `'A'` vor `'B'` → `false` · Tap-Abstand über `KONAMI_TIMEOUT_MS` nach der letzten Richtung → `false` · nach `reset()` zählt eine Teilsequenz von vorher nicht mehr
  - `swipeDirection`: `(0,-80)` → `'up'`, `(90,10)` → `'right'`, `(10,10)` → `null`
- [ ] **Step 2: Run** `node --test tests/` — Expected: FAIL (Module fehlen)
- [ ] **Step 3: Implement** `js/config.js` und `js/rules.js` laut Interfaces. Ein Wort gilt nur, wenn die zusammenhängende Folge belegter Felder von leeren Feldern oder dem Rand begrenzt ist und genau dem Wort entspricht. Beim Konami-Detektor nach einem Fehlschritt prüfen, ob die letzten Eingaben ein Präfix der Sequenz sind (Fall „drittes up“).
- [ ] **Step 4: Run** `node --test tests/` — Expected: alle PASS
- [ ] **Step 5:** `.gitignore` mit `.superpowers/` anlegen.
- [ ] **Step 6: Commit**
```bash
git add .gitignore js/config.js js/rules.js tests/rules.test.js docs/superpowers
git commit -m "feat: add pure game rules for word, snap and konami detection"
```

### Task 2: Layout und Bounds

**Files:**
- Create: `js/layout.js`, `tests/layout.test.js`

**Interfaces:**
- Consumes: `FIELD_COUNT`, `MAX_FIELD_SIZE`, `MIN_HIT_SIZE` aus `js/config.js`
- Produces:
  - `computeLayout(width: number, height: number) -> {width, height, portrait: boolean, fieldSize: number, tileSize: number, hitSize: number, floorY: number, fieldRects: {x,y,w,h}[]}`: Reihe horizontal zentriert, Feld-Oberkante = `floorY`, Felder liegen unterhalb von `floorY` (Slots im Boden), `tileSize ≈ 0.9 × fieldSize`, `hitSize = max(tileSize, MIN_HIT_SIZE)`, unter der Reihe ist Platz für das Schriftfeld
  - `isOutside(x: number, y: number, layout) -> boolean`: `true` links oder rechts außerhalb, unter der Unterkante oder mehr als eine Viewport-Höhe über der Oberkante
  - `clampDelta(ms: number) -> number`: begrenzt auf `1000/60`, Minimum 0

- [ ] **Step 1: Write the failing tests** in `tests/layout.test.js`:
  - `computeLayout(1920,1080)`: `fieldSize === 64`, `fieldRects.length === 15`, Reihe zentriert (linker Rand ≈ rechter Rand ± 1), `portrait === false`
  - `computeLayout(812,375)`: `fieldSize >= 48`, alle `fieldRects` innerhalb von `[0, 812]`, `floorY + fieldSize < 375`, `hitSize >= 40`
  - `computeLayout(375,812).portrait === true`
  - Rects sind lückenlos aufsteigend: `fieldRects[i+1].x >= fieldRects[i].x + fieldRects[i].w`
  - `isOutside`: Mitte → `false`, `x = -10` → `true`, `y = height + 10` → `true`, `y = -height - 10` → `true`, `y = -50` → `false` (Einfallen von oben)
  - `clampDelta(500) === 1000/60`, `clampDelta(8) === 8`, `clampDelta(-3) === 0`
- [ ] **Step 2: Run** `node --test tests/` — Expected: FAIL in layout
- [ ] **Step 3: Implement** `js/layout.js`
- [ ] **Step 4: Run** `node --test tests/` — Expected: alle PASS
- [ ] **Step 5: Commit** `git commit -m "feat: add viewport layout and bounds helpers"`

### Task 3: Seite, Szene und spielbare Steine

Ersetzt den alten POC. Ergebnis: Die Steine fallen herein, lassen sich greifen und werfen und werden in 3D gerendert. Einrasten gibt es hier noch nicht.

**Files:**
- Delete: `index.html` (alter Inhalt), `index_v1.html`, `smartcommerce-web.png`
- Create: `index.html` (neu), `css/style.css`, `js/physics.js`, `js/render.js`, `js/main.js`

**Interfaces:**
- Consumes: `TILES` · `computeLayout`, `isOutside`, `clampDelta`
- Produces (`js/physics.js`, nutzt das globale `Matter`):
  - `createPhysics(layout, {onTap(tileId), onRelease(tileId, {x, y, speed}), onGrab(tileId)}) -> physics`
  - `physics.step(deltaMs)`, `physics.tileStates() -> {id, letter, x, y, angle, snappedField: number|null, visible: boolean}[]`
  - `physics.snap(tileId, fieldIndex)`, `physics.unsnap(tileId)` (in diesem Task nur vorhanden, aufgerufen ab Task 4)
  - `physics.relayout(layout)`, `physics.setInputEnabled(bool)`, `physics.setTilesVisible(ids, bool)`, `physics.dropTiles(ids)` (von oben neu einfallen lassen), `physics.settle()` (Simulation ohne Rendern laufen lassen, bis alles liegt)
- Produces (`js/render.js`):
  - `createRenderer(canvas: HTMLCanvasElement, layout) -> {resize(layout), sync(tileStates)}`: Pixelkoordinaten 1:1, transparenter Hintergrund, Steine als `RoundedBoxGeometry` mit Canvas-Textur auf der Vorderseite (Buchstabe und Punktwert, Farben laut Spec), Schatten auf eine `ShadowMaterial`-Ebene. Die Kamera muss die Dicke der Steine sichtbar machen.
- `index.html`: Import-Map für `three` und `three/addons/`, klassisches `<script>` für Matter.js vor dem Modul `js/main.js`. Overlay-Elemente: Beschriftung oben links, Schriftfeld, Feldreihe (DOM-Kästchen an `fieldRects`), Bodenlinie, `#fx`-Layer, `#reward`-Layer, `#rotate-hint`.
- `css/style.css`: Blaupause als `body`-Hintergrund (Raster laut Spec, Vignette), kein Scrollen (`overflow: hidden`, `touch-action: none` auf der Szene). `#rotate-hint` wird per `@media (orientation: portrait)` gezeigt, die Szene dabei versteckt.

- [ ] **Step 1: Delete** die drei alten Dateien und `ls` prüfen: `helupoc/`, `README.md` und `docs/` sind noch da
- [ ] **Step 2: Implement** `index.html`, `css/style.css`, `js/render.js`, `js/physics.js`, `js/main.js`. Hinweise:
  - Picking über eigene Pointer-Events: der nächstgelegene Stein, dessen Mittelpunkt innerhalb von `hitSize/2` liegt. Gezogen wird über einen `Matter.Constraint`. Tap = Loslassen nach < 6 px Bewegung und < 300 ms. `onGrab` feuert erst, wenn die Bewegung 6 px überschreitet, damit ein Tap auf einen eingerasteten B- oder A-Stein (Konami) ihn nicht herauslöst.
  - `speed` beim Loslassen = Betrag der Körpergeschwindigkeit.
  - Bodenkörper bei `floorY` über die ganze Breite, Seitenwände bei 0 und `width`, keine Decke. Steine, für die `isOutside` gilt, fallen per `dropTiles` neu ein.
  - Start: Die Steine erscheinen gestaffelt über dem oberen Rand, x-Position ungefähr in Namensreihenfolge.
  - Game-Loop über `requestAnimationFrame` mit `clampDelta`.
- [ ] **Step 3: Run** `node --test tests/` — Expected: alle PASS (keine Regression)
- [ ] **Step 4: Verify in Chrome** (`python3 -m http.server 8765`, `http://localhost:8765/`, Viewport 1440 × 900): Die Steine fallen ein und liegen schief. Greifen und Werfen funktioniert, Dicke und Schatten sind sichtbar, Beschriftung und Schriftfeld stehen richtig, die Konsole ist ohne Fehler. Einen Stein kräftig nach oben werfen: Er kommt zurück. Dann die Viewports 812 × 375 (Spiel) und 375 × 812 (Dreh-Hinweis mit `FIG. 3 — BITTE DREHEN`) prüfen. Außerdem `http://localhost:8765/helupoc/` lädt.
- [ ] **Step 5: Commit** `git commit -m "feat: replace chat POC with playable 3D letter tiles"`

### Task 4: Einrasten, KLACK/PLOPP und Worterkennung

**Files:**
- Create: `js/fx.js`
- Modify: `js/main.js`, `js/physics.js` (Snap-Logik), `css/style.css`

**Interfaces:**
- Consumes: `pickSnapField`, `createWordWatcher` · `physics.snap/unsnap/tileStates`, `onRelease`, `onGrab`
- Produces (`js/fx.js`):
  - `showComicWord(layer: HTMLElement, text: 'KLACK!'|'PLOPP!', x: number, y: number, {reducedMotion: boolean})`: Stil laut Spec, Dauer ca. 1000 ms, pro Aufruf zufällig variiert: Skalierung 0.85–1.2, Neigung −14° bis −4°, Versatz ±12 px. Mit `reducedMotion` ohne Überschwinger.
  - `glowFields(fieldEls: HTMLElement[], indices: number[]) -> Promise<void>`: kurzes Aufleuchten, ca. 500 ms
- Produces (`js/rules.js`): `fieldLetters(tileStates, fieldCount) -> (string|null)[]`
- Produces (`js/main.js`): `playReward(name: 'BENNI'|'NINJA'|'KONAMI', match?: {word, start}) -> Promise<void>`
- In `main.js`: `onRelease` → `pickSnapField` → bei Index ≥ 0 `physics.snap` + KLACK. `onGrab` auf einen eingerasteten Stein → `physics.unsnap` + PLOPP. Nach jeder Änderung `wordWatcher.update(fieldLetters(...))`. Ein gefundenes Wort lässt die Felder aufleuchten und ruft `playReward(word, match)` auf. Das ist in diesem Task ein Stub mit `console.info`. Abweichung vom Spec-Satz „frei liegende Steine im Weg werden weggeschoben“: Weil die Felder Slots unter der Bodenlinie sind, kann kein freier Stein im Weg liegen, und Wegschieben entfällt. `physics.snap` setzt den Körper statisch, ohne Drehung, mittig ins Feld (in den Slot unter `floorY`). Bei `relayout` wandern eingerastete Steine an die neuen `fieldRects`.

- [ ] **Step 1: Write the failing test** in `tests/rules.test.js`: `fieldLetters([{letter:'B', snappedField:2}, {letter:'E', snappedField:null}], 15)` → Array der Länge 15, Index 2 = `'B'`, sonst `null`
- [ ] **Step 2: Run** `node --test tests/` — Expected: FAIL
- [ ] **Step 3: Implement** `fieldLetters` in `js/rules.js`, `js/fx.js` und die Verdrahtung in `main.js`/`physics.js`
- [ ] **Step 4: Run** `node --test tests/` — Expected: alle PASS
- [ ] **Step 5: Verify in Chrome** (1440 × 900):
  - Stein langsam über einem Feld loslassen: Er rastet gerade im Slot ein, und KLACK erscheint.
  - Stein über die Reihe werfen: Er rastet nicht ein.
  - Eingerasteten Stein herausziehen: PLOPP, der Stein ist wieder frei.
  - BENNI legen: Die Felder leuchten auf, die Konsole meldet `BENNI` genau einmal. Ein Stein raus und wieder rein: erneut genau einmal.
  - BENNIA legen: keine Meldung.
  - Fenster auf 812 × 375 verkleinern: Die eingerasteten Steine sitzen weiter in ihren Feldern.
- [ ] **Step 6: Commit** `git commit -m "feat: snap tiles into fields with comic feedback and word detection"`

### Task 5: Belohnungen BENNI und NINJA

**Files:**
- Create: `js/rewards/hello.js`, `js/rewards/ninja.js`
- Modify: `js/main.js` (`playReward`), `css/style.css`

**Interfaces:**
- Consumes: `physics.setInputEnabled`, `physics.setTilesVisible`, `physics.dropTiles`, `physics.unsnap`, `physics.tileStates`
- Produces: Jede Belohnung exportiert `play(ctx) -> Promise<void>` mit `ctx = {layer: HTMLElement (#reward), physics, reducedMotion: boolean, match?: {word, start}}`.
  - `hello.js`: dimmen, einfrieren (Physik pausiert), „Hallo, Freund.“ in Monospace Zeichen für Zeichen mit blinkendem Cursor, nach ca. 2 s ausblenden
  - `ninja.js`: Schwarz, drei grüne Punkte oben, Nachtsicht-Grün mit Rauschen und Scanlines (CSS-Overlay plus `filter` auf dem Canvas). Die fünf Steine des Wortes nacheinander `unsnap` + `setTilesVisible(false)`. Licht an, kurz darauf `dropTiles` + `setTilesVisible(true)`.
- `playReward` in `main.js`: setzt während der Belohnung `setInputEnabled(false)`, ignoriert Konami-Eingaben und ruft danach `konami.reset()` auf.

- [ ] **Step 1: Implement** beide Belohnungen und `playReward`. Mit `reducedMotion` ruhig ein- und ausblenden, ohne Flackern und Rauschen.
- [ ] **Step 2: Run** `node --test tests/` — Expected: alle PASS
- [ ] **Step 3: Verify in Chrome:**
  - BENNI legen: Die Begrüßung tippt sich herein, danach läuft das Spiel weiter, und BENNI liegt noch.
  - NINJA legen: Licht aus, Punkte, Nachtsicht, die Steine verschwinden, Licht an, die Steine fallen neu ein.
  - Während einer Belohnung ziehen und klicken: Nichts passiert.
  - Konsole ohne Fehler.
- [ ] **Step 4: Commit** `git commit -m "feat: add BENNI and NINJA rewards"`

### Task 6: Konami-Code und Kuchen

**Files:**
- Create: `js/rewards/cake.js`
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `createKonamiDetector`, `swipeDirection` · `onTap(tileId)` · `playReward`-Mechanik aus Task 5
- Produces: `cake.js` `play(ctx) -> Promise<void>`. Der Kuchen mit Kerze schwebt herab, Konfetti fliegt, der Kuchen zerfällt glitchend in Pixel, dann erscheint „the cake was a lie“, alles ausblenden. Die Darstellung wählt der Builder (CSS/SVG/3D).
- In `main.js`: `keydown` Pfeiltasten → `pushDirection`. Swipe = Pointer-Geste auf freier Fläche, die keinen Stein greift → `swipeDirection` → `pushDirection`. `onTap(tileId)` → `pushTap(letter)`, bei `true` → `playReward('KONAMI')`, das `cake.js` abspielt.

- [ ] **Step 1: Implement** `cake.js` und die Eingabe-Verdrahtung
- [ ] **Step 2: Run** `node --test tests/` — Expected: alle PASS
- [ ] **Step 3: Verify in Chrome** (1440 × 900):
  - ↑↑↓↓←→←→, dann einen B-Stein und einen A-Stein antippen: Der Kuchen erscheint, Ablauf wie im Spec.
  - Erst A, dann B: nichts.
  - Sequenz eingeben und 6 s warten, dann B und A: nichts.
  - Im Querformat 812 × 375 per Drag-Gesten auf freier Fläche (Swipe) wiederholen.
- [ ] **Step 4: Commit** `git commit -m "feat: add konami code cake reward"`

### Task 7: Reduced Motion, Endabnahme, Push

**Files:**
- Modify: `js/main.js`, `css/style.css`

- [ ] **Step 1: Implement** `prefers-reduced-motion`: Beim Start `physics.settle()` aufrufen, sodass die Steine schon liegen. `reducedMotion` an fx und Belohnungen durchreichen und CSS-Animationen dämpfen.
- [ ] **Step 2: Run** `node --test tests/` — Expected: alle PASS
- [ ] **Step 3: Verify in Chrome:** die komplette Checkliste aus dem Spec-Abschnitt „Prüfen“ auf 1440 × 900, 812 × 375 und 375 × 812 durchgehen. Zusätzlich mit emulierter Reduced Motion (DevTools Rendering → `prefers-reduced-motion: reduce`): Die Steine liegen beim Start, die Belohnungen laufen ruhig. Den Tab 30 s in den Hintergrund schicken und zurückholen: Kein Stein ist durch den Boden gefallen.
- [ ] **Step 4: Commit** `git commit -m "feat: respect reduced motion"`
- [ ] **Step 5: Push** `git push -u origin claude/github-io-page-ideas-a951e6`. Danach Benjamin fragen, ob gemergt werden soll, weil der Merge auf `main` das Live-Deployment ist.
