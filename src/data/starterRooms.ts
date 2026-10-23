/**
 * The drawn pieces a room used to start with. New rooms start with pixel
 * stickers now (`starterStickers`); these still fill the Originals shelf and
 * old rooms that predate stickers.
 *
 * Keys are slot indices from SLOTS in RoomCanvas: 0-2 wall, 3-5 floor,
 * 6-7 corner, 8-9 small.
 */
export type Starter = Record<number, string>;

const starters: Record<string, Starter> = {
  kitchen: { 1: 'shelf_spice', 5: 'stool_pine', 8: 'plant_herbs' },
  living: {
    3: 'sofa_sage',
    4: 'rug_sage',
    1: 'art_botanical',
    6: 'plant_fiddle',
    9: 'lamp_table_ceramic',
  },
  bathroom: { 1: 'shelf_floating', 4: 'rug_shag', 8: 'plant_fern' },
  bedroom: { 4: 'rug_blush', 1: 'art_abstract', 7: 'lamp_arc', 9: 'plant_pothos' },
  kids: { 4: 'toybox_playmat', 5: 'toybox_rainbow', 1: 'art_kids', 8: 'pet_dog_bed' },
  dining: { 4: 'table_dining_oak', 1: 'art_map', 6: 'plant_palm', 9: 'candles_taper' },
  office: { 3: 'desk_writing', 5: 'chair_reading', 1: 'shelf_floating', 6: 'plant_monstera' },
  hallway: { 4: 'rug_runner_hall', 1: 'mirror_round', 6: 'lamp_tripod', 8: 'basket_seagrass' },
  laundry: { 1: 'shelf_floating', 5: 'stool_step', 8: 'basket_laundry' },
  guest: { 4: 'rug_berber', 1: 'art_coast', 6: 'plant_olive' },
  garage: { 6: 'bookcase_tall', 5: 'stool_step', 8: 'basket_firewood' },
  storage: { 6: 'bookcase_tall', 5: 'stool_step', 8: 'basket_seagrass' },
  balcony: { 6: 'plant_olive', 5: 'chair_rattan', 8: 'cactus_barrel', 9: 'plant_fern' },
  wc: { 1: 'shelf_floating', 8: 'plant_fern' },
  custom: { 1: 'art_abstract', 4: 'rug_jute', 8: 'plant_fern' },
};

export function starterFor(typeId: string): Starter {
  return starters[typeId] ?? starters.custom;
}
