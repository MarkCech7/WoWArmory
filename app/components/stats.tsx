const POWER_CONFIG: Record<number, { color: string; label: string }> = {
  1: { color: "#1c8aff", label: "Mana" },
  2: { color: "#ab0000", label: "Rage" },
  3: { color: "#ccaa00", label: "Energy" },
  6: { color: "#00accb", label: "Runic Power" },
};

export function StatRow({
  label,
  value,
  suffix = "",
  highlight = false,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-armory-stat-name w-44 shrink-0">{label}</span>
      <span
        className={`w-16 text-right shrink-0 ${
          highlight ? "text-[#1eff00]" : "text-white"
        }`}
      >
        {value}
        {suffix}
      </span>
    </div>
  );
}

export function StatSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 max-w-full">
      <div className="mb-1 tracking-wide font-bold text-white text-armory-stat-section-title">
        {title}
      </div>
      {children}
    </div>
  );
}

export function sanitizeStat(value: number): number {
  if (value > 2_000_000_000) return 0;
  return value;
}

function GeneralStatsBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 100;

  return (
    <div className="relative h-7 flex-none bg-[#1a0f00] rounded border border-amber-900/40 overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded"
        style={{
          width: `${pct}%`,
          backgroundColor: color ?? "#248000", // default = green
        }}
      />
      <span className="absolute inset-0 flex items-center justify-between px-2 text-[13px] font-bold text-white drop-shadow">
        <span>{label}</span>
        <span>{value}</span>
      </span>
    </div>
  );
}

export function GeneralStats({
  charInfo,
  charStats,
}: {
  charInfo: any;
  charStats: any;
}) {
  const powerConfig =
    charInfo.class === 1
      ? POWER_CONFIG[2]
      : charInfo.class === 4
      ? POWER_CONFIG[3]
      : charInfo.class === 6
      ? POWER_CONFIG[6]
      : POWER_CONFIG[1];

  const powerValue =
    charInfo.class === 1
      ? charStats.power2
      : charInfo.class === 4
      ? charStats.power3
      : charInfo.class === 6
      ? charStats.power6
      : charStats.power1;

  return (
    <div className="flex flex-col gap-2">
      <GeneralStatsBar
        label="Health"
        value={charStats.health}
        max={charStats.health}
      />
      <GeneralStatsBar
        label={powerConfig.label}
        value={powerValue}
        max={powerValue}
        color={powerConfig.color}
      />
    </div>
  );
}
