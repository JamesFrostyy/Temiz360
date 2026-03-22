import { Siparis, HaliTuru, Firma, firmaOzellikVar } from "../types";
import { STATUS_CONFIG } from "../constants";
import { toplamAdet, toplamM2 } from "../lib/db";
import { StatusBadge } from "./StatusBadge";

interface DetailSheetProps {
  order: Siparis | null;
  ht: HaliTuru[];
  isAdmin: boolean;
  firma: Firma | null | undefined;
  onClose: () => void;
  onStatusChange: (id: string, durum: string) => void;
  onOdeme: (id: string, odendi: boolean) => void; // 📍 YENİ: Tahsilat Fonksiyonu
  onEdit: (order: Siparis) => void;
  onSmsOpen: (order: Siparis) => void;
  onDelete?: (id: string) => void;
}

export function DetailSheet({ order, ht, isAdmin, firma, onClose, onStatusChange, onOdeme, onEdit, onSmsOpen, onDelete }: DetailSheetProps) {
  if (!order) return null;
  const keys = Object.keys(STATUS_CONFIG);
  const idx = keys.indexOf(order.durum);
  const smsSayisi = Object.values(order.smsDurum || {}).filter(Boolean).length;

  const bildirimLabel = () => {
    const suffix = smsSayisi > 0 ? ` (${smsSayisi})` : "";
    return `💬 Bildirim${suffix}`;
  };

  const paketRenk = firma?.paket === "enterprise"
    ? { bg: "#F5F3FF", color: "#8B5CF6", border: "#DDD6FE", label: "Enterprise" }
    : firma?.paket === "pro"
    ? { bg: "#F0F9FF", color: "#0EA5E9", border: "#BAE6FD", label: "Pro" }
    : { bg: "#EEF2FF", color: "#6366F1", border: "#C7D2FE", label: "Starter" };

  const adresParcalari = [order.mahalle, order.acik_adres, order.ilce, order.il].filter(Boolean);
  const gosterilecekAdres = adresParcalari.length > 0 ? adresParcalari.join(" - ") : order.adres;
  const haritaSorgusu = adresParcalari.length > 0 ? adresParcalari.join(" ") : order.adres;
  const isHaritaAktif = firma?.paket === "pro" || firma?.paket === "enterprise";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "flex-start", paddingTop: "6vh", justifyContent: "center", zIndex: 800, fontFamily: "'Poppins', sans-serif" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px", width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: "#E2E8F0", borderRadius: 4, margin: "0 auto 20px" }} />

        {/* Başlık */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>
              {order.id}{isAdmin && order.firmaAd ? ` · 🏢 ${order.firmaAd}` : ""}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "4px 0 8px" }}>{order.musteri}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge durum={order.durum} />
              {!isAdmin && firma?.paket && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: paketRenk.bg, color: paketRenk.color, border: `1px solid ${paketRenk.border}` }}>
                  {paketRenk.label}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        {/* Süreç */}
        <div style={{ background: "#F8FAFC", borderRadius: 16, padding: 16, marginBottom: 16, border: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 16, textTransform: "uppercase" }}>İşlem Süreci</div>
          <div style={{ display: "flex", alignItems: "center", overflowX: "auto", paddingBottom: 8 }}>
            {keys.map((s, i) => {
              const cfg = STATUS_CONFIG[s];
              const done = i <= idx;
              const cur = i === idx;
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: done ? cfg.color : "#E2E8F0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, color: done ? "#fff" : "#94A3B8", fontWeight: 700,
                      boxShadow: cur ? `0 0 0 4px ${cfg.bg}` : "none", transition: "all 0.3s",
                    }}>
                      {done ? (cur ? cfg.icon : "✓") : ""}
                    </div>
                    <div style={{ fontSize: 10, color: done ? "#334155" : "#94A3B8", fontWeight: cur ? 700 : 500, textAlign: "center", maxWidth: 50 }}>{cfg.label}</div>
                  </div>
                  {i < keys.length - 1 && <div style={{ width: 20, height: 2, background: i < idx ? cfg.color : "#E2E8F0", flexShrink: 0, marginBottom: 24 }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Halı Detayları */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase" }}>Halı Detayları</div>
          {(order.haliKalemleri || []).map((k, i) => {
            const tur = ht.find((t) => t.id === k.turId);
            const kalemTutar = (k.birimFiyat ?? tur?.birimFiyat ?? 0) * (k.m2 || 0) * (k.adet || 1);
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{tur?.icon} {tur?.ad}</span>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#64748B" }}>{k.adet}ad · {k.m2}m²</span>
                  <span style={{ fontWeight: 800, color: "#0F172A", fontSize: 15 }}>₺{kalemTutar}</span>
                </div>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", background: "#EFF6FF", borderRadius: 12, marginTop: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1E40AF" }}>
              {toplamAdet(order.haliKalemleri || [])} Halı · {toplamM2(order.haliKalemleri || [])} m²
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#1E40AF" }}>₺{order.fiyat?.toLocaleString()}</span>
          </div>
        </div>

        {/* 📍 YENİ: TAHSİLAT & BORÇ KONTROLÜ */}
        <div style={{ background: order.odendi ? "#F0FDF4" : "#FEF2F2", borderRadius: 16, padding: "16px 20px", marginBottom: 16, border: `1.5px solid ${order.odendi ? "#BBF7D0" : "#FECACA"}`, transition: "all 0.3s" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
             <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: order.odendi ? "#D1FAE5" : "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                  {order.odendi ? "💵" : "📒"}
                </div>
                <div>
                   <div style={{ fontSize: 13, fontWeight: 700, color: order.odendi ? "#065F46" : "#991B1B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                     Tahsilat Durumu
                   </div>
                   <div style={{ fontSize: 16, fontWeight: 800, color: order.odendi ? "#059669" : "#DC2626", marginTop: 2 }}>
                     {order.odendi ? "✓ Ödendi" : "⚠️ Ödeme Bekliyor"}
                   </div>
                </div>
             </div>
             
             <div>
                {!order.odendi ? (
                   <button onClick={() => onOdeme(order.id, true)} style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "#059669", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit", boxShadow: "0 4px 6px -1px rgba(5,150,105,0.3)", display: "flex", alignItems: "center", gap: 6 }}>
                     ✓ Tahsilat Al
                   </button>
                ) : (
                   <button onClick={() => onOdeme(order.id, false)} style={{ padding: "8px 14px", borderRadius: 8, background: "#fff", color: "#DC2626", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit", border: "1.5px solid #FECACA" }}>
                     ✕ İptal (Borç)
                   </button>
                )}
             </div>
          </div>
        </div>

        {/* İletişim & Adres & Harita */}
        <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 10, textTransform: "uppercase" }}>İletişim & Adres</div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>📞</span>
              <a href={`tel:${order.telefon}`} style={{ color: "#2563EB", fontWeight: 600, fontSize: 15, textDecoration: "none" }}>{order.telefon}</a>
            </div>
            
            {gosterilecekAdres && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 16 }}>📍</span>
                <div style={{ flex: 1 }}>
                  <span style={{ color: "#334155", fontSize: 14, display: "block", marginBottom: 8 }}>{gosterilecekAdres}</span>
                  {isHaritaAktif ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a href={`http://maps.google.com/?q=${encodeURIComponent(haritaSorgusu)}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#059669", background: "#F0FDF4", padding: "8px 12px", borderRadius: 8, textDecoration: "none", border: "1px solid #BBF7D0", transition: "all 0.2s" }}>🗺️ Google Maps</a>
                      <a href={`https://yandex.com.tr/harita/?text=${encodeURIComponent(haritaSorgusu)}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#DC2626", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8, textDecoration: "none", border: "1px solid #FECACA", transition: "all 0.2s" }}>📍 Yandex Navi</a>
                    </div>
                  ) : (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#94A3B8", background: "#F1F5F9", padding: "6px 12px", borderRadius: 8, border: "1px dashed #CBD5E1" }}>🔒 Harita navigasyonu Pro pakete özeldir</div>
                  )}
                </div>
              </div>
            )}

            {order.notlar && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 16 }}>📝</span>
                <span style={{ color: "#334155", fontSize: 14 }}>{order.notlar}</span>
              </div>
            )}
          </div>
        </div>

        {/* Durum Değiştir */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 10, textTransform: "uppercase" }}>Durumu Güncelle</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {keys.map((s) => {
              const cfg = STATUS_CONFIG[s];
              const aktif = order.durum === s;
              return (
                <button key={s} onClick={() => onStatusChange(order.id, s)} style={{
                  padding: "8px 14px", borderRadius: 20,
                  border: `1.5px solid ${aktif ? cfg.color : "#E2E8F0"}`,
                  background: aktif ? cfg.bg : "#fff",
                  color: aktif ? cfg.color : "#64748B",
                  cursor: "pointer", fontWeight: 600, fontSize: 12,
                  fontFamily: "inherit", transition: "all 0.2s",
                }}>
                  {cfg.icon} {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Aksiyonlar */}
        <div style={{ display: "grid", gridTemplateColumns: onDelete ? "1fr 1fr 1fr" : "1fr 1fr", gap: 10 }}>
          <button onClick={() => onEdit(order)} style={{ padding: 14, borderRadius: 12, border: "none", background: "#EFF6FF", color: "#2563EB", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>✏️ Düzenle</button>
          <button onClick={() => onSmsOpen(order)} style={{ padding: 14, borderRadius: 12, border: "none", background: "#F0FDF4", color: "#059669", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>{bildirimLabel()}</button>
          {onDelete && <button onClick={() => onDelete(order.id)} style={{ padding: 14, borderRadius: 12, border: "none", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>🗑️ Sil</button>}
        </div>
      </div>
    </div>
  );
}