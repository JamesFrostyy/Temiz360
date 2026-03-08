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
  outline: "none", width: "100%", boxSizing: "border-box",
};

export function FirmaModal({ token, onClose, onSaved }: FirmaModalProps) {
  const [firmalar, setFirmalar] = useState<Firma[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [aktif, setAktif] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const yukle = async () => {
    setLoading(true);
    const list = await dbFirmalariGetir(token);
    setFirmalar(list);
    setLoading(false);
  };

  useEffect(() => { yukle(); }, []);

  const formuTemizle = () => {
    setAd(""); setEmail(""); setAktif(true);
    setIsEditing(false); setEditId(null); setErr("");
  };

  const duzenleModunaGec = (f: Firma) => {
    setAd(f.ad); setEmail(f.email); setAktif(f.aktif);
    setIsEditing(true); setEditId(f.id); setErr("");
  };

  const kaydet = async () => {
    if (!ad.trim()) { setErr("Firma adı zorunludur."); return; }
    setSaving(true);
    setErr("");
    try {
      if (isEditing && editId) {
        await dbFirmaGuncelle(token, editId, ad, aktif);
      } else {
        if (!email.trim()) { setErr("Email zorunludur."); setSaving(false); return; }
        await dbFirmaEkle(token, ad, email);
        // Davet maili gönder
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
      <div style={{ background: "#fff", borderRadius: 20, padding: 24, width: "100%", maxWidth: 500, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>🏢 Firma Yönetimi</h2>
          <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer" }}>✕</button>
        </div>

        {/* Form */}
        <div style={{ background: isEditing ? "#EFF6FF" : "#F8FAFC", borderRadius: 12, padding: 14, border: `1.5px dashed ${isEditing ? "#93C5FD" : "#CBD5E1"}`, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: isEditing ? "#1D4ED8" : "#6B7280", textTransform: "uppercase" }}>
              {isEditing ? "✏️ Firmayı Düzenle" : "Yeni Firma Ekle"}
            </div>
            {isEditing && <button onClick={formuTemizle} style={{ background: "transparent", border: "none", color: "#64748B", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>İptal Et</button>}
          </div>
          <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
            <input style={inp} value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Firma adı" />
            <input style={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isEditing} placeholder="Firma email adresi" />
            {isEditing && (
              <select style={inp} value={aktif ? "true" : "false"} onChange={(e) => setAktif(e.target.value === "true")}>
                <option value="true">🟢 Hesap Aktif</option>
                <option value="false">🔴 Hesap Pasif</option>
              </select>
            )}
          </div>
          {err && <div style={{ color: "#DC2626", fontSize: 12, marginBottom: 8 }}>❌ {err}</div>}
          <button onClick={kaydet} disabled={saving} style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: isEditing ? "linear-gradient(135deg,#059669,#10B981)" : "linear-gradient(135deg,#1E40AF,#3B82F6)", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>
            {saving ? "İşleniyor..." : isEditing ? "Değişiklikleri Kaydet" : "+ Firma Ekle & Davet Gönder"}
          </button>
        </div>

        {/* Liste */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", marginBottom: 8, textTransform: "uppercase" }}>Mevcut Firmalar</div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 20, color: "#9CA3AF" }}>Yükleniyor...</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {firmalar.length === 0 && <div style={{ textAlign: "center", padding: 20, color: "#9CA3AF", fontSize: 14 }}>Henüz firma yok</div>}
            {firmalar.map((f) => (
              <div key={f.id} style={{ background: "#F8FAFC", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                      🏢 {f.ad}
                      {!f.aktif && <span style={{ fontSize: 10, background: "#FEE2E2", color: "#DC2626", padding: "2px 6px", borderRadius: 4 }}>Pasif</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{f.email}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => duzenleModunaGec(f)} style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Düzenle</button>
                    <button onClick={() => setDeleteConfirm(f.id)} style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sil</button>
                  </div>
                </div>
                {deleteConfirm === f.id && (
                  <div style={{ background: "#FEF2F2", padding: "12px 14px", borderTop: "1px solid #FECACA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#991B1B", fontWeight: 600 }}>⚠️ Firmayı silmek istiyor musunuz?</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setDeleteConfirm(null)} style={{ background: "#fff", border: "1px solid #FECACA", color: "#475569", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>İptal</button>
                      <button onClick={() => sil(f.id)} style={{ background: "#DC2626", border: "none", color: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>Evet, Sil</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}