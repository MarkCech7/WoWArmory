CLASS_NAMES = {
    1: "Warrior",
    2: "Paladin",
    3: "Hunter",
    4: "Rogue",
    5: "Priest",
    6: "Death Knight",
    7: "Shaman",
    8: "Mage",
    10: "Warlock",
    11: "Druid",
}

SLOT_NAMES = {
    1: "Head",
    2: "Neck",
    3: "Shoulders",
    4: "Shirt",
    5: "Chest",
    6: "Waist",
    7: "Legs",
    8: "Feet",
    9: "Wrists",
    10: "Hands",
    11: "Finger",
    12: "Trinket",
    13: "One-Hand",
    14: "Shield",
    15: "Ranged",
    16: "Back",
    17: "Two-Hand",
    19: "Tabard",
    20: "Robe",
    21: "Main hand",
    22: "Off hand",
    23: "Held in Off-Hand",
    25: "Thrown",
    26: "Ranged",
    28: "Relic",
}

RACE_NAMES = {
    1: "Human",
    2: "Orc",
    3: "Dwarf",
    4: "Night Elf",
    5: "Undead",
    6: "Tauren",
    7: "Gnome",
    8: "Troll",
    10: "Blood Elf",
    11: "Draenei",
}

ALLIANCE_RACES = {1, 3, 4, 7, 11}  # Human, Dwarf, Night Elf, Gnome, Draenei
HORDE_RACES = {2, 5, 6, 8, 10}     # Orc, Undead, Tauren, Troll, Blood Elf
GEAR_SLOTS = {0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17}
TWO_HAND_INVENTORY_TYPE = {17} 

def get_class_name(class_id: int) -> str:
    return CLASS_NAMES.get(class_id, "")

def get_slot_name(slot_id: int) -> str:
    return SLOT_NAMES.get(slot_id, "")

def get_race_name(race_id: int) -> str:
    return RACE_NAMES.get(race_id, "")

def compute_average_item_level(equipped_items: list[dict]) -> float:
    ilvl_by_slot = {
        item["slot"]: item["item_level"]
        for item in equipped_items
        if item["slot"] in GEAR_SLOTS
    }

    total = 0

    for slot in GEAR_SLOTS:
        ilvl = ilvl_by_slot.get(slot, 0)
        total += ilvl

    # 2H weapon: also add its ilvl for the offhand slot
    two_hander = next(
        (item for item in equipped_items if item["inventory_type"] in TWO_HAND_INVENTORY_TYPE),
        None
    )

    if two_hander:
        total += two_hander["item_level"]

    return int(total / len(GEAR_SLOTS))