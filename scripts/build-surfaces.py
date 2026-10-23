#!/usr/bin/env python3
"""
Cut the room backgrounds — wallpapers and floors — out of the LPC Revised
Structure sheets, in the same 3/4 top-down view and pixel scale as the stickers.

A wall is one 96x128 cell (crown trim, paper, chair rail, lower paper,
baseboard) that repeats sideways; a floor is a small tile that repeats both
ways. Each family also gets a "blush" recolour of its lightest shade, because
the sheets have almost no pink and this is a pink app.

    python3 scripts/build-surfaces.py      # needs Pillow

writes assets/surfaces/{walls,floors}/*.png (4x, like the stickers) and
src/data/roomSurfaces.ts. Credits go to assets/surfaces/CREDITS.md and the
About screen; the sheets are CC-BY 3.0 / OGA-BY 3.0.
"""

import colorsys
import hashlib
import os
import re

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'scripts', 'data', 'lpc-revised', 'Structure')
OUT = os.path.join(ROOT, 'assets', 'surfaces')
SCALE = 4

# (family id, name, sheet, cell w, cell h)
WALLS = [
    ('painted', 'Painted', 'Walls/Painted Walls.png', 96, 128),
    ('pinstripe', 'Pinstripe', 'Walls/Striped Wallpaper A.png', 96, 128),
    ('candy', 'Candy stripe', 'Walls/Striped Wallpaper B.png', 96, 128),
    ('ribbon', 'Ribbon stripe', 'Walls/Striped Wallpaper C.png', 96, 128),
    ('floral', 'Floral', 'Walls/Floral Wallpaper A.png', 96, 128),
    ('dotty', 'Dotty', 'Walls/Floral Wallpaper B.png', 96, 128),
]
FLOORS = [
    ('boards', 'Boards', 'Floor/Wood Floor A.png', 32, 96),
    ('parquet', 'Parquet', 'Floor/Wood Floor B.png', 32, 32),
    ('herringbone', 'Herringbone', 'Floor/Herringbone A.png', 32, 96),
    ('tiles', 'Tiles', 'Floor/Tile A.png', 32, 32),
    ('squares', 'Big squares', 'Floor/Tile B.png', 32, 32),
    ('flagstone', 'Flagstone', 'Floor/Tile C.png', 64, 64),
    ('harlequin', 'Harlequin', 'Floor/Diamond Tile A.png', 64, 64),
    ('chequer', 'Chequer', 'Floor/Diamond Tile B.png', 32, 32),
    ('mosaic', 'Mosaic', 'Floor/Diamond Tile C.png', 32, 32),
    ('rosette', 'Rosette', 'Floor/Geometric Carpet C.png', 32, 32),
]


def colour_name(img):
    """A plain colour word for a swatch, for labels and screen readers."""
    px = [p for p in img.getdata() if p[3] == 255]
    r, g, b = (sum(p[i] for p in px) / len(px) / 255 for i in range(3))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if s < 0.12 or l > 0.9:
        return 'Cream' if l > 0.78 else 'Grey' if l > 0.45 else 'Charcoal'
    deg = h * 360
    for top, name in [(15, 'Red'), (40, 'Peach'), (55, 'Honey'), (70, 'Lemon'), (160, 'Green'), (200, 'Teal'),
                      (250, 'Blue'), (290, 'Lavender'), (330, 'Plum'), (361, 'Pink')]:
        if deg < top:
            break
    if name in ('Red', 'Peach') and l > 0.72:
        name = 'Blush'
    if name in ('Peach', 'Honey') and s < 0.5 and 0.4 <= l <= 0.8:
        name = 'Tan'
    if name in ('Red', 'Peach', 'Honey') and l < 0.4:
        name = 'Brown'
    if l < 0.3:
        name = 'Dark ' + name.lower()
    elif l > 0.8:
        name = 'Pale ' + name.lower()
    return name


def blush(img):
    """The same tile in kawaii pink: hue turned to rose, lightness kept."""
    out = img.copy()
    data = []
    for r, g, b, a in img.getdata():
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        r2, g2, b2 = colorsys.hls_to_rgb(0.94, min(0.97, l * 1.04), max(s, 0.45) * (0.5 + 0.5 * l))
        data.append((round(r2 * 255), round(g2 * 255), round(b2 * 255), a))
    out.putdata(data)
    return out


def hue_key(img):
    px = [p for p in img.getdata() if p[3] == 255]
    r, g, b = (sum(p[i] for p in px) / len(px) / 255 for i in range(3))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return (s < 0.12, round(h * 12) if s >= 0.12 else 0, -l)


def credits_for(sheet):
    txt = os.path.join(SRC, os.path.dirname(sheet), 'Credits.txt')
    stem = os.path.splitext(os.path.basename(sheet))[0]
    blocks = re.split(r'\n(?=[^\n]+\n-{5,})', open(txt, encoding='utf-8', errors='replace').read())
    artists, licenses = [], []
    for block in blocks:
        if block.strip().split('\n')[0].strip().lower() == stem.lower():
            for m in re.finditer(r'ARTIST\(S\):\s*(.+)', block):
                artists += [a.strip() for a in re.split(r',(?![^()]*\))', m.group(1)) if a.strip()]
            for m in re.finditer(r'LICENSE:\s*(.+)', block):
                licenses += [x.strip() for x in m.group(1).split(',')]
    return artists, licenses


def cells(sheet, cw, ch):
    img = Image.open(os.path.join(SRC, sheet)).convert('RGBA')
    seen = set()
    for y in range(0, img.height - ch + 1, ch):
        for x in range(0, img.width - cw + 1, cw):
            c = img.crop((x, y, x + cw, y + ch))
            # empty corners of a sheet, or a cell that isn't solid
            if min(c.getchannel('A').getdata()) < 255:
                continue
            d = hashlib.sha1(c.tobytes()).hexdigest()
            if d in seen:
                continue
            seen.add(d)
            yield c


def main():
    entries, families, artists, licenses = [], [], set(), set()
    for kind, table in (('wall', WALLS), ('floor', FLOORS)):
        folder = os.path.join(OUT, kind + 's')
        os.makedirs(folder, exist_ok=True)
        for fid, name, sheet, cw, ch in table:
            a, l = credits_for(sheet)
            artists.update(a)
            licenses.update(l)
            tiles = list(cells(sheet, cw, ch))
            lightest = max(tiles, key=lambda t: sum(sum(p[:3]) for p in t.getdata()))
            # ids come from the sheet order, before sorting, so they never move
            named = [(f'{kind}-{fid}-{i + 1:02d}', t) for i, t in enumerate(tiles)]
            named.append((f'{kind}-{fid}-blush', blush(lightest)))
            named.sort(key=lambda it: hue_key(it[1]))
            families.append((fid, kind, name))
            for sid, tile in named:
                file = f'{kind}s/{sid}.png'
                big = tile.resize((tile.width * SCALE, tile.height * SCALE), Image.NEAREST)
                big.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(
                    os.path.join(OUT, file), optimize=True
                )
                # a wall is named for its paper, not its brown trim
                paper = tile.crop((0, 12, tile.width, 80)) if kind == 'wall' else tile
                label = 'Blush' if sid.endswith('-blush') else colour_name(paper)
                entries.append((sid, kind, fid, f'{label} {name.lower()}', tile.width, tile.height, file))

    with open(os.path.join(OUT, 'CREDITS.md'), 'w', encoding='utf-8') as fh:
        fh.write('# Wall and floor credits\n\nCut from **LPC Revised** (https://github.com/ElizaWy/LPC) Structure sheets and scaled 4x by\n'
                 'scripts/build-surfaces.py; the "blush" tiles are pink recolours. Licensed '
                 f'{", ".join(sorted(licenses))}.\nFull per-sheet credits: scripts/data/lpc-revised/Structure/*/Credits.txt.\n\n'
                 f'Artists: {", ".join(sorted(artists))}\n')

    lines = [
        '/**',
        ' * GENERATED by scripts/build-surfaces.py — do not edit by hand.',
        ' *',
        ' * Wallpapers and floors cut from LPC Revised (https://github.com/ElizaWy/LPC),',
        ' * CC-BY 3.0 / OGA-BY 3.0. Credits: assets/surfaces/CREDITS.md and the About screen.',
        ' * `w` and `h` are the tile size in art pixels; the files are drawn 4x.',
        ' */',
        "import type { ImageSourcePropType } from 'react-native';",
        '',
        "export type SurfaceKind = 'wall' | 'floor';",
        '',
        'export interface Surface {',
        '  id: string;',
        '  kind: SurfaceKind;',
        '  family: string;',
        '  label: string;',
        '  w: number;',
        '  h: number;',
        '  src: ImageSourcePropType;',
        '}',
        '',
        'export const surfaceFamilies: { id: string; kind: SurfaceKind; name: string }[] = [',
    ]
    lines += [f"  {{ id: '{fid}', kind: '{kind}', name: '{name}' }}," for fid, kind, name in families]
    lines += ['];', '', '// two flat lists keep the type checker from unrolling one huge literal', 'const SRC: ImageSourcePropType[] = [']
    lines += [f"  require('../../assets/surfaces/{e[6]}')," for e in entries]
    lines += ['];', '', 'const META = `']
    lines += ['|'.join(str(v) for v in e[:6]) for e in entries]
    lines += [
        '`.trim().split(\'\\n\');',
        '',
        'export const surfaces: Surface[] = META.map((line, i) => {',
        "  const [id, kind, family, label, w, h] = line.split('|');",
        '  return { id, kind: kind as SurfaceKind, family, label, w: Number(w), h: Number(h), src: SRC[i] };',
        '});',
        '',
        'export const surfaceArtists: string[] = ' + repr(sorted(artists)).replace("'", '"') + ';',
        '',
    ]
    with open(os.path.join(ROOT, 'src', 'data', 'roomSurfaces.ts'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines))
    walls = sum(1 for e in entries if e[1] == 'wall')
    print(f'{walls} walls, {len(entries) - walls} floors')


if __name__ == '__main__':
    main()
