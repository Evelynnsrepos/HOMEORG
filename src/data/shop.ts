/**
 * The furniture catalogue. Every item is a drawing recipe rather than an image
 * file, so the whole shop ships inside the bundle, weighs nothing, and stays in
 * the same flat, warm style as the rest of the app.
 */

export type Zone = 'wall' | 'floor' | 'corner' | 'small';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type Kind =
  | 'sofa'
  | 'armchair'
  | 'stool'
  | 'bed'
  | 'coffeeTable'
  | 'diningTable'
  | 'desk'
  | 'sideboard'
  | 'bookcase'
  | 'wardrobe'
  | 'rug'
  | 'plantTall'
  | 'plantSmall'
  | 'cactus'
  | 'floorLamp'
  | 'tableLamp'
  | 'pendant'
  | 'shelf'
  | 'artFrame'
  | 'mirror'
  | 'clock'
  | 'windowBox'
  | 'tv'
  | 'basket'
  | 'petBed'
  | 'beanbag'
  | 'fireplace'
  | 'piano'
  | 'aquarium'
  | 'toybox'
  | 'easel'
  | 'guitar'
  | 'candles'
  | 'vase'
  | 'garland'
  | 'tree'
  | 'pumpkin'
  | 'lantern';

export interface ShopItem {
  id: string;
  name: string;
  kind: Kind;
  zone: Zone;
  rarity: Rarity;
  palette: string[];
  price: number;
  seasonal?: boolean;
}

export const rarityPrice: Record<Rarity, number> = {
  common: 40,
  uncommon: 90,
  rare: 180,
  epic: 320,
  legendary: 600,
};

export const rarityLabel: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export const rarityColor: Record<Rarity, string> = {
  common: '#AFA697',
  uncommon: '#7FA88A',
  rare: '#7FA8C4',
  epic: '#A78BC4',
  legendary: '#E3AE45',
};

type Def = [id: string, name: string, kind: Kind, zone: Zone, rarity: Rarity, palette: string[]];

const defs: Def[] = [
  // ---- Seating -------------------------------------------------------
  ['sofa_oat', 'Oat Linen Sofa', 'sofa', 'floor', 'common', ['#E7DBC7', '#D0C0A6', '#8E7E65']],
  ['sofa_sage', 'Sage Velvet Sofa', 'sofa', 'floor', 'uncommon', ['#9FBCA4', '#7FA88A', '#5E876B']],
  ['sofa_clay', 'Clay Corduroy Sofa', 'sofa', 'floor', 'uncommon', ['#DCA98C', '#C48A66', '#8E6247']],
  ['sofa_mint', 'Mint Sofa', 'sofa', 'floor', 'rare', ['#B6D0C6', '#93B5A9', '#6B8C81']],
  ['sofa_navy', 'Deep Sea Sofa', 'sofa', 'floor', 'rare', ['#8095AE', '#5F7793', '#42566A']],
  ['sofa_plum', 'Plum Chesterfield', 'sofa', 'floor', 'epic', ['#AC90B6', '#8D6F9A', '#614B6B']],
  ['chair_reading', 'Reading Armchair', 'armchair', 'floor', 'common', ['#DFD1BB', '#C4B196', '#8C7C63']],
  ['chair_blush', 'Blush Armchair', 'armchair', 'floor', 'uncommon', ['#EBC4BE', '#D6A19A', '#9C7069']],
  ['chair_mustard', 'Mustard Armchair', 'armchair', 'floor', 'uncommon', ['#E9C577', '#D2A64C', '#97762E']],
  ['chair_rattan', 'Rattan Lounger', 'armchair', 'floor', 'rare', ['#E8D3AC', '#CCB081', '#987E51']],
  ['chair_wing', 'Emerald Wingback', 'armchair', 'floor', 'epic', ['#7FA88A', '#5C8468', '#3E5D49']],
  ['stool_pine', 'Pine Stool', 'stool', 'small', 'common', ['#E2CAA1', '#C0A174', '#8B7249']],
  ['stool_cork', 'Cork Stool', 'stool', 'small', 'common', ['#E5CCAA', '#CBAB80', '#90764B']],
  ['pouffe_knit', 'Chunky Knit Pouffe', 'beanbag', 'small', 'uncommon', ['#EDE0CB', '#D4C3A6', '#9D8C6F']],
  ['beanbag_coral', 'Coral Beanbag', 'beanbag', 'floor', 'uncommon', ['#F1AB91', '#DC7154', '#A55037']],
  ['beanbag_moss', 'Moss Beanbag', 'beanbag', 'floor', 'common', ['#AABE91', '#88A16D', '#5F764A']],

  // ---- Beds ----------------------------------------------------------
  ['bed_simple', 'Simple Bed', 'bed', 'floor', 'common', ['#E9DFCC', '#CDBFA4', '#8D7E64']],
  ['bed_blush', 'Blush Bed', 'bed', 'floor', 'uncommon', ['#F2DCD8', '#DCB8B2', '#9A7B76']],
  ['bed_canopy', 'Canopy Bed', 'bed', 'floor', 'epic', ['#EFE5D4', '#C9B99D', '#7E6C52']],
  ['bed_bunk', 'Bunk Bed', 'bed', 'floor', 'rare', ['#DECBB1', '#BB9E79', '#856C4C']],

  // ---- Tables --------------------------------------------------------
  ['table_coffee_oak', 'Oak Coffee Table', 'coffeeTable', 'floor', 'common', ['#DABC90', '#B69364', '#84673E']],
  ['table_coffee_marble', 'Marble Coffee Table', 'coffeeTable', 'floor', 'rare', ['#F1EEE8', '#D8D2C7', '#9E988C']],
  ['table_coffee_glass', 'Glass Coffee Table', 'coffeeTable', 'floor', 'uncommon', ['#DEEAED', '#BAD0D5', '#8CA5AA']],
  ['table_dining_oak', 'Oak Dining Table', 'diningTable', 'floor', 'uncommon', ['#DBBC90', '#B28855', '#80613A']],
  ['table_dining_white', 'Whitewash Table', 'diningTable', 'floor', 'common', ['#F0E9DB', '#D5C9B4', '#9E927C']],
  ['table_dining_walnut', 'Walnut Banquet Table', 'diningTable', 'floor', 'epic', ['#B2875C', '#8C6642', '#5E432C']],
  ['desk_writing', 'Writing Desk', 'desk', 'floor', 'common', ['#E1C69D', '#BD9C6E', '#876D49']],
  ['desk_standing', 'Standing Desk', 'desk', 'floor', 'rare', ['#DBD4C8', '#B4AC9E', '#7E786C']],
  ['desk_vanity', 'Vanity Table', 'desk', 'floor', 'rare', ['#F1E4D0', '#D2BE9E', '#B99060']],

  // ---- Storage -------------------------------------------------------
  ['sideboard_teak', 'Teak Sideboard', 'sideboard', 'floor', 'uncommon', ['#D1A778', '#AA8151', '#775935']],
  ['sideboard_sage', 'Sage Sideboard', 'sideboard', 'floor', 'rare', ['#A8C2AC', '#84A38A', '#5E7C64']],
  ['sideboard_mint', 'Mint Kitchen Unit', 'sideboard', 'floor', 'uncommon', ['#BCD3C9', '#98B7AB', '#6E8F83']],
  ['sideboard_bar', 'Drinks Cabinet', 'sideboard', 'floor', 'epic', ['#906C47', '#674E33', '#E5B047']],
  ['bookcase_tall', 'Tall Bookcase', 'bookcase', 'corner', 'common', ['#DBC097', '#B6966A', '#816A44']],
  ['bookcase_library', 'Library Wall', 'bookcase', 'corner', 'epic', ['#C4A277', '#987851', '#674E33']],
  ['bookcase_low', 'Low Bookshelf', 'bookcase', 'floor', 'common', ['#DEC49D', '#BB9C70', '#856C49']],
  ['wardrobe_oak', 'Oak Wardrobe', 'wardrobe', 'corner', 'common', ['#DFC49D', '#BB9C70', '#856C49']],
  ['wardrobe_mirror', 'Mirrored Wardrobe', 'wardrobe', 'corner', 'rare', ['#E1E9E8', '#B9C8C6', '#899591']],
  ['basket_seagrass', 'Seagrass Basket', 'basket', 'small', 'common', ['#E7D4AE', '#CAB082', '#968251']],
  ['basket_laundry', 'Laundry Hamper', 'basket', 'small', 'common', ['#E3E4DC', '#C2C4B8', '#8F9185']],
  ['basket_firewood', 'Firewood Basket', 'basket', 'small', 'uncommon', ['#DBC198', '#B5966C', '#8C6D47']],
  ['toybox_rainbow', 'Rainbow Toy Box', 'toybox', 'small', 'uncommon', ['#F2B28E', '#91B79C', '#E5B047']],
  ['toybox_pine', 'Pine Toy Chest', 'toybox', 'small', 'common', ['#E3C9A0', '#C0A071', '#8D734A']],
  ['stool_step', 'Step Stool', 'stool', 'small', 'common', ['#E5D4B4', '#C2AD88', '#8D7C5D']],

  // ---- Rugs ----------------------------------------------------------
  ['rug_jute', 'Jute Rug', 'rug', 'floor', 'common', ['#E2D1AA', '#C8B286', '#9C8960']],
  ['rug_berber', 'Berber Rug', 'rug', 'floor', 'uncommon', ['#F2ECDE', '#D5C9B0', '#908773']],
  ['rug_kilim', 'Kilim Runner', 'rug', 'floor', 'rare', ['#DEA280', '#BB7154', '#7C4C38']],
  ['rug_sage', 'Sage Wool Rug', 'rug', 'floor', 'uncommon', ['#C8DACA', '#A1BDA6', '#769271']],
  ['rug_blush', 'Blush Wool Rug', 'rug', 'floor', 'uncommon', ['#F0DAD6', '#DAB5AF', '#A08079']],
  ['rug_persian', 'Persian Heirloom', 'rug', 'floor', 'legendary', ['#CB8165', '#9C5943', '#603629']],
  ['rug_shag', 'Cloud Shag Rug', 'rug', 'floor', 'rare', ['#F4EFE5', '#DED5C6', '#AFA598']],
  ['rug_runner_hall', 'Hallway Runner', 'rug', 'floor', 'common', ['#DECDAA', '#C1AC84', '#907F5E']],
  ['toybox_playmat', 'Play Mat', 'rug', 'floor', 'uncommon', ['#F2DBB7', '#AAC8B2', '#E9AB8E']],

  // ---- Plants --------------------------------------------------------
  ['plant_fiddle', 'Fiddle Leaf Fig', 'plantTall', 'corner', 'uncommon', ['#81A470', '#5E8152', '#CA9C6E']],
  ['plant_monstera', 'Monstera', 'plantTall', 'corner', 'uncommon', ['#709C65', '#507849', '#D4A57B']],
  ['plant_palm', 'Parlour Palm', 'plantTall', 'corner', 'common', ['#8BAE74', '#688B51', '#D1AB80']],
  ['plant_olive', 'Olive Tree', 'plantTall', 'corner', 'rare', ['#98AE87', '#748D64', '#CBA980']],
  ['plant_bird', 'Bird of Paradise', 'plantTall', 'corner', 'epic', ['#6F9D62', '#4D7644', '#D7AA7C']],
  ['plant_pothos', 'Trailing Pothos', 'plantSmall', 'small', 'common', ['#80A66D', '#5F8452', '#D8B68B']],
  ['plant_fern', 'Boston Fern', 'plantSmall', 'small', 'common', ['#8AB278', '#678C57', '#CFA77E']],
  ['plant_orchid', 'White Orchid', 'plantSmall', 'small', 'rare', ['#F2E9E1', '#CBBDB0', '#81A470']],
  ['plant_herbs', 'Kitchen Herbs', 'plantSmall', 'small', 'uncommon', ['#8BB274', '#678C57', '#D8B68B']],
  ['plant_hanging', 'Hanging Ivy', 'plantSmall', 'wall', 'uncommon', ['#80A66D', '#5F8452', '#CBB99C']],
  ['cactus_barrel', 'Barrel Cactus', 'cactus', 'small', 'common', ['#91B17C', '#6E8E5B', '#D39E76']],
  ['cactus_tall', 'Saguaro Cactus', 'cactus', 'corner', 'uncommon', ['#85AA72', '#618452', '#D09E74']],
  ['vase_stem', 'Single Stem Vase', 'vase', 'small', 'common', ['#EDDEC8', '#CBB99C', '#9FB180']],
  ['vase_pampas', 'Pampas in a Jug', 'vase', 'small', 'uncommon', ['#EFE2CA', '#D5C099', '#BBA377']],
  ['vase_tulips', 'Spring Tulips', 'vase', 'small', 'rare', ['#F2DEE2', '#E29CAA', '#91B17C']],

  // ---- Light ---------------------------------------------------------
  ['lamp_arc', 'Arc Floor Lamp', 'floorLamp', 'corner', 'uncommon', ['#EBDBB0', '#C9B585', '#706757']],
  ['lamp_tripod', 'Tripod Lamp', 'floorLamp', 'corner', 'common', ['#F0E4C6', '#CFBF97', '#7E7362']],
  ['lamp_paper', 'Paper Moon Lamp', 'floorLamp', 'corner', 'rare', ['#F7F1DF', '#E2D6BA', '#8E8573']],
  ['lamp_table_brass', 'Brass Table Lamp', 'tableLamp', 'small', 'uncommon', ['#F3E1B2', '#D7BB7A', '#8E7642']],
  ['lamp_table_ceramic', 'Ceramic Table Lamp', 'tableLamp', 'small', 'common', ['#F2E8D8', '#D3C4AC', '#908272']],
  ['lamp_salt', 'Salt Lamp', 'tableLamp', 'small', 'uncommon', ['#F2C9A6', '#DA9C6E', '#7E6C52']],
  ['pendant_rattan', 'Rattan Pendant', 'pendant', 'wall', 'uncommon', ['#EAD4A8', '#CBAE7B', '#90774B']],
  ['pendant_globe', 'Glass Globe Pendant', 'pendant', 'wall', 'rare', ['#F5F0E3', '#DED4C1', '#918A79']],
  ['candles_cluster', 'Candle Cluster', 'candles', 'small', 'common', ['#F5E9D4', '#DECBA8', '#EAAA5E']],
  ['candles_taper', 'Taper Candles', 'candles', 'small', 'common', ['#F5E9D4', '#D8C6A4', '#EAAA5E']],
  ['lantern_hall', 'Hallway Lantern', 'lantern', 'small', 'uncommon', ['#E9DEC6', '#7E7362', '#F2C579']],

  // ---- Walls ---------------------------------------------------------
  ['shelf_floating', 'Floating Shelf', 'shelf', 'wall', 'common', ['#DFC49D', '#BB9C70', '#856C49']],
  ['shelf_ladder', 'Ladder Shelf', 'shelf', 'wall', 'uncommon', ['#DABE94', '#B49268', '#806444']],
  ['shelf_plants', 'Plant Shelf', 'shelf', 'wall', 'rare', ['#DBC8A6', '#81A470', '#5E8152']],
  ['shelf_spice', 'Spice Rack', 'shelf', 'wall', 'common', ['#DEC49D', '#B6976D', '#CB8C6E']],
  ['art_abstract', 'Abstract Print', 'artFrame', 'wall', 'common', ['#F1E8D8', '#DBAB8E', '#7FA88A']],
  ['art_botanical', 'Botanical Print', 'artFrame', 'wall', 'common', ['#F3ECDC', '#91B17C', '#B59C74']],
  ['art_coast', 'Coastal Study', 'artFrame', 'wall', 'uncommon', ['#E9F1F3', '#9DBEC8', '#7E9098']],
  ['art_triptych', 'Gallery Triptych', 'artFrame', 'wall', 'epic', ['#F2EADA', '#CB8C6E', '#7FA88A']],
  ['art_kids', 'Fridge Masterpiece', 'artFrame', 'wall', 'common', ['#FCF5E4', '#F1B460', '#E4876C']],
  ['art_map', 'Old World Map', 'artFrame', 'wall', 'uncommon', ['#F1E5CB', '#C6AA7E', '#807562']],
  ['art_photo_wall', 'Photo Wall', 'artFrame', 'wall', 'rare', ['#F5EEDF', '#CBB99C', '#908272']],
  ['mirror_round', 'Round Mirror', 'mirror', 'wall', 'common', ['#E6EFF0', '#BCD1D5', '#909D9E']],
  ['mirror_arch', 'Arched Mirror', 'mirror', 'wall', 'rare', ['#E8F0F1', '#C3D6D9', '#9E8D64']],
  ['mirror_sunburst', 'Sunburst Mirror', 'mirror', 'wall', 'epic', ['#F5E8C8', '#DBBB71', '#907642']],
  ['mirror_leaning', 'Leaning Mirror', 'mirror', 'corner', 'rare', ['#E8F0F1', '#C3D6D9', '#BB9C70']],
  ['clock_school', 'Schoolhouse Clock', 'clock', 'wall', 'common', ['#F5EEDF', '#3D3832', '#BB9C70']],
  ['clock_brass', 'Brass Wall Clock', 'clock', 'wall', 'uncommon', ['#F2E3BE', '#8E7642', '#3D3832']],
  ['clock_cuckoo', 'Cuckoo Clock', 'clock', 'wall', 'epic', ['#BB9161', '#805E3A', '#C66961']],
  ['window_box', 'Window Box', 'windowBox', 'wall', 'uncommon', ['#DEEAED', '#BAD0D5', '#91B17C']],
  ['window_stained', 'Stained Glass', 'windowBox', 'wall', 'legendary', ['#E9CBAA', '#C66961', '#7FA8C4']],
  ['garland_leaf', 'Leaf Garland', 'garland', 'wall', 'common', ['#91B17C', '#6E8E5B', '#DBC8A6']],
  ['garland_lights', 'Fairy Lights', 'garland', 'wall', 'uncommon', ['#F2DEAA', '#E5B047', '#9C917A']],

  // ---- Statement -----------------------------------------------------
  ['tv_slim', 'Slim TV', 'tv', 'wall', 'uncommon', ['#3D3832', '#24221E', '#90897A']],
  ['tv_projector', 'Projector Screen', 'tv', 'wall', 'rare', ['#F4EFE3', '#D8D0BE', '#7E7767']],
  ['fireplace_stove', 'Wood Burner', 'fireplace', 'floor', 'epic', ['#403A35', '#27231F', '#EAAA5E']],
  ['fireplace_marble', 'Marble Fireplace', 'fireplace', 'floor', 'legendary', ['#F2EFE8', '#D5CEC0', '#EAAA5E']],
  ['piano_upright', 'Upright Piano', 'piano', 'floor', 'legendary', ['#4C3D35', '#2E251F', '#F3EBDC']],
  ['aquarium_tank', 'Fish Tank', 'aquarium', 'floor', 'epic', ['#CDE5E9', '#91BDC6', '#E59C6E']],
  ['aquarium_terrarium', 'Glass Terrarium', 'aquarium', 'small', 'rare', ['#DEEBE6', '#AAC8B2', '#8D7C5D']],
  ['easel_art', 'Painting Easel', 'easel', 'corner', 'uncommon', ['#E0C79F', '#B99C70', '#F1E8D8']],
  ['easel_chalk', 'Chalkboard Easel', 'easel', 'corner', 'common', ['#DBC198', '#403A35', '#F5EEDF']],
  ['guitar_stand', 'Guitar on a Stand', 'guitar', 'corner', 'uncommon', ['#D9AB71', '#AA7E4A', '#3D3832']],

  // ---- Pets ----------------------------------------------------------
  ['pet_cat_bed', 'Cat Basket', 'petBed', 'small', 'common', ['#E9D8B6', '#CBB287', '#CB8C6E']],
  ['pet_dog_bed', 'Dog Bed', 'petBed', 'small', 'common', ['#DECAB0', '#BDA585', '#91A280']],
  ['pet_cat_tree', 'Cat Tower', 'petBed', 'corner', 'rare', ['#E4D5BA', '#C1AC8A', '#8D7D5E']],
  ['petbed_hutch', 'Rabbit Hutch', 'petBed', 'floor', 'epic', ['#DEC49D', '#AA8C64', '#91A280']],

  // ---- Seasonal ------------------------------------------------------
  ['tree_fir', 'Winter Fir', 'tree', 'corner', 'rare', ['#709368', '#4E6D4A', '#C38951']],
  ['tree_lit', 'Twinkling Fir', 'tree', 'corner', 'legendary', ['#709368', '#456341', '#F2C579']],
  ['pumpkin_pair', 'Pumpkin Pair', 'pumpkin', 'small', 'uncommon', ['#EBA660', '#CB7D3E', '#809362']],
  ['garland_holly', 'Holly Garland', 'garland', 'wall', 'rare', ['#608654', '#415F3A', '#C66961']],
  ['candles_advent', 'Advent Candles', 'candles', 'small', 'rare', ['#F1DEC8', '#C66961', '#EAAA5E']],
];

const SEASONAL = new Set([
  'tree_fir',
  'tree_lit',
  'pumpkin_pair',
  'garland_holly',
  'candles_advent',
  'garland_lights',
]);

export const shopItems: ShopItem[] = defs.map(([id, name, kind, zone, rarity, palette]) => ({
  id,
  name,
  kind,
  zone,
  rarity,
  palette,
  price: rarityPrice[rarity],
  seasonal: SEASONAL.has(id),
}));

export const wallpapers = [
  { id: 'wall_plaster', name: 'Warm Plaster', base: '#F3E9D9', accent: '#E6D8C1', pattern: 'plain' },
  { id: 'wall_sage', name: 'Sage Stripe', base: '#E3ECE1', accent: '#CADDCB', pattern: 'stripe' },
  { id: 'wall_clay', name: 'Clay Wash', base: '#F2DFD1', accent: '#E3C7B3', pattern: 'wash' },
  { id: 'wall_botanic', name: 'Botanical', base: '#EFEBDC', accent: '#A7C096', pattern: 'leaf' },
  { id: 'wall_blush', name: 'Blush Dots', base: '#F8E8E5', accent: '#E7C4BD', pattern: 'dots' },
  { id: 'wall_night', name: 'Midnight', base: '#404857', accent: '#343C49', pattern: 'stars' },
] as const;

export const floorings = [
  { id: 'floor_oak', name: 'Oak Boards', base: '#DEC096', accent: '#C7A576', pattern: 'plank' },
  { id: 'floor_ash', name: 'Pale Ash', base: '#EBDDC7', accent: '#D8C7A9', pattern: 'plank' },
  { id: 'floor_herring', name: 'Herringbone', base: '#D7B58B', accent: '#BC9366', pattern: 'herring' },
  { id: 'floor_tile', name: 'Chequer Tile', base: '#F0EBDF', accent: '#CEC4B1', pattern: 'check' },
  { id: 'floor_sisal', name: 'Sisal Mat', base: '#E2D3B0', accent: '#CDBB93', pattern: 'weave' },
  { id: 'floor_slate', name: 'Slate', base: '#C7C5BE', accent: '#ACAAA2', pattern: 'stone' },
] as const;

export function itemById(id: string | null | undefined): ShopItem | undefined {
  if (!id) return undefined;
  return shopItems.find((i) => i.id === id);
}

export const shopCategories: { id: string; name: string; kinds: Kind[] }[] = [
  { id: 'seating', name: 'Seating', kinds: ['sofa', 'armchair', 'stool', 'beanbag', 'bed'] },
  { id: 'tables', name: 'Tables', kinds: ['coffeeTable', 'diningTable', 'desk'] },
  {
    id: 'storage',
    name: 'Storage',
    kinds: ['sideboard', 'bookcase', 'wardrobe', 'basket', 'toybox'],
  },
  { id: 'rugs', name: 'Rugs', kinds: ['rug'] },
  { id: 'plants', name: 'Plants', kinds: ['plantTall', 'plantSmall', 'cactus', 'vase'] },
  { id: 'light', name: 'Light', kinds: ['floorLamp', 'tableLamp', 'pendant', 'candles', 'lantern'] },
  {
    id: 'walls',
    name: 'Walls',
    kinds: ['shelf', 'artFrame', 'mirror', 'clock', 'windowBox', 'garland'],
  },
  {
    id: 'statement',
    name: 'Statement',
    kinds: ['tv', 'fireplace', 'piano', 'aquarium', 'easel', 'guitar', 'petBed', 'tree', 'pumpkin'],
  },
];
