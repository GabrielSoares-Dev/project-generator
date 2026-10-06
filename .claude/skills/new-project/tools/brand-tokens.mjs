const LIGHT_FOREGROUND = 'oklch(0.985 0 0)';
const DARK_FOREGROUND = 'oklch(0.145 0 0)';
const FOREGROUND_THRESHOLD = 0.62;
const DARK_MODE_LIGHTNESS_BOOST = 0.18;
const DARK_MODE_MAX_LIGHTNESS = 0.75;
const DARK_MODE_CHROMA_FACTOR = 0.7;
const ACHROMATIC_CHROMA = 0.0005;

function parseHex(value) {
  const match = /^#?([0-9a-f]{6})$/i.exec(value ?? '');
  if (match === null) {
    throw new Error('Pass a color as #rrggbb, for example #4f46e5.');
  }
  const channels = match[1].match(/../g).map(pair => parseInt(pair, 16));
  return channels.map(channel => channel / 255);
}

function toLinear(channel) {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function toOklch([red, green, blue]) {
  const [r, g, b] = [red, green, blue].map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.hypot(a, bAxis);
  const hue =
    chroma < ACHROMATIC_CHROMA
      ? 0
      : ((Math.atan2(bAxis, a) * 180) / Math.PI + 360) % 360;
  return { lightness, chroma, hue };
}

function format({ lightness, chroma, hue }) {
  const round = value => Number(value.toFixed(3));
  return `oklch(${round(lightness)} ${round(chroma)} ${round(hue)})`;
}

const color = toOklch(parseHex(process.argv[2]));
const dark = {
  lightness: Math.min(
    DARK_MODE_MAX_LIGHTNESS,
    color.lightness + DARK_MODE_LIGHTNESS_BOOST
  ),
  chroma: color.chroma * DARK_MODE_CHROMA_FACTOR,
  hue: color.hue,
};

console.log(
  JSON.stringify(
    {
      primary: format(color),
      primaryForeground:
        color.lightness > FOREGROUND_THRESHOLD
          ? DARK_FOREGROUND
          : LIGHT_FOREGROUND,
      ring: format(color),
      darkPrimary: format(dark),
      darkPrimaryForeground: DARK_FOREGROUND,
      darkRing: format(dark),
    },
    null,
    2
  )
);
