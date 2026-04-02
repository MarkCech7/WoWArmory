import type { Route } from "./+types/armory";
import ArmoryBackground from "~/components/player-armory-background";
import { NameColor } from "~/components/class";
import transmogIcon from "~/assets/armory-assets/transmogrify_border.png";
import { Tooltip } from "radix-ui";
import {
  ItemClass,
  calculateWeaponSpeed,
  calculateWeaponDPS,
  isPrimaryStat,
  formatPrimaryStat,
  getGemIconById,
  getGemBonusById,
  isHeroic,
  getSeasonalText,
  getAllowedClasses,
  formatPrimaryStats,
  formatSecondaryStats,
  formatSpellTooltip,
  ItemSetTooltip,
} from "~/components/item";
import {
  getSlotName,
  getQualityTextColor,
  itemBorderColor,
  emptySlotIcon,
  ItemFlags,
  classBitmask,
  socketNames,
} from "~/components/constants";
import { useChatContext } from "~/components/chat";
import { useEffect } from "react";
import { ArmoryFaction } from "~/components/race";
import { Professions, SecondarySkills } from "~/components/skills";
import {
  GeneralStats,
  StatRow,
  StatSection,
  sanitizeStat,
} from "~/components/stats";

type SlotData = Route.ComponentProps["loaderData"]["equippedItems"][number];
type SetSpell = {
  spellId: number;
  threshold: number;
  description: string;
  active: boolean;
};
type SetPiece = { itemId: number; name: string; equipped: boolean };
type ItemSetInfo = {
  id: number;
  name: string;
  equippedCount: number;
  pieces: SetPiece[];
  spells: SetSpell[];
};
type Enchantment = { index: number; id: number; name: string };
type EquippedItem = {
  item_guid: number;
  itemEntry: number;
  owner: number;
  enchantments: Enchantment[];
  slot: number;
  char_guid: number;
  item_name: string;
  OverallQualityID: number;
  Flags1: number;
  ItemLevel: number;
  InventoryType: number;
  Resistances1: number;
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
  MaxDurability: number;
  RequiredLevel: number;
  SocketMatchEnchantmentID: number;
  AllowableClass: number;
  ItemSet: number;
  SocketType1: number;
  SocketType2: number;
  SocketType3: number;
  GemProperties: number;
  ClassID: number;
  SubClassID: number;
  IconFileDataID: number;
  IconName: string;
  transmog_appearance_id: number | null;
  transmog_item_id: number | null;
  transmog_item_name: string | null;
  Description: string | null;
  TriggerType: number | null;
};

export async function loader({ params, request }: Route.LoaderArgs) {
  const response = await fetch(
    `http://127.0.0.1:8000/armory/${params.characterId}`,
  );

  if (!response.ok) throw new Error("Character not found");
  const data = await response.json();

  return data;
}

function ArmorSlot(props: {
  slot: SlotData | undefined;
  slotNumber: number;
  side?: "left" | "right";
  isCenter?: boolean;
  itemSetData: Record<number, ItemSetInfo>;
}) {
  const iconToDisplay = props.slot
    ? props.slot.IconName
    : emptySlotIcon(props.slotNumber);

  const itemName = props.slot ? props.slot.item_name : `Empty slot`;
  const isLeft = props.side === "left";

  const baseSocketColors = [
    props.slot?.SocketType1,
    props.slot?.SocketType2,
    props.slot?.SocketType3,
  ].filter(Boolean) as number[];

  const SOCKET_ENCHANT_IDS = [3717, 3723, 3729];

  if (props.isCenter) {
    return (
      <div
        style={{
          width: "3.25rem",
          height: "3.75rem",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            backgroundImage: `url(/app/assets/icons/${iconToDisplay}.png)`,
            backgroundSize: "107%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            width: "100%",
            height: "100%",
          }}
          className={
            props.slot
              ? `border-1 ${itemBorderColor(
                  props.slot.OverallQualityID,
                )} rounded-md`
              : ""
          }
        />
      </div>
    );
  }

  if (!props.slot) {
    return (
      <div
        className={`flex items-center ${
          isLeft ? "flex-row" : "flex-row-reverse"
        }`}
        style={{
          background: isLeft
            ? "linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.01))"
            : "linear-gradient(to right, rgba(0,0,0,0.01), rgba(0,0,0,0.85))",
          minWidth: "19rem",
          height: "3.75rem",
          fontSize: "0.781rem",
          padding: "0.25rem 0.25rem",
          boxSizing: "border-box",
          gap: "0.3rem",
        }}
      >
        <div className="w-13 h-13 flex-shrink-0">
          <div
            style={{
              backgroundImage: `url(/app/assets/icons/${iconToDisplay}.png)`,
              backgroundSize: "107%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              width: "100%",
              height: "100%",
            }}
          />
        </div>
      </div>
    );
  }

  const enchantments: Record<number, Enchantment> = {};
  props.slot.enchantments.forEach((i: Enchantment) => {
    enchantments[i.index] = i;
  });

  const hasSocketEnchant = Object.values(enchantments).some(
    //handling Blacksmithing, Eternal belt buckle socket enchants
    (e) => e && SOCKET_ENCHANT_IDS.includes(e.id),
  );

  const socketColors = hasSocketEnchant
    ? [...baseSocketColors, 14]
    : baseSocketColors;

  const hasEnchant = Boolean(enchantments[0]);
  const hasAnySocket = socketColors.some(Boolean);
  const shouldAddSpacer = hasEnchant || hasAnySocket;

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <div
          style={{
            display: "flex",
            //alignItems: "center",
            gap: "0.3rem",
            height: "3.75rem",
            flexDirection: isLeft ? "row" : "row-reverse",
            background: isLeft
              ? "linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.01))"
              : "linear-gradient(to right, rgba(0,0,0,0.01), rgba(0,0,0,0.85))",
            minWidth: "19rem",
            fontSize: "0.781rem",
            padding: "0.25rem 0.25rem",
            boxSizing: "border-box",
          }}
        >
          <Tooltip.Trigger asChild>
            <div className="w-13 h-13 flex-shrink-0 relative">
              <div
                className={`flex items-center gap-2 ${
                  isLeft ? "flex-col" : "flex-col-reverse"
                }`}
              ></div>
              <div
                style={{
                  backgroundImage: `url(/app/assets/icons/${iconToDisplay}.png)`,
                  backgroundSize: "107%",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  width: "100%",
                  height: "100%",
                }}
                className={`border-1 ${itemBorderColor(
                  props.slot.OverallQualityID,
                )} rounded-md`}
              />
              {props.slot.transmog_item_name && (
                <img
                  src="/app/assets/armory-assets/transmogrify_border.png"
                  alt="Transmogrified"
                  className="absolute bottom-0 w-[20px] h-[20px] pointer-events-none z-10 opacity-90"
                />
              )}
            </div>
          </Tooltip.Trigger>
          <div
            style={{
              flexDirection: "column",
              display: "flex",
              justifyContent: "space-between",
              alignItems: isLeft ? "flex-start" : "flex-end",
              marginTop: "-0.2rem",
            }}
          >
            <span
              className={`${getQualityTextColor(
                props.slot.OverallQualityID,
              )} whitespace-nowrap [text-shadow:0_0_4px_black]`}
            >
              {itemName}
            </span>

            <span>
              {enchantments[0] ? (
                <div className="text-wow-uncommon whitespace-nowrap [text-shadow:0_0_4px_black]">
                  {enchantments[0].name}
                </div>
              ) : null}
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: isLeft ? "row" : "row-reverse",
                alignItems: "center",
                marginTop: "auto",
              }}
            >
              <span
                className="text-gray-300 whitespace-nowrap [text-shadow:0_0_4px_black]"
                style={{
                  marginRight: isLeft ? "0.15rem" : "0",
                  marginLeft: isLeft ? "0" : "0.15rem",
                }}
              >
                {props.slot.ItemLevel}
              </span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: "0.12rem",
                }}
              >
                {[2, 3, 4].map((i, idx) =>
                  socketColors[idx] ? (
                    <div
                      key={i}
                      style={{
                        marginLeft: isLeft ? "0.15rem" : "0",
                        marginRight: isLeft ? "0" : "0.15rem",
                      }}
                    >
                      {getGemIconById(enchantments[i]?.id, socketColors[idx])}
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          </div>
        </div>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={20}
            className="text-gray-300 font-medium text-xs w-76 bg bg-gray-900 p-2 rounded shadow-lg border border-gray-700 z-50"
          >
            <div
              className={`${getQualityTextColor(
                props.slot.OverallQualityID,
              )} text-[14px]`}
            >
              {props.slot.item_name}
            </div>
            <div className="text-wow-uncommon">
              {isHeroic(props.slot.Flags1) && (
                <span
                  className={
                    getSeasonalText(props.slot.itemEntry)
                      ? "text-wow-season"
                      : "text-wow-heroic"
                  }
                >
                  {getSeasonalText(props.slot.itemEntry) || "Heroic"}
                </span>
              )}
            </div>
            <div className="text-wow-gold">
              Item Level {props.slot.ItemLevel}
            </div>
            {props.slot.transmog_item_name ? (
              <div className="text-wow-transmog">
                Transmogrified to:
                <br />
                {props.slot.transmog_item_name}
              </div>
            ) : null}
            <div>Binds when picked up</div>
            <div className="flex flex-row justify-between">
              <div className="text-gray-300">{props.slot.slot_name}</div>
              <div className="text-gray-300">
                <ItemClass
                  class={props.slot.ClassID}
                  subClass={props.slot.SubClassID}
                />
              </div>
            </div>
            <div>
              {props.slot.Resistances1 ? (
                <div>
                  {" "}
                  {props.slot.Resistances1.toLocaleString("en-US")} Armor
                </div>
              ) : null}
            </div>
            <div>
              {props.slot.MinDamage1 && props.slot.MaxDamage1 ? (
                <div>
                  <div className="flex flex-row justify-between">
                    <div>
                      {props.slot.MinDamage1.toLocaleString("en-US")} -{" "}
                      {props.slot.MaxDamage1.toLocaleString("en-US")} Damage{" "}
                    </div>
                    <div>{calculateWeaponSpeed(props.slot.ItemDelay)}</div>
                  </div>
                  <div>
                    {calculateWeaponDPS(
                      props.slot.MinDamage1,
                      props.slot.MaxDamage1,
                      props.slot.ItemDelay,
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <div>{formatPrimaryStats(props.slot)}</div>
            {/* SPACER ABOVE ENCHANT OR GEMS */}
            {shouldAddSpacer && <div className="pb-[10px]" />}

            {/* ENCHANT */}
            {hasEnchant && (
              <div className="text-wow-uncommon">{enchantments[0].name}</div>
            )}

            {/* SOCKETS / GEMS */}
            {[0, 1, 2].map((idx) => {
              const gem = enchantments[idx + 2]; // enchantments 2,3,4
              const socketColor = socketColors[idx];

              if (!socketColor) return null;

              return (
                <div key={idx} className="flex flex-row items-top gap-2">
                  <div>{getGemIconById(gem?.id, socketColor)}</div>

                  {gem ? (
                    <div>{gem.name}</div>
                  ) : (
                    <div className="text-wow-gray">
                      {socketNames[socketColor]}
                    </div>
                  )}
                </div>
              );
            })}
            <div>
              {enchantments[5] ? (
                <div className="text-wow-uncommon">
                  Socket Bonus: {enchantments[5].name}
                  <div className="pb-[10px]" />
                </div>
              ) : (
                <div className="text-wow-gray">
                  {props.slot.SocketMatchEnchantmentID ? (
                    <>
                      Socket Bonus:{" "}
                      {getGemBonusById(props.slot.SocketMatchEnchantmentID)}
                      <div className="pb-[10px]" />
                    </>
                  ) : null}
                </div>
              )}
            </div>
            <div>
              {props.slot.MaxDurability
                ? `Durability: ${props.slot.MaxDurability} /${" "}
              ${props.slot.MaxDurability}`
                : null}
            </div>
            <div>
              {getAllowedClasses(props.slot.AllowableClass, classBitmask) ||
                null}
            </div>
            <div>
              {props.slot.RequiredLevel && props.slot.RequiredLevel > 1
                ? `Requires Level ${props.slot.RequiredLevel} `
                : null}
            </div>
            <div className="text-wow-uncommon">
              {formatSecondaryStats(props.slot)}
            </div>
            <div className="text-wow-uncommon">
              {props.slot.Description
                ? props.slot.Description.split("||").map(
                    (desc: string, i: number) => (
                      <div key={i}>
                        {formatSpellTooltip(props.slot.TriggerType, desc)}
                      </div>
                    ),
                  )
                : null}
              {props.slot.ItemSet ? (
                <ItemSetTooltip
                  setId={props.slot.ItemSet}
                  itemSetData={props.itemSetData}
                />
              ) : null}
            </div>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export default function Armory(props: Route.ComponentProps) {
  let {
    equippedItems,
    charInfo,
    charStats,
    itemSetData,
    average_item_level,
    char_skills,
  } = props.loaderData as {
    equippedItems: EquippedItem[];
    charInfo: any;
    charStats: any;
    itemSetData: Record<string, ItemSetInfo>;
    average_item_level: any;
    char_skills: any[];
  };

  const { setCharacterName } = useChatContext();

  useEffect(() => {
    setCharacterName(charInfo.name);
    return () => setCharacterName(undefined);
  }, [charInfo.name]);

  const equippedItemsObject: Record<number, EquippedItem> = {};
  equippedItems.forEach((item: EquippedItem) => {
    equippedItemsObject[item.slot] = item;
  });

  let charTitle = charInfo.actual_title;
  let charName = charInfo.name;

  if (charTitle) {
    charName = charTitle.replace("%s", charName);
  }

  return (
    <div className="max-w-[1300px] mx-auto gap-0.5 mt-5 h-[1600px] bg-content-dark-50 border-t rounded-2xl overflow-hidden">
      <ArmoryBackground raceId={charInfo.race}>
        <div className="w-full pt-7 pl-10 pr-10">
          <div className="pb-4 border-b border-b-article-border">
            <ul className="flex gap-4 text-wow-stagger pl-10 pr-10">
              <li>CHARACTER</li>
              <li>TALENTS & GLYPHS</li>
              <li>PLAYER VS PLAYER</li>
              <li>DUNGEONS & RAIDS</li>
              <li>ACHIEVEMENTS</li>
              <li>MOUNTS & COLLECTIONS</li>
            </ul>
          </div>
        </div>
        <div className="w-full max-w-[62.5rem] pt-2">
          {" "}
          {/*max-w-[60.625rem]*/}
          <div className="pt-2 pb-2">
            <div className="relative w-full">
              <div className="absolute -ml-24 -mt-1">
                <ArmoryFaction raceId={charInfo.race} />
              </div>
              <div className="flex justify-between items-baseline">
                <div className="text-3xl font-bold">{charName}</div>
                <div className="whitespace-nowrap mt-[-2]">
                  <span className="text-2xl font-extrabold">
                    {average_item_level} ilvl
                  </span>
                  <span className="text-m"></span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="pb-2 font-bold text-lg">
                  <NameColor class={charInfo.class_name}>
                    <span className="font-extrabold">{charInfo.level}</span>{" "}
                    <span>{charInfo.race_name}</span>{" "}
                    <span>{charInfo.spec_name}</span>{" "}
                    <span>{charInfo.class_name}</span>
                  </NameColor>{" "}
                  <span className="text-wow-gold">{charInfo.guild_name}</span>
                </div>
                <div className="text-sm text-gray-400 whitespace-nowrap mb-2">
                  (Average Item Level)
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <div className="flex flex-col gap-0.5">
              <ArmorSlot
                slot={equippedItemsObject[0]}
                slotNumber={0}
                side="left"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[1]}
                slotNumber={1}
                side="left"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[2]}
                slotNumber={2}
                side="left"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[14]}
                slotNumber={14}
                side="left"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[4]}
                slotNumber={4}
                side="left"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[3]}
                slotNumber={3}
                side="left"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[18]}
                slotNumber={18}
                side="left"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[8]}
                slotNumber={8}
                side="left"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
            </div>
            <div className="flex flex-col gap-0.5">
              <ArmorSlot
                slot={equippedItemsObject[9]}
                slotNumber={9}
                side="right"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[5]}
                slotNumber={5}
                side="right"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[6]}
                slotNumber={6}
                side="right"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[7]}
                slotNumber={7}
                side="right"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[10]}
                slotNumber={10}
                side="right"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[11]}
                slotNumber={11}
                side="right"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[12]}
                slotNumber={12}
                side="right"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[13]}
                slotNumber={13}
                side="right"
                itemSetData={itemSetData ?? {}}
              ></ArmorSlot>
            </div>
          </div>
          <div className="flex gap-0.5 justify-center pt-12">
            <ArmorSlot
              slot={equippedItemsObject[15]}
              slotNumber={15}
              side="right"
              itemSetData={itemSetData ?? {}}
            />
            <ArmorSlot
              slot={equippedItemsObject[16]}
              slotNumber={16}
              isCenter={!equippedItemsObject[16]}
              side="left"
              itemSetData={itemSetData ?? {}}
            />
            <ArmorSlot
              slot={equippedItemsObject[17]}
              slotNumber={17}
              side="left"
              itemSetData={itemSetData ?? {}}
            />
          </div>
        </div>
      </ArmoryBackground>
      <div className="px-10 text-sm text-amber-100">
        <div className="w-full border-t border-t-article-border pt-[1.625rem] text-[0.781rem]">
          <div className="flex gap-6 w-fit mx-auto">
            {/* LEFT: Single big Character Stats box with 2 inner columns */}
            <div className="bg-armory-stat-section rounded-md p-6 flex flex-col gap-6">
              <div className="font-bold text-white text-armory-section-title">
                Character Stats
              </div>

              <div className="flex gap-8 flex-1">
                {/* Inner left: Attributes, Melee, Resistances */}
                <div className="flex flex-col gap-6 flex-1">
                  {/* Row 1: Attributes | Ranged */}
                  <div className="flex gap-8">
                    <div className="flex-1">
                      <StatSection title="Attributes">
                        <StatRow
                          label="Strength"
                          value={charStats.strength}
                          highlight={charStats.strength > 1200}
                        />
                        <StatRow
                          label="Agility"
                          value={charStats.agility}
                          highlight={charStats.agility > 1200}
                        />
                        <StatRow
                          label="Stamina"
                          value={charStats.stamina}
                          highlight={charStats.stamina > 1200}
                        />
                        <StatRow
                          label="Intellect"
                          value={charStats.intellect}
                          highlight={charStats.intellect > 1200}
                        />
                        <StatRow
                          label="Spirit"
                          value={charStats.spirit}
                          highlight={charStats.spirit > 1200}
                        />
                        <StatRow label="Armor" value={charStats.armor} />
                      </StatSection>
                    </div>
                    <div className="flex-1">
                      <StatSection title="Ranged">
                        <StatRow
                          label="Damage"
                          value={`${charStats.ranged_dmg_min ?? 0} – ${
                            charStats.ranged_dmg_max ?? 0
                          }`}
                        />
                        <StatRow
                          label="Attack Power"
                          value={sanitizeStat(
                            charStats.ranged_attack_power ?? 0,
                          )}
                        />
                        <StatRow
                          label="Speed"
                          value={(charStats.ranged_speed ?? 0).toFixed(2)}
                        />
                        <StatRow
                          label="Haste"
                          value={(charStats.ranged_haste ?? 0).toFixed(2)}
                          suffix="%"
                        />
                        <StatRow
                          label="Hit"
                          value={(charStats.ranged_hit ?? 0).toFixed(2)}
                          suffix="%"
                        />
                        <StatRow
                          label="Critical Strike"
                          value={(charStats.ranged_crit_pct ?? 0).toFixed(2)}
                          suffix="%"
                        />
                        <StatRow
                          label="Armor Penetration"
                          value={(charStats.ranged_arp ?? 0).toFixed(2)}
                        />
                      </StatSection>
                    </div>
                  </div>

                  {/* Row 2: Melee | Spell */}
                  <div className="flex gap-8">
                    <div className="flex-1">
                      <StatSection title="Melee">
                        <StatRow
                          label="Damage"
                          value={`${charStats.melee_dmg_min ?? 0} – ${
                            charStats.melee_dmg_max ?? 0
                          }`}
                        />
                        <StatRow
                          label="Attack Power"
                          value={charStats.attack_power ?? 0}
                        />
                        <StatRow
                          label="Speed"
                          value={(charStats.melee_speed ?? 0).toFixed(2)}
                        />
                        <StatRow
                          label="Haste"
                          value={(charStats.haste ?? 0).toFixed(2)}
                          suffix="%"
                        />
                        <StatRow
                          label="Hit"
                          value={(charStats.hit ?? 0).toFixed(2)}
                          suffix="%"
                        />
                        <StatRow
                          label="Critical Strike"
                          value={(charStats.crit_pct ?? 0).toFixed(2)}
                          suffix="%"
                        />
                        <StatRow
                          label="Armor Penetration"
                          value={(charStats.arp ?? 0).toFixed(2)}
                          suffix="%"
                        />
                        <StatRow
                          label="Expertise"
                          value={charStats.expertise ?? 0}
                        />
                      </StatSection>
                    </div>
                    <div className="flex-1">
                      <StatSection title="Spell">
                        <StatRow
                          label="Spell Power"
                          value={charStats.spell_power ?? 0}
                        />
                        <StatRow
                          label="Haste"
                          value={(charStats.spell_haste ?? 0).toFixed(2)}
                          suffix="%"
                        />
                        <StatRow
                          label="Hit"
                          value={(charStats.spell_hit ?? 0).toFixed(2)}
                          suffix="%"
                        />
                        <StatRow
                          label="Spell Penetration"
                          value={(charStats.spell_pen ?? 0).toFixed(2)}
                        />
                        <StatRow
                          label="Mana Regen"
                          value={(charStats.mana_regen ?? 0).toFixed(2)}
                        />
                        <StatRow
                          label="Combat Regen"
                          value={(charStats.combat_regen ?? 0).toFixed(2)}
                        />
                        <StatRow
                          label="Critical Strike"
                          value={(charStats.spell_crit_pct ?? 0).toFixed(2)}
                          suffix="%"
                        />
                      </StatSection>
                    </div>
                  </div>

                  {/* Row 3: Resistances | Defense */}
                  <div className="flex gap-8">
                    <div className="flex-1">
                      <StatSection title="Resistances">
                        <StatRow
                          label="Arcane"
                          value={charStats.res_arcane ?? 0}
                        />
                        <StatRow label="Fire" value={charStats.res_fire ?? 0} />
                        <StatRow
                          label="Frost"
                          value={charStats.res_frost ?? 0}
                        />
                        <StatRow
                          label="Nature"
                          value={charStats.res_nature ?? 0}
                        />
                        <StatRow
                          label="Shadow"
                          value={charStats.res_shadow ?? 0}
                        />
                      </StatSection>
                    </div>
                    <div className="flex-1">
                      <StatSection title="Defense">
                        <StatRow
                          label="Defense"
                          value={charStats.defense ?? 0}
                        />
                        <StatRow
                          label="Dodge"
                          value={(charStats.dodge ?? 0).toFixed(2)}
                          suffix="%"
                        />
                        <StatRow
                          label="Parry"
                          value={(charStats.parry ?? 0).toFixed(2)}
                          suffix="%"
                        />
                        <StatRow
                          label="Block"
                          value={(charStats.block ?? 0).toFixed(2)}
                          suffix="%"
                        />
                        <StatRow
                          label="Resilience"
                          value={charStats.resilience ?? 0}
                        />
                      </StatSection>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: General, Professions, Secondary Skills — separate boxes */}
            <div className="flex flex-col gap-6 w-[350px]">
              <div className="bg-armory-stat-section rounded-md p-6 flex flex-col gap-[9px]">
                <div className="font-bold text-white pb-4 text-armory-section-title">
                  General
                </div>
                <GeneralStats charInfo={charInfo} charStats={charStats} />
              </div>

              <div className="bg-armory-stat-section rounded-md p-6 flex flex-col gap-[9px]">
                <div className="font-bold text-white pb-4 text-armory-section-title">
                  Professions
                </div>
                <Professions skills={char_skills} />
              </div>

              <div className="bg-armory-stat-section rounded-md p-6 flex flex-col gap-[9px] flex-1">
                <div className="font-bold text-white pb-4 text-armory-section-title">
                  Secondary Skills
                </div>
                <SecondarySkills skills={char_skills} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
