import type { Route } from "./+types/armory";
import { loadCharacter } from "~/server/db";
import ArmoryBackground from "~/components/player-armory-background";
import { NameColor } from "~/components/class";
import { ArmoryRace } from "~/components/race";
import { ArmoryClass } from "~/components/class";
import { ArmorySpec } from "~/components/specialization";
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

type SlotData = Route.ComponentProps["loaderData"]["equippedItems"][number];

export async function loader({ params, request }: Route.LoaderArgs) {
  let character = await loadCharacter();
  return character;
}

function ArmorSlot(props: {
  slot: SlotData | undefined;
  slotNumber: number;
  side?: "left" | "right";
  isCenter?: boolean;
}) {
  const iconToDisplay = props.slot
    ? props.slot.item_icon
    : emptySlotIcon(props.slotNumber);

  const itemName = props.slot ? props.slot.item_name : `Empty slot`;
  const isLeft = props.side === "left";

  const baseSocketColors = [
    props.slot?.socketcolor_1,
    props.slot?.socketcolor_2,
    props.slot?.socketcolor_3,
  ].filter(Boolean) as number[];

  const SOCKET_ENCHANT_IDS = [3717, 3723, 3729];

  if (!props.slot) {
    if (props.isCenter === false) {
      return (
        <div
          className={`flex items-center ${
            isLeft ? "flex-row" : "flex-row-reverse"
          }`}
          style={{
            background: isLeft
              ? "linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.01))"
              : "linear-gradient(to right, rgba(0,0,0,0.01), rgba(0,0,0,0.85))",
            minWidth: "305px",
            padding: "4px 4px",
          }}
        >
          <div className="w-13 h-13">
            <div
              style={{
                backgroundImage: `url(/app/assets/icons/${iconToDisplay}.png)`,
                backgroundSize: "107%",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                width: "100%",
                height: "100%",
              }}
              title={itemName}
            />
          </div>
          <span></span>
        </div>
      );
    }
    return (
      <div
        className={`flex items-center ${
          isLeft ? "flex-row" : "flex-row-reverse"
        }`}
      >
        <div className="w-13 h-13">
          <div
            style={{
              backgroundImage: `url(/app/assets/icons/${iconToDisplay}.png)`,
              backgroundSize: "107%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              width: "100%",
              height: "100%",
            }}
            title={itemName}
          />
        </div>
        <span></span>
      </div>
    );
  }
  const enchantments = Object.fromEntries(
    props.slot.enchantments.map((i) => [i.index, i])
  );

  const hasSocketEnchant = Object.values(enchantments).some(
    //handling Blacksmithing, Eternal belt buckle socket enchants
    (e) => e && SOCKET_ENCHANT_IDS.includes(e.id)
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
                  props.slot.quality
                )} rounded-md`}
              />
              {props.slot.transmogrifyId && (
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
                props.slot.quality
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
                {props.slot.itemlevel}
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
                  ) : null
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
                props.slot.quality
              )} text-[14px]`}
            >
              {props.slot.item_name}
            </div>
            <div className="text-wow-uncommon">
              {isHeroic(props.slot.flags) && (
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
              Item Level {props.slot.itemlevel}
            </div>
            {props.slot.transmogrifyId ? (
              <div className="text-wow-transmog">
                Transmogrified to:
                <br />
                {props.slot.transmogrifyId}
              </div>
            ) : null}
            <div>Binds when picked up</div>
            <div className="flex flex-row justify-between">
              <div className="text-gray-300">
                {getSlotName(props.slot.inventorytype)}
              </div>
              <div className="text-gray-300">
                <ItemClass
                  class={props.slot.class}
                  subClass={props.slot.subclass}
                />
              </div>
            </div>
            <div>
              {props.slot.armor ? (
                <div> {props.slot.armor.toLocaleString("en-US")} Armor</div>
              ) : null}
            </div>
            <div>
              {props.slot.dmg_min1 && props.slot.dmg_max1 ? (
                <div>
                  <div className="flex flex-row justify-between">
                    <div>
                      {props.slot.dmg_min1.toLocaleString("en-US")} -{" "}
                      {props.slot.dmg_max1.toLocaleString("en-US")} Damage{" "}
                    </div>
                    <div>{calculateWeaponSpeed(props.slot.delay)}</div>
                  </div>
                  <div>
                    {calculateWeaponDPS(
                      props.slot.dmg_min1,
                      props.slot.dmg_max1,
                      props.slot.delay
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
                  {props.slot.socketbonus ? (
                    <>
                      Socket Bonus: {getGemBonusById(props.slot.socketbonus)}
                      <div className="pb-[10px]" />
                    </>
                  ) : null}
                </div>
              )}
            </div>
            <div>
              {props.slot.maxdurability
                ? `Durability: ${props.slot.maxdurability} /${" "}
              ${props.slot.maxdurability}`
                : null}
            </div>
            <div>
              {getAllowedClasses(props.slot.allowableclass, classBitmask) ||
                null}
            </div>
            <div>
              {props.slot.requiredlevel
                ? `Requires level ${props.slot.requiredlevel} `
                : null}
            </div>
            <div className="text-wow-uncommon">
              {formatSecondaryStats(props.slot)}
            </div>
            <div className="text-wow-uncommon">
              {props.slot.spell_description ? (
                <div>
                  {formatSpellTooltip(
                    props.slot.spelltrigger_1,
                    props.slot.spell_description
                  )}
                </div>
              ) : null}
            </div>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export default function Armory(props: Route.ComponentProps) {
  let { equippedItems, charInfo, charStats } = props.loaderData;

  const equippedItemsObject = Object.fromEntries(
    equippedItems.map((item) => [item.slot, item])
  );

  let charTitle = charInfo.actual_title;
  let charName = charInfo.name;
  charName = charTitle.replace("%s", charName);

  return (
    <div className="max-w-[1300px] mx-auto gap-0.5 mt-5 h-[1400px] bg-content-dark-50 border-t rounded-2xl overflow-hidden">
      <ArmoryBackground raceId={charInfo.race}>
        <div className="w-full max-w-4xl pt-10">
          <div className="">
            <div className="text-3xl font-bold">{charName}</div>
            <div className="pb-3 font-bold text-lg">
              <NameColor classId={charInfo.class}>
                <span className="font-extrabold">{charInfo.level}</span>{" "}
                <ArmoryRace raceId={charInfo.race} />{" "}
                <ArmorySpec specId={charInfo.spec} />{" "}
                <ArmoryClass classId={charInfo.class} />
              </NameColor>{" "}
              <span className="text-wow-gold">{charInfo.guild_name}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <div className="flex flex-col gap-0.5">
              <ArmorSlot
                slot={equippedItemsObject[0]}
                slotNumber={0}
                side="left"
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[1]}
                slotNumber={1}
                side="left"
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[2]}
                slotNumber={2}
                side="left"
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[14]}
                slotNumber={14}
                side="left"
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[4]}
                slotNumber={4}
                side="left"
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[3]}
                slotNumber={3}
                side="left"
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[18]}
                slotNumber={18}
                side="left"
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[8]}
                slotNumber={8}
                side="left"
              ></ArmorSlot>
            </div>
            <div className="flex flex-col gap-0.5">
              <ArmorSlot
                slot={equippedItemsObject[9]}
                slotNumber={9}
                side="right"
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[5]}
                slotNumber={5}
                side="right"
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[6]}
                slotNumber={6}
                side="right"
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[7]}
                slotNumber={7}
                side="right"
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[10]}
                slotNumber={10}
                side="right"
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[11]}
                slotNumber={11}
                side="right"
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[12]}
                slotNumber={12}
                side="right"
              ></ArmorSlot>
              <ArmorSlot
                slot={equippedItemsObject[13]}
                slotNumber={13}
                side="right"
              ></ArmorSlot>
            </div>
          </div>
          <div className="flex gap-0.5 justify-center pt-10">
            <ArmorSlot
              slot={equippedItemsObject[15]}
              slotNumber={15}
              side="right"
            ></ArmorSlot>
            <ArmorSlot
              slot={equippedItemsObject[16]}
              slotNumber={16}
              isCenter={true}
            ></ArmorSlot>
            <ArmorSlot
              slot={equippedItemsObject[17]}
              slotNumber={17}
              side="left"
            ></ArmorSlot>
          </div>
        </div>
      </ArmoryBackground>
      <div className="h-12 gap-1 border-t-black border-t-2">
        <div className="border-2 bg-content-hover">
          <div className="p-5 flex flex-row justify-center">
            <span className="mr-4 bg-[#49c219] flex rounded-md w-50 h-8 items-center text-white text-center font-bold justify-center">
              Health: {charStats.health}
            </span>
            {charInfo.class === 1 && (
              <span className="bg-[#C41E3A] flex rounded-md w-50 h-8 items-center text-white text-center font-bold justify-center">
                Rage: {charStats.power2}
              </span>
            )}
            {[2, 3, 5, 7, 8, 9, 11].includes(charInfo.class) && (
              <span className="bg-[#0070DE] flex rounded-md w-50 h-8 items-center text-white text-center font-bold justify-center">
                Mana: {charStats.power1}
              </span>
            )}
            {charInfo.class === 4 && (
              <span className="bg-[#FFF569] flex rounded-md w-50 h-8 items-center text-black text-center font-bold justify-center">
                Energy: {charStats.power3}
              </span>
            )}
            {charInfo.class === 6 && (
              <span className="bg-[#00CCFF] flex rounded-md w-50 h-8 items-center text-white text-center font-bold justify-center">
                Runic Power: {charStats.power6}
              </span>
            )}
          </div>
          <div className="flex flex-col items-center">
            <div className="text-amber-100">
              <div className="font-extrabold">Base Stats</div>
              <div>
                Strength{" "}
                <span
                  className={charStats.strength > 1200 ? "text-[#1eff00]" : ""}
                >
                  {charStats.strength}
                </span>
              </div>
              <div>
                Agility{" "}
                <span
                  className={charStats.agility > 1200 ? "text-[#1eff00]" : ""}
                >
                  {charStats.agility}
                </span>
              </div>
              <div>
                Stamina{" "}
                <span
                  className={charStats.stamina > 1200 ? "text-[#1eff00]" : ""}
                >
                  {charStats.stamina}
                </span>
              </div>
              <div>
                Intellect{" "}
                <span
                  className={charStats.intellect > 1200 ? "text-[#1eff00]" : ""}
                >
                  {charStats.intellect}
                </span>
              </div>
              <div>
                Spirit{" "}
                <span
                  className={charStats.spirit > 1200 ? "text-[#1eff00]" : ""}
                >
                  {charStats.spirit}
                </span>
              </div>
              <div>
                Armor <span>{charStats.armor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
