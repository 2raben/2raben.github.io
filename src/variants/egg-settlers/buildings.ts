/**
 * The building that stands for each game in the settlement, keyed by the game's
 * id (its file name in src/content/games/). Each building shows only what the
 * game's own text describes. A game without an entry gets a plain house, so a
 * new game appears without changes here.
 */
export type BuildingKind = "stunt-track" | "garage" | "house";

const buildings: Record<string, BuildingKind> = {
  "moto-devil": "stunt-track",
  "car-drive": "garage",
};

/** What each building shows, for screen readers. */
export const buildingLabels: Record<BuildingKind, string> = {
  "stunt-track":
    "Eine Stuntstrecke vor verschneiten Bergen: Ein Motorrad springt mit Düsenschub von einer Holzrampe über Stacheln, die aus dem Boden schiessen. Dahinter ein Looping, ein Grabstein, ein Rabe im Sturzflug und die Zielflagge.",
  garage:
    "Eine Strasse mit drei Spuren von oben: Das eigene Auto fährt mit Boost, daneben ein Lastwagen, Gegenverkehr und ein blinkendes Auto. Auf der Strasse liegen ein Herz und ein Schild, am Rand steht die Garage mit Autos. Oben links zwei von drei Herzen.",
  house: "Ein Fachwerkhaus mit Ziegeldach, davor eine Siedlerin.",
};

export const buildingFor = (gameId: string): BuildingKind =>
  buildings[gameId] ?? "house";
