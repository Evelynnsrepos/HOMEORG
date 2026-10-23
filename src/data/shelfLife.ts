import { addDays, dayKey } from '../lib/date';
import type { Place } from './units';

/**
 * How long food keeps, by where it's kept — so everything on a shelf gets a
 * best-before even when the packet's date was never typed in. Rough home
 * kitchen numbers in days, erring on the early side: the point is a nudge to
 * use things up, not a food safety guarantee.
 *
 * How a name is matched:
 *
 * 1. **States** first. Words that change everything wherever they appear —
 *    frozen (TK), a tin or jar (Dose, Glas, in Öl), dried or ground, cooked
 *    leftovers, long-life (H-, UHT), a drink. "Erbsen TK" is frozen whatever
 *    the peas say; "Preiselbeeren Glas" is a jar, not fresh berries.
 * 2. Otherwise **the match that ends last wins**, and the longer one on a
 *    tie. German puts the thing at the end of a compound: Fischsauce is a
 *    sauce, Rinderhack is mince, Butterkeks a biscuit, Zuckerschoten peas —
 *    and Knoblauch beats Lauch, Erdnussbutter beats Butter.
 *
 * Covers German and English names and staples from many kitchens — East and
 * South Asian, Middle Eastern, African, Latin American — because that's what
 * ends up in a shared fridge. `scripts/test-shelf.ts` holds the names that
 * keep it honest; add yours there when a guess surprises you.
 *
 * A number is days from when it went on that shelf. `null` means it keeps
 * (honey, salt, vinegar): no date. A place left out falls back per place.
 */
type Keeps = Partial<Record<Place, number | null>>;
type Rule = [RegExp, Keeps];

const FROZEN: Keeps = { freezer: 180, fridge: 2, pantry: 0 };
const TIN: Keeps = { pantry: 365, fridge: 7, freezer: 60 };
const DRY: Keeps = { pantry: 365, fridge: 365, freezer: 365 };
const KEEPS: Keeps = { pantry: null, fridge: null, freezer: null };

const states: Rule[] = [
  [/\btk\b|tiefkühl|tiefgekühlt|tiefgefroren|gefroren|frozen/i, FROZEN],
  [/frisch gepresst|saft frisch|frischer saft|fresh(ly)? (squeezed|juice)|smoothie/i, { fridge: 4, freezer: 90, pantry: 0 }],
  [/getränk|\bdrink\b|drink\b|nektar|\blimo|limonade|schorle|eistee|iced tea|\bcola\b|energy ?drink/i, { pantry: 365, fridge: 7, freezer: 90 }],
  [/\bdosen?\b|konserve|passiert|passata|\bglas\b|im glas|in lake|eingelegt|in öl\b|in oel\b|in oil\b|\btin\b|tinned|canned|\bjar\b|pickled/i, TIN],
  [/getrocknet|dried|trocken|instant|pulver|gemahlen|ground (?!beef|meat|pork|turkey|chicken|lamb)|powder|flakes|flocken|raspeln|desiccated/i, DRY],
  [/gekocht|gebraten|gegart|cooked|leftover|\breste\b|vom vortag/i, { fridge: 3, freezer: 90, pantry: 0 }],
  [/\bh-|haltbar|\buht\b|long ?life/i, { pantry: 90, fridge: 4, freezer: 90 }],
];

const rules: Rule[] = [
  // ---- meat, fish, seafood ---------------------------------------------
  [/hack|hackfleisch|faschiertes|mince|minced|ground (beef|meat|pork|turkey|chicken|lamb)|burger patt/i, { fridge: 1, freezer: 90, pantry: 0 }],
  [/hähnchen|haehnchen|hühnchen|huhn|hendl|geflügel|pute|truthahn|ente|gans|chicken|turkey|duck/i, { fridge: 2, freezer: 180, pantry: 0 }],
  [/rind|rinder|steak|schwein|kalb|lamm|ziege|wild\b|fleisch|gulasch|gyros|geschnetzelt|schnitzel|kotelett|beef|pork|lamb|veal|goat|mutton/i, { fridge: 3, freezer: 180, pantry: 0 }],
  [/leber|niere|innereien|liver|kidney(?! ?bean)|offal/i, { fridge: 1, freezer: 90, pantry: 0 }],
  [/wurst|würstchen|wiener|aufschnitt|schinken|speck|bacon|mortadella|sausage|hot ?dog|\bham\b/i, { fridge: 7, freezer: 60, pantry: 0 }],
  [/salami|chorizo|kabanos|prosciutto|serrano|parmaschinken|pancetta|bresaola|landjäger|cured/i, { fridge: 21, freezer: 60, pantry: 7 }],
  [/fisch|fish|lachs|salmon|forelle|trout|kabeljau|\bcod\b|seelachs|pollock|dorade|tilapia|makrele|mackerel|hering|herring|zander|steak de thon|tuna steak|thunfischsteak/i, { fridge: 2, freezer: 90, pantry: 0 }],
  [/garnele|shrimp|prawn|scampi|muschel|mussel|clam|tintenfisch|squid|calamari|oktopus|octopus|krabbe|crab|hummer|lobster|meeresfrücht|seafood/i, { fridge: 2, freezer: 90, pantry: 0 }],
  [/räucherlachs|raeucherlachs|smoked salmon|räucherfisch|matjes|rollmops|bismarck/i, { fridge: 10, freezer: 60, pantry: 0 }],
  [/thunfisch|sardine|sardelle|anchov|ölsardine/i, { pantry: 365, fridge: 30, freezer: 60 }],
  [/surimi|fischfrikadelle|fish ?cake/i, { fridge: 5, freezer: 90, pantry: 0 }],

  // ---- plant protein ---------------------------------------------------
  [/tofu|seidentofu|silken tofu|räuchertofu/i, { fridge: 7, freezer: 90, pantry: 1 }],
  [/tempeh|seitan/i, { fridge: 10, freezer: 90, pantry: 1 }],
  [/natto/i, { fridge: 10, freezer: 60, pantry: 0 }],
  [/pilz-hack|veggie|vegan\w* (hack|burger|wurst|würst|schnitzel|filet)|plant[- ]based|sojaschnetzel(?!.*trocken)/i, { fridge: 7, freezer: 90, pantry: 1 }],
  [/falafel/i, { fridge: 5, freezer: 90, pantry: 1 }],
  [/hummus|houmous/i, { fridge: 7, freezer: 60, pantry: 0 }],

  // ---- dairy and eggs ----------------------------------------------------
  [/milch|\bmilk\b/i, { fridge: 5, freezer: 60, pantry: 0 }],
  [/hafermilch|sojamilch|mandelmilch|reismilch|haferdrink|sojadrink|mandeldrink|reisdrink|oat ?milk|soy ?milk|almond ?milk|rice ?milk/i, { pantry: 180, fridge: 7, freezer: 60 }],
  [/kokosmilch|kokosnussmilch|coconut milk|coconut cream/i, { pantry: 365, fridge: 4, freezer: 60 }],
  [/buttermilch|kefir|ayran|lassi|dickmilch/i, { fridge: 10, freezer: 60, pantry: 0 }],
  [/sahne|schlagsahne|schmand|crème fraîche|creme fraiche|saure sahne|\bcream\b|heavy cream|sour cream|crema/i, { fridge: 7, freezer: 60, pantry: 0 }],
  [/joghurt|jogurt|yogh?urt|skyr|quark|pudding|labneh|labne/i, { fridge: 10, freezer: 60, pantry: 0 }],
  [/frischkäse|cream cheese|philadelphia|hüttenkäse|cottage cheese|körniger frischkäse/i, { fridge: 10, freezer: 60, pantry: 0 }],
  [/mascarpone|ricotta|queso fresco|paneer/i, { fridge: 7, freezer: 60, pantry: 0 }],
  [/mozzarella|burrata|stracciatella/i, { fridge: 5, freezer: 60, pantry: 0 }],
  [/feta|hirtenkäse|halloumi|grillkäse|schafskäse/i, { fridge: 14, freezer: 90, pantry: 0 }],
  [/brie|camembert|weichkäse|gorgonzola|roquefort|blauschimmel|blue cheese/i, { fridge: 10, freezer: 60, pantry: 0 }],
  [/käse|kaese|cheese|gouda|emmentaler|cheddar|bergkäse|manchego|pecorino|parmesan|grana|parmigiano/i, { fridge: 28, freezer: 120, pantry: 1 }],
  [/butter|margarine|kaergarden/i, { fridge: 30, freezer: 180, pantry: 3 }],
  [/ghee|butterschmalz/i, { pantry: 180, fridge: 365, freezer: 365 }],
  [/eier|\bei\b|\beggs?\b/i, { fridge: 28, freezer: 120, pantry: 14 }],

  // ---- herbs and aromatics -------------------------------------------------
  [/petersilie|koriander|basilikum|schnittlauch|\bdill\b|minze|rosmarin|thymian|salbei|estragon|kerbel|curryblätter|curry leaves|parsley|cilantro|coriander|basil|chives|\bmint\b|sage|tarragon|kräuter|herbs?\b/i, { fridge: 7, freezer: 120, pantry: 2 }],
  [/zitronengras|lemongrass|galgant|galangal|kaffirlimette|kaffir|makrut|lime leaves|limettenblätter/i, { fridge: 14, freezer: 180, pantry: 5 }],
  [/ingwer|ginger|kurkuma|turmeric root/i, { fridge: 21, freezer: 180, pantry: 10 }],
  [/zwiebel|schalotte|onion|shallot/i, { pantry: 30, fridge: 14, freezer: 120 }],
  [/lauchzwiebel|frühlingszwiebel|spring onion|scallion|green onion/i, { fridge: 7, freezer: 120, pantry: 2 }],
  [/knoblauch|garlic/i, { pantry: 60, fridge: 30, freezer: 180 }],

  // ---- vegetables --------------------------------------------------------
  [/salat|rucola|feldsalat|kopfsalat|eisberg|romana|spinat|mangold|kresse|lettuce|rocket|arugula|spinach|chard|cress|mesclun/i, { fridge: 4, freezer: 180, pantry: 1 }],
  [/pilz|champignon|seitling|shiitake|pfifferling|enoki|steinpilz|mushroom/i, { fridge: 5, freezer: 120, pantry: 2 }],
  [/brokkoli|broccoli|blumenkohl|cauliflower|pak ?choi|bok ?choy|spargel|asparagus|suppengrün|suppengruen|grünkohl|kale|rosenkohl|brussels|okra|zuckerschoten|snap ?peas|mangetout|grüne bohnen|green beans|brechbohnen|fisolen|erbsen|\bpeas\b|edamame|artischocke|artichoke|fenchel|fennel|sprossen|sprouts|bohnensprossen/i, { fridge: 5, freezer: 180, pantry: 2 }],
  [/maiskolben|corn on the cob|zuckermais/i, { fridge: 3, freezer: 180, pantry: 1 }],
  [/gurke|zucchini|aubergine|cucumber|courgette|eggplant|kürbis|pumpkin|squash/i, { fridge: 7, freezer: 90, pantry: 5 }],
  [/hokkaido|butternut/i, { pantry: 60, fridge: 30, freezer: 180 }],
  [/essiggurke|gewürzgurke|cornichon|saure gurke|dill pickle|\bpickles\b/i, { pantry: 365, fridge: 60, freezer: 60 }],
  [/paprika|peperoni|chili|chilli|jalape(ñ|n)o|habanero|pepper(?!corn)/i, { fridge: 10, freezer: 180, pantry: 4 }],
  [/pfefferoni|peperoncini/i, { pantry: 365, fridge: 60, freezer: 60 }],
  [/tomate|tomato/i, { fridge: 7, pantry: 5, freezer: 90 }],
  [/tomatenmark|tomato paste|passata|passierte|tomaten stückig|gehackte tomaten|stückige tomaten/i, { pantry: 365, fridge: 7, freezer: 90 }],
  [/karotte|möhre|moehre|rübe|pastinake|petersilienwurzel|sellerie|kohlrabi|rote bete|rettich|daikon|lauch|porree|leek|carrot|celery|celeriac|beetroot|beet\b|turnip|steckrübe|topinambur/i, { fridge: 21, freezer: 240, pantry: 7 }],
  [/radieschen|radish/i, { fridge: 10, freezer: 60, pantry: 2 }],
  [/kohl|weißkohl|rotkohl|wirsing|spitzkohl|cabbage/i, { fridge: 30, freezer: 240, pantry: 7 }],
  [/chinakohl|napa/i, { fridge: 10, freezer: 120, pantry: 3 }],
  [/kartoffel|süßkartoffel|suesskartoffel|potato|yams?\b|taro|malanga/i, { pantry: 30, fridge: 30, freezer: 240 }],
  [/maniok|cassava|yuca|tapioka wurzel/i, { pantry: 5, fridge: 7, freezer: 180 }],

  // ---- fruit -------------------------------------------------------------
  [/beere|beeren|berry|berries/i, { fridge: 4, freezer: 180, pantry: 1 }],
  [/avocado/i, { pantry: 4, fridge: 7, freezer: 120 }],
  [/banane|banana/i, { pantry: 5, fridge: 7, freezer: 120 }],
  [/kochbanane|plantain/i, { pantry: 7, fridge: 7, freezer: 180 }],
  [/zitrone|limette|orange|mandarine|clementine|grapefruit|pomelo|yuzu|lemon|lime\b|limes\b/i, { pantry: 10, fridge: 21, freezer: 120 }],
  [/apfel|äpfel|aepfel|birne|quitte|apple|pear|quince/i, { pantry: 14, fridge: 30, freezer: 180 }],
  [/mango|papaya|litschi|lychee|maracuja|passionsfrucht|passion fruit|guave|guava|ananas|pineapple|melone|melon|kiwi|pfirsich|nektarine|aprikose|pflaume|zwetschge|kirsche|traube|kaki|feige|drachenfrucht|dragon fruit|rambutan|durian|jackfruit|peach|nectarine|apricot|plum|cherr|grape|persimmon|fig\b|figs\b/i, { pantry: 5, fridge: 7, freezer: 180 }],
  [/granatapfel|pomegranate/i, { pantry: 14, fridge: 30, freezer: 180 }],
  [/kokosnuss|\bcoconut\b/i, { pantry: 30, fridge: 30, freezer: 180 }],
  [/datteln|dates\b|trockenobst|rosinen|raisins|cranberries getrocknet|dried fruit/i, { pantry: 180, fridge: 365, freezer: 365 }],
  [/oliven|olives/i, { fridge: 30, pantry: 365, freezer: 90 }],
  [/kapern|capers/i, { fridge: 180, pantry: 365 }],

  // ---- bread, pasta, grains ----------------------------------------------
  [/brot|bread|baguette|ciabatta|sauerteig|pita|naan|chapati|roti|paratha|fladenbrot|lavash|focaccia|bagel/i, { pantry: 4, freezer: 90, fridge: 7 }],
  [/brötchen|broetchen|semmel|schrippe|croissant|brezel|laugen|\brolls?\b|buns?\b/i, { pantry: 2, freezer: 90, fridge: 4 }],
  [/toast|sandwich/i, { pantry: 7, freezer: 90, fridge: 10 }],
  [/tortilla|wrap|taco/i, { pantry: 14, freezer: 90, fridge: 30 }],
  [/injera/i, { pantry: 3, freezer: 60, fridge: 7 }],
  [/kuchen|torte|cake|muffin|brownie|mochi|daifuku/i, { fridge: 4, pantry: 3, freezer: 90 }],
  [/keks|kekse|biscuit|cookie|cracker|salzstangen|zwieback|chips|crisps|popcorn|reiswaffel|rice cake/i, { pantry: 180, fridge: 180 }],
  [/nudeln|pasta|spaghetti|penne|fusilli|linguine|tortiglioni|rigatoni|farfalle|lasagne|makkaroni|ramen|udon|soba|glasnudeln|reisnudeln|mie|vermicelli|noodles|rice noodles/i, DRY],
  [/frische pasta|frische nudeln|pasta fresca|fresh pasta|fresh noodles|udon frisch|frische udon|gnocchi|spätzle|spaetzle|maultasche|tortellini|ravioli|dumpling|gyoza|wan ?tan|wonton|pierogi|pelmeni/i, { fridge: 7, freezer: 90, pantry: 0 }],
  [/reis|rice|basmati|jasmin|risotto|arborio|bulgur|couscous|quinoa|polenta|grieß|griess|hirse|millet|buchweizen|amaranth|teff|masa harina|maismehl|cornmeal|mehl|flour|haferflocken|oats|müsli|muesli|granola|linsen|lentil|\bdal\b|kichererbsen|chickpea|bohnen|beans|kidney ?bean|semolina/i, DRY],
  [/teig|dough|pastry|filo|yufka/i, { fridge: 14, freezer: 90, pantry: 0 }],
  [/frische hefe|\bhefe\b|fresh yeast/i, { fridge: 14, freezer: 90, pantry: 1 }],
  [/backpulver|natron|baking (powder|soda)|stärke|starch|gelatine|agar|vanillezucker|puddingpulver/i, DRY],

  // ---- the cupboard ------------------------------------------------------
  [/honig|honey|\bsalz|\bsalt\b|zucker|sugar|essig|vinegar|balsamico|reisessig/i, KEEPS],
  [/öl\b|oel\b|\boil\b|olivenöl|sesamöl|kokosöl|rapsöl|sonnenblumenöl|erdnussöl/i, { pantry: 365, fridge: 365 }],
  [/senf|mustard|ketchup|mayo|mayonnaise|remoulade|sauce|soße|sosse|dressing|bbq|aioli/i, { fridge: 90, pantry: 180 }],
  [/sojasauce|sojasoße|soy ?sauce|tamari|fischsauce|fish ?sauce|austernsauce|oyster sauce|hoisin|sriracha|worcester|tabasco|hot sauce|mirin|reiswein|rice wine|shaoxing|\bsake\b|ponzu|teriyaki/i, { pantry: 730, fridge: 730 }],
  [/miso|gochujang|doenjang|sambal|harissa|currypaste|curry paste|tamarind|wasabi|chilipaste|chili paste|tahini|tahin|sesampaste|tom yum|laksa|berbere paste|adobo|chipotle/i, { fridge: 180, pantry: 180 }],
  [/brühe|bruehe|\bfond\b|bouillon|\bstock\b|broth|dashi/i, { pantry: 365, fridge: 4, freezer: 90 }],
  [/apfelmus|birnenmus|kompott|applesauce|compote|\bmus\b/i, { pantry: 365, fridge: 10, freezer: 90 }],
  [/pesto/i, { fridge: 7, freezer: 90, pantry: 180 }],
  [/kimchi|sauerkraut|\bkraut\b|achar|lacto/i, { fridge: 90, freezer: 90, pantry: 7 }],
  [/salsa|guacamole|tzatziki|dip\b|aufstrich frisch/i, { fridge: 5, freezer: 60, pantry: 0 }],
  [/marmelade|konfitüre|jam\b|gelee|chutney|fruchtaufstrich/i, { pantry: 365, fridge: 60 }],
  [/erdnussbutter|erdnussb|peanut butter|nutella|nussmus|mandelmus|cashewmus|aufstrich|spread/i, { pantry: 180, fridge: 180 }],
  [/ahornsirup|maple syrup|sirup|syrup|agave|dattelsirup|melasse|molasses/i, { pantry: 365, fridge: 365 }],
  [/nori|kombu|wakame|seetang|seaweed|algen|dashi/i, DRY],
  [/gewürz|spice|pfeffer|zimt|oregano|kreuzkümmel|cumin|garam masala|berbere|za.?atar|sumach|sumac|currypulver|curry powder|chiliflocken|muskat|nelke|kardamom|anis|lorbeer|vanille|safran|ras el hanout|five spice|fünf gewürz|gochugaru|shichimi|togarashi|aleppo|chilipulver|chili powder|paprika edelsüß|edelsüß/i, DRY],
  [/kaffee|coffee|\btee\b|\btea\b|matcha|kakao|cocoa/i, DRY],
  [/schokolade|chocolate|nüsse|nuesse|\bnuts?\b|mandeln|almond|cashew|walnu|erdnüsse|peanuts|haselnu|hazelnut|pistazie|pistachio|kerne|seeds|sesam|sesame|chia|leinsamen|flax/i, { pantry: 180, fridge: 365 }],
  [/saft|juice|wasser|water|bier|beer|wein|wine|sekt|prosecco/i, { pantry: 365, fridge: 7 }],
  [/(vanille|schoko|erdbeer|speise|stiel|wasser)eis|eiscreme|\beis\b|ice ?cream|gelato|sorbet|pommes|fries|fischstäbchen|tiefkühlpizza/i, FROZEN],
  [/pizza|fertiggericht|ready meal|lasagne fertig|quiche|sushi\b(?! ?reis)|onigiri|bento|sandwich fertig/i, { fridge: 3, freezer: 90, pantry: 0 }],
];

/** When nothing matches: the fridge means "fresh, use soon", the freezer "months", the cupboard "no idea". */
const fallback: Record<Place, number | null> = { fridge: 7, freezer: 90, pantry: null };

export interface ShelfLife {
  /** days it keeps there, or null for "keeps" (or, when not known, "can't say") */
  days: number | null;
  /** false when it's only the place's fallback */
  known: boolean;
}

const global = (re: RegExp) => new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
const ruleRes = rules.map(([re, keeps]) => [global(re), keeps] as const);

function matchKeeps(name: string): Keeps | undefined {
  const n = name.toLowerCase();
  for (const [re, keeps] of states) if (re.test(n)) return keeps;
  let best: Keeps | undefined;
  let end = -1;
  let len = -1;
  for (const [re, keeps] of ruleRes) {
    re.lastIndex = 0;
    for (const m of n.matchAll(re)) {
      const e = (m.index ?? 0) + m[0].length;
      if (e > end || (e === end && m[0].length > len)) {
        best = keeps;
        end = e;
        len = m[0].length;
      }
    }
  }
  return best;
}

export function shelfLife(name: string, place: Place): ShelfLife {
  const keeps = matchKeeps(name);
  if (!keeps) return { days: fallback[place], known: false };
  return { days: place in keeps ? keeps[place]! : fallback[place], known: true };
}

/** The best-before day for something put on `place` at `from`, or undefined if it keeps. */
export function autoBestBefore(name: string, place: Place, from: Date | string = new Date()): string | undefined {
  const { days } = shelfLife(name, place);
  if (days == null) return undefined;
  return dayKey(addDays(new Date(from), days));
}

/** "about 5 days", "about 3 months", "keeps", "not sure" — for the date picker. */
export function shelfLifeText(name: string, place: Place): string {
  const { days, known } = shelfLife(name, place);
  if (days == null) return known ? 'keeps' : 'not sure';
  if (days === 0) return 'use today';
  if (days < 14) return `about ${days} ${days === 1 ? 'day' : 'days'}`;
  if (days < 60) return `about ${Math.round(days / 7)} weeks`;
  if (days < 365) return `about ${Math.round(days / 30)} months`;
  return 'a year or more';
}
