# Problem

«November Games» trägt den Ursprung des Studios im Namen: Der Nationale
Zukunftstag findet jeweils im November statt. Schülerinnen und Schüler von der
5. Primarklasse bis zur 1. Oberstufe entwickeln dabei eigene Spiele – und retten
ganz nebenbei die Welt.

Die bestehende Variante vermittelt diesen Zusammenhang noch kaum. Ihre Tagline
nennt einen Donnerstag im November, die Seiten verwenden den allgemeinen
Studioauftritt und ein helles, zurückhaltendes Theme. Was den Namen trägt – junge
Menschen, die Zukunft ausprobieren und selbst etwas erschaffen – bleibt im
Hintergrund. Für die Teilnehmenden, ihre Familien und weitere Spielinteressierte
fehlt damit ein unverwechselbarer Zugang zu den Spielen und ihrer Geschichte.

Status: Zur Umsetzung angenommen und am 15. November 2026 für die bestehende
Variante `november-games` umgesetzt. Die folgende Problemstellung beschreibt den
Ausgangspunkt; den aktuellen Stand hält die
[Architekturdokumentation](../../architecture/README.md#variants) fest.

# Solution

November Games bekommt den Charakter einer kleinen Spielewerkstatt aus der
Zukunft. Der Synthwave-Stil verbindet den November und den Zukunftstag visuell:
draussen dunkel, drinnen leuchten Ideen. Die Stimmung ist neugierig, mutig und
spielerisch. Die jungen Entwicklerinnen und Entwickler sind die Menschen, die
diese Zukunft gestalten.

Der Vorschlag umfasst fünf Elemente:

1. **Ein Einstieg, der den Namen erklärt.** Auf der Startseite stehen der Name,
   ein kurzer Leitsatz und der Bezug zum Zukunftstag zusammen. Ein möglicher
   Text: «Im November bauen wir Zukunft. Und Spiele.» Ein kurzer Absatz erklärt,
   dass Schülerinnen und Schüler von der 5. Primarklasse bis zur 1. Oberstufe am
   Nationalen Zukunftstag eigene Spiele entwickeln. «Spiele entwickeln. Die Welt
   retten.» funktioniert als augenzwinkerndes Studiomotto; konkrete Aussagen zu
   den Spielen bleiben bei deren dokumentierten Inhalten.
2. **Eine futuristische, gut lesbare Spielauswahl.** Die vorhandenen Spiele
   erscheinen als klar getrennte Felder einer futuristischen Konsole. Titel,
   Kurzbeschreibung, «Spielen» und der Zugang zu weiteren Informationen bleiben
   unmittelbar erkennbar. Dunkle Flächen, wenige leuchtende Akzente, kantige
   Konturen, violette Flächen und ein Sonnenuntergang in Pink und Cyan geben die
   gestalterische Richtung vor. SVG-Illustrationen ergänzen die Spielauswahl.
   Die Spiele stehen im Vordergrund; Dekoration unterstützt die Orientierung.
3. **Eine zusammenhängende Welt auf allen Seiten der Variante.** Startseite,
   Spieleseiten und «Über uns» teilen die neue Gestaltung. Die Spieleseiten
   halten Beschreibung, Steuerung und Spielstart gut zugänglich. «Über uns»
   erzählt den Zusammenhang zwischen November, Zukunftstag und dem eigenen
   Entwickeln. Die Sprache bleibt direkt, verständlich und in Schweizer
   Rechtschreibung. Futuristische Akzente dürfen verspielt sein, längere Texte
   brauchen ruhige Flächen und klare Schrift.
4. **Kurze Wege durch das Angebot.** Von der Startseite geht es direkt ins Spiel
   oder zuerst auf dessen Informationsseite. Von dort führt «Alle Spiele» zurück
   zur Auswahl. «Über uns» erklärt den Ursprung; die bestehende Navigation und
   der Rückweg zur Variantenübersicht bleiben erhalten. Die Website funktioniert
   auch auf dem Telefon, ohne damit eine mobile Steuerung der Spiele zu
   versprechen.

5. **Eine Landschaft zum Ausprobieren.** Auf ausdrücklichen Wunsch wurde der
   Pitch nach der ersten Umsetzung um Synthwave-Grafiken, ein interaktives Canvas
   und Tastaturnavigation erweitert. Der Sonnenuntergang liegt als bildschirmfüllender
   Hintergrund hinter allen Seiten der Variante. Eine stilisierte Mythen-Silhouette
   und das Kloster Einsiedeln stehen im Neon-Gitter; die Zahl als Bildmotiv entfällt.
   Mausbewegungen verändern die Aussicht. Klicks ausserhalb von Bedienelementen
   oder die Aktivierung von «Szene steuern» senden einen Lichtimpuls. Bei Fokus
   auf diesem Knopf lenken Pfeiltasten die Szene, Tab führt normal weiter. Ein sichtbares Menü mit
   `Alt+K`, Pfeiltasten in der Navigation und Spielauswahl sowie die normale
   Tab-Reihenfolge ermöglichen Tastaturbedienung. Die Effekte sind pausierbar und
   beachten reduzierte Bewegung; SVG und normale Links funktionieren ohne Skript.

Die Landschaft ist eine freie Synthwave-Komposition der Region. Als visuelle
Referenzen dienen das [beschriftete Mythen-Panorama von RAOnline](https://www.raonline.ch/pages/ch/gal/chpanoal04b3b.html)
und die [Frontansicht des Klosters Einsiedeln](https://de.academic.ru/pictures/dewiki/75/Kloster_Einsiedeln_Frontansicht.jpg).
Die Silhouetten sind eigene Vektorzeichnungen; keine Fotos werden eingebunden.
Leseflächen bleiben dunkel und transparent, während die Startseite Raum für den
Hintergrund lässt.

Das [editierbare Navigationsmodell](pitch--zukunftstag-cyberpunk.breadboard.excalidraw)
zeigt diese Wege ohne eine fertige Oberfläche vorzugeben. Die Szene wurde lokal
erstellt; eine visuelle Prüfung im Excalidraw-Browser war wegen des nicht
erreichbaren Canvas-Servers nicht möglich.

Das begrenzte Experiment ist ein vollständiger Auftritt der vorhandenen Variante
mit den bestehenden Spielen. Beim Vergleich sollen Besucherinnen und Besucher
den Namen mit dem Zukunftstag im November verbinden, die jungen Menschen als
Entwickelnde erkennen und ohne Erklärung ein Spiel starten können. Dies lässt
sich an der Startseite, einer Spieleseite und «Über uns» auf Computer und Telefon
prüfen, einschliesslich Lesbarkeit, Tastaturbedienung und sichtbarem Fokus.

Die Umsetzung bleibt in `src/pages/november-games/` und
`src/variants/november-games/`. Die vorhandenen gemeinsamen Spielinhalte und
Spieladressen werden weiterverwendet; interne Links verwenden `href()`.
Die Übersicht übernimmt wie bisher das Theme und die Metadaten der Variante.
Die Seiten bleiben statisch erzeugt. Für die ausdrücklich gewünschten
Interaktionen ergänzt lokales JavaScript das HTML, CSS und SVG; siehe
[ADR 0005](../../architecture/decisions/0005-enhance-november-games-with-local-interactions.md).

# Security

Der Vorschlag benötigt keine Datenerfassung oder externen Dienste. Maus- und
Tastaturereignisse werden nur lokal verarbeitet. Die optionale Sitzungsspeicherung
merkt sich ausschliesslich, ob bewegte Effekte pausiert sind.
Er beschreibt die beteiligte Schulstufe ohne Namen, Porträts oder andere
persönliche Angaben zu Kindern. Die Spiele und ihr Quellcode bleiben über die
vorhandenen Links erreichbar; Spielinhalte werden nicht in die Website eingebettet.

# Rabbit Holes

- **Cyberpunk wird zur Effektsammlung.** Glitch-Animationen, Partikel, Videos oder
  eine aufwendige 3D-Stadt würden die Gestaltung dominieren. Die gewünschte
  Interaktion bleibt auf ein begrenztes 2D-Canvas und die Spielillustrationen
  beschränkt. Keine Startsequenz, keine neuen Grafikbibliotheken; der Vollbild-
  Hintergrund begrenzt Auflösung und Bildrate. Animationen pausieren in verborgenen
  Tabs und bei reduzierter Bewegung.
- **Neon verdrängt Lesbarkeit.** Leuchteffekte bleiben dekorativ. Fliesstext,
  Spielaktionen und Fokuszustände müssen auch ohne Effekte klar erkennbar sein;
  Informationen dürfen nicht allein durch Farbe vermittelt werden.
- **Der Stil wird zu düster oder zu technisch.** Die Gestaltung soll den Stolz
  aufs Selbermachen tragen. Dystopische Gewaltmotive und schwer verständliche
  Konsolenbegriffe würden den Zugang für Kinder und Familien erschweren.
- **Das Motto erfindet Spielhandlungen.** «Die Welt retten» gibt dem Studio eine
  spielerische Haltung. Es behauptet weder Rettungsmissionen in Moto Devil oder
  Car Drive noch eine reale gesellschaftliche Wirkung der Spiele.
- **Der Entwurf wächst zur neuen Plattform.** Zusätzliche Geschichten, ein
  Jahresarchiv oder eine ausgearbeitete Science-Fiction-Welt sind für den
  Vergleich des Namenskandidaten nicht erforderlich.

# No-Gos

- Änderungen an anderen Varianten, der gemeinsamen Spielesammlung oder den
  Spielen selbst.
- Neue Seitenarten, Konten, Ranglisten, Kommentare oder Anmeldeformulare.
- Kopierte Spiel-Builds oder Spiel-Assets sowie neue externe Schrift-, Medien-
  oder Tracking-Dienste.
- Blinkende Effekte, obligatorische Animationen oder Tastenkürzel, die normales
  Schreiben, Browserbefehle oder die Tab-Navigation übernehmen.
- Ein verbindliches Logo, eine endgültige Namenswahl oder die Umbenennung der
  Organisation und ihrer Repositories.
