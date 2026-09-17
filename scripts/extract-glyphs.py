"""Extracts condensed Archivo outlines as SVG paths for the on-chain pass renderer.

The contract cannot load a web font, so the pass's display lettering ships as vector paths.
Run: python scripts/extract-glyphs.py > contracts/glyphs.json
Font: Archivo (SIL Open Font License 1.1), instanced at wght=800 wdth=62.
"""

import json
import sys
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

FONT = "web/node_modules/@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2"
CHARS = "ABDEGIKLNOPRSVYZ0123456789"
UPM_TARGET = 1000


def main() -> None:
    font = TTFont(FONT)
    font = instantiateVariableFont(font, {"wght": 800, "wdth": 62}, updateFontNames=False)

    upm = font["head"].unitsPerEm
    scale = UPM_TARGET / upm
    cmap = font.getBestCmap()
    glyphs = font.getGlyphSet()
    hmtx = font["hmtx"]

    out = {}
    for char in CHARS:
        name = cmap[ord(char)]
        pen = SVGPathPen(glyphs, ntos=lambda v: str(round(v * scale)))
        glyphs[name].draw(pen)
        advance = round(hmtx[name][0] * scale)
        out[char] = {"d": pen.getCommands(), "adv": advance}

    total = sum(len(g["d"]) for g in out.values())
    print(json.dumps(out, separators=(",", ":")))
    print(f"{len(out)} glyphs, {total} path bytes", file=sys.stderr)


if __name__ == "__main__":
    main()
