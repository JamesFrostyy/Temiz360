import { useState, useEffect } from "react";
import { Firma, Siparis } from "../types";
import { sbFetch } from "../lib/supabase";

interface AdminPanelProps {
  firmalar: Firma[];
  orders: Siparis[];
  token: string;
  onFirmaYonet: () => void;
  onYukle: () => void;
}

interface FirmaIstatistik {
  firmaId: string;
  firmaAd: string;
  siparisSayisi: number;
  toplamCiro: number;
  aktifSiparis: number;
  sonSiparisTarih: string;
}

interface AylikVeri {
  ay: string;
  siparis_sayisi: number;
  toplam_ciro: number;
}

export function AdminPanel({ firmalar, orders, token, onFirmaYonet, onYukle }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "siparisler" | "raporlar">("dashboard");
  const [aylikVeri, setAylikVeri] = useState<AylikVeri[]>([]);
  const [filterFirma, setFilterFirma] = useState("Tümü");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const aylikYukle = async () => {
      try {
        const veri = await sbFetch(
          "aylik_ozet?select=ay,siparis_sayisi,toplam_ciro&order=ay.desc&limit=12",
          {},
          token
        ) as AylikVeri[];
        // Ay bazında grupla
        const grouped = veri.reduce((acc: Record<string, AylikVeri>, v) => {
          const ay = v.ay.slice(0, 7);
          if (!acc[ay]) acc[ay] = { ay, siparis_sayisi: 0, toplam_ciro: 0 };
          acc[ay].siparis_sayisi += Number(v.siparis_sayisi);
          acc[ay].toplam_ciro += Number(v.toplam_ciro);
          return acc;
        }, {});
        setAylikVeri(Object.values(grouped).slice(0, 6).reverse());
      } catch (e) {
        console.error("Aylık veri yüklenemedi:", e);
      }
    };
    aylikYukle();
  }, [token]);

  // Firma istatistikleri hesapla
  const firmaIstatistikleri: FirmaIstatistik[] = firmalar.map((f) => {
    const firmaOrders = orders.filter((o) => o.firmaId === f.id);
    const aktif = firmaOrders.filter((o) => o.durum !== "teslim_edildi").length;
    const ciro = firmaOrders.reduce((s, o) => s + o.fiyat, 0);
    const sonTarih = firmaOrders.sort((a, b) => b.tarih.localeCompare(a.tarih))[0]?.tarih || "-";
    return {
      firmaId: f.id,
      firmaAd: f.ad,
      siparisSayisi: firmaOrders.length,
      toplamCiro: ciro,
      aktifSiparis: aktif,
      sonSiparisTarih: sonTarih,
    };
  }).sort((a, b) => b.siparisSayisi - a.siparisSayisi);

  const toplamSiparis = orders.length;
  const toplamCiro = orders.reduce((s, o) => s + o.fiyat, 0);
  const aktifFirma = firmalar.filter((f) => f.aktif).length;
  const aktifSiparis = orders.filter((o) => o.durum !== "teslim_edildi").length;

  // Filtrelenmiş siparişler
  const filteredOrders = orders.filter((o) => {
    if (filterFirma !== "Tümü" && o.firmaId !== filterFirma) return false;
    if (search && !o.musteri.toLowerCase().includes(search.toLowerCase()) && !o.id.includes(search)) return false;
    return true;
  });

  const maxCiro = Math.max(...firmaIstatistikleri.map((f) => f.toplamCiro), 1);
  const maxAylikSiparis = Math.max(...aylikVeri.map((a) => a.siparis_sayisi), 1);

  const tabBtn = (key: typeof activeTab, label: string, icon: string) => (
    <button
      onClick={() => setActiveTab(key)}
      style={{
        padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer",
        fontFamily: "inherit", fontWeight: 600, fontSize: 14, transition: "all 0.2s",
        background: activeTab === key ? "#1E40AF" : "transparent",
        color: activeTab === key ? "#fff" : "#64748B",
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 100px", fontFamily: "'Poppins', sans-serif" }}>

      {/* Tab Navigasyon */}
      <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 12, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {tabBtn("dashboard", "Dashboard", "📊")}
        {tabBtn("siparisler", "Siparişler", "📋")}
        {tabBtn("raporlar", "Raporlar", "📈")}
      </div>

      {/* ─── DASHBOARD ─── */}
      {activeTab === "dashboard" && (
        <div>
          {/* Özet Kartlar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
            {[
              { label: "Aktif Firma", value: aktifFirma, icon: "🏢", color: "#2563EB", bg: "#EFF6FF" },
              { label: "Toplam Sipariş", value: toplamSiparis, icon: "📋", color: "#7C3AED", bg: "#F5F3FF" },
              { label: "Aktif İş", value: aktifSiparis, icon: "⚙️", color: "#D97706", bg: "#FFFBEB" },
              { label: "Platform Cirosu", value: `₺${toplamCiro.toLocaleString()}`, icon: "💰", color: "#059669", bg: "#ECFDF5" },
            ].map((k, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{k.icon}</div>
                  <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>{k.label}</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Firma Kartları */}
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>🏢 Firma Performansı</h3>
            <button onClick={onFirmaYonet} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              + Firma Yönet
            </button>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {firmaIstatistikleri.map((f, i) => (
              <div key={f.firmaId} style={{ background: "#fff", borderRadius: 16, padding: "16px 20px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: i === 0 ? "#FEF3C7" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏢"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{f.firmaAd}</div>
                      <div style={{ fontSize: 12, color: "#94A3B8" }}>Son sipariş: {f.sonSiparisTarih}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: "#059669" }}>₺{f.toplamCiro.toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{f.siparisSayisi} sipariş · {f.aktifSiparis} aktif</div>
                  </div>
                </div>
                {/* Ciro bar */}
                <div style={{ width: "100%", height: 6, background: "#F1F5F9", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((f.toplamCiro / maxCiro) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#3B82F6,#60A5FA)", borderRadius: 6, transition: "width 1s ease-out" }} />
                </div>
              </div>
            ))}
            {firmaIstatistikleri.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#94A3B8", fontSize: 14 }}>Henüz firma yok.</div>
            )}
          </div>
        </div>
      )}

      {/* ─── SİPARİŞLER ─── */}
      {activeTab === "siparisler" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Müşteri veya sipariş no ara..."
              style={{ flex: 1, minWidth: 200, padding: "10px 16px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14, fontFamily: "inherit", outline: "none" }}
            />
            <select
              value={filterFirma}
              onChange={(e) => setFilterFirma(e.target.value)}
              style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14, fontFamily: "inherit", background: "#fff", cursor: "pointer" }}
            >
              <option value="Tümü">Tüm Firmalar</option>
              {firmalar.map((f) => <option key={f.id} value={f.id}>{f.ad}</option>)}
            </select>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  {["No", "Firma", "Müşteri", "Tutar", "Durum", "Tarih"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>Sonuç bulunamadı.</td></tr>
                ) : filteredOrders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: 700, color: "#475569", fontSize: 12, background: "#F1F5F9", padding: "4px 8px", borderRadius: 6 }}>{o.id}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 13, color: "#475569", background: "#F8FAFC", padding: "4px 8px", border: "1px solid #E2E8F0", borderRadius: 6 }}>🏢 {o.firmaAd || "—"}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 14 }}>{o.musteri}</div>
                      <div style={{ fontSize: 12, color: "#94A3B8" }}>{o.telefon}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: 800, color: "#059669", fontSize: 15 }}>₺{o.fiyat?.toLocaleString()}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "#F1F5F9", color: "#475569" }}>{o.durum}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748B", fontSize: 13 }}>{o.tarih}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length > 0 && (
              <div style={{ padding: "12px 20px", borderTop: "1px solid #E2E8F0", fontSize: 13, color: "#64748B", background: "#F8FAFC" }}>
                Toplam <strong>{filteredOrders.length}</strong> sipariş · <strong>₺{filteredOrders.reduce((s, o) => s + o.fiyat, 0).toLocaleString()}</strong> ciro
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── RAPORLAR ─── */}
      {activeTab === "raporlar" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20 }}>

            {/* Firma Ciro Karşılaştırması */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0F172A" }}>💰 Firma Ciro Karşılaştırması</h3>
              <div style={{ display: "grid", gap: 14 }}>
                {firmaIstatistikleri.map((f) => (
                  <div key={f.firmaId}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                      <span>🏢 {f.firmaAd}</span>
                      <span>₺{f.toplamCiro.toLocaleString()} <span style={{ color: "#94A3B8", fontWeight: 500 }}>({f.siparisSayisi} sipariş)</span></span>
                    </div>
                    <div style={{ width: "100%", height: 10, background: "#F1F5F9", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ width: `${Math.round((f.toplamCiro / maxCiro) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#3B82F6,#60A5FA)", borderRadius: 6, transition: "width 1s ease-out" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aylık Büyüme */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0F172A" }}>📈 Aylık Büyüme</h3>
              {aylikVeri.length === 0 ? (
                <div style={{ color: "#94A3B8", fontSize: 14 }}>Henüz yeterli veri yok.</div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 180 }}>
                  {aylikVeri.map((a) => {
                    const yuzde = Math.round((a.siparis_sayisi / maxAylikSiparis) * 100);
                    const ayAd = new Date(a.ay + "-01").toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });
                    return (
                      <div key={a.ay} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#3B82F6" }}>{a.siparis_sayisi}</div>
                        <div style={{ width: "100%", height: `${Math.max(yuzde, 5)}%`, background: "linear-gradient(180deg,#3B82F6,#93C5FD)", borderRadius: "6px 6px 0 0", transition: "height 1s ease-out", minHeight: 8 }} />
                        <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textAlign: "center" }}>{ayAd}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {aylikVeri.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
                  {aylikVeri.slice(-1).map((a) => (
                    <div key={a.ay} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#64748B" }}>Bu ay ciro:</span>
                      <span style={{ fontWeight: 700, color: "#059669" }}>₺{Number(a.toplam_ciro).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* En Aktif Firmalar */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0F172A" }}>🏆 Sıralama</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {firmaIstatistikleri.map((f, i) => (
                  <div key={f.firmaId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: i === 0 ? "#FFFBEB" : "#F8FAFC", borderRadius: 12, border: `1px solid ${i === 0 ? "#FDE68A" : "#E2E8F0"}` }}>
                    <div style={{ fontSize: 22, width: 32, textAlign: "center" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{f.firmaAd}</div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>{f.siparisSayisi} sipariş</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#059669" }}>₺{f.toplamCiro.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}