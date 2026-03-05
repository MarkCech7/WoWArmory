import type { Generated } from "kysely";

export interface CharactersDatabase {
  character_arena_stats: {
    guid: number;
    slot: number;
    personalRating: number;
    weekGames: number;
    weekWins: number;
    seasonGames: number;
    seasonWon: number;
    seasonBestRating: number;
    weeklyBestRating: number;
    rank: number;
  };
  characters: {
    guid: number;
    name: string;
    race: number;
    class: number;
    gender: number;
    level: number;
    chosenTitle: number;
    health: number;
    power1: number;
    power2: number;
    power3: number;
    power4: number;
    power5: number;
    power6: number;
    power7: number;
  };
  character_talent: {
    guid: number;
    talentId: number;
  };
  character_inventory: {
    guid: number /* player guid */;
    bag: number /* if bag = 0, item is equipped */;
    slot: number;
    item: number /* item guid from item_instance */;
  };
  item_instance: {
    guid: number /* item guid */;
    itemEntry: number /* item id in item_template */;
    owner_guid: number /*guid of player which owns the item */;
    enchantments: string;
  };
  guild: {
    guildid: number;
    name: string;
  };
  guild_member: {
    guildid: number;
    guid: number;
  };
  character_stats: {
    guid: number;
    strength: number;
    agility: number;
    stamina: number;
    intellect: number;
    spirit: number;
    armor: number;
  };
  item_instance_transmog: {
    itemGuid: number;
    itemModifiedAppearanceAllSpecs: number;
  };
}

export interface AuthDatabase {
  "auth.account": {
    id: Generated<number>;
    username: string;
    salt: Buffer;
    verifier: Buffer;
    reg_mail: string;
  };
}

export interface WebDatabase {
  "web.item_sparse": {
    ID: number /* itemEntry from item_instance */;
    Display: string;
    OverallQualityID: number;
    Flags1: number;
    Flags2: number;
    Flags3: number;
    Flags4: number;
    ItemLevel: number;
    InventoryType: number;
    Resistances1: number /* this is Armor stat */;
    MinDamage1: number;
    MaxDamage1: number;
    ItemDelay: number;
    StatModifierBonusStat1: number;
    StatModifierBonusStat2: number;
    StatModifierBonusStat3: number;
    StatModifierBonusStat4: number;
    StatModifierBonusStat5: number;
    StatModifierBonusStat6: number;
    StatModifierBonusAmount1: number;
    StatModifierBonusAmount2: number;
    StatModifierBonusAmount3: number;
    StatModifierBonusAmount4: number;
    StatModifierBonusAmount5: number;
    StatModifierBonusAmount6: number;
    ItemSet: number;
    SocketType1: number;
    SocketType2: number;
    SocketType3: number;
    GemProperties: number;
    MaxDurability: number;
    SocketMatchEnchantmentID: number;
    RequiredLevel: number;
    AllowableClass: number;
  };
  "web.item": {
    ID: number /* itemEntry from item_instance */;
    ClassID: number;
    SubClassID: number;
    IconFileDataID: number;
  };
  "web.icon_data": {
    DataFileID: number;
    IconName: string;
  };
  "web.char_titles": {
    ID: number;
    Name: string;
    Name1: string;
    MaskID: number;
  };
  "web.spell_item_enchantment": {
    ID: number;
    Name: string;
  };
  "web.gem_properties": {
    ID: number;
    EnchantID: number;
  };
  "web.spell": {
    ID: number;
    Description: string;
  };
  "web.item_effect": {
    ID: number;
    SpellID: number;
    TriggerType: number;
    ParentItemID: number;
  };
  "web.talent": {
    ID: number;
    SpellRank1: string;
  };
  "web.item_modified_appearance": {
    ID: number;
    ItemID: number;
  };
}

export interface HotfixesDatabase {
  "hotfixes.item_sparse": {
    ID: number /* itemEntry from item_instance */;
    Display: string;
    OverallQualityID: number;
    Flags1: number;
    Flags2: number;
    Flags3: number;
    Flags4: number;
    ItemLevel: number;
    InventoryType: number;
    Resistances1: number /* this is Armor stat */;
    MinDamage1: number;
    MaxDamage1: number;
    ItemDelay: number;
    StatModifierBonusStat1: number;
    StatModifierBonusStat2: number;
    StatModifierBonusStat3: number;
    StatModifierBonusStat4: number;
    StatModifierBonusStat5: number;
    StatModifierBonusStat6: number;
    StatModifierBonusAmount1: number;
    StatModifierBonusAmount2: number;
    StatModifierBonusAmount3: number;
    StatModifierBonusAmount4: number;
    StatModifierBonusAmount5: number;
    StatModifierBonusAmount6: number;
    ItemSet: number;
    SocketType1: number;
    SocketType2: number;
    SocketType3: number;
    GemProperties: number;
    MaxDurability: number;
    SocketMatchEnchantmentID: number;
    RequiredLevel: number;
    AllowableClass: number;
  };
  "hotfixes.item": {
    ID: number /* itemEntry from item_instance */;
    ClassID: number;
    SubClassID: number;
    IconFileDataID: number;
  };
  "hotfixes.char_titles": {
    ID: number;
    Name: string;
    Name1: string;
    MaskID: number;
  };
  "hotfixes.spell_item_enchantment": {
    ID: number;
    Name: string;
  };
  "hotfixes.gem_properties": {
    ID: number;
    EnchantID: number;
  };
  /*"hotfixes.spell": {
    ID: number;
    Description: string;
  };*/
  "hotfixes.item_effect": {
    ID: number;
    SpellID: number;
    TriggerType: number;
    ParentItemID: number;
  };
  "hotfixes.talent": {
    ID: number;
    SpellRank1: string;
  };
  "hotfixes.item_modified_appearance": {
    ID: number;
    ItemID: number;
  };
  "web.item_set": {
    ID: number;
    Name: string;
    ItemID1: number;
    ItemID2: number;
    ItemID3: number;
    ItemID4: number;
    ItemID5: number;
    ItemID6: number;
    ItemID7: number;
    ItemID8: number;
    ItemID9: number;
    ItemID10: number;
    ItemID11: number;
    ItemID12: number;
    ItemID13: number;
    ItemID14: number;
    ItemID15: number;
    ItemID16: number;
    ItemID17: number;
  };
  "web.item_set_spell": {
    ID: number;
    SpellID: number;
    Threshold: number;
    ItemSetID: number;
  };
}
