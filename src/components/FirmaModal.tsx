import { useState, useEffect } from "react";
import { Firma } from "../types";
import { dbFirmalariGetir, dbFirmaEkle, dbFirmaGuncelle, dbFirmaSil } from "../lib/db";
import { SUPABASE_URL, SUPABASE_KEY } from "../constants";

interface FirmaModalProps {
  token: string;
  onClose: () => void;
  onSaved: () => void;
}

const inp: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0",
  fontSize: 14, fontFamily: "'Poppins', sans-serif",
  outline: "none", width: "100%", boxSizing: "border-box", background: "#fff",
};

const PLAN_CONFIG = {
  starter:    { label: "Starter",    color: "#6B7280", bg: "#F3F4F6", icon: "🌱", fiyat: "₺499/ay" },
  pro:        { label: "Pro",        color: "#2563EB", bg: "#EFF6FF", icon: "⚡", fiyat: "₺999/ay" },
  enterprise: { label: "Enterprise", color: "#7C3AED", bg: "#F5F3FF", icon: "👑", fiyat: "Özel" },
};

const BOLUM = ({ title }: { title: string }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginTop: 14, marginBottom: 6 }}>
    {title}
  </div>
);

export function FirmaModal({ token, onClose, onSaved }: FirmaModalProps) {
  const [firmalar, setFirmalar] = useState<Firma[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [aktif, setAktif] = useState(true);
  const [telefon, setTelefon] = useState("");
  const [adres, setAdres] = useState("");
  const [sehir, setSehir] = useState("");
  const [yetkiliAd, setYetkiliAd] = useState("");
  const [yetkiliUnvan, setYetkiliUnvan] = useState("");
  const [vergiNo, setVergiNo] = useState("");
  const [vergiDairesi, setVergiDairesi] = useState("");
  const [abonelikPlani, setAbonelikPlani] = useState<"starter" | "pro" | "enterprise">("starter");
  const [abonelikBaslangic, setAbonelikBaslangic] = useState(new Date().toISOString().slice(0, 10));

  const yukle = async () => {
    setLoading(true);
    const list = await dbFirmalariGetir(token);
    setFirmalar(list);
    setLoading(false);
  };

  useEffect(() => { yukle(); }, []);

  const formuTemizle = () => {
    setAd(""); setEmail(""); setAktif(true);
    setTelefon(""); setAdres(""); setSehir("");
    setYetkiliAd(""); setYetkiliUnvan("");
    setVergiNo(""); setVergiDairesi("");
    setAbonelikPlani("starter");
    setAbonelikBaslangic(new Date().toISOString().slice(0, 10));
    setIsEditing(false); setEditId(null); setErr("");
  };

  const duzenleModunaGec = (f: Firma) => {
    setAd(f.ad); setEmail(f.email); setAktif(f.aktif);
    setTelefon(f.telefon || ""); setAdres(f.adres || ""); setSehir(f.sehir || "");
    setYetkiliAd(f.yetkili_ad || ""); setYetkiliUnvan(f.yetkili_unvan || "");
    setVergiNo(f.vergi_no || ""); setVergiDairesi(f.vergi_dairesi || "");
    setAbonelikPlani(f.abonelik_plani || "starter");
    setAbonelikBaslangic(f.abonelik_baslangic || new Date().toISOString().slice(0, 10));
    setIsEditing(true); setEditId(f.id); setErr("");
  };

  const kaydet = async () => {
    if (!ad.trim()) { setErr("Firma adı zorunludur."); return; }
    setSaving(true); setErr("");
    try {
      const extraData = {
        telefon, adres, sehir,
        yetkili_ad: yetkiliAd, yetkili_unvan: yetkiliUnvan,
        vergi_no: vergiNo, vergi_dairesi: vergiDairesi,
        abonelik_plani: abonelikPlani,
        abonelik_baslangic: abonelikBaslangic,
      };

      if (isEditing && editId) {
        await dbFirmaGuncelle(token, editId, ad, aktif, extraData);
      } else {
        if (!email.trim()) { setErr("Email zorunludur."); setSaving(false); return; }
        await dbFirmaEkle(token, ad, email, extraData);
        await fetch(`${SUPABASE_URL}/auth/v1/invite`, {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      }
      formuTemizle();
      await yukle();
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const sil = async (id: string) => {
    await dbFirmaSil(token, id);
    setDeleteConfirm(null);
    await yukle();
    onSaved();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, fontFamily: "'Poppins', sans-serif", padding: 16 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>🏢 Firma Yönetimi</h2>
          <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        {/* Form */}
        <div style={{ background: isEditing ? "#EFF6FF" : "#F8FAFC", borderRadius: 14, padding: 16, border: `1.5px dashed ${isEditing ? "#93C5FD" : "#CBD5E1"}`, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isEditing ? "#1D4ED8" : "#6B7280", textTransform: "uppercase" }}>
              {isEditing ? "✏️ Firmayı Düzenle" : "➕ Yeni Firma Ekle"}
            </div>
            {isEditing && <button onClick={formuTemizle} style={{ background: "transparent", border: "none", color: "#64748B", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>İptal Et</button>}
          </div>

          {/* Temel Bilgiler */}
          <BOLUM title="Temel Bilgiler" />
          <div style={{ display: "grid", gap: 8, marginBottom: 4 }}>
            <input style={inp} value={ad} onChange={(e) => setAd(e.target.value)} placeholder="🏢 Firma adı *" />
            <input style={{ ...inp, background: isEditing ? "#F1F5F9" : "#fff", color: isEditing ? "#94A3B8" : "#0F172A" }}
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              disabled={isEditing} placeholder="📧 Firma email adresi *" />
            {isEditing && (
              <select style={inp} value={aktif ? "true" : "false"} onChange={(e) => setAktif(e.target.value === "true")}>
                <option value="true">🟢 Hesap Aktif</option>
                <option value="false">🔴 Hesap Pasif</option>
              </select>
            )}
          </div>

          {/* İletişim */}
          <BOLUM title="İletişim Bilgileri" />
          <div style={{ display: "grid", gap: 8, marginBottom: 4 }}>
            <input style={inp} value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="📞 Telefon numarası" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input style={inp} value={sehir} onChange={(e) => setSehir(e.target.value)} placeholder="🏙️ Şehir" />
              <input style={inp} value={adres} onChange={(e) => setAdres(e.target.value)} placeholder="📍 Adres" />
            </div>
          </div>

          {/* Yetkili */}
          <BOLUM title="Yetkili Kişi" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 }}>
            <input style={inp} value={yetkiliAd} onChange={(e) => setYetkiliAd(e.target.value)} placeholder="👤 Ad Soyad" />
            <input style={inp} value={yetkiliUnvan} onChange={(e) => setYetkiliUnvan(e.target.value)} placeholder="💼 Unvan" />
          </div>

          {/* Vergi */}
          <BOLUM title="Vergi Bilgileri" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 }}>
            <input style={inp} value={vergiNo} onChange={(e) => setVergiNo(e.target.value)} placeholder="🔢 Vergi No" />
            <input style={inp} value={vergiDairesi} onChange={(e) => setVergiDairesi(e.target.value)} placeholder="🏛️ Vergi Dairesi" />
          </div>

          {/* Abonelik */}
          <BOLUM title="Abonelik Planı" />
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {(Object.entries(PLAN_CONFIG) as [string, typeof PLAN_CONFIG.starter][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setAbonelikPlani(key as "starter" | "pro" | "enterprise")}
                  style={{
                    padding: "10px 8px", borderRadius: 10, border: `2px solid ${abonelikPlani === key ? cfg.color : "#E2E8F0"}`,
                    background: abonelikPlani === key ? cfg.bg : "#fff", cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{cfg.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: abonelikPlani === key ? cfg.color : "#475569" }}>{cfg.label}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{cfg.fiyat}</div>
                </button>
              ))}
            </div>
            <input style={inp} type="date" value={abonelikBaslangic} onChange={(e) => setAbonelikBaslangic(e.target.value)} />
          </div>

          {err && <div style={{ color: "#DC2626", fontSize: 12, marginTop: 10 }}>❌ {err}</div>}

          <button
            onClick={kaydet}
            disabled={saving}
            style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", marginTop: 14, background: isEditing ? "linear-gradient(135deg,#059669,#10B981)" : "linear-gradient(135deg,#1E40AF,#3B82F6)", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}
          >
            {saving ? "İşleniyor..." : isEditing ? "✅ Değişiklikleri Kaydet" : "➕ Firma Ekle & Davet Gönder"}
          </button>
        </div>

        {/* Firma Listesi */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", marginBottom: 10, textTransform: "uppercase" }}>
          Mevcut Firmalar ({firmalar.length})
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 20, color: "#9CA3AF" }}>Yükleniyor...</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {firmalar.length === 0 && (
              <div style={{ textAlign: "center", padding: 20, color: "#9CA3AF", fontSize: 14 }}>Henüz firma yok</div>
            )}
            {firmalar.map((f) => {
              const plan = PLAN_CONFIG[f.abonelik_plani || "starter"];
              const isExpanded = expandedId === f.id;
              return (
                <div key={f.id} style={{ background: "#F8FAFC", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
                  {/* Kart başlığı */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? null : f.id)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        🏢 {f.ad}
                        {!f.aktif && <span style={{ fontSize: 10, background: "#FEE2E2", color: "#DC2626", padding: "2px 6px", borderRadius: 4 }}>Pasif</span>}
                        <span style={{ fontSize: 10, background: plan.bg, color: plan.color, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>{plan.icon} {plan.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{f.email}</div>
                      {f.sehir && <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>📍 {f.sehir}</div>}
                    </div>
                    <div style={{ fontSize: 16, color: "#94A3B8", marginLeft: 8 }}>{isExpanded ? "▲" : "▼"}</div>
                  </div>

                  {/* Genişletilmiş detay */}
                  {isExpanded && (
                    <div style={{ padding: "0 14px 14px", borderTop: "1px solid #E5E7EB" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12, fontSize: 12, color: "#475569" }}>
                        {f.telefon && <div>📞 {f.telefon}</div>}
                        {f.adres && <div>📍 {f.adres}</div>}
                        {f.yetkili_ad && <div>👤 {f.yetkili_ad} {f.yetkili_unvan ? `— ${f.yetkili_unvan}` : ""}</div>}
                        {f.vergi_no && <div>🔢 VN: {f.vergi_no}</div>}
                        {f.vergi_dairesi && <div>🏛️ {f.vergi_dairesi} VD</div>}
                        {f.abonelik_baslangic && <div>📅 Başlangıç: {f.abonelik_baslangic}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button onClick={() => { duzenleModunaGec(f); setExpandedId(null); }} style={{ flex: 1, background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>✏️ Düzenle</button>
                        <button onClick={() => setDeleteConfirm(f.id)} style={{ flex: 1, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>🗑️ Sil</button>
                      </div>
                    </div>
                  )}

                  {deleteConfirm === f.id && (
                    <div style={{ background: "#FEF2F2", padding: "12px 14px", borderTop: "1px solid #FECACA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#991B1B", fontWeight: 600 }}>⚠️ Firmayı silmek istiyor musunuz?</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setDeleteConfirm(null)} style={{ background: "#fff", border: "1px solid #FECACA", color: "#475569", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>İptal</button>
                        <button onClick={() => sil(f.id)} style={{ background: "#DC2626", border: "none", color: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>Evet, Sil</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}