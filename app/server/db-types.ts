import type { Generated } from "kysely";

export interface AcoreCharactersDatabase {
  arena_team_member: {
    guid: number;
    arenaTeamId: number;
    seasonWins: number;
    seasonGames: number;
  };
  arena_team: {
    arenaTeamId: number;
    type: number;
    rating: number;
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
    spell: number;
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
  custom_transmogrification: {
    owner: number;
    guid: number;
    fakeentry: number;
  };
}

export interface AcoreWorldDatabase {
  "acore_world.item_template": {
    entry: number /* itemEntry from item_instance */;
    name: string;
    displayid: number /* actual displayid of item */;
    quality: number;
    flags: number;
    itemlevel: number;
    class: number;
    subclass: number;
    inventorytype: number;
    armor: number;
    dmg_min1: number;
    dmg_max1: number;
    delay: number;
    stat_type1: number;
    stat_value1: number;
    stat_type2: number;
    stat_value2: number;
    stat_type3: number;
    stat_value3: number;
    stat_type4: number;
    stat_value4: number;
    stat_type5: number;
    stat_value5: number;
    stat_type6: number;
    stat_value6: number;
    spellid_1: number;
    spelltrigger_1: number;
    spellcooldown_1: number;
    spellid_2: number;
    spelltrigger_2: number;
    spellcooldown_2: number;
    spellid_3: number;
    spelltrigger_3: number;
    spellcooldown_3: number;
    spellid_4: number;
    spelltrigger_4: number;
    spellcooldown_4: number;
    spellid_5: number;
    spelltrigger_5: number;
    spellcooldown_5: number;
    itemset: number;
    socketcolor_1: number;
    socketcolor_2: number;
    socketcolor_3: number;
    gemproperties: number;
    maxdurability: number;
    socketbonus: number;
    requiredlevel: number;
    allowableclass: number;
  };
  "acore_world.db_chartitles_12340": {
    mask_id: number;
    name_lang_enUS: string;
  };
  "acore_world.db_itemdisplayinfo_12340": {
    id: number;
    inventoryicon_1: string;
  };
  "acore_world.db_spellitemenchantment_12340": {
    id: number;
    name_lang_enUS: string;
  };
  "acore_world.db_gemproperties_12340": {
    id: number;
    enchant_id: number;
  };
  "acore_world.db_spell_12340": {
    id: number;
    Description_lang_enUS: string;
  };
}

export interface AcoreAuthDatabase {
  "acore_auth.account": {
    id: Generated<number>;
    username: string;
    salt: Buffer;
    verifier: Buffer;
    reg_mail: string;
  };
}
