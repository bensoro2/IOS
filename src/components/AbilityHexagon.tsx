import { useMemo } from "react";
import {
  ABILITY_STAT_LABELS,
  AbilityScore,
} from "@/constants/abilityStats";

interface AbilityHexagonProps {
  scores: AbilityScore[];
  size?: number;
}

const RINGS = [0.25, 0.5, 0.75, 1];

export const AbilityHexagon = ({ scores, size = 240 }: AbilityHexagonProps) => {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 34;

  const points = useMemo(() => {
    return scores.map((s, i) => {
      const angle = (-90 + i * 60) * (Math.PI / 180);
      // keep a small floor so the shape stays visible when everything is 0
      const ratio = Math.max(s.value, 4) / 100;
      return {
        ...s,
        angle,
        x: cx + Math.cos(angle) * radius * ratio,
        y: cy + Math.sin(angle) * radius * ratio,
        ax: cx + Math.cos(angle) * radius,
        ay: cy + Math.sin(angle) * radius,
        lx: cx + Math.cos(angle) * (radius + 20),
        ly: cy + Math.sin(angle) * (radius + 20),
      };
    });
  }, [scores, cx, cy, radius]);

  const ringPath = (scale: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const angle = (-90 + i * 60) * (Math.PI / 180);
      return `${cx + Math.cos(angle) * radius * scale},${cy + Math.sin(angle) * radius * scale}`;
    }).join(" ");

  const shape = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {RINGS.map((r) => (
          <polygon
            key={r}
            points={ringPath(r)}
            className="fill-muted/30 stroke-border"
            strokeWidth={1}
          />
        ))}
        {points.map((p) => (
          <line
            key={`axis-${p.stat}`}
            x1={cx}
            y1={cy}
            x2={p.ax}
            y2={p.ay}
            className="stroke-border"
            strokeWidth={1}
          />
        ))}

        <polygon
          points={shape}
          className="fill-primary/30 stroke-primary"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {points.map((p) => (
          <circle key={`dot-${p.stat}`} cx={p.x} cy={p.y} r={3} className="fill-primary" />
        ))}

        {points.map((p) => (
          <text
            key={`label-${p.stat}`}
            x={p.lx}
            y={p.ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-[9px] font-semibold"
          >
            <tspan x={p.lx} dy={-4}>
              {ABILITY_STAT_LABELS[p.stat].short}
            </tspan>
            <tspan x={p.lx} dy={11} className="fill-muted-foreground">
              {p.points}
            </tspan>
          </text>
        ))}
      </svg>
    </div>
  );
};
