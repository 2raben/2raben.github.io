/** Original simplified silhouettes, shared by Canvas and the no-script SVG. */
export interface LandmarkShape {
  d: string;
  fill: string;
  stroke: string;
  width: number;
}

// Haggenspitz, Kleiner Mythen, the saddle, and the broader Grosser Mythen.
export const mythen: LandmarkShape[] = [
  {
    d: "M0 400V315L62 284 116 239 172 177 196 154 218 174 234 159 267 119 284 111 303 125 318 116 352 140 392 184 443 229 492 248 526 239 559 202 591 191 617 151 645 110 673 64 701 40 720 48 738 29 755 33 771 68 797 83 810 118 841 127 861 165 889 176 908 235 949 306 1000 333V400Z",
    fill: "#211334",
    stroke: "#e29cfa",
    width: 2,
  },
  {
    d: "M116 239 196 154 180 229 218 174 203 268 267 119 245 237 284 111 301 204 318 116 352 224 392 184 378 285 443 229 492 312 526 239 548 320M591 191 617 151 638 263 673 64 660 192 701 40 710 172 738 29 758 164 797 83 782 236 841 127 824 279 889 176 873 306 949 306",
    fill: "none",
    stroke: "#9560c0",
    width: 1.4,
  },
  {
    d: "M673 64 701 40 720 48 738 29 755 33 771 68 758 164 710 172Z M267 119 284 111 303 125 318 116 352 140 301 204Z",
    fill: "#4a285b",
    stroke: "#e29cfa",
    width: 1,
  },
  {
    d: "M0 367 98 331 178 336 273 302 366 346 469 329 563 354 662 312 752 344 861 323 1000 369V400H0Z",
    fill: "#161029",
    stroke: "#76508f",
    width: 1,
  },
];

const wall = "#1e1536";
const outline = "#e99be0";
export const monastery: LandmarkShape[] = [
  {
    d: "M0 315V194H235V147H565V194H800V315Z",
    fill: wall,
    stroke: outline,
    width: 2,
  },
  {
    d: "M0 194 27 167H235V194ZM565 167H773L800 194H565Z",
    fill: "#4e234d",
    stroke: "#f9a4b9",
    width: 2,
  },
  {
    d: "M300 310V173Q331 167 344 139L356 112H374Q400 89 426 112H444L456 139Q469 167 500 173V310Z",
    fill: "#332042",
    stroke: outline,
    width: 2,
  },
  {
    d: "M344 139H456M318 172Q400 148 482 172M309 211Q400 185 491 211M300 259H500M330 174V310M350 171V310M450 171V310M470 174V310",
    fill: "none",
    stroke: "#b577b6",
    width: 1.6,
  },
  {
    d: "M381 310V278a19 19 0 0 1 38 0V310Z M384 242V224a16 16 0 0 1 32 0V242Z",
    fill: "#0c1027",
    stroke: "#76dfe9",
    width: 2,
  },
  {
    d: "M390 132a10 10 0 1 0 20 0a10 10 0 1 0 -20 0M400 100V83M393 89H407",
    fill: "none",
    stroke: "#ffcb9c",
    width: 2,
  },
  ...[245, 505].flatMap((x): LandmarkShape[] => [
    {
      d: `M${x} 310V83H${x + 50}V310Z`,
      fill: "#2c1b3e",
      stroke: outline,
      width: 2,
    },
    {
      d: `M${x - 5} 83Q${x - 3} 46 ${x + 13} 40Q${x + 25} 36 ${x + 25} 27Q${x + 25} 36 ${x + 37} 40Q${x + 53} 46 ${x + 55} 83Z`,
      fill: "#234053",
      stroke: "#84e6e8",
      width: 2,
    },
    {
      d: `M${x + 25} 27V6M${x + 17} 14H${x + 33}M${x + 25} 39Q${x + 8} 52 ${x + 12} 82M${x + 25} 39Q${x + 42} 52 ${x + 38} 82`,
      fill: "none",
      stroke: "#84e6e8",
      width: 1.7,
    },
    {
      d: `M${x - 5} 87H${x + 55}M${x - 6} 108H${x + 56}M${x - 6} 164H${x + 56}M${x - 6} 208H${x + 56}M${x - 6} 258H${x + 56}M${x + 5} 110V309M${x + 45} 110V309`,
      fill: "none",
      stroke: "#c189c9",
      width: 1.7,
    },
    {
      d: `M${x + 13} 151V130a5 5 0 0 1 10 0V151ZM${x + 27} 151V130a5 5 0 0 1 10 0V151ZM${x + 16} 244V226a9 9 0 0 1 18 0V244Z`,
      fill: "#0b1129",
      stroke: "#85dbe6",
      width: 1.4,
    },
    {
      d: `M${x + 12} 186A13 13 0 1 0 ${x + 38} 186A13 13 0 1 0 ${x + 12} 186M${x + 25} 176V186L${x + 33} 190`,
      fill: "#18293e",
      stroke: "#ffd099",
      width: 2,
    },
  ]),
  ...[24, 60, 96, 132, 168, 204, 580, 616, 652, 688, 724, 760].flatMap(
    (x): LandmarkShape[] => [
      {
        d: `M${x} 210h14v23h-14ZM${x} 253h14v23h-14Z`,
        fill: "#233650",
        stroke: "#80cddb",
        width: 1.3,
      },
    ],
  ),
  {
    d: "M361 314H439L459 324H341ZM330 328H470M316 334H484M230 315H570",
    fill: "#41203e",
    stroke: "#f7b0cd",
    width: 2,
  },
];

export function landscapeLayout(width: number, height: number) {
  const narrow = width < 760;
  const mountainArea = {
    x: width * (narrow ? -0.1 : 0.4),
    width: width * (narrow ? 1.2 : 0.65),
    height: height * 0.6,
  };
  const mountainScale = Math.min(
    mountainArea.width / 1000,
    mountainArea.height / 400,
  );
  const abbeyArea = {
    x: width * (narrow ? 0.06 : 0.6),
    width: width * (narrow ? 0.88 : 0.37),
    height: height * 0.36,
  };
  const abbeyScale = Math.min(abbeyArea.width / 800, abbeyArea.height / 340);
  return {
    horizon: height * 0.7,
    sunX: width * (narrow ? 0.5 : 0.725),
    sunY: height * (narrow ? 0.3 : 0.32),
    sunRadius:
      Math.min(width * (narrow ? 0.7 : 0.45), height * (narrow ? 0.4 : 0.5)) *
      0.42,
    mountain: {
      x: mountainArea.x + (mountainArea.width - mountainScale * 1000) / 2,
      y: height * 0.7 - mountainScale * 400,
      scale: mountainScale,
    },
    abbey: {
      x: abbeyArea.x + (abbeyArea.width - abbeyScale * 800) / 2,
      y: height * 0.86 - abbeyScale * 340,
      scale: abbeyScale,
    },
  };
}
