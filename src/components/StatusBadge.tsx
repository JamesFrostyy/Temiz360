import { STATUS_CONFIG } from "../constants";

interface StatusBadgeProps {
  durum: string;
}

export function StatusBadge({ durum }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[durum];
  if (!cfg) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 12, fontWeight: 700,
      fontFamily: "'Poppins', sans-serif",
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}