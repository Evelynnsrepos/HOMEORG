import { addDays, dayKey } from '../lib/date';
import type { Place } from './units';

/**
 * How long food keeps, by where it's kept — so everything on a shelf gets a
 * best-before even when the packet's date was never typed in. Rough home
 * kitchen numbers in days, erring on the early side: the point is a nudge to
 * use things up, not a food safety guarantee.
 *
 * First match wins, so the narrow rules come before the broad ones (H-Milch
 * before Milch, Lauchzwiebeln before Zwiebeln, Sonnenblumenöl before Blumen-
 * anything). German first, because that is what the till and the barcode
 * database call things; English after it for what you type yourself.
 *
 * A number is days from when it went on that shelf. `null` means it keeps
 * (honey, salt): no date at all. A place left out falls back to the default
 * for that place below.
 */
type Keeps = Partial<Record<Place, number | null>>;

const rules: [RegExp, Keeps][] = [
  // long-life and frozen goods first, they break the fresh rules below
  [/\bH-|haltbar|haferdrink|hafermilch|mandeldrink|sojadrink|reisdrink|oat ?drink|uht/i, { pantry: 90, fridge: 4, freezer: 90 }],
  [/\btk\b|tiefkühl|tiefgefroren|pommes|frites|kroketten|fischstäbchen|\beis\b|eiscreme|rahmspinat|frozen|ice cream/i, { freezer: 180, fridge: 2, pantry: 0 }],
  [/frische hefe|fresh yeast/i, { fridge: 10, freezer: 90, pantry: 1 }],

  // tins and jars, spreads and drinks: their names are full of fresh foods
  [/thunfisch|sardine|makrele in|in öl\b|in oel\b|\bdose\b|konserve/i, { pantry: 365, fridge: 3, freezer: 60 }],
  [/erdnussbutter|erdnussb|nutella|aufstrich|peanut butter|spread/i, { pantry: 90, fridge: 90 }],
  [/saft|juice|getränk|limo|schorle|smoothie/i, { pantry: 180, fridge: 5 }],

  // meat, fish and the like
  [/tofu|tempeh|seitan|pilz-hack|veggie|vegan.*(hack|burger|würst)/i, { fridge: 7, freezer: 90, pantry: 1 }],
  [/hack|mince|minced/i, { fridge: 1, freezer: 90, pantry: 0 }],
  [/garnele|shrimp|prawn|lachs|salmon|fisch|fish|thunfischfilet(?!.*öl)|forelle|kabeljau|seelachs/i, { fridge: 2, freezer: 90, pantry: 0 }],
  [/hähnchen|haehnchen|huhn|pute|geflügel|chicken|turkey/i, { fridge: 2, freezer: 180, pantry: 0 }],
  [/salami|chorizo|kabanos/i, { fridge: 21, freezer: 60, pantry: 7 }],
  [/wurst|aufschnitt|schinken|speck|bacon|ham\b|sausage/i, { fridge: 7, freezer: 60, pantry: 0 }],
  [/fleisch|rind|schwein|steak|gyros|geschnetzelt|schnitzel|beef|pork|lamb/i, { fridge: 3, freezer: 180, pantry: 0 }],

  // dairy and eggs
  [/\bmilch\b|vollmilch|frischmilch|\bmilk\b/i, { fridge: 5, freezer: 60, pantry: 0 }],
  [/sahne|schmand|crème fraîche|creme fraiche|saure sahne|\bcream\b/i, { fridge: 5, freezer: 60, pantry: 0 }],
  [/joghurt|jogurt|skyr|quark|kefir|buttermilch|pudding|yoghurt|yogurt/i, { fridge: 7, freezer: 60, pantry: 0 }],
  [/mozzarella|burrata|ricotta|hüttenkäse|cottage/i, { fridge: 5, freezer: 60, pantry: 0 }],
  [/frischkäse|philadelphia|feta|hirtenkäse|halloumi|cream cheese/i, { fridge: 10, freezer: 60, pantry: 0 }],
  [/käse|kaese|parmesan|gouda|emmentaler|cheddar|cheese/i, { fridge: 21, freezer: 120, pantry: 1 }],
  [/butter(?!milch)(?!.*erdnuss)|margarine|kaergarden/i, { fridge: 30, freezer: 180, pantry: 3 }],
  [/\beier\b|\bei\b|\beggs?\b/i, { fridge: 21, pantry: 14, freezer: 120 }],
  [/hummus|pesto|guacamole|tzatziki|dip\b/i, { fridge: 5, freezer: 60, pantry: 1 }],

  // greens, herbs, soft fruit and veg
  [/petersilie|koriander|basilikum|schnittlauch|\bdill\b|minze|rosmarin|thymian frisch|kräuter(?!seitl)|parsley|coriander|cilantro|basil|chives|mint|herbs?\b/i, { fridge: 5, freezer: 120, pantry: 2 }],
  [/lauchzwiebel|frühlingszwiebel|spring onion|scallion/i, { fridge: 7, freezer: 120, pantry: 2 }],
  [/salat|rucola|spinat|feldsalat|lettuce|rocket|spinach|salad/i, { fridge: 4, freezer: 180, pantry: 1 }],
  [/beere|erdbeer|himbeer|heidelbeer|brombeer|berr/i, { fridge: 3, freezer: 180, pantry: 1 }],
  [/pilz|champignon|seitling|shiitake|mushroom/i, { fridge: 5, freezer: 120, pantry: 2 }],
  [/brokkoli|broccoli|blumenkohl|cauliflower|pak ?choi|bok choy|spargel|asparagus|suppengrün|suppengruen/i, { fridge: 5, freezer: 180, pantry: 2 }],
  [/gurke|zucchini|aubergine|cucumber|courgette|eggplant/i, { fridge: 7, freezer: 90, pantry: 3 }],
  [/paprika(?!.*(pulver|edelsüß|gemahlen|scharf\b.*pulver))|chili|pepper(?!corn)/i, { fridge: 10, freezer: 180, pantry: 4 }],
  [/tomate(?!n?(mark|passiert|stück|dose|sauce|soße))|tomato(?!.*(paste|tin|can|sauce))/i, { fridge: 7, pantry: 5, freezer: 90 }],
  [/karotte|möhre|moehre|sellerie|kohl|wirsing|kohlrabi|rote bete|pastinake|carrot|celery|cabbage|beetroot|parsnip|lauch|leek/i, { fridge: 21, pantry: 7, freezer: 240 }],
  [/kartoffel|süßkartoffel|potato/i, { pantry: 30, fridge: 30, freezer: 240 }],
  [/zwiebel|knoblauch|schalotte|onion|garlic|shallot/i, { pantry: 30, fridge: 14, freezer: 120 }],
  [/ingwer|ginger|kurkuma frisch/i, { fridge: 21, pantry: 10, freezer: 180 }],
  [/avocado/i, { pantry: 4, fridge: 7, freezer: 120 }],
  [/banane|banana/i, { pantry: 5, fridge: 7, freezer: 120 }],
  [/zitrone|limette|orange|mandarine|clementine|grapefruit|lemon|lime/i, { pantry: 10, fridge: 21, freezer: 120 }],
  [/apfel(?!getränk|saft|mus|essig)|äpfel|birne|apple(?! juice)|pear/i, { pantry: 14, fridge: 30, freezer: 180 }],
  [/traube|kaki|kiwi|pfirsich|nektarine|mango|ananas|melone|pflaume|kirsche|grape|peach|plum|cherr|pineapple|melon/i, { pantry: 5, fridge: 7, freezer: 180 }],

  // bakery
  [/toast|sandwich/i, { pantry: 7, freezer: 90, fridge: 10 }],
  [/brot|brötchen|baguette|bread|roll\b|bagel|wrap|tortilla/i, { pantry: 4, freezer: 90, fridge: 7 }],
  [/kuchen|torte|cake/i, { fridge: 4, pantry: 2, freezer: 90 }],

  // the cupboard
  [/honig|honey|salz\b|salt\b|zucker|sugar|essig|vinegar/i, { pantry: null, fridge: null, freezer: null }],
  [/kokosmilch|coconut milk|\bdose\b|konserve|bohnen|kidney|kichererbsen|chickpea|\bmais\b|passiert|stückige|gehackte tomaten|tomatenmark|thunfisch|tinned|canned|\bcan\b/i, { pantry: 365, fridge: 3, freezer: 60 }],
  [/nudeln|pasta|spaghetti|penne|fusilli|linguine|tortiglioni|lasagne|reis|rice|mehl|flour|couscous|bulgur|quinoa|linsen|lentil|haferflocken|oats|müsli|muesli|polenta|grieß/i, { pantry: 365, fridge: 365, freezer: 365 }],
  [/öl\b|oel\b|olivenöl|kokosöl|sonnenblumenöl|\boil\b/i, { pantry: 180, fridge: 180 }],
  [/marmelade|konfitüre|jam\b/i, { pantry: 365, fridge: 30 }],
  [/senf|ketchup|mayo|sauce|soße|dressing|mustard/i, { fridge: 60, pantry: 180 }],
  [/sambal|currypaste|curry paste|miso|sriracha|gochujang|sojasauce|soy sauce|fischsauce/i, { fridge: 90, pantry: 180 }],
  [/schokolade|chocolate|chips|kekse|cookies|nüsse|nuts|mandeln|almonds|kerne|seeds|rosinen|nori/i, { pantry: 120, fridge: 120 }],
  [/kaffee|coffee|tee\b|tea\b|gewürz|spice|pfeffer|zimt|oregano|curry\b|paprikapulver/i, { pantry: 365 }],
];

/** When nothing matches: the fridge means "fresh, use soon", the freezer "months". */
const fallback: Record<Place, number | null> = { fridge: 7, freezer: 90, pantry: null };

export interface ShelfLife {
  /** days it keeps there, or null for "keeps" */
  days: number | null;
  /** false when it's only the place's fallback */
  known: boolean;
}

export function shelfLife(name: string, place: Place): ShelfLife {
  for (const [match, keeps] of rules) {
    if (!match.test(name)) continue;
    if (place in keeps) return { days: keeps[place]!, known: true };
    return { days: fallback[place], known: true };
  }
  return { days: fallback[place], known: false };
}

/** The best-before day for something put on `place` at `from`, or undefined if it keeps. */
export function autoBestBefore(name: string, place: Place, from: Date | string = new Date()): string | undefined {
  const { days } = shelfLife(name, place);
  if (days == null) return undefined;
  return dayKey(addDays(new Date(from), days));
}

/** "about 5 days", "about 3 months", "keeps" — for the date picker. */
export function shelfLifeText(name: string, place: Place): string {
  const { days } = shelfLife(name, place);
  if (days == null) return 'keeps';
  if (days === 0) return 'use today';
  if (days < 14) return `about ${days} ${days === 1 ? 'day' : 'days'}`;
  if (days < 60) return `about ${Math.round(days / 7)} weeks`;
  if (days < 365) return `about ${Math.round(days / 30)} months`;
  return 'about a year';
}
