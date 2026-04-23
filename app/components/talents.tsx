import type { FC, ReactElement } from "react";
import { Tooltip } from "radix-ui";
import { Spec } from "~/components/specialization";
import { talentBorderColor, glyphBorderColor } from "./constants";

export interface TalentPrereq {
  talent_id: number;
  rank: number;
}

export interface Talent {
  talent_id: number;
  tier_id: number;
  col_index: number;
  max_rank: number;
  learned_rank: number;
  spell_name: string;
  icon_name: string;
  spell_class: string;
  spell_description: string;
  prereqs: TalentPrereq[];
}

export interface TalentTab {
  tab_id: number;
  name: string;
  background_file: string;
  order_index: number;
  spell_icon_id: number;
  spell_icon_name: string;
  talents: Talent[];
}

export interface Glyph {
  glyph_slot: number;
  glyph_id: number;
  spell_id: number;
  glyph_type: "major" | "minor";
  glyph_class: string;
  spell_name: string;
  spell_description: string;
  icon_name: string;
}

export interface TalentTreeProps {
  talentTabs?: TalentTab[];
  glyphs?: Glyph[];
}

const OUTER_W = 236;
const OUTER_H = 473;
const INNER_W = 173;
const INNER_H = 473;
const CELL = 36;
const NUM_COLS = 4;
const NUM_TIERS = 11;
const PAD_TOP = 10;
const PAD_BOTTOM = 10;
const AVAILABLE_H = INNER_H - PAD_TOP - PAD_BOTTOM;
const GLYPH_PANEL_W = 290;

function colX(col: number): number {
  const slotW = INNER_W / NUM_COLS;
  return slotW * col + slotW / 2 - CELL / 2;
}

function rowY(tier: number): number {
  const slotH = AVAILABLE_H / NUM_TIERS;
  return PAD_TOP + slotH * tier + slotH / 2 - CELL / 2;
}

function cellCenter(tier: number, col: number): { x: number; y: number } {
  return {
    x: colX(col) + CELL / 2,
    y: rowY(tier) + CELL / 2,
  };
}

function iconUrl(name: string): string {
  if (!name) return "/app/assets/icons/inv_misc_questionmark.png";
  return `/app/assets/icons/${name.toLowerCase()}.png`;
}

function glyphIconUrl(name: string): string {
  if (!name) return "/app/assets/icons/UI-Backpack-EmptySlot.png";
  return `/app/assets/icons/${name.toLowerCase()}.png`;
}

interface TalentPosition {
  tier: number;
  col: number;
}

function buildTalentPositions(
  talents: Talent[],
): Record<number, TalentPosition> {
  const map: Record<number, TalentPosition> = {};
  for (const t of talents) {
    map[t.talent_id] = { tier: t.tier_id, col: t.col_index };
  }
  return map;
}

interface ArrowOverlayProps {
  talents: Talent[];
}

const ArrowOverlay: FC<ArrowOverlayProps> = ({ talents }) => {
  const posMap = buildTalentPositions(talents);
  const lines: ReactElement[] = [];

  for (const talent of talents) {
    for (const prereq of talent.prereqs ?? []) {
      const from = posMap[prereq.talent_id];
      if (!from) continue;

      const fc = cellCenter(from.tier, from.col);
      const tc = cellCenter(talent.tier_id, talent.col_index);
      const fx = fc.x;
      const fy = fc.y + CELL / 2;
      const tx = tc.x;
      const ty = tc.y - CELL / 2;

      const isLearned = talent.learned_rank > 0;
      const color = isLearned ? "#f8c000" : "#4a4030";
      const markerId = `arrow-${prereq.talent_id}-${talent.talent_id}`;

      lines.push(
        <g key={`${prereq.talent_id}->${talent.talent_id}`}>
          <defs>
            <marker
              id={markerId}
              markerWidth="4"
              markerHeight="4"
              refX="2"
              refY="2"
              orient="auto"
            >
              <path d="M0,0 L0,4 L4,2 z" fill={color} />
            </marker>
          </defs>
          <line
            x1={fx}
            y1={fy}
            x2={tx}
            y2={ty}
            stroke={color}
            strokeWidth={isLearned ? 1.5 : 1}
            strokeDasharray={isLearned ? undefined : "3 2"}
            markerEnd={`url(#${markerId})`}
            opacity={isLearned ? 0.9 : 0.35}
          />
        </g>,
      );
    }
  }

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "visible",
      }}
      width="300px"
      height={INNER_H}
    >
      {lines}
    </svg>
  );
};

interface TalentNodeProps {
  talent: Talent;
}

const TalentNode: FC<TalentNodeProps> = ({ talent }) => {
  const { learned_rank: learned, max_rank: max } = talent;
  const isMax = learned >= max && max > 0;
  const isPartial = learned > 0 && !isMax;
  const isNone = learned === 0;

  const borderColor = isMax ? "#f8c000" : isPartial ? "#22c55e" : "#3a3020";
  const hoverBorderColor = isMax
    ? "#ffd740"
    : isPartial
    ? "#4ade80"
    : "#6b5a3a";
  const defaultShadow = isMax ? "0 0 4px rgba(248,192,0,0.5)" : "none";
  const hoverShadow = isMax
    ? "0 0 10px rgba(248,192,0,0.9), 0 0 3px rgba(248,192,0,0.7)"
    : isPartial
    ? "0 0 10px rgba(34,197,94,0.8), 0 0 3px rgba(34,197,94,0.6)"
    : "0 0 7px rgba(160,120,50,0.6)";

  const left = colX(talent.col_index);
  const top = rowY(talent.tier_id);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/app/assets/icons/inv_misc_questionmark.png";
  };

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            style={{
              position: "absolute",
              left,
              top,
              width: CELL,
              height: CELL,
              border: `1px solid ${borderColor}`,
              boxShadow: defaultShadow,
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            }}
            className={`cursor-default rounded-sm flex-shrink-0 ${talentBorderColor(
              isMax,
              isPartial,
            )} ${isNone ? "grayscale-[80%] brightness-[45%]" : ""}`}
          >
            <img
              src={iconUrl(talent.icon_name)}
              alt={talent.spell_name}
              className="w-full h-full block object-cover"
              style={{ transition: "filter 0.15s ease" }}
              onError={handleImgError}
            />
            {max > 0 && (
              <div
                className={`absolute -bottom-1 -right-1 bg-black/90 text-[10px] font-bold px-[0.7px] rounded-[2px] border border-gray-700 leading-none shadow-md ${
                  isMax
                    ? "text-[#f8c000]"
                    : isPartial
                    ? "text-[#22c55e]"
                    : "text-gray-400"
                }`}
              >
                {learned}/{max}
              </div>
            )}
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="text-gray-300 font-medium text-xs w-80 max-w-[400px] bg-gray-900 p-[6px] rounded shadow-lg border border-gray-700 z-50"
          >
            <div className="items-center gap-2">
              <div className="text-[12px]">
                {talent.spell_name || "Unknown Talent"}
                <div className="text-gray-500">Talent</div>
                <div>Requires {talent.spell_class}</div>
                {talent.spell_description && (
                  <div className="text-wow-gold">
                    {talent.spell_description}
                  </div>
                )}
                {learned === 0 && (
                  <div className="text-red-400 mt-[10px]">Not learned</div>
                )}
              </div>
            </div>
            <Tooltip.Arrow className="fill-gray-700" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

interface TalentGridProps {
  tab: TalentTab;
}

const TalentGrid: FC<TalentGridProps> = ({ tab }) => {
  const totalPoints = tab.talents.reduce(
    (sum, t) => sum + (t.learned_rank ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-[2px]">
      <div
        className="flex items-center gap-1.5 bg-content-dark-100 p-1 border border-active font-b-semi-bold"
        style={{ width: OUTER_W }}
      >
        <Spec specId={tab.tab_id} />
        <span className="text-[12px] text-gray-300 font-medium truncate">
          {tab.name}
        </span>
        <span className="ml-auto pr-1 text-[12px] shrink-0 text-gray-300">
          {totalPoints}/71
        </span>
      </div>
      <div
        style={{
          position: "relative",
          width: OUTER_W,
          height: OUTER_H,
          backgroundImage: tab.tab_id
            ? `url(/app/assets/armory-assets/talent-backgrounds/${tab.tab_id}.jpg)`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "top center",
          background: tab.tab_id
            ? undefined
            : "linear-gradient(180deg, #1a1408 0%, #0d0b06 100%)",
          flexShrink: 0,
        }}
        className="rounded-sm overflow-hidden border border-active"
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right,  rgba(0,0,0,0.6) 0%, transparent 35%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to left,   rgba(0,0,0,0.6) 0%, transparent 35%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 25%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top,    rgba(0,0,0,0.6) 0%, transparent 25%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: (OUTER_W - INNER_W) / 2,
            width: INNER_W,
            height: INNER_H,
            zIndex: 2,
          }}
        >
          <ArrowOverlay talents={tab.talents} />
          {tab.talents.map((t) => (
            <TalentNode key={t.talent_id} talent={t} />
          ))}
        </div>
      </div>
    </div>
  );
};

interface GlyphRowProps {
  glyph: Glyph;
}

const GlyphRow: FC<GlyphRowProps> = ({ glyph }) => {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/app/assets/icons/inv_misc_questionmark.png";
  };

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            className="flex items-center gap-3 cursor-default p-1"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.01))",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                flexShrink: 0,
                transition: "filter 0.15s ease, box-shadow 0.15s ease",
                borderRadius: "2px",
                overflow: "hidden",
              }}
              className={`rounded-sm overflow-hidden border ${glyphBorderColor(
                glyph.glyph_type,
              )}`}
            >
              <img
                src={iconUrl(glyph.icon_name)}
                alt={glyph.spell_name}
                className="w-full h-full block object-cover"
                onError={handleImgError}
              />
            </div>
            <span className="text-[13px] text-armory-stat-name">
              {glyph.spell_name || "Unknown Glyph"}
            </span>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="left"
            sideOffset={8}
            className="text-gray-300 font-medium text-xs w-72 bg-gray-900 p-[6px] rounded shadow-lg border border-gray-700 z-50"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="font-semibold text-[13px] leading-tight">
                {glyph.spell_name || "Unknown Glyph"}
              </div>
            </div>
            <div className="text-[12px]">Requires {glyph.glyph_class}</div>
            {glyph.spell_description && (
              <div className="text-wow-gold leading-relaxed">
                {glyph.spell_description}
              </div>
            )}
            <Tooltip.Arrow className="fill-gray-700" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

interface GlyphSectionProps {
  label: string;
  items: Glyph[];
  totalSlots?: number;
}

const GlyphSection: FC<GlyphSectionProps> = ({
  label,
  items,
  totalSlots = 3,
}) => {
  const slots: (Glyph | null)[] = Array.from(
    { length: totalSlots },
    (_, i) => items[i] ?? null,
  );

  return (
    <div className="bg-armory-stat-section rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-6 pb-0">
        <span className="font-bold text-white text-armory-section-title">
          {label}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-6">
        {slots.map((g, i) =>
          g ? (
            <GlyphRow key={g.glyph_slot} glyph={g} />
          ) : (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 p-1"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.01))",
              }}
            >
              <img
                src={glyphIconUrl("")}
                alt="Empty Glyph"
                className="w-[30px] h-[30px] block object-cover"
              />
              <span className="text-[13px] text-gray-400">Empty</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
};

const TalentTree: FC<TalentTreeProps> = ({ talentTabs = [], glyphs = [] }) => {
  const sorted = [...talentTabs].sort((a, b) => a.order_index - b.order_index);
  const major = glyphs.filter((g) => g.glyph_type === "major");
  const minor = glyphs.filter((g) => g.glyph_type === "minor");

  if (!sorted.length) {
    return (
      <div className="text-gray-500 text-xs text-center py-6">
        No talent data available.
      </div>
    );
  }

  return (
    <div className="w-[1200px] mx-auto content-center pt-[1.625rem]">
      <div className="flex gap-6 justify-center">
        <div className="p-6 bg-armory-stat-section rounded-md">
          <div className="text-white text-armory-section-title pb-6 font-bold">
            Talents
          </div>
          <div className="flex gap-3">
            {sorted.map((tab) => (
              <TalentGrid key={tab.tab_id} tab={tab} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6" style={{ width: GLYPH_PANEL_W }}>
          <GlyphSection label="Major Glyphs" items={major} />
          <GlyphSection label="Minor Glyphs" items={minor} />
        </div>
      </div>
    </div>
  );
};

export default TalentTree;
