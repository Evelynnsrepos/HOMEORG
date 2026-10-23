"""
Every pet in the library: species, colour, pose, set and rarity. House cats
are common, birds and bunnies rare-ish, the big and wild cats are the epic
finds. Ids stay stable: add new pets at the end of a list, never rename.
"""
from coats import Coat
from templates import (BETTA_BOWL, BIGCAT_LIE, DOG_SIT, DOG_SIT_POINTY, GECKO, GOLDFISH_BOWL, GUINEA_PIG, HAMSTER, RAT,
                       TETRA_BOWL, TURTLE, BIRD_CREST, BIRD_PERCH, BUNNY_SIT, CAT_LOAF, CAT_SIT, LION_LIE,
                       LYNX_SIT, MANUL_SIT, SERVAL_SIT)

PET_SETS = [
    ('cats', 'Cosy Cats', '🐈'),
    ('wildcats', 'Wild Whiskers', '🐅'),
    ('feathers', 'Feathers & Fluff', '🐦'),
    ('dogs', 'Good Dogs', '🐕'),
    ('fishes', 'Fish Bowl', '🐠'),
    ('critters', 'Little Critters', '🐹'),
]

HOUSE_CATS = [
    ('ginger-tabby', 'Ginger tabby', Coat('#d98a3c', 'tabby', eye='#a5c94a')),
    ('brown-tabby', 'Brown tabby', Coat('#8a6a4c', 'tabby', mark='#3a2a22', eye='#c9b24a')),
    ('grey-tabby', 'Grey tabby', Coat('#9097a0', 'tabby', mark='#4a4f58', eye='#c9c24a')),
    ('black', 'Black cat', Coat('#2e2a33', eye='#e0c24a', pale='#2e2a33', ear='#7a5a64', outline='#141018')),
    ('white', 'White cat', Coat('#f4f0ec', eye='#7fb6e6', pale='#ffffff', outline='#7a6a70')),
    ('tuxedo', 'Tuxedo cat', Coat('#2e2a33', 'tuxedo', eye='#9ccc4a', ear='#7a5a64', outline='#141018')),
    ('calico', 'Calico', Coat('#f6ead8', 'calico', patch=('#d98a3c', '#2e2a33'), outline='#5a4a44')),
    ('siamese', 'Siamese', Coat('#efe2cc', 'points', point='#5a4038', eye='#6aa8e8', outline='#5a4a44')),
    ('tortie', 'Tortoiseshell', Coat('#2e2a33', 'tortie', patch=('#c9783a',), pale='#3a3036', outline='#141018', eye='#e0a24a')),
    ('cream', 'Cream cat', Coat('#ecd2a8', 'faint', mark='#c9a878', eye='#c98a4a')),
    ('blue', 'Blue cat', Coat('#7d8796', pale='#9aa3b0', eye='#e0a24a', ear='#c99aa4')),
    ('pink', 'Strawberry cat', Coat('#f2a7bd', 'faint', mark='#d97a98', pale='#fde6ee', eye='#7fb6e6')),
]

WILD_SIT = [
    ('manul', "Pallas's cat", MANUL_SIT, Coat('#a39a90', 'manul', mark='#3e3530', pale='#e8e2d8', eye='#e8c84a'), 'epic'),
    ('manul-rusty', "Rusty Pallas's cat", MANUL_SIT, Coat('#b08868', 'manul', mark='#4a3428', pale='#efe2d0', eye='#e8c84a'), 'epic'),
    ('manul-winter', "Pallas's cat in winter", MANUL_SIT, Coat('#c9c4be', 'manul', mark='#5a5048', pale='#f4f0ea', eye='#e8c84a'), 'epic'),
    ('serval', 'Serval', SERVAL_SIT, Coat('#d9a858', 'spots', mark='#2a1c14', eye='#d9b84a'), 'rare'),
    ('serval-black', 'Black serval', SERVAL_SIT, Coat('#2a2428', pale='#3a3236', eye='#d9b84a', outline='#0e0a0c'), 'epic'),
    ('caracal', 'Caracal', LYNX_SIT, Coat('#c9905a', pale='#f2e6d4', eye='#d9b84a', ear='#2a1c14'), 'rare'),
    ('lynx', 'Lynx', LYNX_SIT, Coat('#b8a48c', 'spots', mark='#5a4a3c', pale='#f2ece2', eye='#c9b84a'), 'rare'),
]

BIG_CATS = [
    ('tiger', 'Tiger', BIGCAT_LIE, Coat('#e0802e', 'tiger', mark='#1e1414', pale='#f8f0e4', eye='#d9b84a')),
    ('tiger-white', 'White tiger', BIGCAT_LIE, Coat('#f0ece6', 'tiger', mark='#3a3038', pale='#ffffff', eye='#7fb6e6', outline='#6a5a64')),
    ('snow-leopard', 'Snow leopard', BIGCAT_LIE, Coat('#d6d4d0', 'rosettes', mark='#5a5458', pale='#f6f4f0', eye='#9cc8c0')),
    ('lion', 'Lion', LION_LIE, Coat('#d6a35e', pale='#f2e2c4', eye='#c9903a', mane='#8a5428')),
    ('cheetah', 'Cheetah', BIGCAT_LIE, Coat('#e0b25e', 'cheetah', mark='#2a1c14', pale='#f6ead0', eye='#c9903a')),
    ('panther', 'Black panther', BIGCAT_LIE, Coat('#24202a', pale='#2a2630', eye='#e0c24a', outline='#0a080c')),
    ('jaguar', 'Jaguar', BIGCAT_LIE, Coat('#d9a04a', 'rosettes', mark='#2a1c14', pale='#f6ead0', eye='#c9b84a')),
]

BIRDS = [
    ('budgie-green', 'Green budgie', BIRD_PERCH, Coat('#6cc04a', 'budgie', head='#f2dc4a', mark='#2a2a22', pale='#f2dc4a', wing=('#2a3a22', '#a8d870'), tail='#3a6ac8', beak='#f2c070', eye='#1a1418')),
    ('budgie-blue', 'Blue budgie', BIRD_PERCH, Coat('#5aa0e0', 'budgie', head='#f6f6f2', mark='#2a2a32', pale='#f6f6f2', wing=('#2a2a38', '#b0d0f0'), tail='#2a4a9a', beak='#f2c070', eye='#1a1418')),
    ('budgie-violet', 'Violet budgie', BIRD_PERCH, Coat('#a07ad8', 'budgie', head='#f6f6f2', mark='#2a2a32', pale='#f6f6f2', wing=('#3a2a48', '#d0c0f0'), tail='#5a3a9a', beak='#f2c070', eye='#1a1418')),
    ('budgie-lutino', 'Lutino budgie', BIRD_PERCH, Coat('#f6e050', head='#fff2a0', pale='#fff2a0', wing=('#f0d040', '#fff2a0'), beak='#f2c070', eye='#d0405a')),
    ('cockatiel', 'Cockatiel', BIRD_CREST, Coat('#9a9aa0', head='#f2dc6a', pale='#c8c8cc', wing=('#f6f6f6', '#9a9aa0'), beak='#a0a0a8', crest='#f2dc6a', cheek='#f08a3a', eye='#1a1418')),
    ('cockatiel-lutino', 'Lutino cockatiel', BIRD_CREST, Coat('#f6f0dc', head='#f8e070', pale='#fff8e8', wing=('#fff8e8', '#f0e4c0'), beak='#e8c8a8', crest='#f8e070', cheek='#f08a3a', eye='#d0405a')),
    ('robin', 'Robin', BIRD_PERCH, Coat('#8a6a50', pale='#f0843a', wing=('#6a4a38', '#8a6a50'), eye='#1a1418', beak='#3a2a22')),
    ('java-sparrow', 'Java sparrow', BIRD_PERCH, Coat('#8a8e9a', head='#2a2a30', pale='#f2f2f2', wing=('#6a6e7a', '#8a8e9a'), beak='#f06a7a', eye='#1a1418')),
    ('canary', 'Canary', BIRD_PERCH, Coat('#f6d84a', pale='#fbe88a', wing=('#e8c03a', '#f6d84a'), eye='#1a1418', beak='#f2c8a0')),
    ('lovebird', 'Lovebird', BIRD_PERCH, Coat('#5cc05a', head='#f08a6a', pale='#f6b090', wing=('#3a8a3a', '#5cc05a'), tail='#3a6ac8', beak='#e84a3a', eye='#1a1418')),
    ('blue-tit', 'Blue tit', BIRD_PERCH, Coat('#7ab0d8', head='#4a7ac8', pale='#f2dc4a', wing=('#3a5a9a', '#7ab0d8'), beak='#2a2a30', eye='#1a1418')),
    ('pink-galah', 'Galah', BIRD_CREST, Coat('#a8a8b0', head='#f2a0b8', pale='#e8708e', wing=('#c8c8d0', '#9898a0'), crest='#fbd8e2', cheek='#f2a0b8', beak='#f0e8e0', eye='#1a1418')),
]

BUNNIES = [
    ('bunny-white', 'White bunny', Coat('#f6f2ee', pale='#ffffff', eye='#d0405a', outline='#7a6a70')),
    ('bunny-brown', 'Brown bunny', Coat('#a07850', pale='#f2e6d4', eye='#2a1c14')),
    ('bunny-grey', 'Grey bunny', Coat('#a0a2aa', pale='#eceef2', eye='#2a1c14')),
    ('bunny-dutch', 'Dutch bunny', Coat('#3a3236', 'tuxedo', pale='#ffffff', eye='#2a1c14', outline='#141018')),
    ('bunny-pink', 'Candy bunny', Coat('#f6c0d0', pale='#fff0f4', eye='#7fb6e6')),
    ('bunny-cream', 'Cream bunny', Coat('#ecd2a8', pale='#fff6e8', eye='#2a1c14')),
    ('bunny-black', 'Black bunny', Coat('#2e2a33', pale='#3a3438', eye='#c9a24a', ear='#7a5a64', outline='#141018')),
]


DOGS = [
    ('golden', 'Golden retriever', DOG_SIT, Coat('#e0b060', pale='#f6e2b8', eye='#2a1c14', nose='#2a1c14')),
    ('labrador-black', 'Black labrador', DOG_SIT, Coat('#2e2a30', pale='#3a3438', eye='#8a5a2a', nose='#141018', outline='#0e0a0c')),
    ('labrador-choc', 'Chocolate labrador', DOG_SIT, Coat('#6a4430', pale='#8a5e44', eye='#c9903a', nose='#2a1810')),
    ('pug', 'Pug', DOG_SIT, Coat('#e0c090', 'points', point='#2a2228', pale='#ecd4a8', eye='#2a1c14', nose='#141018')),
    ('dalmatian', 'Dalmatian', DOG_SIT, Coat('#f6f4f0', 'cheetah', mark='#2a2428', pale='#ffffff', eye='#2a1c14', nose='#2a1c14', outline='#6a5a64')),
    ('poodle-white', 'White poodle', DOG_SIT, Coat('#f6f2ee', pale='#ffffff', eye='#2a1c14', nose='#2a1c14', outline='#7a6a70')),
    ('poodle-apricot', 'Apricot poodle', DOG_SIT, Coat('#e8b890', pale='#f8dcc4', eye='#2a1c14', nose='#6a4430')),
    ('corgi', 'Corgi', DOG_SIT_POINTY, Coat('#e09040', pale='#fbf2e6', eye='#2a1c14', nose='#2a1c14')),
    ('husky', 'Husky', DOG_SIT_POINTY, Coat('#7d8796', pale='#f6f6f6', eye='#7fb6e6', nose='#2a1c14')),
    ('shiba', 'Shiba', DOG_SIT_POINTY, Coat('#d98a3c', pale='#fbefdc', eye='#2a1c14', nose='#2a1c14')),
    ('german-shepherd', 'Shepherd', DOG_SIT_POINTY, Coat('#b07a40', 'points', point='#2a2228', pale='#d9a868', eye='#2a1c14', nose='#141018')),
    ('pomeranian-pink', 'Candy pom', DOG_SIT_POINTY, Coat('#f6c0d0', pale='#fff0f4', eye='#2a1c14', nose='#7a4a5a')),
]


FISH = [
    ('goldfish', 'Goldfish', GOLDFISH_BOWL, Coat('#e8842e', tail='#f2a84a', eye='#1a1418')),
    ('goldfish-calico', 'Calico goldfish', GOLDFISH_BOWL, Coat('#f6f0e6', 'calico', patch=('#e8842e', '#2e2a30'), tail='#f6c8a8', eye='#1a1418')),
    ('goldfish-moor', 'Black moor', GOLDFISH_BOWL, Coat('#2e2a33', tail='#4a4250', eye='#e0c24a')),
    ('betta-red', 'Red betta', BETTA_BOWL, Coat('#c8304a', tail='#e84a6a', eye='#1a1418')),
    ('betta-blue', 'Blue betta', BETTA_BOWL, Coat('#3a5ac8', tail='#5a8af0', eye='#1a1418')),
    ('betta-purple', 'Purple betta', BETTA_BOWL, Coat('#7a3ab0', tail='#b070e0', eye='#1a1418')),
    ('betta-koi', 'Koi betta', BETTA_BOWL, Coat('#f6f0ec', 'calico', patch=('#e8504a', '#2e2a30'), tail='#f8c0c8', eye='#1a1418')),
    ('tetra-neon', 'Neon tetra', TETRA_BOWL, Coat('#3a8ae0', tail='#e84a5a', eye='#1a1418')),
    ('guppy', 'Guppy', TETRA_BOWL, Coat('#a8b0b8', tail='#f070b0', eye='#1a1418')),
    ('guppy-sunny', 'Sunny guppy', TETRA_BOWL, Coat('#f2d070', tail='#3a8ae0', eye='#1a1418')),
]

CRITTERS = [
    ('hamster-golden', 'Golden hamster', 'small', HAMSTER, Coat('#e0a860', pale='#fbf2e6', eye='#1a1418')),
    ('hamster-white', 'White dwarf hamster', 'small', HAMSTER, Coat('#f6f2ee', pale='#ffffff', eye='#d0405a', outline='#7a6a70')),
    ('hamster-russian', 'Russian dwarf hamster', 'small', HAMSTER, Coat('#9a9aa0', pale='#f2f2f2', eye='#1a1418')),
    ('hamster-panda', 'Panda hamster', 'small', HAMSTER, Coat('#2e2a33', 'tuxedo', pale='#ffffff', eye='#d0a0a8', outline='#141018')),
    ('guinea-tricolor', 'Tricolour guinea pig', 'small', GUINEA_PIG, Coat('#c98a4a', 'calico', patch=('#2e2a30', '#f6f0e6'), pale='#f6f0e6', eye='#1a1418')),
    ('guinea-ginger', 'Ginger guinea pig', 'small', GUINEA_PIG, Coat('#d98a3c', pale='#f6e2c4', eye='#1a1418')),
    ('guinea-white', 'White guinea pig', 'small', GUINEA_PIG, Coat('#f6f2ee', pale='#ffffff', eye='#d0405a', outline='#7a6a70')),
    ('guinea-dutch', 'Dutch guinea pig', 'small', GUINEA_PIG, Coat('#2e2a33', 'tortie', patch=('#f6f0e6',), pale='#f6f0e6', eye='#1a1418', outline='#141018')),
    ('rat-grey', 'Grey rat', 'small', RAT, Coat('#9a9aa0', pale='#f2f2f2', tail='#f2b8c0', eye='#1a1418')),
    ('rat-white', 'White rat', 'small', RAT, Coat('#f6f2ee', pale='#ffffff', tail='#f2b8c0', eye='#d0405a', outline='#7a6a70')),
    ('rat-hooded', 'Hooded rat', 'small', RAT, Coat('#f6f2ee', head='#2e2a33', pale='#ffffff', tail='#f2b8c0', eye='#1a1418', outline='#5a4a50')),
    ('rat-cinnamon', 'Cinnamon rat', 'small', RAT, Coat('#b88a62', pale='#f2e6d4', tail='#f2b8c0', eye='#1a1418')),
    ('gecko-leopard', 'Leopard gecko', 'reptile', GECKO, Coat('#f2d070', 'spots', mark='#5a4a3a', eye='#1a1418')),
    ('gecko-albino', 'Albino gecko', 'reptile', GECKO, Coat('#f6e2b0', 'spots', mark='#e0a070', eye='#d0405a')),
    ('gecko-crested', 'Crested gecko', 'reptile', GECKO, Coat('#e0904a', eye='#1a1418')),
    ('turtle', 'Turtle', 'reptile', TURTLE, Coat('#7aa860', tail='#6a8a3a', pale='#c9d890', eye='#1a1418')),
    ('turtle-red', 'Red-eared slider', 'reptile', TURTLE, Coat('#6a9a50', tail='#4a6a3a', pale='#e8d880', ear='#d84a3a', eye='#1a1418')),
    ('tortoise', 'Tortoise', 'reptile', TURTLE, Coat('#b89a6a', tail='#8a6a3a', pale='#d8c8a0', eye='#1a1418')),
]

RARE_EXTRA = {'betta-purple', 'betta-koi', 'goldfish-moor', 'hamster-panda', 'rat-hooded', 'gecko-crested', 'tortoise'}


def all_pets():
    """(id, set, label, rarity, template, coat) for every pet, in a stable order."""
    out = []
    for cid, label, coat in HOUSE_CATS:
        rarity = 'rare' if cid in ('calico', 'tortie', 'pink', 'siamese') else 'common'
        out.append((f'pet-cat-{cid}-sit', 'cats', label, rarity, CAT_SIT, coat))
        out.append((f'pet-cat-{cid}-loaf', 'cats', f'{label} loafing', rarity, CAT_LOAF, coat))
    for cid, label, tpl, coat, rarity in WILD_SIT:
        out.append((f'pet-{cid}', 'wildcats', label, rarity, tpl, coat))
    for cid, label, tpl, coat in BIG_CATS:
        out.append((f'pet-{cid}', 'wildcats', label, 'epic', tpl, coat))
    for cid, label, tpl, coat in BIRDS:
        out.append((f'pet-{cid}', 'feathers', label, 'rare' if cid in ('pink-galah', 'cockatiel-lutino', 'budgie-violet') else 'common', tpl, coat))
    for cid, label, coat in BUNNIES:
        rarity = 'rare' if cid == 'bunny-pink' else 'common'
        out.append((f'pet-{cid}', 'feathers', label, rarity, BUNNY_SIT, coat))
    for cid, label, tpl, coat in FISH:
        out.append((f'pet-fish-{cid}', 'fishes', label, 'rare' if cid in RARE_EXTRA else 'common', tpl, coat))
    for cid, label, _kind, tpl, coat in CRITTERS:
        out.append((f'pet-{cid}', 'critters', label, 'rare' if cid in RARE_EXTRA else 'common', tpl, coat))
    for cid, label, tpl, coat in DOGS:
        out.append((f'pet-dog-{cid}', 'dogs', label, 'rare' if cid in ('pomeranian-pink', 'husky', 'dalmatian') else 'common', tpl, coat))
    return out
