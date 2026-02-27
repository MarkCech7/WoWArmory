import {
  itemClassMap,
  itemStatTypes,
  gemIcons,
  seasonalItems,
  ItemFlags,
  socketIcons,
} from "./constants";
import React from "react";
import { enchantNamesById } from "./enchant-names";

const PRIMARY_STAT_ORDER = [4, 3, 7, 5, 6];

type Stat = {
  type: number;
  value: number;
};

export function ItemClass(props: { class: number; subClass: number }) {
  const itemClass = itemClassMap[`${props.class}-${props.subClass}`];
  return <span>{itemClass}</span>;
}

export function calculateWeaponSpeed(delay: number) {
  return (delay / 1000).toFixed(2);
}

export function calculateWeaponDPS(
  minDamage: number,
  maxDamage: number,
  delay: number
) {
  const avgDamage = (minDamage + maxDamage) / 2;
  const dps = avgDamage / (delay / 1000);
  return `(${Math.round(dps * 10) / 10} damage per second)`;
}

export const getStatNameById = (statId: number): string => {
  return itemStatTypes[statId] || `Unknown Stat (${statId})`;
};

export function isPrimaryStat(statId: number) {
  return [0, 1, 3, 4, 5, 6, 7].includes(statId);
}

export function isSecondaryStat(statId: number) {
  return [
    12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
  ].includes(statId);
}

export function formatPrimaryStat(statId: number, statValue: number) {
  return `+${statValue} ${getStatNameById(statId)}`;
}

export function formatSecondaryStat(statId: number, statValue: number) {
  return `Equip: Improves your ${getStatNameById(statId)} by ${statValue}.`;
}

function collectStats(slot: any): Stat[] {
  return [
    { type: slot.stat_type1, value: slot.stat_value1 },
    { type: slot.stat_type2, value: slot.stat_value2 },
    { type: slot.stat_type3, value: slot.stat_value3 },
    { type: slot.stat_type4, value: slot.stat_value4 },
    { type: slot.stat_type5, value: slot.stat_value5 },
    { type: slot.stat_type6, value: slot.stat_value6 },
  ].filter((s) => s.type > 0 && s.value > 0);
}

export function formatPrimaryStats(slot: any): React.ReactNode[] {
  const stats = collectStats(slot).filter((s) => isPrimaryStat(s.type));

  return PRIMARY_STAT_ORDER.flatMap((statId) =>
    stats
      .filter((s) => s.type === statId)
      .map((s, idx) => (
        <div key={`primary-${statId}-${idx}`}>
          {formatPrimaryStat(s.type, s.value)}
        </div>
      ))
  );
}

export function formatSecondaryStats(slot: any): React.ReactNode[] {
  return collectStats(slot)
    .filter((s) => isSecondaryStat(s.type))
    .map((s, i) => {
      // special case for Mana per 5 sec (MP5)
      if (s.type === 43) {
        return (
          <div key={i}>{`Equip: Restores ${s.value} Mana per 5 sec.`}</div>
        );
      }

      // default secondary stat formatting
      return (
        <div key={i}>
          {`Equip: Improves your ${getStatNameById(s.type)} by ${s.value}.`}
        </div>
      );
    });
}
export function formatSpellTooltip(
  spellTrigger: number,
  spell_description: string
) {
  if (spellTrigger === 0) {
    return `Use: ${spell_description}`;
  }
  return `Equip: ${spell_description}`;
}

export function getGemIconById(
  gemId: number | undefined,
  socketColor: number | undefined
): React.ReactNode {
  if (gemId && gemIcons[gemId]) {
    return (
      <span>
        <img
          src={`/app/assets/icons/${gemIcons[gemId]}.png`}
          alt={`Gem ${gemId}`}
          className="max-w-[15px] max-h-[15px]"
        />
      </span>
    );
  }

  if (socketColor && socketIcons[socketColor]) {
    return (
      <img
        src={`/app/assets/icons/${socketIcons[socketColor]}.png`}
        alt="Empty socket"
        className="max-w-[15px] max-h-[15px]"
      />
    );
  }

  return null;
}

export function getGemBonusById(bonusId: number): React.ReactNode {
  const bonusName = enchantNamesById[bonusId];
  return bonusName;
}

export function getFlags(
  flagsValue: number,
  flagsDefinition: Record<string, number>
): string[] {
  return Object.entries(flagsDefinition)
    .filter(([_, value]) => (flagsValue & value) === value)
    .map(([name, _]) => name);
}

export function getSeasonalText(itemEntry: number): string | null {
  return seasonalItems[itemEntry] || null;
}

export function isHeroic(flags: number): boolean {
  return (flags & 8) === 8; // 8 is the HEROIC flag value
}

export function isUniqueEquipped(flags: number): boolean {
  return (flags & 524288) === 524288; // 524288 is the Unique_Equipped flag value
}

export function getAllowedClasses(
  classValue: number,
  classDefinition: Record<string, number>
): string | null {
  if (classValue === -1 || classValue === 262143) {
    return null;
  }

  const classNames = Object.entries(classDefinition)
    .filter(([_, value]) => (classValue & value) === value && value !== 0)
    .map(([name, _]) => {
      if (name === "DeathKnight") {
        return "Death Knight";
      }
      return name;
    });

  return `Classes: ${classNames.join(", ")}`;
}
