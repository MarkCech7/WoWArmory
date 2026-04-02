const SKILL_ICON_OVERRIDES: Record<number, string> = {
  762: "spell_nature_swiftness",
};
const SECONDARY_SKILL_IDS = [185, 356, 129, 762]; // Cooking, Fishing, First Aid, Riding
const SECONDARY_SKILL_META: Record<number, { name: string; icon: string }> = {
  185: { name: "Cooking", icon: "inv_misc_food_15" },
  356: { name: "Fishing", icon: "trade_fishing" },
  129: { name: "First Aid", icon: "spell_holy_sealofsacrifice" },
  762: { name: "Riding", icon: "spell_nature_swiftness" },
};

function getSkillIcon(prof: any): string | null {
  return SKILL_ICON_OVERRIDES[prof.skill] ?? prof.icon_name ?? null;
}

export function Professions({ skills }: { skills: any[] }) {
  const professions = skills.filter((s) => s.category_id === 11);
  const slots = [professions[0] ?? null, professions[1] ?? null];

  return (
    <div className="flex flex-col gap-2">
      {slots.map((prof, i) => {
        const isPlaceholder = prof === null;
        return (
          <div key={i} className="flex items-center gap-2">
            <img
              src={`/app/assets/icons/${
                isPlaceholder
                  ? "trade_engineering"
                  : getSkillIcon(prof) ?? prof.icon_name ?? "trade_engineering"
              }.png`}
              alt={isPlaceholder ? `Profession ${i + 1}` : prof.skill_name}
              className={`w-7 h-7 rounded border border-amber-900/50 shrink-0 ${
                isPlaceholder ? "grayscale opacity-40" : ""
              }`}
            />
            <div
              className={`relative flex-1 h-6 rounded border overflow-hidden w-[300px] ${
                isPlaceholder
                  ? "bg-[#1a0f00]/50 border-amber-900/20"
                  : "bg-[#1a0f00] border-amber-900/40"
              }`}
            >
              {!isPlaceholder && (
                <div
                  className="absolute inset-y-0 left-0 bg-[#4a7c10] rounded"
                  style={{
                    width: `${Math.min((prof.value / prof.max) * 100, 100)}%`,
                  }}
                />
              )}
              <span
                className={`absolute inset-0 flex items-center px-2 text-xs font-bold drop-shadow ${
                  isPlaceholder ? "text-white/25" : "text-white"
                }`}
              >
                {isPlaceholder ? `Profession ${i + 1}` : prof.skill_name}
              </span>
            </div>
            <span
              className={`font-bold text-sm w-7 text-right shrink-0 ${
                isPlaceholder ? "text-white/25" : "text-white"
              }`}
            >
              {isPlaceholder ? "N/A" : prof.max}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function SecondarySkills({ skills }: { skills: any[] }) {
  const secondary = SECONDARY_SKILL_IDS.map((id) => ({
    id,
    data: skills.find((s) => s.skill === id) ?? null,
  }));

  return (
    <div className="flex flex-col gap-2">
      {secondary.map(({ id, data }) => {
        const isPlaceholder = data === null;
        const meta = SECONDARY_SKILL_META[id];
        const icon = isPlaceholder
          ? meta.icon
          : getSkillIcon(data) ?? data.icon_name ?? meta.icon;
        const name = isPlaceholder ? meta.name : data.skill_name;

        return (
          <div key={id} className="flex items-center gap-2">
            <img
              src={`/app/assets/icons/${icon}.png`}
              alt={name}
              className={`w-7 h-7 rounded border border-amber-900/50 shrink-0 ${
                isPlaceholder ? "grayscale opacity-40" : ""
              }`}
            />
            <div
              className={`relative flex-1 h-6 rounded border overflow-hidden ${
                isPlaceholder
                  ? "bg-[#1a0f00]/50 border-amber-900/20"
                  : "bg-[#1a0f00] border-amber-900/40"
              }`}
            >
              {!isPlaceholder && (
                <div
                  className="absolute inset-y-0 left-0 bg-[#4a7c10] rounded"
                  style={{
                    width: `${Math.min((data.value / data.max) * 100, 100)}%`,
                  }}
                />
              )}
              <span
                className={`absolute inset-0 flex items-center px-2 text-xs font-bold drop-shadow ${
                  isPlaceholder ? "text-white/25" : "text-white"
                }`}
              >
                {name}
              </span>
            </div>
            <span
              className={`font-bold text-sm w-7 text-right shrink-0 ${
                isPlaceholder ? "text-white/25" : "text-white"
              }`}
            >
              {isPlaceholder ? "N/A" : data.max}
            </span>
          </div>
        );
      })}
    </div>
  );
}
