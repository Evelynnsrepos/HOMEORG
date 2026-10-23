"""Turn a template and a coat into an RGBA image."""
from PIL import Image

def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)

def render(template, coat):
    """coat(ch, x, y) -> '#rrggbb' or None; called for every non-empty pixel."""
    rows = [r for r in template.strip('\n').split('\n')]
    w = max(len(r) for r in rows)
    img = Image.new('RGBA', (w, len(rows)), (0, 0, 0, 0))
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch == '.':
                continue
            c = coat(ch, x, y)
            if c:
                img.putpixel((x, y), hexrgb(c))
    return img
