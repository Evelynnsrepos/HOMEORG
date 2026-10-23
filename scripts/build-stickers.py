"""
Cuts the LPC Revised object sheets into single stickers for the room editor.

    python3 scripts/build-stickers.py        (needs Pillow: pip install pillow)

Source: scripts/data/lpc-revised/Objects, from https://github.com/ElizaWy/LPC
(commit in UPSTREAM-COMMIT), CC-BY 3.0 / OGA-BY 3.0 — free to use with credit.
Every sheet's Credits.txt is read so each sticker set carries its artists,
and the credits end up in assets/stickers/CREDITS.md and on the About screen.

What it does, sheet by sheet:
  1. find each piece as a group of touching non-transparent pixels, merging
     groups whose boxes nearly touch (a flower's stem, a lamp's shade)
  2. drop crumbs and exact duplicates
  3. scale up 4x with hard edges — a phone smooths small pixel art when it
     enlarges it, and that turns crisp pixels into mush — and save as an
     indexed PNG, which is tiny for art with so few colours
  4. write assets/stickers/<set>/<n>.png and src/data/stickerCatalog.ts
"""

import hashlib
import json
import os
import re
from collections import deque

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'scripts', 'data', 'lpc-revised', 'Objects')
OUT = os.path.join(ROOT, 'assets', 'stickers')
CATALOG = os.path.join(ROOT, 'src', 'data', 'stickerCatalog.ts')
SCALE = 4
MIN_SIDE = 6
MIN_PIXELS = 30

# set id, name, emoji, and the sheet paths (regex, relative to Objects/) that belong to it.
# First match wins, so the narrow patterns come first.
SETS = [
    ('forge', 'Forge & Ore', '⚒️', [r'^Furniture/Smithing/', r'^Small Items/Ores & Ingots/', r'Tools, Smithing']),
    ('maker', "Maker's Workshop", '🧵', [r'Sewing & Weaving/', r'^Small Items/Fabric/Fabri', r'Tools, (Carpentry|Sewing)', r'Workbench', r'Lumber', r'Sawdust', r'Sawhorse', r'Shavehorse', r'Table, (Workshop|Rough Wood)', r'Ladder']),
    ('pantry', 'Pantry Treats', '🧁', [r'^Small Items/Food/']),
    ('festive', 'Festive', '🎄', [r'Christmas', r'Presents']),
    ('curious', 'Curiosities', '🔮', [r'Skeletons', r'Dungeon', r'Cauldron', r'Thrones', r'Stone Slab', r'Wolf Stone', r'Mailboxes', r'Shopping Cart']),
    ('bedroom', 'Snug Bedroom', '🛏️', [r'^Furniture/Beds/', r'Pillows', r'Blankets', r'Dresser', r'Desk, Vanity', r'End Table', r'Mirror', r'Curtains', r'Standing Screen', r'Lighting, (Floor|Table)']),
    ('kitchen', 'Kitchen Corner', '🍳', [r'Fridge', r'Countertop', r'Cabinet', r'Oven', r'Sink', r'Coffee Maker', r'Dishes', r'Kitchen Clutter', r'Water Cooler', r'Bar Stools', r'Chair, Dining', r'Table, Ornate', r'^Furniture/Bin']),
    ('lounge', 'Lounge Life', '🛋️', [r'^Furniture/Seating/', r'^Furniture/Rugs/', r'TV, ', r'Table, Card', r'Games', r'Rotary Phones', r'Vase-Studies', r'Lighting, Wall', r'Wheelchair']),
    ('garden', 'Green Thumb', '🪴', [r'Flowers', r'Planter', r'Lighting, Outdoors', r'Hay & Straw', r'Trough', r'Baskets', r'Buckets']),
    ('gallery', 'Gallery Wall', '🖼️', [r'Paintings', r'Posters', r'Tabletop Portraits', r'Pride Flags', r'Graffiti']),
    ('study', 'Study Nook', '📚', [r'Desk, Office', r'Chair, Office', r'Laptop', r'Loose Paper', r'Copy Machine', r'Shelf', r'Clock', r'Vending Machine', r'Boxes', r'Crate']),
    ('fireside', 'Fireside', '🔥', [r'Fireplace', r'Fire, ', r'Barrel', r'Chest']),
]


def set_for(rel):
    for sid, _name, _emoji, patterns in SETS:
        if any(re.search(p, rel) for p in patterns):
            return sid
    return None


def kind_for(rel):
    if rel.startswith('Wall Items/'):
        return 'wall'
    if rel.startswith('Small Items/'):
        return 'small'
    return 'furniture'


def pieces(img):
    """Bounding boxes of the separate things on a sheet."""
    w, h = img.size
    alpha = img.getchannel('A').load()
    seen = [[False] * w for _ in range(h)]
    boxes = []
    for y in range(h):
        for x in range(w):
            if seen[y][x] or alpha[x, y] < 8:
                continue
            q = deque([(x, y)])
            seen[y][x] = True
            x0, y0, x1, y1, n = x, y, x, y, 0
            while q:
                cx, cy = q.popleft()
                n += 1
                x0, y0, x1, y1 = min(x0, cx), min(y0, cy), max(x1, cx), max(y1, cy)
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and alpha[nx, ny] >= 8:
                            seen[ny][nx] = True
                            q.append((nx, ny))
            boxes.append([x0, y0, x1 + 1, y1 + 1, n])
    # merge boxes that touch or nearly do: parts of one thing
    merged = True
    while merged:
        merged = False
        for i in range(len(boxes)):
            for j in range(i + 1, len(boxes)):
                a, b = boxes[i], boxes[j]
                if a[0] <= b[2] + 1 and b[0] <= a[2] + 1 and a[1] <= b[3] + 1 and b[1] <= a[3] + 1:
                    boxes[i] = [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]), a[4] + b[4]]
                    boxes.pop(j)
                    merged = True
                    break
            if merged:
                break
    return [b for b in boxes if b[2] - b[0] >= MIN_SIDE and b[3] - b[1] >= MIN_SIDE and b[4] >= MIN_PIXELS]


def rarity(w, h):
    area = w * h
    if area < 700:
        return 'common'
    if area < 3000:
        return 'rare'
    return 'epic'


def credits_for(path):
    """The artists named in the Credits.txt next to a sheet."""
    folder = os.path.dirname(path)
    stem = os.path.splitext(os.path.basename(path))[0].strip()
    txt = os.path.join(folder, 'Credits.txt')
    if not os.path.exists(txt):
        return [], []
    blocks = re.split(r'\n(?=[^\n]+\n-{5,})', open(txt, encoding='utf-8', errors='replace').read())
    artists, licenses = [], []
    for block in blocks:
        title = block.strip().split('\n')[0].strip()
        if title and (title.lower() in stem.lower() or stem.lower() in title.lower()):
            for m in re.finditer(r'ARTIST\(S\):\s*(.+)', block):
                artists += [a.strip() for a in re.split(r',(?![^()]*\))', m.group(1)) if a.strip()]
            for m in re.finditer(r'LICENSE:\s*(.+)', block):
                licenses += [l.strip() for l in m.group(1).split(',')]
    return artists, licenses


def main():
    os.makedirs(OUT, exist_ok=True)
    seen = set()
    entries = []
    set_artists = {sid: set() for sid, *_ in SETS}
    set_licenses = {sid: set() for sid, *_ in SETS}
    counters = {sid: 0 for sid, *_ in SETS}

    sheets = []
    for folder, _dirs, files in os.walk(SRC):
        for f in files:
            if f.lower().endswith('.png'):
                sheets.append(os.path.join(folder, f))
    for path in sorted(sheets):
        rel = os.path.relpath(path, SRC).replace(os.sep, '/')
        sid = set_for(rel)
        if not sid:
            print('no set for', rel)
            continue
        img = Image.open(path).convert('RGBA')
        artists, licenses = credits_for(path)
        set_artists[sid].update(artists)
        set_licenses[sid].update(licenses)
        label = re.sub(r'\s+', ' ', os.path.splitext(os.path.basename(path))[0]).strip()
        for x0, y0, x1, y1, _n in pieces(img):
            crop = img.crop((x0, y0, x1, y1))
            digest = hashlib.sha1(crop.tobytes()).hexdigest()
            if digest in seen:
                continue
            seen.add(digest)
            counters[sid] += 1
            n = counters[sid]
            os.makedirs(os.path.join(OUT, sid), exist_ok=True)
            name = f'{sid}/{n:03d}.png'
            big = crop.resize((crop.width * SCALE, crop.height * SCALE), Image.NEAREST)
            # pixel art has a handful of colours: an indexed PNG is a fraction of the size
            big.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(
                os.path.join(OUT, name), optimize=True
            )
            entries.append({
                'id': f'{sid}-{n:03d}', 'set': sid, 'file': name, 'label': label,
                'w': crop.width, 'h': crop.height, 'kind': kind_for(rel), 'rarity': rarity(crop.width, crop.height),
            })

    # assets/stickers/CREDITS.md: who drew what, as the licence asks
    with open(os.path.join(OUT, 'CREDITS.md'), 'w', encoding='utf-8') as fh:
        fh.write('# Sticker credits\n\nPixel art from **LPC Revised** (https://github.com/ElizaWy/LPC), cut into single stickers and\n'
                 'scaled 4x by scripts/build-stickers.py. Licensed CC-BY 3.0 / OGA-BY 3.0. Full per-sheet credits are in\n'
                 'scripts/data/lpc-revised/Objects/**/Credits.txt.\n\n')
        for sid, name, emoji, _ in SETS:
            fh.write(f'## {emoji} {name}\n\nArtists: {", ".join(sorted(set_artists[sid])) or "see Credits.txt"}  \n'
                     f'Licence: {", ".join(sorted(set_licenses[sid])) or "CC-BY 3.0 / OGA-BY 3.0"}\n\n')

    lines = [
        '/**',
        ' * GENERATED by scripts/build-stickers.py — do not edit by hand.',
        ' *',
        ' * Pixel art stickers cut from LPC Revised (https://github.com/ElizaWy/LPC),',
        ' * CC-BY 3.0 / OGA-BY 3.0. Credits: assets/stickers/CREDITS.md and the About screen.',
        ' * `w` and `h` are the original pixel size; the files are drawn 4x.',
        ' */',
        "import type { ImageSourcePropType } from 'react-native';",
        '',
        "export type StickerKind = 'furniture' | 'small' | 'wall';",
        "export type Rarity = 'common' | 'rare' | 'epic';",
        '',
        'export interface StickerSet {',
        '  id: string;',
        '  name: string;',
        '  emoji: string;',
        '  artists: string[];',
        '  licenses: string[];',
        '}',
        '',
        'export interface Piece {',
        '  id: string;',
        '  set: string;',
        '  label: string;',
        '  w: number;',
        '  h: number;',
        '  kind: StickerKind;',
        '  rarity: Rarity;',
        '  src: ImageSourcePropType;',
        '}',
        '',
        'export const stickerSets: StickerSet[] = [',
    ]
    for sid, name, emoji, _ in SETS:
        lines.append(f'  {{ id: {json.dumps(sid)}, name: {json.dumps(name)}, emoji: {json.dumps(emoji)}, '
                     f'artists: {json.dumps(sorted(set_artists[sid]), ensure_ascii=False)}, '
                     f'licenses: {json.dumps(sorted(set_licenses[sid]) or ["CC-BY 3.0", "OGA-BY 3.0"])} }},')
    lines += ['];', '', 'export const pieces: Piece[] = [']
    for e in entries:
        lines.append(f"  {{ id: '{e['id']}', set: '{e['set']}', label: {json.dumps(e['label'])}, w: {e['w']}, h: {e['h']}, "
                     f"kind: '{e['kind']}', rarity: '{e['rarity']}', src: require('../../assets/stickers/{e['file']}') }},")
    lines += ['];', '']
    with open(CATALOG, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines))

    print(f'{len(entries)} stickers in {len(SETS)} sets')
    for sid, *_ in SETS:
        print(f'  {sid:9s} {counters[sid]}')


if __name__ == '__main__':
    main()
