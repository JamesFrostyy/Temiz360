import { useState } from "react";
import { HaliTuru } from "../types";

interface HaliModalProps {
  turler: HaliTuru[];
  onClose: () => void;
  onSave: (liste: HaliTuru[]) => void;
}

const inp: React.CSSProperties = {
  padding: "10px", borderRadius: 8, border: "1.5px solid #E2E8F0",
  fontSize: 14, fontFamily: "'Poppins', sans-serif",
  outline: "none", background: "#fff", boxSizing: "border-box",
};

const IKONLAR = ["🟫", "🟦", "🐑", "✨", "🦁", "🔶", "🧒", "🚿", "🪄", "🌿", "⭐", "🎨"];

export function HaliModal({ turler, onClose, onSave }: HaliModalProps) {
  const [liste, setListe] = useState<HaliTuru[]>(turler.map((t) => ({ ...t })));
  const [yeni, setYeni] = useState({ ad: "", birimFiyat: "", icon: "🪄" });

  const guncelle = (i: number, f: keyof HaliTuru, v: string | number) => {
    const k = [...liste];
    k[i] = { ...k[i], [f]: f === "birimFiyat" ? +v : v };
    setListe(k);
  };

  const ekle = () => {
    if (!yeni.ad || !yeni.birimFiyat) return;
    setListe([...liste, {
      id: yeni.ad.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
      ad: yeni.ad,
      birimFiyat: +yeni.birimFiyat,
      icon: yeni.icon,
    }]);
    setYeni({ ad: "", birimFiyat: "", icon: "🪄" });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 2000, fontFamily: "'Poppins', sans-serif" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px", width: "100%", maxWidth: 600, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: "#E2E8F0", borderRadius: 4, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>🪄 Halı Türleri ve Fiyatlar</h2>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        {/* Mevcut Liste */}
        <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
          {liste.map((t, i) => (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "44px 1fr 90px 36px", gap: 8, alignItems: "center" }}>
              <select style={{ ...inp, padding: "4px", fontSize: 20, textAlign: "center" }} value={t.icon} onChange={(e) => guncelle(i, "icon", e.target.value)}>
                {IKONLAR.map((ik) => <option key={ik} value={ik}>{ik}</option>)}
              </select>
              <input style={{ ...inp, width: "100%" }} value={t.ad} onChange={(e) => guncelle(i, "ad", e.target.value)} />
              <input style={{ ...inp, textAlign: "center" }} type="number" value={t.birimFiyat} onChange={(e) => guncelle(i, "birimFiyat", e.target.value)} placeholder="₺/m²" />
              <button onClick={() => setListe(liste.filter((_, idx) => idx !== i))} style={{ background: "#FEE2E2", border: "none", borderRadius: 8, width: 36, height: 36, cursor: "pointer", color: "#DC2626", fontSize: 16 }}>✕</button>
            </div>
          ))}
        </div>

        {/* Yeni Ekle */}
        <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16, border: "1.5px dashed #CBD5E1", marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 12, textTransform: "uppercase" }}>Yeni Ekle</div>
          <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 90px auto", gap: 8, alignItems: "center" }}>
            <select style={{ ...inp, padding: "4px", fontSize: 20, textAlign: "center" }} value={yeni.icon} onChange={(e) => setYeni({ ...yeni, icon: e.target.value })}>
              {IKONLAR.map((ik) => <option key={ik} value={ik}>{ik}</option>)}
            </select>
            <input style={{ ...inp, width: "100%" }} value={yeni.ad} onChange={(e) => setYeni({ ...yeni, ad: e.target.value })} placeholder="Tür adı" />
            <input style={{ ...inp, textAlign: "center" }} type="number" value={yeni.birimFiyat} onChange={(e) => setYeni({ ...yeni, birimFiyat: e.target.value })} placeholder="₺/m²" />
            <button onClick={ekle} style={{ background: "#EFF6FF", color: "#2563EB", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>+ Ekle</button>
          </div>
        </div>

        <button onClick={() => onSave(liste)} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#2563EB,#3B82F6)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 16, fontFamily: "inherit" }}>
          Değişiklikleri Kaydet
        </button>
      </div>
    </div>
  );
}