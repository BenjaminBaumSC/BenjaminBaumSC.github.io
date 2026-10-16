# Design: Namens-Puzzle – Erweiterung

Stand: 16.10.2026 · Autor: Benjamin Baum (mit Claude)
Baut auf `docs/superpowers/specs/2026-10-16-name-puzzle-design.md` auf. Alles, was dort steht, gilt weiter, sofern hier nichts anderes steht.

## Worum es geht

Das Puzzle bekommt drei Erweiterungen: einen Punktezähler, einen Neustart-Button und ein großes Finale. Wer **BENJAMIN BAUM** komplett in die Leiste legt, bekommt eine „Freigabe“ der Zeichnung und zehn neue Steine. Mit diesen Steinen lassen sich vier weitere Geheimwörter bilden, die sich alle auf Benjamin beziehen: sein alter Mini Cooper, sein Pseudonym CODUMO, sein Gamertag BITU84 und sein Comic-Schaf Ben32.

**Erfolg heißt:** Wer alles findet, hat eine kleine Schnitzeljagd durch Benjamins Internet-Identitäten hinter sich. Der Zähler macht Lust, auch sinnlose Wörter zu legen.

## Nicht-Ziele

- Kein gespeicherter Zustand. Jeder Seitenaufruf und jeder Neustart beginnt mit den zwölf Grundsteinen, ohne localStorage und ohne Cookies (Benjamin, 16.10.2026).
- Keine Links. Auch `codumo.de` wird nur angezeigt und ist nicht klickbar (Benjamin, 16.10.2026).
- Keine Highscores, keine Rangliste.

## 1. Punktezähler

- Das Schriftfeld unten rechts bekommt eine **vierte Zeile** `PKT: <Zahl>` im selben Stil.
- **Gezählt wird alles**, was in der Leiste liegt, auch sinnlose Wörter und Einzelsteine (Benjamin, 16.10.2026). Jede zusammenhängende Folge eingerasteter Steine ist ein Wort.
- Gerechnet wird nach Scrabble-Regeln: Ein Stein auf einem 2×-Buchstabe-Feld (hellblau) zählt doppelt. Jedes 3×-Wort-Feld (rot) unter einem Wort verdreifacht dieses Wort, zwei rote Felder verneunfachen es. Die Summe aller Wörter ist der Zählerstand.
- Der Zähler aktualisiert sich bei jedem Einrasten und Herausziehen. Ändert sich der Wert, ploppt die Zahl kurz größer auf. Bei Reduced Motion ändert sie sich einfach.
- Punktwerte der neuen Steine: C 4, O 2, D 1, T 1, I 1 (deutsche Scrabble-Werte). **Ziffern zählen ihren eigenen Wert**: 8 → 8, 4 → 4, 3 → 3, 2 → 2. *(Claudes Vorschlag, im Chat angekündigt)*

## 2. Neustart-Button

- Ein kleiner Button oben rechts mit der Aufschrift `NEU ZEICHNEN`, im Blaupausen-Stil: Monospace, weißer dünner Rahmen, transparenter Hintergrund, beim Hover leicht heller.
- Ein Klick setzt alles zurück, wie beim ersten Laden: Die Leiste wird geleert, es gibt wieder nur die zwölf Grundsteine, und alle fallen neu von oben ein. Der Zähler steht auf 0, im Schriftfeld steht wieder `REV: 0.1 · BL. 1/1`, und eine angefangene Konami-Eingabe wird verworfen (Benjamin, 16.10.2026).
- Während einer Belohnung tut der Button nichts.

## 2a. Leiste sprengen

- Neben `NEU ZEICHNEN` sitzt ein zweiter Button `LEISTE SPRENGEN` im selben Stil (Benjamin, 16.10.2026).
- Ein Klick schleudert alle eingerasteten Steine mit Wucht aus der Leiste. Dazu kommen Speedlines an jedem Feld, die Szene wackelt, und ein Comic-„KAWUMM!“ erscheint. Die Steine fallen danach wieder auf den Boden. Alles andere bleibt erhalten: freigeschaltete Steine, REV-Stand, keine neue Runde.
- Bei leerer Leiste und während einer Belohnung tut der Button nichts. Bei Reduced Motion fallen die Steine nur heraus, ohne Wackeln und ohne Speedlines.

## 3. BENJAMIN BAUM → Freigabe

- **Auslöser:** In der Leiste liegen nacheinander BENJAMIN, **genau ein** leeres Feld und BAUM, links und rechts begrenzt durch ein leeres Feld oder den Rand der Leiste. Das braucht 13 der 15 Felder. *(Erkennung: Claudes Entscheidung)*
- **Belohnung:** Alle 13 Felder leuchten auf, die Szene wackelt kurz, und ein roter Stempel **„GENEHMIGT“** knallt schräg auf die Zeichnung (Benjamin, 16.10.2026). Dazu kommt ein Comic-„WUMMS!“ im bekannten Stil. Der Stempel sieht aus wie ein Gummistempel: roter Doppelrahmen, leicht unregelmäßige Kanten, etwas transparent, groß und mittig. Er bleibt etwa zwei Sekunden und blendet dann aus.
- Im Schriftfeld steht danach dauerhaft `REV: 1.0 · FREIGEGEBEN`, bis zum Neustart.
- **Nachlieferung:** Direkt danach fallen zehn neue Steine von oben herein: **I, C, O, O, D, T, 8, 4, 3, 2**. Sie sehen aus wie die übrigen Steine, Ziffern inklusive.
- Legt man BENJAMIN BAUM später noch einmal, kommt der Stempel wieder, aber keine weiteren Steine.

## 4. Neue Geheimwörter

Die Erkennung funktioniert wie bei BENNI und NINJA: zusammenhängend, links und rechts begrenzt. **Neu ist, dass mehrere Geheimwörter gleichzeitig in der Leiste liegen dürfen**, z. B. MINI und BEN32. Jedes Wort löst aus, sobald es neu entsteht, auch wenn schon ein anderes daliegt. Laufen zwei Belohnungen gleichzeitig an, gilt die erste, die zweite verfällt.

| Wort | Bezug | Benötigte neue Steine |
|---|---|---|
| MINI | Benjamins Mini Cooper, ca. 2005 | I |
| CODUMO | Pseudonym und Website codumo.de | C, O, O, D |
| BITU84 | Gamertag bei Steam und Xbox | T, 8, 4 |
| BEN32 | Comic-Schaf Ben32 aus dem eingestellten Comic Jump42 | 3, 2 |

### MINI
- Ein Mini Cooper in Seitenansicht fährt als weiße Silhouette von links nach rechts quer durchs Bild, etwa auf Höhe der Bodenlinie. Die Räder drehen sich (Speichen), hinten puffen ein paar Abgaswölkchen, dazu ein Comic-„BRUMM!“. Die Grafik ist das Noun-Project-Icon „Mini Cooper“ von kiddo, das Benjamin geliefert hat (16.10.2026, ersetzt Claudes eigene Zeichnung). Es steht unter CC BY 3.0, deshalb steht unter dem Auto klein der Credit `Icon: kiddo / Noun Project`.
- Während der Wagen durch die Mitte fährt, erscheint groß in der Bildmitte das **originale MINI-Logo** in Weiß. Die Flügel klappen auf, indem es horizontal von 0 auf volle Breite aufgezogen wird, mit kurzem Überschwinger. Danach blendet es aus. Quelle: [File:MINI logo.svg](https://commons.wikimedia.org/wiki/File:MINI_logo.svg), Wikimedia Commons. Die Commons-Metadaten bleiben in der Datei erhalten. Benjamin hat entschieden, das Original-Logo trotz Markenrecht zu verwenden, wie es auf Fanseiten üblich ist (16.10.2026).

### CODUMO
- Die Szene wird abgedunkelt. Das **CODUMO-Logo** baut sich auf: Der lila Chevron links (`<`) und der rechts (`>`) schieben sich von den Seiten herein, das gelbe, offene Sechseck in der Mitte zeichnet sich zuerst als Linie und füllt sich dann. Darunter tippt sich in Monospace `codumo.de` herein, ohne Link. Nach etwa zwei Sekunden verschwindet alles.
- Das Logo zeichnet Claude als SVG nach dem PNG `https://codumo.de/wp-content/uploads/2025/06/CODUMO-Logo-2023.png` nach, weil es kein SVG gibt. Farben: Lila etwa `#663399`, Gelb etwa `#F5BC0A`, beide aus dem PNG abgenommen.

### BITU84
- Unten in der Mitte gleitet ein **Erfolgs-Toast im Xbox-Stil** herein: eine dunkle, abgerundete Pille mit einem runden Icon links (Pokal oder Stern, selbst gezeichnet, kein Xbox-Logo). Daneben stehen zwei Zeilen: klein „Erfolg freigeschaltet“, darunter „84G – BITU84“. Der Toast bleibt etwa drei Sekunden und gleitet dann wieder hinaus.

### BEN32
- Benjamins Original-Illustration (`https://ben32.de/assets/ben32_mit_bg_800.jpg`, verkleinert auf etwa 60 KB) erscheint als **Comic-Panel**. Das Panel hat einen weißen Rand, liegt schräg wie ein mit Klebeband auf die Blaupause gepinntes Blatt und ploppt mit Überschwinger herein.
- Eine Comic-Sprechblase am Schaf sagt **„The fence is a lie.“**, der Spruch von ben32.de. Dazu kommt ein Comic-„MÄH!“. Nach etwa drei Sekunden kippt das Panel aus dem Bild.
- Das Schaf wird nicht einzeln animiert, weil die Grafik eine vollständige Illustration mit Hintergrund ist.

## 5. BENNI-Party (ersetzt „Hallo, Freund“, 16.10.2026)

Die BENNI-Belohnung wird zur Party (Benjamin, 16.10.2026). Sie dauert etwa acht Sekunden:

1. **Begrüßung:** Über der Leiste ploppt groß und im Comic-Stil **„HALLO, FREUND!“** auf, Buchstabe für Buchstabe mit Überschwinger.
2. **Party-Steine:** Der Beutel erscheint und schüttet fünf komplett farbige Steine **P, A, R, T, Y** aus. Sie haben einen weißen Buchstaben und den Punktwert, die Farben sind Rot `#c8423a`, Blau `#2f6db5`, Gelb `#f5bc0a`, Türkis `#20b69e` und Pink `#e74266`.
3. **La-Ola:** Die fünf BENNI-Steine heben sich nacheinander aus ihren Feldern, kippen kurz und setzen sich wieder. Die Welle läuft zweimal.
4. **Applaus:** Alle freien Steine, Party-Steine eingeschlossen, hüpfen dreimal durcheinander wie ein jubelndes Publikum.
5. **Konfetti-Regen:** Konfetti rieselt von oben über die ganze Breite und flattert dabei seitlich.
6. **Herz:** Alle freien Steine fliegen hoch und ordnen sich gleichmäßig verteilt über der Leiste zu einem Herz. Das hält etwa eine Sekunde, dann fallen sie wieder herunter.
7. **Abschied:** Die Party-Steine zerplatzen mit einem „PLOPP!“ und verschwinden. *(Claudes Entscheidung: sonst lägen P, R und Y ohne Geheimwort herum und verfälschten den Zähler.)* BENNI bleibt in der Leiste liegen.

Bei Reduced Motion erscheinen nur der Text und ruhig eingeblendetes Konfetti, ohne Party-Steine, Welle, Applaus und Herz.

## 6. Leerlauf-Eskalation (16.10.2026)

Wenn niemand spielt, wird die Seite nach und nach ungeduldig (Benjamin, 16.10.2026; Stufe 4 „MGS-Alarm“ bewusst weggelassen):

1. **Nach 10 s – Fußtippen (Sonic):** Ein zufälliger freier Stein wippt rhythmisch, dazu ploppt einmal ein Comic-„…?“ auf.
2. **Nach 25 s – Einschlafen (Super Mario 64):** Alle freien Steine „atmen“ langsam (leichtes Stauchen), über dem Haufen steigen Comic-„Z“ auf.
3. **Nach 45 s – Attract-Modus (Spielhalle):** Über der Leiste blinkt `PRESS START` in Arcade-Optik. Ein Pac-Man und ein Geist laufen in Schleife über die Bodenlinie, und Steine in Pac-Mans Nähe hüpfen erschrocken hoch.

- Jede Stufe hält an, bis der Spieler etwas tut. Dann endet alles sofort, und der Zähler beginnt von vorn.
- Als „Spielen“ zählen Klick, Touch und Tastendruck, **nicht** reine Mausbewegung. Sonst sähe jemand, der nur mit der Maus über die Seite fährt, die Animationen nie. *(Claudes Entscheidung)*
- Während einer Belohnung, während der Beutel schüttet und im Hochformat läuft der Zähler nicht.
- Bei Reduced Motion gibt es kein Wippen, kein Atmen und keinen Pac-Man. Es bleiben nur das „…?“, still eingeblendete „Z“ und ein stehendes `PRESS START`.

## Technik

- Weiterhin keine neuen Dependencies, kein Build und keine Web-Fonts.
- Neue Assets liegen im Repo unter `assets/`: das MINI-Logo-SVG und das verkleinerte Ben32-Bild. Das CODUMO-Logo und das Auto-SVG dürfen inline im Code stehen.
- Die Physik und das Rendering müssen zur Laufzeit Steine hinzufügen können (Nachlieferung) und beim Neustart auf die zwölf Grundsteine zurückfallen.
- Mit 22 Steinen wird es am Handy im Querformat voll. Die Steine dürfen sich stapeln, müssen aber greifbar bleiben. Geprüft wird bei 812 × 375. Die Nachlieferung fällt deshalb über die **ganze Breite** ein und nicht nur in die schmale Abwurfzone. Bei 812 px Breite ergeben 22 Steine etwa zwei Lagen, und die passen unter die Leiste. Höher als die Unterkante der Leiste sollen freie Steine nicht dauerhaft liegen. Wenn das beim Test nicht klappt, wird die Leiste im Querformat am Handy etwas höher gehängt. *(Claudes Entscheidung)*
- Reduced Motion: Alle neuen Belohnungen blenden ruhig ein und aus, ohne Wackeln, Fahren und Überschwinger.

## Prüfen

- Zähler: Mehrere Wörter auf normalen, hellblauen und roten Feldern legen und den Wert nachrechnen. Herausziehen senkt den Wert.
- Neustart: nach dem Freischalten klicken → wieder 12 Steine, Zähler 0, REV 0.1.
- BENJAMIN BAUM legen → Stempel, REV 1.0, zehn neue Steine. Ein zweites Mal legen → Stempel, aber keine weiteren Steine.
- MINI, CODUMO, BITU84 und BEN32 nacheinander und auch zwei gleichzeitig in der Leiste legen.
- Desktop 1440 × 900, Querformat 812 × 375, Konsole ohne Fehler.

## Ideen / Später

- Eine Zähleranzeige „gefundene Geheimnisse: 3/7“. Bewusst nicht jetzt, weil sie verraten würde, dass es mehr gibt.
