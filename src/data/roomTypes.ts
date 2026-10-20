import type { Effort } from '../lib/types';
import type { Unit } from '../lib/date';

export interface ChoreTemplate {
  name: string;
  minutes: number;
  effort: Effort;
  every: number;
  unit: Unit;
  /** pre-ticked when the room is added */
  on?: boolean;
}

export interface RoomType {
  id: string;
  name: string;
  emoji: string;
  chores: ChoreTemplate[];
}

const c = (
  name: string,
  minutes: number,
  effort: Effort,
  every: number,
  unit: Unit,
  on = true,
): ChoreTemplate => ({ name, minutes, effort, every, unit, on });

export const roomTypes: RoomType[] = [
  {
    id: 'kitchen',
    name: 'Kitchen',
    emoji: '\u{1F373}',
    chores: [
      c('Do dishes / empty dishwasher', 15, 'medium', 1, 'day'),
      c('Wipe counters', 5, 'light', 1, 'day'),
      c('Wipe the hob', 5, 'light', 1, 'day'),
      c('Take out the rubbish', 3, 'light', 2, 'day'),
      c('Sweep the floor', 8, 'light', 2, 'day'),
      c('Mop the floor', 12, 'medium', 1, 'week'),
      c('Scrub the sink', 6, 'light', 1, 'week'),
      c('Wipe cupboard fronts', 12, 'medium', 2, 'week', false),
      c('Clean the microwave', 8, 'medium', 2, 'week', false),
      c('Clear out the fridge', 20, 'deep', 1, 'month'),
      c('Descale the kettle', 10, 'medium', 1, 'month', false),
      c('Deep clean the oven', 45, 'deep', 3, 'month'),
      c('Clean the extractor filter', 20, 'deep', 3, 'month', false),
    ],
  },
  {
    id: 'living',
    name: 'Living Room',
    emoji: '\u{1F6CB}\u{FE0F}',
    chores: [
      c('Fluff & straighten cushions', 3, 'light', 1, 'day'),
      c('Tidy surfaces', 6, 'light', 1, 'day'),
      c('Dust surfaces', 8, 'light', 1, 'week'),
      c('Vacuum the floor', 10, 'medium', 1, 'week'),
      c('Wipe the TV & screens', 5, 'light', 1, 'week', false),
      c('Water the plants', 5, 'light', 1, 'week'),
      c('Vacuum under the sofa', 15, 'medium', 1, 'month'),
      c('Clean the windows', 20, 'medium', 1, 'month', false),
      c('Wash throws & covers', 25, 'deep', 3, 'month', false),
    ],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    emoji: '\u{1F6C1}',
    chores: [
      c('Wipe the sink', 3, 'light', 1, 'day'),
      c('Wipe the mirror', 2, 'light', 3, 'day'),
      c('Clean the toilet', 8, 'medium', 3, 'day'),
      c('Empty the bin', 3, 'light', 4, 'day'),
      c('Refill toiletries', 10, 'medium', 1, 'week'),
      c('Fresh towels', 5, 'light', 1, 'week'),
      c('Clean the shower', 15, 'medium', 1, 'week'),
      c('Mop the floor', 10, 'medium', 1, 'week'),
      c('Wash the bath mat', 10, 'medium', 2, 'week', false),
      c('Descale the shower head', 20, 'deep', 1, 'month', false),
      c('Deep clean the bath', 30, 'deep', 1, 'month'),
    ],
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    emoji: '\u{1F6CF}\u{FE0F}',
    chores: [
      c('Make the bed', 3, 'light', 1, 'day'),
      c('Put clothes away', 8, 'light', 2, 'day'),
      c('Dust surfaces', 8, 'light', 1, 'week'),
      c('Vacuum the floor', 10, 'medium', 1, 'week'),
      c('Change the bed linen', 15, 'medium', 2, 'week'),
      c('Clean under the bed', 15, 'medium', 1, 'month'),
      c('Sort the wardrobe', 30, 'deep', 3, 'month', false),
      c('Flip the mattress', 15, 'deep', 6, 'month', false),
    ],
  },
  {
    id: 'kids',
    name: 'Kids Room',
    emoji: '\u{1F9F8}',
    chores: [
      c('Toys back in boxes', 8, 'light', 1, 'day'),
      c('Make the bed', 3, 'light', 1, 'day'),
      c('Wipe sticky spots', 5, 'light', 1, 'week'),
      c('Dust surfaces', 6, 'light', 1, 'week'),
      c('Vacuum the floor', 10, 'medium', 1, 'week'),
      c('Change the bed linen', 12, 'medium', 2, 'week'),
      c('Sort outgrown clothes', 30, 'deep', 3, 'month', false),
    ],
  },
  {
    id: 'dining',
    name: 'Dining Room',
    emoji: '\u{1F37D}\u{FE0F}',
    chores: [
      c('Wipe the dining table', 3, 'light', 1, 'day'),
      c('Tidy up / clear the table', 3, 'light', 1, 'day'),
      c('Dust surfaces', 8, 'light', 1, 'week'),
      c('Sweep under the table', 8, 'light', 1, 'week'),
      c('Polish the table', 15, 'medium', 1, 'month', false),
      c('Wash the table linen', 20, 'medium', 1, 'month', false),
    ],
  },
  {
    id: 'office',
    name: 'Office',
    emoji: '\u{1F4BB}',
    chores: [
      c('Clear the desk', 5, 'light', 1, 'day'),
      c('Wipe the desk surface', 5, 'light', 2, 'day'),
      c('Empty the paper bin', 3, 'light', 1, 'week'),
      c('Dust screen & keyboard', 8, 'light', 1, 'week'),
      c('Vacuum the floor', 10, 'medium', 1, 'week'),
      c('File loose paperwork', 20, 'medium', 2, 'week', false),
      c('Cable tidy', 15, 'medium', 3, 'month', false),
    ],
  },
  {
    id: 'hallway',
    name: 'Hallway',
    emoji: '\u{1F6AA}',
    chores: [
      c('Shoes back on the rack', 3, 'light', 1, 'day'),
      c('Sort the post', 4, 'light', 2, 'day'),
      c('Sweep the floor', 8, 'light', 1, 'week'),
      c('Shake out the doormat', 5, 'light', 2, 'week'),
      c('Mop the floor', 10, 'medium', 2, 'week'),
      c('Wipe handles & switches', 8, 'medium', 1, 'month'),
      c('Wipe the front door', 6, 'light', 1, 'month', false),
    ],
  },
  {
    id: 'laundry',
    name: 'Laundry Room',
    emoji: '\u{1F9FA}',
    chores: [
      c('Run a wash', 10, 'light', 2, 'day'),
      c('Hang / put away laundry', 15, 'medium', 2, 'day'),
      c('Clean the lint filter', 3, 'light', 1, 'week'),
      c('Wipe the machines', 6, 'light', 2, 'week'),
      c('Tackle the ironing pile', 25, 'deep', 2, 'week', false),
      c('Run a machine cleaning cycle', 10, 'medium', 1, 'month', false),
    ],
  },
  {
    id: 'guest',
    name: 'Guest Room',
    emoji: '\u{1FA9F}',
    chores: [
      c('Air the room', 5, 'light', 1, 'week'),
      c('Dust surfaces', 8, 'light', 2, 'week'),
      c('Vacuum the floor', 10, 'medium', 2, 'week'),
      c('Fresh linen', 15, 'medium', 1, 'month'),
      c('Check towels & amenities', 8, 'light', 1, 'month', false),
    ],
  },
  {
    id: 'garage',
    name: 'Garage',
    emoji: '\u{1F6B2}',
    chores: [
      c('Tidy tools away', 15, 'medium', 2, 'week'),
      c('Sort the recycling', 10, 'medium', 2, 'week'),
      c('Sweep the floor', 12, 'medium', 1, 'month'),
      c('Declutter one shelf', 30, 'deep', 3, 'month', false),
      c('Check the bike tyres', 10, 'medium', 3, 'month', false),
    ],
  },
  {
    id: 'balcony',
    name: 'Balcony',
    emoji: '\u{1FAB4}',
    chores: [
      c('Water the plants', 6, 'light', 2, 'day'),
      c('Sweep the balcony', 8, 'light', 1, 'week'),
      c('Deadhead & prune', 15, 'medium', 2, 'week', false),
      c('Wipe outdoor furniture', 12, 'medium', 1, 'month'),
      c('Clean the railing', 15, 'medium', 3, 'month', false),
    ],
  },
  {
    id: 'storage',
    name: 'Storage',
    emoji: '\u{1F4E6}',
    chores: [
      c('Check for damp', 8, 'light', 1, 'month'),
      c('Sort one box', 20, 'medium', 1, 'month', false),
      c('Sweep the floor', 15, 'medium', 3, 'month'),
      c('Declutter a shelf', 30, 'deep', 6, 'month', false),
    ],
  },
  {
    id: 'wc',
    name: 'WC',
    emoji: '\u{1F6BD}',
    chores: [
      c('Wipe the sink', 3, 'light', 2, 'day'),
      c('Clean the toilet', 6, 'medium', 3, 'day'),
      c('Restock the paper', 3, 'light', 1, 'week'),
      c('Mop the floor', 8, 'medium', 1, 'week'),
    ],
  },
  { id: 'custom', name: 'Custom room', emoji: '\u{2728}', chores: [] },
];

export const homeTypes = [
  { id: 'flat', name: 'Flat', emoji: '\u{1F3E2}', floors: ['Home'] },
  { id: 'house', name: 'House', emoji: '\u{1F3E1}', floors: ['Ground floor', 'Upstairs'] },
  { id: 'shared', name: 'Shared flat', emoji: '\u{1F91D}', floors: ['Home'] },
  { id: 'studio', name: 'Studio', emoji: '\u{1FA9F}', floors: ['Home'] },
  {
    id: 'townhouse',
    name: 'Townhouse',
    emoji: '\u{1F3D8}\u{FE0F}',
    floors: ['Ground floor', 'First floor', 'Loft'],
  },
];

export function roomTypeById(id: string): RoomType {
  return roomTypes.find((r) => r.id === id) ?? roomTypes[roomTypes.length - 1];
}

export const startingConditions = [
  { id: 'spotless', name: 'Just cleaned', hint: 'Everything starts at 100%', progress: 1 },
  { id: 'normal', name: 'Lived in', hint: 'A normal week of dust', progress: 0.5 },
  { id: 'grubby', name: 'Needs a reset', hint: 'Everything is due now', progress: 0 },
];
