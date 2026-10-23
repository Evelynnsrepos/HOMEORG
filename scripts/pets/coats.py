"""
Coats: what colour each pixel of a template gets, for every species and
colour of pet. A coat is a ramp (light, base, shade) plus a pattern that
paints over it — stripes, spots, rosettes, points, patches, wing bars.
"""

def mix(a, b, t):
    a = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(x + (y - x) * t):02x}' for x, y in zip(a, b))


def dark(c, t=0.35):
    return mix(c, '#1a0f14', t)


def light(c, t=0.3):
    return mix(c, '#ffffff', t)


BODY = {'1': 0, '2': 1, '3': 2, '4': 0, '5': 1, '6': 2, '7': 0, '8': 1, '9': 2, 'q': 1, 'r': 1, 's': 2, 'g': 2}
PART = {'1': 'body', '2': 'body', '3': 'body', '4': 'head', '5': 'head', '6': 'head', '7': 'tail', '8': 'tail',
        '9': 'tail', 'q': 'ear', 'r': 'paw', 's': 'paw', 'g': 'wing'}


def h(x, y, k=1):
    """A steady pseudo-random number in 0..1 for a pixel, for spots and patches."""
    v = (x * 374761393 + y * 668265263 + k * 2147483647) & 0xffffffff
    v = (v ^ (v >> 13)) * 1274126177 & 0xffffffff
    return (v ^ (v >> 16)) / 0xffffffff


class Coat:
    def __init__(self, base, pattern='solid', mark=None, pale='#f6ead8', eye='#9ccc4a', nose='#e8899a',
                 ear='#eda3ab', point=None, patch=None, head=None, tail=None, wing=None, beak='#f2a33a',
                 feet='#e8916a', crest=None, cheek=None, outline=None, mane=None, tuft='#1a1418'):
        self.ramp = [light(base, 0.22), base, dark(base, 0.22)]
        self.pattern, self.mark = pattern, mark or dark(base, 0.55)
        self.pale, self.eye, self.nose, self.ear = pale, eye, nose, ear
        self.point, self.patch = point, patch
        self.head = [light(head, 0.22), head, dark(head, 0.22)] if head else None
        self.tail = [light(tail, 0.22), tail, dark(tail, 0.22)] if tail else None
        self.wing = wing
        self.beak, self.feet, self.crest, self.cheek = beak, feet, crest, cheek
        self.outline = outline or dark(base, 0.7)
        self.mane, self.tuft = mane or dark(base, 0.3), tuft

    def __call__(self, ch, x, y):
        if ch == 'o':
            return self.outline
        if ch in 'wW':
            c = self.pale if ch == 'w' else dark(self.pale, 0.12)
            if self.pattern == 'calico' and h(x // 3, y // 3, 5) < 0.25:
                return self.patch[1]
            return c
        scene = {'a': '#cfe9f5', 'G': '#ffffff', 'S': '#ead6aa', 'P': '#5cae5a', 'O': '#7aa4bc'}
        if ch in scene:
            return scene[ch]
        if ch == 'm':
            return self.mane if h(x, y, 11) < 0.7 else dark(self.mane, 0.18)
        simple = {'t': self.tuft, 'i': self.cheek or self.ear, 'e': self.eye,
                  'k': '#1a1418', 'n': self.nose, 'b': self.beak, 'f': self.feet, 'c': self.crest or self.ramp[1]}
        if ch in simple:
            return simple[ch]
        shade, part = BODY[ch], PART[ch]
        ramp = self.ramp
        if part == 'head' and self.head:
            ramp = self.head
        if part == 'tail' and self.tail:
            ramp = self.tail
        c = ramp[shade]
        p = self.pattern
        if part == 'wing' and self.wing:
            return self.wing[0] if y % 2 else self.wing[1]
        if p == 'points' and part in ('ear', 'paw', 'tail'):
            return [self.point, self.point, dark(self.point, 0.2)][shade]
        if p == 'points' and part == 'head' and ch == '5' and 4 <= x <= 8 and y >= 5:
            return self.point
        if p == 'tuxedo' and part == 'paw':
            return self.pale
        if p == 'calico':
            v = h(x // 3, y // 3)
            if v < 0.33:
                return self.patch[0] if shade < 2 else dark(self.patch[0], 0.2)
            if v < 0.55:
                return self.patch[1] if shade < 2 else dark(self.patch[1], 0.15)
        if p == 'tortie' and h(x // 2, y // 2, 3) < 0.45:
            return self.patch[0] if shade < 2 else dark(self.patch[0], 0.2)
        if p in ('tabby', 'tiger', 'manul', 'faint'):
            if part == 'tail':
                band = 2 if p == 'tiger' else 3
                # a manul's tail lies along the ground, so its rings run across x
                if (p == 'manul' and x % 2 == 0) or (p != 'manul' and y % band == 0):
                    return self.mark
            elif part == 'head':
                # the "M" on the forehead and a few cheek lines
                if p != 'faint' and ch in '45' and y in (3, 4) and x in (4, 6, 8):
                    return self.mark
                if p == 'manul' and h(x, y, 9) < 0.18 and y < 5:
                    return self.mark
            elif part == 'body' and p != 'manul':
                period = 3 if p in ('tabby', 'faint') else 4
                if (x + y // 3) % period == 0 and (p != 'faint' or y % 2 == 0):
                    return self.mark if p != 'faint' else mix(c, self.mark, 0.5)
        if p in ('spots', 'rosettes', 'cheetah') and part in ('body', 'head', 'tail', 'paw', 'ear'):
            if part == 'tail' and y % 2 == 0 and p != 'cheetah':
                return self.mark
            if p == 'rosettes':
                if (x % 4 in (0, 2) and y % 4 == 1) or (x % 4 == 1 and y % 4 in (0, 2)):
                    return self.mark if h(x // 4, y // 4, 7) < 0.8 else c
            else:
                cell = 3 if p == 'cheetah' else 4
                if (x + (y // cell) * 2) % cell == 0 and y % cell == 0:
                    return self.mark
                if p == 'spots' and (x + y) % 3 == 0 and y % 2 == 1 and h(x, y) < 0.55:
                    return self.mark
        if p == 'budgie' and part == 'head' and y in (1, 2) and x % 2:
            return self.mark
        return c
