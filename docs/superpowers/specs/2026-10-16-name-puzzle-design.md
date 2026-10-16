# Design: Namens-Puzzle auf benjaminbaumsc.github.io

Stand: 16.10.2026 · Autor: Benjamin Baum (mit Claude)

## Worum es geht

Unter benjaminbaumsc.github.io liegt heute ein alter Chat-POC: ein Screenshot der SmartCommerce-Website mit n8n-Chat-Widget. Der POC wird nicht mehr gebraucht. Die Seite soll stattdessen ein **verspielter Platzhalter** werden. Sie bietet keinen Inhalt, ist kein Portfolio und kein Vertriebswerkzeug, sondern ein kleines Spielzeug mit versteckten Geheimnissen, das Spaß macht und das man selbst entdecken muss.

Die Buchstaben von **BENJAMIN BAUM** fallen als 3D-Scrabble-Steine auf eine Blaupause. Man kann sie greifen, werfen und in eine Reihe Spielfelder einrasten lassen. Wer bestimmte Wörter legt oder den Konami-Code eingibt, löst eine Animation aus. Nichts davon wird erklärt. Der einzige Hinweis, dass hier mehr steckt, ist das unauffällige Portal-Zitat „the cake is a lie“ im Schriftfeld der Zeichnung.

**Erfolg heißt:** Wer auf der Seite landet, spielt eine Minute herum, merkt am Zitat, dass da noch was ist, und findet mit etwas Probieren mindestens ein Geheimnis. Auf Desktop und Handy läuft es flüssig.

## Ziele

- Ein spielbares Physik-Spielzeug aus den zwölf Buchstaben des Namens.
- Drei versteckte Geheimnisse mit je eigener, deutlich unterschiedlicher Belohnung.
- Ein eigener, stimmiger Look: Blaupause trifft Scrabble.
- Statisch auf GitHub Pages, ohne Build-Schritt.

## Nicht-Ziele

- Kein Ton, keine Musik. Rückmeldung läuft ausschließlich über Bewegung und Comic-Schrift.
- Keine Punktezählung (siehe „Ideen / Später“).
- Kein Tracking, keine Analytics, kein Cookie-Banner, kein Backend.
- Keine Links, Profilangaben oder Kontaktdaten auf der Seite.

## Anti-Ziele (wäre ein Fehlschlag, auch wenn es technisch läuft)

- Ein Hinweistext, eine Anleitung oder ein Tooltip, der die Geheimnisse verrät.
- Effekte, die beim zehnten Mal nerven, weil sie zu lang, zu groß oder zu laut sind.
- Zufallstreffer: Ein Geheimnis darf nicht ausgelöst werden, ohne dass jemand es bewusst gelegt hat.
- Ruckeln oder unbedienbar kleine Steine auf dem Handy.

## Szene und Look

Die Szene ist eine Seitenansicht mit Schwerkraft nach unten.

- **Hintergrund:** Blaupause in `#1d4f91` mit Raster (grob 100 px, fein 20 px, weiße Linien in geringer Deckkraft) und leichter Vignette.
- **Beschriftung oben links:** `FIG. 2 — SPIELFELD, SCHNITT A–A` in Monospace, weiß, gedämpft.
- **Schriftfeld unten rechts**, wie auf einer technischen Zeichnung, mit dünnem weißem Rahmen und drei Zeilen:
  - `PROJ: BENJAMINBAUMSC`
  - `DWG: THE CAKE IS A LIE` (das ist der versteckte Hinweis)
  - `REV: 0.1 · BL. 1/1`
- **Boden:** eine durchgehende Bodenlinie über die ganze Breite. Darauf liegt mittig die Spielfeld-Reihe als begrenzter Streifen, daneben ist schlichter Boden. Die Felder haben eine Maximalgröße von etwa 64 px, damit die Steine auf breiten Bildschirmen nicht riesig werden. Das Schriftfeld sitzt unten rechts unterhalb der Bodenlinie oder neben der Reihe und überlappt nicht mit den Feldern. Steine auf dem Boden neben der Reihe sind einfach frei. *(Claudes Entscheidung)*
- **Spielfeld-Reihe:** 15 Felder nebeneinander, in den Prämienfarben der ersten Scrabble-Reihe:
  `3×W · – · – · 2×B · – · – · – · 3×W · – · – · – · 2×B · – · – · 3×W`
  Farben: 3× Wort `#c8423a`, 2× Wort `#e9a3a3`, 3× Buchstabe `#2f6db5`, 2× Buchstabe `#9cc8e8`, leere Felder als helle, halbtransparente Kästchen mit weißem Rand.
- **Steine:** zwölf Stück, B E N J A M I N B A U M. Cremefarbenes Holz (`#ecd29c` mit hellerer Ober- und dunklerer Unterkante), dunkler Serifen-Buchstabe (`#2a2118`), deutscher Scrabble-Punktwert klein unten rechts: A 1, B 3, E 1, I 1, J 6, M 3, N 1, U 1. Sie werden in echtem 3D gerendert, mit sichtbarer Dicke, abgerundeten Kanten und Schatten auf der Blaupause.

Referenz-Mockups liegen unter `.superpowers/brainstorm/` (`combined.html` für die Szene, `klack-v2.html` für den Einrast-Effekt). Sie sind Skizzen, kein Pixel-Vorbild.

## Verhalten

### Start
Beim Laden fallen die zwölf Steine von oben herein, ungefähr in Namensreihenfolge von links nach rechts, landen schief und stapeln sich teilweise. Die Spielfeld-Reihe ist leer. *(Claudes Entscheidung)*

### Greifen und Werfen
Steine lassen sich mit Maus oder Finger greifen, ziehen und werfen. Sie kollidieren miteinander, mit dem Boden und mit den Seitenrändern des Fensters. Kein Stein darf die Szene dauerhaft verlassen.

### Einrasten
- Ein Stein rastet ein, wenn man ihn **über einem freien Feld loslässt**. Geworfene Steine, die zufällig auf einem Feld landen, rasten nicht ein. Den Unterschied macht die Geschwindigkeit beim Loslassen.
- Ein eingerasteter Stein sitzt gerade und exakt im Feld und bewegt sich nicht mehr. So unterscheidet er sich sichtbar von einem Stein, der nur schief auf einem Feld liegt.
- Jedes Feld hält höchstens einen eingerasteten Stein. Frei liegende Steine, die im Weg sind, werden beim Einrasten weggeschoben.
- Zieht man einen eingerasteten Stein heraus, ist er wieder frei beweglich.

### Comic-Effekte statt Ton
- **Einrasten:** Der Stein staucht beim Aufsetzen kurz zusammen, ein paar weiße Speedlines spritzen weg, und ein **„KLACK!“** ploppt auf. Die Schrift ist weiß, fett und comicartig mit dunkelblauer Kontur (`#0d2a52`) und hartem Schatten. Sie erscheint mit Überschwinger und schräg gestellt, treibt dann leicht nach oben und verblasst. Gesamtdauer etwa eine Sekunde.
- **Herausziehen:** Auf dieselbe Art erscheint ein **„PLOPP!“**.
- Größe, Neigung und Position beider Wörter variieren bei jedem Auftreten leicht, damit es nicht kopiert wirkt.

### Die drei Geheimnisse
Ein Wort gilt als gelegt, wenn eine **zusammenhängende Folge eingerasteter Steine** genau dieses Wort von links nach rechts ergibt und links und rechts davon kein eingerasteter Stein anschließt. Das Wort darf an beliebiger Stelle der Reihe liegen. *(Claudes Entscheidung, angelehnt an Scrabble)*

Sobald ein Wort liegt, leuchten die Felder darunter kurz auf, dann startet die Belohnung. Während einer Belohnung ist keine Eingabe möglich. Danach geht das Spiel normal weiter, und jedes Geheimnis lässt sich beliebig oft auslösen.

Da NINJA und BENNI beide die zwei N und das I brauchen, kann immer nur eines der beiden Wörter liegen. Das ist so gewollt.

1. **Konami-Code → Kuchen**
   - Auslöser: ↑ ↑ ↓ ↓ ← → ← → auf der Tastatur, danach ein Stein **B** und dann ein Stein **A** antippen, also kurz klicken, ohne zu ziehen. Welches B und welches A, ist egal, und es ist auch egal, ob die Steine eingerastet sind.
   - Am Handy ersetzen Wischgesten auf freier Fläche die Pfeiltasten: hoch, hoch, runter, runter, links, rechts, links, rechts.
   - Belohnung: Ein Kuchen mit brennender Kerze schwebt herunter, Konfetti fliegt. Dann zerfällt der Kuchen glitchend in Pixel, und klein erscheint „the cake was a lie“. Danach ist die Szene wieder wie vorher.
2. **BENNI → „Hallo, Freund“**
   - Auslöser: BENNI eingerastet in der Reihe.
   - Belohnung: Die Szene wird gedimmt und friert ein. In Monospace tippt sich Zeichen für Zeichen „Hallo, Freund.“ herein, wie in einem Terminal, mit blinkendem Cursor. Das ist eine Anspielung auf das „Hello, friend“ aus Mr. Robot. Nach einem Moment verschwindet der Text, und die Szene läuft weiter.
3. **NINJA → Splinter Cell**
   - Auslöser: NINJA eingerastet in der Reihe.
   - Belohnung: Das Licht geht schlagartig aus, die Szene ist schwarz. Oben leuchten drei grüne Punkte auf, die Nachtsichtbrille von Sam Fisher. Dann kippt alles in Nachtsicht-Grün mit Rauschen und Scanlines. Die fünf NINJA-Steine verschwinden lautlos, einer nach dem anderen. Das Licht geht wieder an, die übrigen Steine liegen da, als wäre nichts gewesen. Kurz darauf fallen die fünf Steine von oben wieder herein. *(Rückkehr der Steine: Claudes Entscheidung, damit das Spiel nicht kaputtgeht)*

### Handy und Barrierefreiheit
- Die Szene füllt den Viewport und skaliert mit, ohne horizontales Scrollen.
- Die Reihe hat überall 15 Felder. **Im Hochformat** (Viewport höher als breit) wird das Spiel nicht gezeigt. Stattdessen erscheint ein Hinweis, das Handy zu drehen (Benjamin, 16.10.2026). Der Hinweis ist im Blaupausen-Stil gehalten, z. B. eine Strichzeichnung eines Handys mit Drehpfeil und `FIG. 3 — BITTE DREHEN`. *(Gestaltung: Claudes Entscheidung)* Dreht man ins Querformat, startet bzw. läuft das Spiel.
- Im Querformat auf dem Handy (z. B. 812 × 375) sind die Felder etwa 50 px groß. Die greifbare Fläche jedes Steins ist mindestens 40 × 40 px.
- Bei `prefers-reduced-motion` liegen die Steine beim Start bereits, die Comic-Wörter erscheinen ohne Überschwinger, und die Belohnungen werden ruhiger ein- und ausgeblendet statt mit Glitch und Flackern.

## Technik

- **Statisch, ohne Build-Schritt**, ausgeliefert von GitHub Pages aus `main`.
- **Three.js** für das Rendering und **Matter.js** für die Physik, beide per CDN mit fest gepinnter Version, z. B. über eine Import-Map. Freigabe für beide Dependencies: Benjamin, 16.10.2026.
- **Physik in 2D, Darstellung in 3D:** Matter.js simuliert die Steine auf der Bildebene, Three.js rendert sie als 3D-Körper an den simulierten Positionen. Weil die Steine ohnehin nur seitlich fallen, reicht 2D. Das ist robuster, und Greifen, Werfen und Einrasten lassen sich damit einfacher umsetzen. *(Entscheidung 16.10.2026)*
- **Keine Web-Fonts**, also weder Google Fonts noch selbst gehostete Schriften. Die Steine nutzen einen System-Serif-Stack (Georgia, „Times New Roman“, serif), die Comic-Wörter einen fetten System-Stack („Arial Black“, Impact, sans-serif). Den Comic-Look erzeugen Kontur, harter Schatten, Neigung und Animation. *(Claudes Entscheidung: keine weitere Dependency, keine DSGVO-Frage)*
- Comic-Wörter, Schriftfeld und Beschriftungen dürfen als HTML/CSS-Overlay über der Szene liegen. Das muss der Builder nicht in WebGL zeichnen.

## Aufräumen im Repo

- Raus: `index.html` (der alte Chat-POC, wird durch das Spiel ersetzt), `index_v1.html` und `smartcommerce-web.png`. Der Root-Chat muss nicht mehr erreichbar sein (Benjamin, 16.10.2026).
- Bleibt unangetastet: `/helupoc/`. Vor dem Löschen prüfen, dass `/helupoc/` nichts aus dem Root referenziert.
- `.superpowers/` in die `.gitignore` aufnehmen.

## Dem Builder überlassen

- Dateistruktur (eine Datei oder mehrere Dateien im Root)
- Konkrete Bibliotheksversionen und CDN
- Kamera (orthografisch oder leichte Perspektive), Licht, Schatten-Technik
- Schwellenwerte für „losgelassen vs. geworfen“ und den Einrast-Radius
- Exakte Timings und Easings der Animationen im Rahmen der Beschreibung
- Wie der Kuchen dargestellt wird (3D-Modell, Sprite oder CSS)
- Zeitfenster zwischen Konami-Sequenz und dem Antippen von B und A

## Prüfen

- Hochformat 375 × 812: Der Dreh-Hinweis erscheint. Querformat 812 × 375: Das Spiel läuft.
- Manuell in Chrome auf dem Desktop und im Querformat 812 × 375: Steine greifen, werfen und einrasten, KLACK und PLOPP auslösen und alle drei Geheimnisse durchspielen.
- Ein geworfener Stein darf nicht einrasten, und ein falsches Wort (z. B. „BENNIA“) löst nichts aus.
- Keine Fehler in der Konsole, flüssige Bildrate.

## Ideen / Später

- Das Schriftfeld zählt die Scrabble-Punkte des gelegten Wortes mit, inklusive Prämienfeldern.
- Weitere Geheimwörter, die sich aus dem Namen bauen lassen: BAMBI, MAMBA, JABBA, IMBA, MANA.
- Assassin's Creed als alternative NINJA-Belohnung (Leap of Faith in einen Heuhaufen).
