# Architecture

A static website built with Astro 7, Tailwind CSS 4 and daisyUI 5
([ADR 0001](decisions/0001-build-a-static-site-with-astro-and-daisyui.md)) and
published on GitHub Pages. It has no server, and no content depends on client-side
JavaScript; a variant may add small scripts for optional effects
([ADR 0004](decisions/0004-allow-optional-client-side-scripts-in-a-variant.md)). November Games adds
keyboard navigation and an interactive canvas background
([ADR 0005](decisions/0005-enhance-november-games-with-local-interactions.md)), and
2raben games a small canvas scene within the rules of ADR 0004. Waldstatt Games
is the exception to script-free content: its home page is a building game drawn
with PixiJS, and its content is reached only through play
([ADR 0006](decisions/0006-make-waldstatt-games-a-browser-game.md)). Until
the studio's name is chosen, the site holds one complete version per name
candidate ([ADR 0002](decisions/0002-compare-name-candidates-as-variant-routes.md)),
each with its own pages, layout and theme.
All text on the site is German, written with Swiss spelling ("ss", not "ß").
See [CONTRIBUTING.md](../../CONTRIBUTING.md) for checks.

## Variants

Each name candidate is an independent version of the site
([ADR 0003](decisions/0003-give-each-variant-its-own-pages-and-styles.md)) and owns
two folders named after its slug:

| Path | Contents |
| --- | --- |
| `src/pages/<slug>/` | Its pages: `index.astro`, usually `ueber-uns.astro` and `spiele/[game].astro`, and any pages only this variant has |
| `src/variants/<slug>/meta.ts` | Slug, name, and tagline |
| `src/variants/<slug>/Layout.astro` | HTML shell with `data-theme="<slug>"`, navigation, footer; loads `styles.css` |
| `src/variants/<slug>/GameCard.astro` | A game card linking to the game and to its page (not in Waldstatt Games) |
| `src/variants/<slug>/styles.css` | Tailwind, typography plugin, and daisyUI without built-in themes |
| `src/variants/<slug>/theme.css` | The variant's custom daisyUI theme, named after the slug |

The first four variants started from the same layout and pages, and their themes started as
copies of daisyUI's retro (Schafbock Studio), cupcake (Egg Settlers), nord
(November Games) and forest (Waldstatt Games). 2raben games was added later from
the same starting point, with its own theme from the start. A variant may add components and
modules of its own to its folder. Change a variant only inside its own folders;
never import another variant's files.

### Schafbock Studio

A pop-art comic starring a superhero ram, shaped in the
[pitch](../pitches/schafbock-studio/pitch--pop-art-superhero.md). Its own theme
replaces the retro copy, and the comic face Bangers comes self-hosted from
`@fontsource/bangers`. Its folder `src/variants/schafbock-studio/` adds:

| Path | Contents |
| --- | --- |
| `Ram.astro`, `RamHead.astro` | The ram as SVG in four poses: landing (home), moto (Moto Devil), car (Car Drive), sketch (Über uns) |
| `Burst.astro`, `Icon.astro` | Sound-effect bursts and small comic icons |
| `comics.ts` | The variant's comic retelling of each game, keyed by game id; `getComicGames()` fails the build when a game has none |
| `MotoTour.astro`, `CarRoad.astro` | Charts of each game's facts: Moto Devil's countries, Car Drive's road and levels |
| `MotoDemo.astro`, `CarDemo.astro` | Key demos for each game's controls; hidden until their script runs |
| `effects.ts` | Optional effects on pointer movement, clicks and typing ([ADR 0004](decisions/0004-allow-optional-client-side-scripts-in-a-variant.md)) |

The game pages show the variant's comic copy first and the shared game Markdown
below it. Running text sits on flat backgrounds; halftone dots only appear behind
shapes and large display headings.

### November Games

November Games has a dark synthwave theme with pink, sunset and cyan accents.
Its home and about pages explain the Nationaler Zukunftstag and the participating
school levels; the world-saving motto is studio copy, not a claim about game
content. Game pages retain the shared Markdown and existing play/source links.
The overview automatically uses the updated theme and tagline.

The variant owns `Horizon.astro` (SVG landscape), `landmarks.ts` (the projected
monastery model, river, label layout and scene placement), `panorama.ts`
(generated skyline and summit data) and its generator `tools/panorama.mjs`,
`GameArtwork.astro` (decorative SVG game
illustrations), `GamePreview.astro` with `preview.ts`, `previewMoto.ts` and
`previewCar.ts` (the game previews), `SynthwaveScene.astro` (fixed full-viewport canvas with SVG fallback
on every November Games page), `KeyboardControls.astro`, `interactions.ts` and
`scene.ts`. No game assets, external
fonts, rendering libraries or remote services are loaded. The numeric November
motif has been removed. See the
[implemented pitch](../pitches/november-games/pitch--zukunftstag-cyberpunk.md).

All links work without JavaScript. With JavaScript, a visible Navigation button
or Alt+K opens a native modal dialog. Up/Down and Home/End select its links;
Enter follows a link and Escape closes the dialog and restores focus. Left/Right
and Home/End move between header links or between the same action on each game
card. Tab keeps its native order throughout. Shortcuts ignore editing fields,
composition and unrelated modifier combinations. A skip link and visible focus
are available on every page.

The full-screen background reacts to pointer movement across the document and
clicks/taps outside interactive controls. It never captures pointer events or
keyboard focus itself. The visible «Szene steuern» button accepts arrow keys;
its native click, Enter and Space activation send a light impulse. Tab continues
to the next control. A hint appears when that button is focused or hovered.
Game artwork still tilts towards the pointer, and focused games are highlighted.

Each game page shows a preview («Probefahrt») below its heading: a neon canvas
with simplified rules from the game's text, not the game itself. Moto Devil's
follows the 2raben games key warm-up: the motorbike accelerates, brakes, tilts
into a salto, jumps over a ramp, fires the jet while Space is held after a jump,
turns round, restarts and crashes back to the start on a bad landing. Car
Drive's follows the Egg Settlers practice road: three lanes with traffic both
ways, cars that blink before changing lanes, levels every 1000 m, trucks from
4000 m, hearts, a shield, coins and the boost gauge. Both rule sets were copied
into this variant and redrawn; nothing is imported from another variant. A
demonstration plays while the preview is on screen until somebody presses a key
from the controls table or an on-screen key; after eight idle seconds it takes
over again. Keys are handled only while the preview has focus, Escape leaves
it, and the on-screen keys work by pointer and touch, held while pressed. A live
region announces actions while somebody plays. There is no demonstration with
reduced motion or with the effects switched off. The loop runs at about 30
frames per second, only while the preview is on screen and moving. Without
JavaScript or a 2D canvas the preview stays hidden; clicks in it send no
impulse to the background.

The landscape is a synthwave composition of a real view. The mountain panorama
is generated from swisstopo elevation data and swissNAMES3D summit names as seen
from about 450 m above the Klosterplatz Einsiedeln, looking south-west towards
the Mythen. It is drawn in four depth bands with heights exaggerated 2.2 times
over headings 140° to 252°, easing down into the plain over the outer 12° at
both ends, and labels each visible summit outside those ends with its official
height. `panorama.ts` records
the viewpoint and is not edited by hand: `node
src/variants/november-games/tools/panorama.mjs` downloads the data from
api3.geo.admin.ch into `node_modules/.cache/november-games-panorama/` (about
3000 requests on the first run; later runs fetch only what is missing) and
regenerates it. The script holds the viewpoint, the drawing parameters and the
labelled summits with their names and heights. The site itself never contacts
swisstopo. The monastery is a simplified 3D model
of the west front after photographs and measured from them: corner pavilions
with turrets, four-storey wings, the twin towers with their stages, clocks,
belfries and copper domes over a square plan with lanterns, and the convex
church front with its attic, niche and statues, about 145 m in all, and the
north wing with the north-east pavilion behind, about 105 m deep after the
abbey's outline in OpenStreetMap; the east and south wings stay out of sight. The main
tower clocks show the time in Einsiedeln (Europe/Zurich) with an hour and a
minute hand, the upper ones a single minute hand across the dial, as on the
real towers; the canvas redraws them every minute, and the static SVG shows
ten past ten. It is projected so that its
lines meet the floor grid's vanishing point, where the sun sets. Where the page
leaves a margin of at least 200 px left of its text column (from 105rem), the
monastery stands in that margin instead: further away, turned towards the
viewer at 45°, close enough that the near tower stands larger than the far
one, and drawn 1.15 times taller so that it does not look squat from the front
(`abbeyPose()` in `landmarks.ts`); its lines meet the horizon at their own
point. About 54° off the centre of the view, a flat projection would stretch it
sideways by 1.7 times, so it is projected as if looked at straight on and then
moved to where its heading lies on the screen; it keeps its proportions and size
while the view turns. The Alp is drawn freely, from below Grosser Mythen
across the floor towards the viewer. On its far bank, on the right, stand the
ski jumps of Einsiedeln, drawn freely after a photograph and facing left
towards the monastery: the large and the medium hill with in-runs on concrete
pillars, the start tower on the hilltop, landing hills with distance marks and
floodlights, the judges' tower between them, and a small hill behind. Canvas and fallback SVG share these drawings
in "scene units" whose origin is the vanishing point. Chrome ignores CSS geometry
on nested SVG elements, so `Horizon.astro` renders the wide and narrow placements
as attributes and switches between them with a media query; the about-page card
always uses the narrow placement. The wide placement holds both monasteries, the
one in the margin computed for 1920 × 1080, and the same media query picks one.
From 105rem the shade behind the home-page text follows the text column instead
of the screen's left edge.

Arrow keys on «Szene steuern» turn the view between 35° left and 20° right, and
mouse movement turns it slightly. The tele panorama and the sun pan by the turn.
The floor grid, monastery and river are projected in 3D from a near-field camera
(`viewFor()` in `landmarks.ts`): turning left orbits it around the church front
by 1.5 times the turn, as in a 3D map, so that the west front is seen more and
more from the front; turning right turns it in place. Its painting order holds
while the camera stays north of the towers. Around the monastery in the margin,
hundreds of metres away, such an orbit would swing the camera across the floor,
the river and the ski jumps, so there turning left only turns the camera, like
turning right, and the monastery moves with the view, behind the text if need
be. The river's distant part bends to meet the
Alptal in the panorama while the valley is near; when a turn pans the valley
far away, the bend lets go instead of dragging the river across the floor. Summit labels behind the home-page headline are
dimmed.
The home page leaves space to see the landscape; longer content uses translucent
dark surfaces. Visual reference sources are recorded in the
[pitch](../pitches/november-games/pitch--zukunftstag-cyberpunk.md#solution).

The effects button pauses movement, remembering the choice in optional session
storage. Reduced-motion preferences always disable movement; navigation still
works. The renderer caps pixel density at 2, raster size at approximately three
million pixels and drawing at 30 fps, limits concurrent impulses, and suspends
its animation loop in hidden tabs. Glowing landmarks are drawn into offscreen
canvases once per size, and the monastery and ski jumps again whenever the view
turns by a tenth of a degree, cut to the screen so that a drawing turned far to
the side never grows past it; each frame only copies them and redraws the floor and river. The fixed canvas remains visible when the page scrolls. A static SVG remains if JavaScript or the 2D context is unavailable;
the unavailable scene control stays hidden. Phone layouts retain readable game
controls without promising mobile game support.

### Egg Settlers

A strategy-game interface in which the settlers build a giant egg, shaped in the
[pitch](../pitches/egg-settlers/pitch--egg-settlers.md). The pages lie on a
pixel-art meadow, and the illustrations are top-down pixel art in the manner of
1990s settlement games, drawn for this variant and copied from none. Text sits
on parchment, stone and wooden panels; headings use Cinzel, self-hosted from
`@fontsource/cinzel`. The header is a resource bar whose "Spiele" counter counts
the game collection; the other counters are jokes. Its folder
`src/variants/egg-settlers/` adds:

| Path | Contents |
| --- | --- |
| `pixel.ts`, `Paths.astro` | The pixel-art renderer: drawings as color grids from hand-drawn rows or seeded generators (grass, paths, trees, huts, the egg), output as one SVG path per color with crisp edges |
| `sprites.ts` | Detailed sprites on top of the renderer: houses in an oblique view with walls, gables and tiled, thatched or slate roofs; the monastery of Einsiedeln with arcades and fountain, the dam, towers, windmill, crane, ships; settlers, men and women, in two frames; animals, goods and a building site |
| `map.ts` | The home page's 480 × 300 map, computed at build time and loosely after Einsiedeln: the Sihlsee with its dam, the Sihl and the Alp with bridges, the monastery square, roads, plaza, fields, buildings, seeded woods, settlers at work and on the roads, the walkers' keyframes, the water names, and the grid of cells where visitors may have houses built |
| `Settlement.astro`, `Thing.astro` | The map as the home page's fixed fullscreen background, with the giant egg in six rings of shell inside a wooden frame, and over it the intro and a command bar with progress, status, "Bauen", "Haus bauen" and the settler |
| `settlement.ts` | The optional interactions ([ADR 0004](decisions/0004-allow-optional-client-side-scripts-in-a-variant.md)): building the egg ring by ring, the settler's replies, and crews that walk to a clicked spot of meadow, fell its trees and build a house |
| `Settler.astro` | The foreman's portrait, a settler woman with a calm and a grumpy face |
| `Building.astro`, `buildings.ts`, `vehicles.ts` | Each game's picture, keyed by game id: Moto Devil's stunt track in side view (bike, ramp, spikes, loop, raven, gravestone, goal) and Car Drive's three-lane road from above (traffic, truck, pickups, hearts, boost, garage); a house for any game without an entry |
| `MotoPractice.astro`, `CarPractice.astro`, `practice.ts`, `motoPractice.ts`, `carPractice.ts`, `motoCourse.ts`, `carRoad.ts` | The practice grounds on the game pages: small simulations with simplified rules from each game's text, driven by the keys of its controls table or on-screen buttons, with a demonstration that plays until somebody takes over |
| `TechIcon.astro` | The icons of the name's tech tree on the about page: Ei, siedeln, Ei-siedeln, Egg Settlers |
| `ResourceIcon.astro` | The resource bar's icons |

The pixel art is generated at build time, so the same build always draws the
same picture; `Layout.astro` sets the grass tile as the page background. On the
home page the map lies fixed behind the page (`main` isolates its stacking
context) and is cropped around the egg on narrow screens; on phones it moves
down behind the taller resource bar. On wide screens the intro sits beside the
command bar at the bottom, leaving the top of the map free. Sprites are defined
once and placed with `<use>`; two-frame sprites alternate through CSS, and
walkers follow keyframes that `map.ts` writes into the SVG. The home page weighs
about 150 kB gzipped.

The map follows Einsiedeln's water loosely: the Sihl leaves the Sihlsee's dam at
the north end and the Alp flows from the south through the village into it. The
lake lies west of the village, not east as in reality, to keep the picture's
composition. The monastery is a simplified drawing without religious symbols.
The names of the lake and the rivers are SVG text, not drawn letters.

Without JavaScript the egg stands with its first ring, its planned outline and
the status "Im Bau"; the buttons and the settler stay hidden, and so do the
practice grounds. The scripts read their text from the page's data attributes
or their own source, create sprites with `createElementNS` and never set HTML
from strings; they store nothing, and a reload starts over. A click on the map
reaches it through the overlay, whose empty parts ignore the pointer; "Haus
bauen" offers the same for keyboards. The practice grounds run only while on
screen. Reduced motion stops every animation of the map, which then shows each
sprite's first frame; houses then appear at once, and the practice grounds play
no demonstration but still respond to input.

### 2raben games

A funny pixel-art version, shaped in the
[pitch](../pitches/2raben-games/pitch--pixel-raben.md): two ravens, a nod to the
two ravens in the Einsiedeln coat of arms, host the site. They are our own
drawings; the site shows neither the coat of arms nor a shield. The theme pairs
cream paper with raven black and red, with square corners. The header is red with
the ravens in black, the colours of the district's arms; its crest of two flying
ravens, one above the other and flapping in turn, is larger than the bar and hangs
out of it. The pixel face Jersey 10
comes self-hosted from `@fontsource/jersey-10` and is used only for short text;
running text stays in the default sans-serif. Its folder
`src/variants/2raben-games/` adds:

| Path | Contents |
| --- | --- |
| `pixels.ts` | The one source of all pixel art: palette, raven poses and scarf, props, the stage scenery (`composeBackdrop`: sky, sun, mountains, hills, monastery, firs, clouds), the 3×5 bubble font |
| `scenes.ts` | Static pictures composed from it: the stage's still frames, the header crest, the perched pair, vignettes, module icons, the about picture |
| `PixelArt.astro` | Renders a picture as crisp SVG at build time |
| `RavenStage.astro`, `stage.ts` | The home page's hero with the raven stage as its background: still SVG, replaced by the canvas scene when the script runs |
| `GameModule.astro` | A game as a cartridge with its vignette, «Spielen!» and «Mehr erfahren» |
| `ravens.ts` | The ravens' comment, picture and key summary per game, keyed by game id; `getRavenGames()` fails the build when a game has none |
| `Keycaps.astro` | The key summary as pixel keys |
| `KeyDrill.astro`, `drill.ts` | The key warm-up («Probefahrt») on each game page: a pixel canvas driven by the game's keys; hidden until its script runs |

Game pages show a vignette, the raven's comment and the play button first, then
the key summary, the key warm-up and the shared game Markdown. The warm-up, like
Schafbock Studio's key demos, is not the game: no traps, no traffic, no score.
Focused, it handles the keys from the game's controls table. In Moto Devil's, the
motorbike accelerates, brakes, tilts into a salto, jumps over a ramp, fires the
jet while Space is held, turns round and restarts, and crashes back to the start
on a bad landing. In Car Drive's, the car changes between three lanes, boosts and
restarts, and follows a mouse pointer's lane. A raven comments in the bubble font,
and a live region announces each action. The on-screen keys work by pointer and
touch, held as long as they are pressed. The scene only moves while the warm-up
has focus. The comments only retell the
games' documentation: Moto Devil's ravens in a dive, Car Drive's bird's-eye view.

The stage fills the hero behind the title, the intro and the buttons; the content
lets clicks through to the sky, and the stage is a sibling of the content, so keys
on its buttons never reach the scene. A soil strip closes the hero. The stage draws
at a low resolution (about 140 pixels high and at least 120 wide) and is scaled up
by a whole number, so pixels stay sharp. Two ravens start one above the other, then
fly to perches (ground, monastery roof and towers, firs); the second follows a
wing length behind and lands next to the first or on the ground below. Idle, they
blink, peck, call «Krah!» and bump each other. A click or tap sends the first
raven there; tapping a raven makes it call. «Raben steuern» moves focus to the
stage (`role="application"`), where arrow keys or WASD fly and Space calls;
Escape returns to the button and Tab leaves normally. Keys are only handled while
the stage has focus. «Pause» stops the scene. The loop runs at about 30 frames
per second and stops while paused, off-screen or in a hidden tab. With reduced
motion, without script or without a 2D canvas, the still picture stays (one for
wide and one for tall screens) and the controls stay hidden; the header crest
stops flapping with reduced motion. Nothing is stored or sent.

### Waldstatt Games

A building game in an endless forest, shaped in the
[pitch](../pitches/waldstatt-games/pitch--aufbauspiel-im-wald.md): «Waldstatt» is
the historical name for Einsiedeln, and its people were the «Waldleute». The home
page is the whole variant. Visitors fell trees, build, and find the site's
content hidden in the forest; there are no about or game pages, and without
JavaScript or WebGL only a still picture of the forest, the name and a note show
([ADR 0006](decisions/0006-make-waldstatt-games-a-browser-game.md)). The map is
an isometric view drawn with PixiJS 8 (WebGL) that turns top-down for reading;
the toolbox and menus are HTML, and so is everything visitors read or use on
the map. Its folder `src/variants/waldstatt-games/` holds:

| Path | Contents |
| --- | --- |
| `Game.astro` | The page: map host, toolbox, menus, the back button, the confirmation for «Neu beginnen», and inert `<template>`s with the Ortstafel, the Chronik and each game's rendered Markdown, which lie hidden in the forest |
| `Forest.astro` | The still picture: the start of the generated forest as SVG, shown until the game is ready and instead of it |
| `Icon.astro`, `icons.ts` | Pixel icons as colour grids for the toolbox, the Waldmensch's portrait and the app icon |
| `png.ts` | A small PNG encoder for the app icons at build time |
| `tools/waters.mjs`, `tools/gpkg.mjs`, `tools/shapefile.mjs`, `tools/download.mjs` | Generate the water data from swisstopo's GeoPackages and BAFU's stream orders; see below |
| `game/waters.ts` | Generated: the index of the water pages (which have a file, which lie wholly in Switzerland), the Sihlsee basin, the dam's site and the page format |
| `data/water-pages.json` | Generated: Switzerland's waters and border in pages of 10 × 10 km, in tiles; one long line, ignored by Prettier |
| `game/config.ts` | The balance table: costs, footprints, build times, speeds, stock limits, the hidden texts and where they lie |
| `game/world.ts` | The world: the forest from a fixed seed, and the water pages, loaded as they come into view and rasterized into tiles: water, lakes by number, the palisade and the land abroad |
| `game/iso.ts` | The projections between tiles and the screen: the isometric view, the top-down plan, and the blend between them |
| `game/state.ts` | The save in IndexedDB ([ADR 0007](decisions/0007-save-waldstatt-games-in-indexeddb.md)): the settlement, the people and one record per chunk, validated on load, written in part, reset by deleting the database |
| `game/sim.ts` | The rules: the tools on the ground, marking and felling, the hidden texts, Waldleute and their tasks (walking back to eat included), bridges, ports and ships, building sites, placing rules, what the build menu shows, ruins and repair, the ravens; it steps the systems below in turn |
| `game/economy.ts` | The goods: the shared stock and its limits, the crews and recipes of the producing buildings, beer for the Spielhäuser and the theatre, the upkeep of the Klause, the churches and the Kloster, the Brot auswerfen |
| `game/people.ts` | The Waldleute's lives: ages, meals and where food reaches, children, deaths, graves and tombstones, beds, the fire and the first pair |
| `game/mood.ts` | Motivation: where it tends with what stands, passing events, and the work speed it sets |
| `game/growth.ts` | The forest growing back: seedlings on felled ground beside forest, kept down where Waldleute walk |
| `game/flood.ts` | The Sihlsee filling and draining tile by tile, buildings sinking, and the flood wave down the Sihl |
| `game/nav.ts` | Finding ways: the Waldleute's search over open ground and crossings by ship, straightening ways, and ships' routes over their lake |
| `game/texts.ts` | Reads the templates and splits each text into sections at its `<h2>` headings |
| `game/art.ts` | The painted art for the isometric view on canvases at twice the resolution: trees, Waldleute, ravens, the axe and the saw, buildings (a house of its own for each game, with the game's name painted on its front), the amphitheatre in two parts, ground textures |
| `game/plan.ts` | The same buildings, trees and Waldleute seen from straight above, for the plan view |
| `game/render.ts` | PixiJS: the ground in tile units under the view's projection (textured tiles in chunks of 16 × 16 with gaps where found texts lie, rivers, lakes, the top-down art, the stage, placing, sawing and cursor overlays), and trees, buildings, Waldleute and the tools on the ground upright on top, sorted back to front, with the ravens and the motes over hidden texts above; the camera's flights and the turn between the views |
| `game/overlay.ts` | The HTML lying on the map under the same projection: found texts under the canvas; upright pins for water names, Einsiedeln and status labels; and the measuring of texts that sets their footprint |
| `game/stage.ts` | The theatre's stage in two canvases: the preview standing on the stage in 3D for the isometric view, and, turned top-down, the preview in 2D with a status line and wooden signs for the programme, the keys and the real game, on the amphitheatre's floor |
| `game/input.ts` | Pointer, touch, wheel and keyboard input on the map |
| `game/ui.ts` | The HTML interface, reading on the map, and announcements |
| `game/preview.ts`, `previewMoto.ts`, `previewCar.ts` | The previews' rules, copied from November Games and repainted as a stage set, each with its scene in 2D and in 3D |
| `game/main.ts` | Start-up, saving and the service worker registration |

`src/pages/waldstatt-games/` holds the home page and four endpoints: the web
manifest, the service worker `sw.js`, the app icons `icon-<size>.png`, and the
water pages `waters/<px>_<py>.json`.

**The world.** One tile is 50 m; tile (0, 0) is the Klosterplatz Einsiedeln,
and north is −y. The first clearing lies 1.8 km north of it at Holzrüti 2
(ISE AG, LV95 2699524 / 1222155 from the federal building register), on the
Alp's west bank. The map is isometric: tiles are 2:1
diamonds, so north lies to the upper right. The forest is generated per tile
from a fixed seed, mostly firs with patches of broadleaf trees, so every visitor
starts in the same forest and only changes are saved. The map covers all of
Switzerland, and its waters are real, from swissTLM3D: rivers and brooks from
Strahler stream order 5 on, after BAFU, and the natural lakes from 0.03 km².
Rivers from order 6 on are drawn wide, the others as brooks, as layered blue
strokes with sandy banks; lakes as their shores. The Sihlsee is a reservoir, so
it is only a basin: until the visitor's dam floods it, the Sihl and its brooks
run through the valley along the lake axes the data records. Other reservoirs,
found by the dams at their shores, are left out; their rivers run through. The
national border is a wooden palisade, with gaps only where water crosses it;
beyond it lies the land abroad, bare and dim, where nobody walks or builds.

The waters come in pages of 10 × 10 km (200 × 200 tiles), one file each, about
1 kB gzipped and at most 3 kB. The pages round Einsiedeln and round the saved
view load before the game starts, as the hidden texts are placed by them;
others load, four at a time, when a chunk of ground in them comes into view.
A page is rasterized into tiles once it arrives: water, the lake each tile
belongs to (so ships know their lake), the palisade, and abroad. Pages wholly
abroad, or wholly in Switzerland without water, have no file. Until its page is
there, a tile counts as forest, its ground is not drawn, and it cannot be
marked; when it arrives, the chunks it touches are made anew and the Waldleute
look for ways again. Ground chunks are made as they come into view, a few per
frame, and destroyed far off screen; trees, buildings and Waldleute are sorted
by depth.
How far one can zoom out is limited so that about 16,000 tiles are on screen at
most.

**The water data.** `node src/variants/waldstatt-games/tools/waters.mjs`
downloads swisstopo's swissTLM3D (about 5 GB zipped, 11 GB unzipped) and
swissBOUNDARIES3D as GeoPackages from data.geo.admin.ch, and BAFU's
«Flussordnungszahl nach Strahler» (FLOZ, a shapefile, open use), once, into
`node_modules/.cache/waldstatt-games-waters/`; unzipping needs `unzip`. It
reads them with Node's built-in `node:sqlite` and a small shapefile reader and
writes `game/waters.ts` and `data/water-pages.json` in about 15 seconds.
swissTLM3D records no stream order, and computing one over its braided
channels, canals and lake axes inflates it; BAFU computed FLOZ on the older
VECTOR25 network. So each piece of swissTLM3D takes the order of the nearest
FLOZ segment of the same watercourse, matched by its water body number
(`gewiss_nr`, `GEWISSNR`) at the piece's midpoint; a watercourse FLOZ does not
know takes the order of a river within 60 m. Kept pieces, culverts included,
are joined into lines per watercourse and width, whichever way each was
drawn. Lake areas are the land cover's
standing waters, named after the shore lines that cover the same box; a lake
with a Staudamm or Staumauer within 100 m of its shore is a reservoir. The
border is Switzerland's area without Liechtenstein, with Büsingen and Campione
as holes. Everything is simplified (rivers to 12.5 m, lakes to 17.5 m, the
border to 25 m), rounded to a tenth of a tile and cut into pages; lines reach
two tiles past their page so strokes meet at its edges. The endpoint
`waters/[page].json.ts` serves each page as its own file. The site itself never
contacts swisstopo or BAFU. The game's menu credits both.

**Play.** The tools lie on the ground and are picked up with a tap: the axe
in the first clearing, beside the Waldmensch; the saw, once a hut stands and
100 trees are felled, where the last of them fell. Until then their buttons
are missing from the toolbox. The axe marks single trees; the saw marks every tree in a dragged area
(two fingers or another mouse button pan meanwhile); with «Abreissen», a first
tap marks a building in red and a second tap on it tears it down, returning half
its costs. Waldleute walk only on open ground: felled forest, the natural gaps,
bridges and the finished dam, never through standing trees or water. They build
the nearest site they can reach (counted a few tiles nearer) and otherwise fell
the nearest marked tree beside open ground, so a sawn area is cleared from its
edge inward and a tree marked deep in the forest waits until a way leads to it.
Felled wood counts at once. Ways are found tile by tile with eight neighbours,
never cutting between two diagonal trees, and straightened where the straight
line stays clear (`nav.ts`). A search reaches 256 tiles from the Waldmensch; to
keep it cheap, at most two run per frame, and tiles from which a search found
nothing are not searched again until a tree is marked or felled, a task is
freed or a way changes.

Water needs building. A **Brücke** spans a river where the visitor points:
the shorter of the straight runs of water across, up to five tiles, from bank
to bank. Brooks count as rivers; their water tiles are at least half a tile
wide, so they form an unbroken line. Lakes take no bridge. A **Hafen** stands on
the shore of a lake: a natural lake, or the Sihlsee once it is dammed. A
**Schiff** is built on the lake beside a finished port. Once a lake has a ship,
Waldleute cross it between any two of its ports: the search counts the
crossing as a path, a Waldmensch waits at the quay, the nearest free ship of
the lake comes, takes everyone waiting for the same crossing, sails over the
lake's water to the other port and returns to its own. Ships under way are not
saved; after a reload they lie at their ports.

**Goods and crews.** Holz, Steine, Pergament, Bücher, Getreide, Mehl, Brot,
Fleisch and Bier are one shared stock with a limit each; nothing is carried,
and what a building makes is in stock at once (`economy.ts`). The producing
buildings take a crew of up to four: the Schafweide (parchment), Getreidehof
(grain), Viehhof (meat), Mühle (grain to flour, only on a river bank),
Bäckerei (flour to bread), Brauerei (grain to beer), Steinbruch (stones) and
Druckerei (parchment and wood to books). A new one asks for a full crew;
tapping a finished one shows a bar with − and + to change it. Crews are filled
from the idle and the nearest adults, always leaving one free to fell and
build, and work only once there; each works faster with motivation. Once
there are stones, the tool **Pflastern** plans cobbles like the saw marks
trees: tap a tile, or drag over an area, of cleared, dry ground that is not
built on, texts included. Waldleute lay one stone per planned tile, as long as
there are stones, and walk half again as fast on cobbles. Planned tiles show a
pale frame until they are paved.

**The Waldleute live** (`people.ts`). Each is a person with a position, an
age, a sex, hunger and work; children (under 14) do not work, and a year
passes in 30 seconds of play. The game starts with a woman and a man by a fire
in the first clearing, with some meat. Waldleute eat a meal every 90 seconds:
within 1 km of a Viehhof or a Bäckerei, or of the fire until the first of
them stands, food reaches them where they are; farther out, a hungry
Waldmensch leaves their work and walks back. Five minutes hungry, or old enough
(60 to 80 years), they die. A woman and a man of the right age have children
now and then while food is plenty, sooner with beer in stock, born by the
nearest house. Huts give four beds, the Steinhaus twelve, the fire two; more
Waldleute than beds lowers motivation and makes the years pass faster. Who dies
within 1 km of a church or the Kloster whose graveyard has room is buried
there; elsewhere a tombstone stays, and motivation drops for a while. A
settlement can die out; nothing brings new Waldleute but children. Children are
drawn smaller, the old greyer and the hungry paler.

**Motivation** («Stimmung», `mood.ts`) sets how fast everybody fells, builds,
paves and produces, from half to one and a half times. It drifts towards a
level raised by working churches and the Kloster, the ISE AG and Spielhäuser
with beer, and lowered by Spielhäuser without beer, overcrowding and hunger;
opening a game from a Spielhaus, the Brot auswerfen and lonely deaths move it
for a while. The Klause, the churches and the Kloster use food and books every
minute, but only goods the settlement can already make; without them they
decay, lose their effect below half (the raven leaves), and fall into ruins,
which a tap repairs for half the costs. A Spielhaus and the theatre drink beer;
without it they are shut, and their play link and stage do not open. The
Brot auswerfen waits for 100 loaves, then throws them one by one to the
hungriest nearby and takes itself down.

**The forest grows back** (`growth.ts`): felled ground beside forest grows
seedlings, drawn small and light, which become trees after four minutes. They
never grow on cobbles, water, buildings, tombstones, by the fire, or where a
Waldmensch walked in the last two minutes, so ways stay open. Over a text they
cover it again unless it is cobbled; a game whose scroll once lay free stays
explored.

**Building.** Buildings stand only on cleared ground: a footprint with trees
shows red, «Zuerst die Bäume fällen». Some have rules of their own: a church
stands more than 1 km from every other church and Kloster not under water, a
graveyard right beside a church or the Kloster, the ISE AG in the first
clearing, the Mühle on a river bank. The build menu shows each building as a
small picture, painted by the same code as the map, and its name; costs show
only while placing. It shows only what has appeared, and what appeared stays:
the Mühle with a Getreidehof, the Bäckerei with a Getreidehof and 10 Waldleute,
the Brauerei with a Getreidehof and 20, a game's Spielhaus once its scroll lay
free and a Brauerei stands, its Bibliothek with its Spielhaus, the theatre with
a Brauerei and a Spielhaus, churches with a Druckerei and 20 Waldleute, the
graveyard with a church or the Kloster, the Kloster with a Druckerei and 50,
the ISE AG with a Druckerei, the Brot auswerfen with a Bäckerei, the dam once
every tree on its site is felled, and the Steinhaus at 100 Waldleute. A dot on
«Bauen» marks that something appeared, until the menu is opened. Content
buildings are one of a kind (per game for a game's buildings). Nothing on the
map opens a panel or dialog: a tap on a building turns the view to its text or
stage, opens its game or source, sets its crew, repairs it, or shows a short
status label for a few seconds. Nothing explains the game: there are no hints,
and announcements tell only what happened. Only «Neu beginnen» in the menu asks
for confirmation.

**Resources.** On wide screens a bar along the top shows the goods the
settlement has had, the Waldleute and beds, and motivation; on phones the same
list is in the menu, and only the toolbox stays at the bottom.

**Content on the map.** The texts are not built; they lie hidden under the
forest and are explored by felling it. The Ortstafel (the name) and the
Chronik (the about texts) lie within 1 km of the Klosterplatz, each game's
scroll (its whole Markdown, controls included) 1.5 to 5 km from it, on dry land
outside the Sihlsee's basin. Where exactly is chosen at random for each new
forest from a seed and saved. A hidden text lies under unbroken forest:
its tiles always carry a tree, its ground shimmers pale, and motes of light
drift over its treetops. Its first felled tree finds it; once all its trees are
felled it is explored, and a game's explored scroll lets its Spielhaus be
built. A text is wider on wide screens (9 to 13 tiles) than on narrow ones (6
to 8), chosen once when the page starts, and as long as its text, measured
once in a hidden copy with the map's styles (`textLength()`). The view reads it
at zoom 0.95 at most, so its 12 text pixels show at about 16 screen pixels. A found text is real HTML, cloned from the
templates, in a layer under the map's canvas and under the same projection as
the ground, at 32 text pixels per tile: the canvas is transparent where no
ground is drawn, and the ground leaves a gap on each cleared tile of a found
text. So the text lies on the floor, the trees still standing cover the rest,
and Waldleute and buildings stand over it. It is cream with golden headings
on a dark green floor; on cobbled tiles the floor under it shows cobbles, and
a dark copy of the text, hidden from screen readers, shows instead of the light
one, with a hairline stroke that thickens its letters without moving its
lines. Under a text, cobbles are faint: stones and mortar are almost the same
light colour, so their pattern does not compete with the letters; elsewhere
they are drawn light with narrow joints. Each ink is masked to its tiles
at four mask pixels per tile, so a cobbled path across a text changes its ink
tile by tile. When cobbles are laid, the new floor and masks are made as images
and decoded before they replace the old ones, all at once, so the text does not
flicker. Buildings cannot be placed on a text. A label marks Einsiedeln on the map.

Meinrads Klause and the Kloster each bring one of Meinrad's two ravens. A
raven leads to a game's scroll that is not yet explored, the nearest first
and one per raven: it circles about 500 m into the forest from the felled
ground nearest the scroll, and over the scroll once it is found; with no
scroll left it circles its own building. Its direction is announced.

Each game has a house of its own: Moto Devil a keep with a tower and a jump
ramp, Car Drive a coach house with two gates and a lantern turret; another game
gets a generic house. The game's name is painted on a board on the house's
front, in the plane of its wall. A tap on the house opens the game in a new
tab. Once its Spielhaus stands, each game can have a **Bibliothek**: a stone
hall with the game's name and «Quellcode» over its door and books stacked
outside; it costs books, and a tap on it opens the game's source code in a new
tab. Both are announced, so keyboard users reach them with the cursor and
Enter.

The theatre is a wooden amphitheatre: tiered stands with railings rise all
round a stage in its middle, with a backdrop and red curtains at its back,
pennants and torches. A painted audience sits on the stands, the same seats in
both views (`crowd()` in `art.ts`); the first front row stays free, so the
hint lying before the stage stays readable. The stage is painted on the map, not HTML (`stage.ts`).
In the isometric view the preview of a game whose Spielhaus stands plays in 3D
on the stage: its picture stands between the theatre's back and front, which
are painted apart, so the front stands hide it. Turned top-down, a canvas
texture lying on the amphitheatre's floor shows the preview in 2D, a status
line, and wooden signs for the programme, for each key of the game's controls
and for the real game. The previews are the rule sets of
November Games', copied into this variant and redrawn as a painted stage; a
demonstration plays until somebody takes over, and again after eight idle
seconds. The stage runs only while it is on screen.

A tap on a found text or the stage turns the view: the camera flies to it
while the isometric view blends into a top-down plan with north up
(`projection()` in `iso.ts`), so the text lies upright and fills the width at a
comfortable size. Meanwhile trees, buildings and Waldleute blend from their
isometric pictures into ones seen from straight above (`plan.ts`). In the plan
the map can be dragged and zoomed in and out; zoomed out below half the
reading zoom, it turns back to the isometric view where and as high as it is,
and the button «Zurück zur Karte» or Escape turns it back to where it was. On the stage, taps on its signs press
them (held while the pointer stays down), the keys from the controls table
play, and the long sign opens the real game in a new tab. The monastery and
Meinrads Klause, the churches and the graveyards are drawn without religious
symbols; graves are tombstones. The dam can only stand where the Sihl leaves
the basin; choosing it shows nothing of the lake to come. While it stands, the
water spreads from the Sihl through the basin in a fixed order, tile by tile,
until the Sihlsee is full after 15 minutes (`flood.ts`): trees in it die,
buildings it reaches sink over a minute and a half, and Waldleute step back
from it. In the full lake only the towers of drowned churches and of the
Kloster rise above the water; drowned buildings no longer count, so a new
church or Kloster may be built. Tearing the dam down sends a wave down the Sihl
towards the Zürichsee: its band, two and a half tiles each side of the river
from the dam on, is found from the water pages, which load for it; the wave
runs five tiles a second, destroys the buildings it reaches and stays a minute
and a half on each tile. The lake drains in three minutes; churches and the
Kloster that lay in it come back as ruins, the rest is gone.

**State and offline.** The save is in the IndexedDB database
`waldstatt-games` ([ADR 0007](decisions/0007-save-waldstatt-games-in-indexeddb.md)):
a record with the settlement (stock, marks and planned cobbles, buildings with
their crew, condition, graves and how far they sank, the flood's level and the
wave, the camera, the tools, where the saw lies, the seed and positions of the
hidden texts, the explored texts, what appeared in the build menu, the goods
seen, motivation and its passing events, and the tombstones), a record with
the people, where they stand and how they are, and one record per chunk with
its felled trees and cobbles as bitsets and its seedlings as bytes. What a
Waldmensch is doing is not saved; they look for work anew. A text's length
follows its current text on load, so changed texts need no migration. The game
saves two seconds after a change, every ten seconds while the page shows, and
when it is hidden; only chunks that changed are written. The organization's
Pages sites share one origin (the games save under `moto-devil/` and
`car-drive/` in `localStorage`), so the save is validated on load, a broken
save starts a new forest with a notice, and «Neu beginnen» deletes the
database and any old keys starting with `waldstatt-games/`. The installed app
asks the browser to keep its storage. The manifest's start URL and scope and
the service worker's scope are the variant's path under the base path. The
worker's cache is named after the build; it fetches the page network-first and
serves files under the variant's path and Astro's `_astro/` assets cache-first,
ignoring `Vary` because those URLs carry content hashes. On the first visit the
page hands the worker the files it already loaded, so the next start works
offline. The worker is not registered in development.

**Access.** The map is a focusable `role="application"`: arrow keys move a
cursor tile, Shift and arrows pan, + and − zoom, Enter or Space applies the tool
or opens a building, Escape cancels. While the view is turned onto the stage,
the keys from the game's controls play it instead. Every tool, menu item and
link is a real button or link with a German name; status, finished buildings,
the stage's status while somebody plays, and events such as births, deaths
and stocks running out are announced politely,
and the texts on the map are in the page as a region «Im Wald». With reduced
motion Waldleute do not walk or swing their tools, ships do not sail visibly,
and the previews play no demonstration. Screen-reader users and search engines can hardly reach the
content: accepted for this name experiment in ADR 0006. The page weighs about
10 kB of HTML, a 130 kB script (most of it PixiJS, which loads its WebGL parts
as further chunks) and 20 kB of styles, gzipped; the water follows in pages of
about 1 kB.

### Adding a variant

1. Copy `src/pages/<existing>/` and `src/variants/<existing>/` to the new slug.
2. Replace the old slug in the copied imports, set `meta.ts`, and rename the theme
   in `theme.css` to the new slug.
3. List the variant in `src/variants/index.ts` and import its `theme.css` in
   `src/styles/overview.css`.

## Routes

| Route | Page | Source |
| --- | --- | --- |
| `/` | Overview of the variants, each card in the variant's theme | [src/pages/index.astro](../../src/pages/index.astro) |
| `/<slug>/` | Home: name, tagline, game cards | `src/pages/<slug>/index.astro` |
| `/<slug>/ueber-uns/` | About the studio | `src/pages/<slug>/ueber-uns.astro` |
| `/<slug>/spiele/<game>/` | Game idea, what to expect, controls, play link | `src/pages/<slug>/spiele/[game].astro` |

Waldstatt Games has only its home page, plus `manifest.webmanifest`, `sw.js`
and `icon-<size>.png` beside it ([ADR 0006](decisions/0006-make-waldstatt-games-a-browser-game.md)).

`/moto-devil/` and `/carrrgh/` on the same domain belong to the games' own Pages
sites and take precedence; no route of this site may use them.

## Shared modules

| Path | Responsibility |
| --- | --- |
| [src/variants/index.ts](../../src/variants/index.ts) | Lists the variants for the overview; fails the build on unlisted page folders, missing pages, or reserved slugs |
| [src/variants/types.ts](../../src/variants/types.ts) | `VariantMeta`: slug, name, tagline |
| [src/content.config.ts](../../src/content.config.ts) | The `games` collection schema: title, tagline, `playUrl`, `sourceUrl`, order |
| [src/content/games/](../../src/content/games/) | One Markdown file per game; the file name is the route segment |
| [src/lib/games.ts](../../src/lib/games.ts) | `getGames()`: all games in display order |
| [src/lib/url.ts](../../src/lib/url.ts) | `href()`: prefixes internal paths with the base path |
| [src/styles/overview.css](../../src/styles/overview.css) | The overview's stylesheet; imports every variant's theme |
| [astro.config.mjs](../../astro.config.mjs) | Site URL and base path from `SITE_URL` / `BASE_PATH`, trailing slashes, Tailwind |

## Conventions

- Link internal pages with `href("/path/")`, never a bare `/path/`, so the site
  works under a base path. URLs end with a slash (`trailingSlash: "always"`).
- Game links point to the games' deployments (`playUrl`); this site never copies
  game builds. When the organization is renamed, update every `playUrl` and
  `sourceUrl`.
- Style with daisyUI components and Tailwind utilities and the variant's theme
  colors (`bg-base-100`, `btn-primary`, and so on), so a theme change restyles the
  whole variant.

## Deployment

[pages.yml](../../.github/workflows/pages.yml) builds and deploys `dist/` on every
push to `main`; [ci.yml](../../.github/workflows/ci.yml) runs `mise run check` on
pull requests. The repository name decides the address: a repository named
`<owner>.github.io` is served at `https://<owner>.github.io/`; any other name at
`https://<owner>.github.io/<repository>/`. On the free organization plan the
repository must be public, and Pages must use "GitHub Actions" as its source.
