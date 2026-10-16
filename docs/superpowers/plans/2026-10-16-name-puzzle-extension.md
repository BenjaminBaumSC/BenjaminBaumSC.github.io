# Namens-Puzzle Erweiterung – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Punktezähler, Neustart-Button, BENJAMIN-BAUM-Freigabe mit zehn nachgelieferten Steinen und vier neue Geheimwörter (MINI, CODUMO, BITU84, BEN32).

**Architecture:** Die reinen Regeln in `js/rules.js` lernen Phrasen mit Leerfeld, mehrere gleichzeitige Wörter und die Scrabble-Wertung, getestet mit `node --test`. Physik und Renderer verwalten eine veränderliche Steinmenge (`addTiles`, `reset`). Jede Belohnung ist ein eigenes Modul in `js/rewards/` mit `play(ctx) -> Promise<void>`, wie bisher.

**Tech Stack:** unverändert: Three.js 0.169.0, Matter.js 0.20.0, ES-Module, `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-16-name-puzzle-extension-design.md` (baut auf `docs/superpowers/specs/2026-10-16-name-puzzle-design.md` auf).

## Global Constraints

- Keine neuen Dependencies, kein Build, keine Web-Fonts, kein Speicherzustand (kein localStorage), keine Links.
- Texte exakt: `PKT: <n>`, `NEU ZEICHNEN`, `GENEHMIGT`, `WUMMS!`, `REV: 1.0 · FREIGEGEBEN`, `REV: 0.1 · BL. 1/1`, `BRUMM!`, `codumo.de`, `Erfolg freigeschaltet`, `84G – BITU84`, `The fence is a lie.`, `MÄH!`.
- Punktwerte: A1 B3 E1 I1 J6 M3 N1 U1 C4 O2 D1 T1, Ziffern nach ihrem Wert (8, 4, 3, 2).
- Testbefehl: `node --test 'tests/*.test.js'`. Browser-Checks in Claude in Chrome über `python3 -m http.server 8765`. Vor jedem Check die geänderten Dateien mit `fetch(url, {cache: 'reload'})` neu laden, weil der Server Caching zulässt.
- Arbeiten auf `claude/name-puzzle-extension`, ausgehend von `main` (43a8f7b). Merge auf `main` nur mit Benjamins OK.

## Review Focus

1. **Neustart mitten in einer Belohnung** wird ignoriert, ebenso ein Neustart während der Nachlieferung. Abgedeckt durch `rewardGate.active` (Task 3, manueller Schritt).
2. **Zwei Wörter gleichzeitig:** MINI liegt, dann wird BEN32 daneben gelegt → BEN32 löst aus, MINI nicht erneut. Abgedeckt durch einen Watcher-Test in Task 1.
3. **BENJAMIN BAUM mit einem Stein zu viel daneben** (z. B. ein A im 14. Feld) löst nichts aus. Abgedeckt durch einen Test in Task 1.
4. **Neustart nach der Nachlieferung:** Danach sind exakt 12 Steine im Spiel, keine versteckten Körper bleiben in der Welt. Abgedeckt durch einen Browser-Check in Task 2.
5. **Zähler nach dem NINJA-Verschwinden und nach dem Neustart** zeigt den echten Stand der Leiste. Abgedeckt durch den Aufruf von `updateScore` in `checkWords` (Task 3).

---

### Task 1: Regeln für Phrasen, mehrere Wörter und Wertung

**Files:** Modify `js/config.js`, `js/rules.js`, `tests/rules.test.js`

**Interfaces:**
- `config.js`: `TILES` bleibt die Grundmenge, ids 0–11. Neu ist `EXTRA_TILES` mit den Buchstaben I C O O D T 8 4 3 2 und den ids 12–21. `POINTS` (exportiert) wird um C, O, D, T und die Ziffern erweitert. `SECRET_WORDS = ['BENNI', 'NINJA', 'BENJAMIN BAUM', 'MINI', 'CODUMO', 'BITU84', 'BEN32']`.
- `rules.js`:
  - `findWords(fieldLetters, words) -> {word, start}[]` findet alle Treffer. Ein Leerzeichen im Wort steht für genau ein leeres Feld, links und rechts muss ein leeres Feld oder der Rand anschließen. `findWord` entfällt.
  - `createWordWatcher(words).update(fieldLetters) -> {word, start}[]` liefert nur die neu entstandenen Treffer.
  - `scoreRow(fieldLetters, premiums, points) -> number`

- [ ] **Step 1: Write the failing tests:**
  - Die bestehenden `findWord`-Tests auf `findWords` umstellen (`[0]` bzw. leeres Array).
  - `findWords` erkennt `BENJAMIN_BAUM` ab Feld 0 und ab Feld 2.
  - `BENJAMIN__BAUM` (zwei Lücken) → keine Phrase.
  - `BENJAMIN_BAUMA` → keine Phrase.
  - `MINI_BEN32` → zwei Treffer.
  - Watcher: Auf MINI folgt MINI + BEN32 → nur BEN32 wird gemeldet.
  - `scoreRow`:
    - B auf einem normalen Feld → 3
    - B auf DL (Index 3) → 6
    - `BEN` ab Index 0 (TW) → (3+1+1)×3 = 15
    - BENJAMIN BAUM ab 0 → TW auf 0 und 7 → ×9 auf BENJAMIN, BAUM ab 9 mit DL auf 11 (U doppelt)
    - `8` zählt 8
    - zwei Wörter werden addiert
- [ ] **Step 2:** `node --test 'tests/*.test.js'` → FAIL
- [ ] **Step 3: Implement.** `findWords` bildet `'.' + letters.map(l => l ?? '.').join('') + '.'` und sucht jedes Muster `'.' + word.replaceAll(' ', '.') + '.'` mit überlappender Suche (start = index). Der Watcher merkt sich die Keys `word@start` als Set.
- [ ] **Step 4:** Tests → PASS. `js/main.js` auf `findWords`/Array-Rückgabe umstellen (erster neuer Treffer wird gespielt). Browser-Smoke: BENNI löst weiterhin aus.
- [ ] **Step 5: Commit** `feat: detect phrases and simultaneous words, add scrabble scoring`

### Task 2: Steine zur Laufzeit hinzufügen und zurücksetzen

**Files:** Modify `js/physics.js`, `js/render.js`

**Interfaces:**
- `physics.addTiles(defs: {id, letter, points}[], {spread: 'full'})`: Die Steine fallen über die ganze Breite verteilt von oben ein.
- `physics.reset(defs)`: Entfernt alle Körper aus der Welt, legt `defs` neu an und lässt sie einfallen wie beim Start. `tileStates()` enthält nur aktive Steine.
- `renderer.sync(states)` legt Meshes bei Bedarf für neue ids an und blendet Meshes ohne State aus. Die Textur zeigt auch Ziffern, der Punktwert ist der Ziffernwert.
- [ ] **Step 1:** Implementieren (es gibt keine reine Logik, die sich mit Node testen ließe).
- [ ] **Step 2: Browser-Check** mit einer eigenständigen Instanz: `addTiles(EXTRA_TILES)` → 22 States. `reset(TILES)` → 12 States, und `Composite.allBodies` zählt 12 Steine plus 3 Begrenzungen.
- [ ] **Step 3: Commit** `feat: add and reset tiles at runtime`

### Task 3: Zähler und Neustart

**Files:** Modify `index.html`, `css/style.css`, `js/main.js`

- Im Schriftfeld bekommt die REV-Zeile `id="rev"`, dazu kommt eine neue Zeile `<div id="score">PKT: 0</div>`. Oben rechts sitzt `<button id="restart" type="button">NEU ZEICHNEN</button>`.
- `updateScore()` rechnet `scoreRow(currentLetters(), FIELD_PREMIUMS, POINTS)` und setzt den Text. Bei geändertem Wert bekommt die Zahl kurz die Klasse `bump`. `updateScore` wird in `checkWords()` aufgerufen.
- `restart()`: ignoriert, solange `rewardGate.active` gilt. Sonst `physics.reset(TILES)`, `unlocked = false`, REV-Text zurücksetzen, `konami.reset()`, Watcher neu anlegen, `updateScore()`.
- [ ] **Step 1:** Implementieren.
- [ ] **Step 2: Browser-Check:** B auf DL → `PKT: 6`. Den Stein herausziehen → `PKT: 0`. Neustart → 12 Steine fallen neu ein.
- [ ] **Step 3: Commit** `feat: add score counter and restart button`

### Task 4: BENJAMIN BAUM, Stempel und Nachlieferung

**Files:** Create `js/rewards/approved.js`; Modify `js/main.js`, `css/style.css`

- `approved.play(ctx)`: Szene wackelt (CSS-Klasse auf `#scene`), roter Stempel `GENEHMIGT` und Comic `WUMMS!` (über `showComicWord`, den `ctx` mitliefert). Ca. 2 s halten, dann ausblenden.
- In `main.js` wird nach der Belohnung `BENJAMIN BAUM` beim ersten Mal (`!unlocked`) `physics.addTiles(EXTRA_TILES)` aufgerufen, `unlocked = true` gesetzt und `#rev` auf `REV: 1.0 · FREIGEGEBEN` gestellt. Beim zweiten Mal kommt nur der Stempel.
- Für den Browser-Check darf vorübergehend eine Hilfsfunktion die Steine per `physics.snap` direkt platzieren. Sie wird **nicht** committet.
- [ ] **Step 1:** Implementieren. **Step 2:** Browser-Check (Stempel, REV, 22 Steine, beim zweiten Mal keine neuen). **Step 3: Commit** `feat: approve the drawing and deliver extra tiles for BENJAMIN BAUM`

### Task 5: Vier neue Belohnungen

**Files:** Create `js/rewards/mini.js`, `js/rewards/codumo.js`, `js/rewards/bitu.js`, `js/rewards/ben32.js`, `assets/mini-logo.svg`, `assets/ben32.jpg`; Modify `js/main.js` (REWARDS-Map), `css/style.css`

- `assets/mini-logo.svg`: die Commons-Datei, `fill` auf `#ffffff` gesetzt, Metadaten bleiben erhalten.
- `assets/ben32.jpg`: das Original auf 400 px Breite skaliert, Qualität ca. 70 (`sips`), Ziel ≤ 70 KB.
- `mini.js`: eigenes Auto-SVG (R53, Seitenlinie, weiß, Räder als eigene Gruppen mit Rotation), fährt über `translateX` von links nach rechts. Dazu Abgas-Puffs, `BRUMM!` und das Logo, das in der Mitte per `scaleX` aufzieht.
- `codumo.js`: Inline-SVG nach dem PNG. Die Chevrons sind Polygone, das Sechseck ist ein Pfad mit `stroke-dasharray`-Animation und anschließendem Fill. Darunter tippt sich `codumo.de` herein, Abdunklung wie bei `hello.js`.
- `bitu.js`: Toast-DOM mit selbst gezeichnetem Pokal-SVG, Slide-up, 3 s halten, Slide-down.
- `ben32.js`: Panel mit `<img src="assets/ben32.jpg">`, Tape, Sprechblase, `MÄH!`, Pop-in und Kipp-out.
- Alle Belohnungen mit Reduced-Motion-Variante (Klasse `calm`: nur Fade).
- [ ] **Step 1:** Assets erstellen und ihre Größe prüfen (`ls -l`). **Step 2:** Jede Belohnung implementieren und einzeln im Browser auslösen, mit der temporären Snap-Hilfe. **Step 3: Commit** `feat: add MINI, CODUMO, BITU84 and BEN32 rewards`

### Task 6: Endabnahme

- [ ] Die Spec-Checkliste „Prüfen“ auf 1440 × 900 und 812 × 375 durchgehen, Konsole ohne Fehler. Reduced Motion per `matchMedia`-Override prüfen.
- [ ] Ein Review des ganzen Branches durch einen frischen Subagenten. Wichtige Befunde beheben.
- [ ] Den Branch pushen und Benjamin nach dem Merge fragen.
