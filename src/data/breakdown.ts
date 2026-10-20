/**
 * Task breakdown, on device. The real app calls a model for this; with no
 * server there is nothing to call, so the steps come from a rule library —
 * the same thing Tidywell falls back to when you are offline.
 */

export type Grain = 'simple' | 'medium' | 'micro';

interface Recipe {
  match: RegExp;
  steps: string[];
}

const recipes: Recipe[] = [
  {
    match: /dish|dishwasher|washing.?up/i,
    steps: [
      'Clear the sink of anything soaking',
      'Stack plates on one side',
      'Empty the clean load out',
      'Load the dirty plates',
      'Load the glasses and mugs',
      'Load the cutlery',
      'Hand-wash the pans',
      'Start the machine',
      'Wipe the sink and taps dry',
    ],
  },
  {
    match: /oven|hob|extractor|grill/i,
    steps: [
      'Take the shelves out',
      'Put the shelves in to soak',
      'Spray the inside and leave it',
      'Wipe the door glass',
      'Scrub the base',
      'Wipe the sides and roof',
      'Rinse and dry the shelves',
      'Slide the shelves back in',
      'Wipe the outside and handle',
    ],
  },
  {
    match: /fridge|freezer|pantry|cupboard/i,
    steps: [
      'Get a bag for the bin',
      'Take one shelf out at a time',
      'Bin anything out of date',
      'Wipe the empty shelf',
      'Wipe the door seals',
      'Put things back in groups',
      'Write down what needs replacing',
      'Add those to the shopping list',
    ],
  },
  {
    match: /bed linen|bedding|sheets|change the bed/i,
    steps: [
      'Strip the old bedding off',
      'Put it straight in the machine',
      'Start the wash',
      'Fit the bottom sheet',
      'Put the duvet cover on',
      'Change the pillowcases',
      'Straighten it all out',
    ],
  },
  {
    match: /make the bed/i,
    steps: [
      'Pull the duvet up to the top',
      'Shake it out flat',
      'Straighten the bottom sheet',
      'Plump the pillows',
      'Fold the throw over the end',
    ],
  },
  {
    match: /vacuum|hoover|sweep/i,
    steps: [
      'Pick up anything on the floor',
      'Lift the chairs or move the rug',
      'Get the vacuum out',
      'Do the edges first',
      'Do the middle of the room',
      'Get under the furniture you can reach',
      'Empty the canister',
      'Put the vacuum away',
    ],
  },
  {
    match: /mop|floor/i,
    steps: [
      'Sweep or vacuum first',
      'Fill the bucket with hot water',
      'Start at the far corner',
      'Work backwards to the door',
      'Rinse the mop halfway through',
      'Empty and rinse the bucket',
      'Leave the door open to dry',
    ],
  },
  {
    match: /dust|surface|shelf|shelves/i,
    steps: [
      'Grab a cloth, damp it slightly',
      'Move the things off one surface',
      'Wipe the surface',
      'Wipe the things before they go back',
      'Put them back',
      'Move on to the next surface',
    ],
  },
  {
    match: /toilet|loo|wc/i,
    steps: [
      'Squirt cleaner under the rim',
      'Leave it while you do the rest',
      'Wipe the cistern and lid',
      'Wipe the seat, both sides',
      'Wipe the base and behind',
      'Brush the bowl',
      'Flush and rinse the brush',
    ],
  },
  {
    match: /shower|bath|tiles|screen/i,
    steps: [
      'Move the bottles out',
      'Rinse the walls with hot water',
      'Spray the cleaner on',
      'Give it five minutes',
      'Scrub the corners and grout',
      'Squeegee or wipe the screen',
      'Rinse everything down',
      'Put the bottles back, wiped',
    ],
  },
  {
    match: /sink|tap|basin/i,
    steps: [
      'Clear whatever is in it',
      'Rinse it out',
      'Scrub the bowl',
      'Do the taps and around the base',
      'Rinse and dry with a cloth',
    ],
  },
  {
    match: /mirror|window|glass/i,
    steps: [
      'Wipe off the dust first',
      'Spray the top half',
      'Wipe in one direction',
      'Do the bottom half',
      'Buff the streaks with a dry cloth',
      'Do the frame and sill',
    ],
  },
  {
    match: /laundry|wash|iron/i,
    steps: [
      'Gather it from every room',
      'Sort into lights and darks',
      'Check the pockets',
      'Load the machine',
      'Add detergent and start it',
      'Set a reminder for the end',
      'Hang it up or get it in the dryer',
    ],
  },
  {
    match: /clothes|wardrobe|drawer/i,
    steps: [
      'Pick up everything off the floor',
      'Sort into clean and dirty',
      'Dirty straight to the basket',
      'Hang up what hangs',
      'Fold what folds',
      'Put one drawer right',
    ],
  },
  {
    match: /toy|kids|play/i,
    steps: [
      'Pick one box or bin',
      'Fill it with what belongs in it',
      'Do the same for the next one',
      'Books back on the shelf',
      'Anything broken into the bin',
      'Last sweep of the floor',
    ],
  },
  {
    match: /bin|rubbish|recycl|trash/i,
    steps: [
      'Tie the bag off',
      'Take it outside',
      'Wipe the inside of the bin',
      'Put a fresh bag in',
      'Do the recycling too',
    ],
  },
  {
    match: /desk|paper|post|file/i,
    steps: [
      'Take everything off the desk',
      'Wipe the empty surface',
      'Bin the obvious rubbish',
      'Make one pile for filing',
      'Make one pile for action',
      'Put back only what lives there',
      'Deal with the action pile',
    ],
  },
  {
    match: /plant|water|garden|balcon/i,
    steps: [
      'Fill the watering can',
      'Check which ones are actually dry',
      'Water those',
      'Pull off the dead leaves',
      'Turn them towards the light',
      'Empty the drip trays',
    ],
  },
  {
    match: /counter|worktop|table|tidy|clear/i,
    steps: [
      'Take everything off',
      'Bin the rubbish as you go',
      'Wipe the whole surface',
      'Put back only what belongs',
      'Find homes for the rest',
      'Give it a final wipe',
    ],
  },
];

const generic = [
  'Set a timer for five minutes',
  'Clear the space around it',
  'Get the things you need in one trip',
  'Start at the left, work right',
  'Do the worst bit first',
  'Do the second half',
  'Put your things away',
  'Stand back and look at it',
];

const grainCount: Record<Grain, number> = { simple: 3, medium: 5, micro: 9 };

/** Split a task into steps. Deterministic — the same task gives the same list. */
export function breakDown(taskName: string, grain: Grain): string[] {
  const recipe = recipes.find((r) => r.match.test(taskName));
  const pool = recipe ? recipe.steps : generic;
  const want = grainCount[grain];

  if (pool.length <= want) return pool.slice();

  // Spread the picks evenly so "simple" keeps the beginning, middle and end.
  const out: string[] = [];
  for (let i = 0; i < want; i++) {
    const idx = Math.round((i * (pool.length - 1)) / (want - 1));
    const step = pool[idx];
    if (!out.includes(step)) out.push(step);
  }
  let cursor = 0;
  while (out.length < want && cursor < pool.length) {
    if (!out.includes(pool[cursor])) out.push(pool[cursor]);
    cursor++;
  }
  return out;
}

export const grainLabel: Record<Grain, string> = {
  simple: 'Simple',
  medium: 'Medium',
  micro: 'Micro',
};
