import { StatusCfg } from "../types";

export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL!;
export const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY!;

export const STATUS_CONFIG: Record<string, StatusCfg> = {
  bekliyor:      { label: "Bekliyor",       color: "#F59E0B", bg: "#FEF3C7", icon: "⏳" },
  toplandı:      { label: "Toplandı",       color: "#3B82F6", bg: "#DBEAFE", icon: "📦" },
  yıkamada:      { label: "Yıkamada",       color: "#8B5CF6", bg: "#EDE9FE", icon: "🫧" },
  kurutuluyor:   { label: "Kurutuluyor",    color: "#06B6D4", bg: "#CFFAFE", icon: "💨" },
  hazır:         { label: "Hazır",          color: "#10B981", bg: "#D1FAE5", icon: "✅" },
  dağıtımda:     { label: "Dağıtımda",      color: "#F97316", bg: "#FFEDD5", icon: "🚚" },
  teslim_edildi: { label: "Teslim Edildi",  color: "#6B7280", bg: "#F3F4F6", icon: "🏠" },
};

export const STATUSLAR = ["Tümü", ...Object.keys(STATUS_CONFIG)];

export const VARSAYILAN_FIYAT_LISTESI = [
  { ad: "Klasik / Düz",        birimFiyat: 25, icon: "🟫" },
  { ad: "Akrilik",             birimFiyat: 30, icon: "🟦" },
  { ad: "Yün",                 birimFiyat: 45, icon: "🐑" },
  { ad: "İpek / Bambu",        birimFiyat: 80, icon: "✨" },
  { ad: "Shaggy / Tüylü",      birimFiyat: 40, icon: "🦁" },
  { ad: "Kilim / Düz Dokuma",  birimFiyat: 20, icon: "🔶" },
  { ad: "Çocuk Odası Halısı",  birimFiyat: 28, icon: "🧒" },
  { ad: "Banyo / Kapı Paspası",birimFiyat: 15, icon: "🚿" },
];