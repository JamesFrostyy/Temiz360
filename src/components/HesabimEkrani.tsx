import { useState, useEffect } from "react";
import { Firma, PAKETLER, PaketTip } from "../types";
import { sbFetch } from "../lib/supabase";
import { STATUS_CONFIG } from "../constants";
import { ADRES_DATA } from "../data/adres";

interface HesabimEkraniProps {
  firma: Firma | null | undefined;
  token: string;
  onYukle: () => void;
}

const HESAP_DURUM_CFG: Record<string, {
  label: string; color: string; bg: string; border: string; icon: string; aciklama: string
}> = {
  demo:    { label: "Demo",            color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", icon: "🧪", aciklama: "Deneme süreniz aktif" },
  aktif:   { label: "Aktif",           color: "#059669", bg: "#F0FDF4", border: "#BBF7D0", icon: "✅", aciklama: "Aboneliğiniz aktif" },
  gecikme: { label: "Ödeme Gecikmeli", color: "#D97706", bg: "#FFF7ED", border: "#FDE68A", icon: "⚠️", aciklama: "Ödemeniz gecikmiş" },
  pasif:   { label: "Hesap Pasif",     color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: "🔴", aciklama: "Hesabınız donduruldu" },
  iptal:   { label: "İptal",           color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", icon: "❌", aciklama: "Abonelik iptal edildi" },
};

function gunFarki(tarih?: string): number {
  if (!tarih) return 999;
  return Math.ceil((new Date(tarih).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function tarihFormat(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export function HesabimEkrani({ firma, token, onYukle }: HesabimEkraniProps) {
  const [showOdeme, setShowOdeme] = useState(false);
  const [otoSmsAktif, setOtoSmsAktif] = useState(false);
  const [otoSmsDurumlar, setOtoSmsDurumlar] = useState<string[]>([]);
  const [hizmetIli, setHizmetIli] = useState<string>("");
  const [hizmetIlceleri, setHizmetIlceleri] = useState<string[]>([]);

  useEffect(() => {
    if (!firma?.id) return;
    const ayarlariGetir = async () => {
      try {
        const data = (await sbFetch(`firmalar?id=eq.${firma.id}&select=oto_sms_aktif,oto_sms_durumlar,hizmet_ili,hizmet_ilceleri`, {}, token)) as any[];
        if (data && data.length > 0) {
          const f = data[0];
          setOtoSmsAktif(f.oto_sms_aktif || false);
          setHizmetIli(f.hizmet_ili || "");
          setHizmetIlceleri(f.hizmet_ilceleri || []);
          let arr: string[] = [];
          if (Array.isArray(f.oto_sms_durumlar)) arr = f.oto_sms_durumlar;
          else if (typeof f.oto_sms_durumlar === 'string') {
            const str = (f.oto_sms_durumlar as string).replace(/^{|}$/g, '');
            arr = str ? str.split(',') : [];
          }
          setOtoSmsDurumlar(arr);
        }
      } catch (err) { console.error("Ayarlar veritabanından çekilemedi:", err); }
    };
    ayarlariGetir();
  }, [firma?.id, token]);

  const handleIlceToggle = async (ilce: string) => {
    const yeniIlceler = hizmetIlceleri.includes(ilce) ? hizmetIlceleri.filter(i => i !== ilce) : [...hizmetIlceleri, ilce];
    setHizmetIlceleri(yeniIlceler);
    try {
      await sbFetch(`firmalar?id=eq.${firma?.id}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ hizmet_ilceleri: yeniIlceler }) }, token);
    } catch (err) {
      setHizmetIlceleri(hizmetIlceleri);
      alert("Bölge ayarı kaydedilemedi.");
    }
  };

  if (!firma) {
    return <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontFamily: "'Poppins', sans-serif" }}>Firma bilgisi yüklenemedi.</div>;
  }

  const paketKey = (firma.paket || "starter") as PaketTip;
  const paket = PAKETLER[paketKey];
  const durumCfg = HESAP_DURUM_CFG[firma.hesap_durum || "demo"];
  const smsKredisi = firma.sms_kredisi ?? 0;
  const smsYuzde = Math.min(100, Math.round((smsKredisi / 50) * 100));
  const demKalan = gunFarki(firma.demo_bitis);
  const odemeKalan = gunFarki(firma.sonraki_odeme_tarihi);
  const paketSirasi: PaketTip[] = ["starter", "pro", "enterprise"];
  const mevcutIndex = paketSirasi.indexOf(paketKey);
  const secilebilenPaketler = firma.hesap_durum === "demo" ? paketSirasi : paketSirasi.filter((_, i) => i >= mevcutIndex);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 100px", fontFamily: "'Poppins', sans-serif" }}>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0F172A" }}>👤 Hesabım</h2>
        <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 14 }}>Paket bilgileriniz ve operasyon ayarlarınız</p>
      </div>

      {/* 📍 DESKTOP İÇİN 3 SÜTUNLU GRID DÜZENİ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, alignItems: "start" }}>

        {/* 1. SÜTUN: ABONELİK VE PROFİL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          <div style={{ background: durumCfg.bg, border: `1.5px solid ${durumCfg.border}`, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 32 }}>{durumCfg.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: durumCfg.color }}>{durumCfg.label}</div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{durumCfg.aciklama}</div>
            </div>
            {firma.hesap_durum === "demo" && firma.demo_bitis && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: demKalan <= 3 ? "#DC2626" : durumCfg.color }}>{Math.max(0, demKalan)}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>gün kaldı</div>
              </div>
            )}
            {(firma.hesap_durum === "aktif" || firma.hesap_durum === "gecikme") && firma.sonraki_odeme_tarihi && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: odemeKalan <= 3 ? "#DC2626" : "#059669" }}>
                  {odemeKalan < 0 ? `${Math.abs(odemeKalan)}g gecikme` : odemeKalan === 0 ? "Bugün!" : `${odemeKalan}g sonra`}
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>ödeme</div>
              </div>
            )}
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 12 }}>Firma & Paket</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: paket.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏢</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#0F172A" }}>{firma.ad}</div>
                <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{firma.email}</div>
                {firma.yetkili_ad && <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>👤 {firma.yetkili_ad}</div>}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: paket.bg, color: paket.renk, border: `1px solid ${paket.renk}30` }}>{paket.ad}</span>
            </div>
            <div style={{ background: "linear-gradient(135deg,#1E40AF,#3B82F6)", borderRadius: 12, padding: "14px 18px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: "#BFDBFE", fontWeight: 700, textTransform: "uppercase" }}>Aktif Paket</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{paket.ad}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>₺{paket.fiyat.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: "#BFDBFE" }}>/ay</div>
              </div>
            </div>
          </div>

          {firma.hesap_durum === "demo" && (
            <div style={{ background: "#F5F3FF", border: "1.5px solid #DDD6FE", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", marginBottom: 12 }}>🧪 Demo Süresi</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "#fff", borderRadius: 10, padding: 12, border: "1px solid #DDD6FE" }}>
                  <div style={{ fontSize: 11, color: "#7C3AED", fontWeight: 600, marginBottom: 4 }}>Başlangıç</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{tarihFormat(firma.demo_baslangic)}</div>
                </div>
                <div style={{ background: "#fff", borderRadius: 10, padding: 12, border: `1px solid ${demKalan <= 3 ? "#FECACA" : "#DDD6FE"}` }}>
                  <div style={{ fontSize: 11, color: demKalan <= 3 ? "#DC2626" : "#7C3AED", fontWeight: 600, marginBottom: 4 }}>Bitiş</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{tarihFormat(firma.demo_bitis)}</div>
                </div>
              </div>
              <button onClick={() => setShowOdeme(true)} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#7C3AED,#A78BFA)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 15, fontFamily: "inherit" }}>
                🚀 Abonelik Satın Al
              </button>
            </div>
          )}

          {(firma.hesap_durum === "aktif" || firma.hesap_durum === "gecikme") && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 14 }}>💳 Abonelik & Ödeme</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {firma.abonelik_baslangic && (
                  <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12, border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 4 }}>Başlangıç</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{tarihFormat(firma.abonelik_baslangic)}</div>
                  </div>
                )}
                {firma.son_odeme_tarihi && (
                  <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12, border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 4 }}>Son Ödeme</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>{tarihFormat(firma.son_odeme_tarihi)}</div>
                  </div>
                )}
              </div>
              {firma.sonraki_odeme_tarihi && (
                <div style={{ background: odemeKalan <= 3 ? "#FEF2F2" : "#F0FDF4", border: `1px solid ${odemeKalan <= 3 ? "#FECACA" : "#BBF7D0"}`, borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: odemeKalan <= 3 ? "#DC2626" : "#059669", marginBottom: 2 }}>{odemeKalan < 0 ? "🔴 Gecikmiş!" : odemeKalan === 0 ? "🔴 Son Gün!" : "💰 Sonraki Ödeme"}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{tarihFormat(firma.sonraki_odeme_tarihi)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: odemeKalan <= 3 ? "#DC2626" : "#059669" }}>₺{paket.fiyat.toLocaleString()}</div>
                    {odemeKalan < 0 && <button onClick={() => setShowOdeme(true)} style={{ marginTop: 8, padding: "8px 16px", borderRadius: 8, border: "none", background: "#DC2626", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Ödeme Yap</button>}
                  </div>
                </div>
              )}
              {mevcutIndex < paketSirasi.length - 1 && (
                <button onClick={() => setShowOdeme(true)} style={{ marginTop: 14, width: "100%", padding: 12, borderRadius: 10, border: "1.5px dashed #CBD5E1", background: "#F8FAFC", color: "#475569", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "inherit" }}>🚀 Paketi Yükselt</button>
              )}
            </div>
          )}
        </div>

        {/* 2. SÜTUN: OPERASYON (Bölgeler & Otomasyon) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>📍 Hizmet Bölgeleri</div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>Sipariş alacağınız ilçeleri buradan yönetin. Formda sadece bu ilçeler çıkar.</div>

            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 6 }}>Kayıtlı Faaliyet İli</div>
                {hizmetIli ? (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F1F5F9", padding: "8px 14px", borderRadius: 10, border: "1px solid #E2E8F0", color: "#334155", fontWeight: 700, fontSize: 14 }}>🏢 {hizmetIli}</div>
                ) : (
                  <div style={{ fontSize: 13, color: "#DC2626", fontWeight: 600, background: "#FEF2F2", padding: "10px", borderRadius: 8, border: "1px dashed #FECACA" }}>Henüz il atamanız yapılmamıştır. Lütfen yönetici ile iletişime geçiniz.</div>
                )}
              </div>

              {hizmetIli && ADRES_DATA[hizmetIli] && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 10 }}>Hizmet Verilen İlçeler ({hizmetIlceleri.length} Seçili)</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {Object.keys(ADRES_DATA[hizmetIli]).map(ilce => {
                      const secili = hizmetIlceleri.includes(ilce);
                      return (
                        <button key={ilce} onClick={() => handleIlceToggle(ilce)} style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${secili ? "#3B82F6" : "#E2E8F0"}`, background: secili ? "#EFF6FF" : "#fff", color: secili ? "#1D4ED8" : "#475569", fontWeight: secili ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                          {secili && <span style={{ color: "#2563EB", fontWeight: 900 }}>✓</span>} {ilce}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(paketKey === "pro" || paketKey === "enterprise") && (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: otoSmsAktif ? 16 : 0 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#065F46" }}>🤖 Otomatik SMS Asistanı</div>
                  <div style={{ fontSize: 12, color: "#059669", marginTop: 2, paddingRight: 10 }}>Sipariş durumu değiştiğinde müşteriye kendiliğinden SMS gider.</div>
                </div>
                <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, flexShrink: 0 }}>
                  <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={otoSmsAktif} onChange={async (e) => {
                    const yeniDurum = e.target.checked;
                    setOtoSmsAktif(yeniDurum);
                    try { await sbFetch(`firmalar?id=eq.${firma.id}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ oto_sms_aktif: yeniDurum }) }, token); } 
                    catch { setOtoSmsAktif(!yeniDurum); alert("Ayar kaydedilemedi."); }
                  }} />
                  <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: otoSmsAktif ? "#059669" : "#CBD5E1", borderRadius: 34, transition: ".4s" }}>
                    <span style={{ position: "absolute", height: 18, width: 18, left: 3, bottom: 3, backgroundColor: "white", borderRadius: "50%", transition: ".4s", transform: otoSmsAktif ? "translateX(20px)" : "translateX(0)" }} />
                  </span>
                </label>
              </div>

              {otoSmsAktif && (
                <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #A7F3D0" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#065F46", marginBottom: 10 }}>Hangi durumlarda mesaj atılsın?</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {Object.keys(STATUS_CONFIG).map((statusKey) => {
                      const cfg = STATUS_CONFIG[statusKey];
                      const secili = otoSmsDurumlar.includes(statusKey);
                      return (
                        <label key={statusKey} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#34D399", cursor: "pointer", padding: "8px 12px", border: `1px solid ${secili ? "#059669" : "#E2E8F0"}`, borderRadius: 8, background: secili ? "#ECFDF5" : "#fff", transition: "all 0.2s" }}>
                          <input type="checkbox" checked={secili} onChange={async (e) => {
                            const isChecked = e.target.checked;
                            const yeniDurumlar = isChecked ? [...otoSmsDurumlar, statusKey] : otoSmsDurumlar.filter(x => x !== statusKey);
                            setOtoSmsDurumlar(yeniDurumlar);
                            try { await sbFetch(`firmalar?id=eq.${firma.id}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ oto_sms_durumlar: yeniDurumlar }) }, token); } 
                            catch { setOtoSmsDurumlar(otoSmsDurumlar); alert("Durum ayarı kaydedilemedi."); }
                          }} />
                          <span style={{ color: secili ? "#065F46" : "#475569", fontWeight: secili ? 700 : 500 }}>{cfg.icon} {cfg.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. SÜTUN: SMS, ÖZELLİKLER VE DESTEK */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>SMS Kredisi</div>
              <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: smsKredisi > 10 ? "#F0FDF4" : smsKredisi > 0 ? "#FFF7ED" : "#FEF2F2", color: smsKredisi > 10 ? "#059669" : smsKredisi > 0 ? "#D97706" : "#DC2626", border: `1px solid ${smsKredisi > 10 ? "#BBF7D0" : smsKredisi > 0 ? "#FDE68A" : "#FECACA"}` }}>
                {smsKredisi > 10 ? "✓ Yeterli" : smsKredisi > 0 ? "⚠️ Azalıyor" : "🚫 Tükendi"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: smsKredisi > 10 ? "#059669" : smsKredisi > 0 ? "#D97706" : "#DC2626" }}>{smsKredisi}</span>
              <span style={{ fontSize: 14, color: "#64748B" }}>SMS kaldı</span>
            </div>
            <div style={{ width: "100%", height: 8, background: "#F1F5F9", borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ width: `${smsYuzde}%`, height: "100%", borderRadius: 6, background: smsKredisi > 10 ? "linear-gradient(90deg,#059669,#34D399)" : smsKredisi > 0 ? "linear-gradient(90deg,#D97706,#FBBF24)" : "#DC2626" }} />
            </div>
            {smsKredisi <= 10 && (
              <div style={{ fontSize: 13, color: smsKredisi === 0 ? "#DC2626" : "#D97706", fontWeight: 600, marginTop: 6 }}>
                {smsKredisi === 0 ? "SMS krediniz tükendi. Yöneticinizle iletişime geçin." : "Krediniz azalıyor."}
              </div>
            )}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px dashed #E2E8F0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 10 }}>HIZLI SMS PAKETİ YÜKLE</div>
              <div style={{ display: "flex", gap: 10 }}>
                <a href={`https://www.shopier.com/yikanio/1000SMS?email=${firma.email}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: "8px", textAlign: "center", background: "#F8FAFC", color: "#334155", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none", border: "1px solid #CBD5E1", transition: "all 0.2s" }}>
                  +1.000 SMS <br/><span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>₺250</span>
                </a>
                <a href={`https://www.shopier.com/yikanio/5000SMS?email=${firma.email}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: "8px", textAlign: "center", background: "#F0FDF4", color: "#065F46", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none", border: "1px solid #A7F3D0", transition: "all 0.2s" }}>
                  +5.000 SMS <br/><span style={{ fontSize: 11, color: "#059669", fontWeight: 500 }}>₺1.000</span>
                </a>
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 14 }}>Paket Özellikleri</div>
            <div style={{ display: "grid", gap: 10 }}>
              {paket.ozellikler.map((o, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: paket.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: paket.renk, fontWeight: 800, fontSize: 12 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{o}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "16px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13, color: "#64748B" }}>
            Paket değişikliği, ödeme veya destek için:<br/>
            <a href="mailto:info@yikanio.com" style={{ color: "#2563EB", fontWeight: 700, textDecoration: "none", display: "inline-block", marginTop: 4 }}>info@yikanio.com</a>
          </div>

        </div>
      </div>

      {showOdeme && (
        <OdemeModal
          firma={firma} token={token} mevcutPaket={paketKey} mevcutDurum={firma.hesap_durum || "demo"}
          secilebilenPaketler={secilebilenPaketler} onClose={() => setShowOdeme(false)}
          onBasarili={() => { setShowOdeme(false); onYukle(); }}
        />
      )}
    </div>
  );
}

// OdemeModal kodu aynen devam ediyor... (Değişiklik yok)
interface OdemeModalProps { firma: Firma; token: string; mevcutPaket: PaketTip; mevcutDurum: string; secilebilenPaketler: PaketTip[]; onClose: () => void; onBasarili: () => void; }
function OdemeModal({ firma, token, mevcutPaket, mevcutDurum, secilebilenPaketler, onClose, onBasarili }: OdemeModalProps) {
  const paketSirasi: PaketTip[] = ["starter", "pro", "enterprise"];
  const mevcutIndex = paketSirasi.indexOf(mevcutPaket);
  const varsayilanPaket = mevcutDurum === "demo" ? "starter" : (paketSirasi[mevcutIndex + 1] || mevcutPaket) as PaketTip;
  const [secilenPaket, setSecilenPaket] = useState<PaketTip>(varsayilanPaket);
  const [isYearly, setIsYearly] = useState(true);
  const [yukleniyor, setYukleniyor] = useState(false);
  const secilenPaketBilgi = PAKETLER[secilenPaket];
  const aylikBirimFiyat = secilenPaketBilgi.fiyat;
  const gosterilenAylikFiyat = isYearly ? Math.round(aylikBirimFiyat * 0.8) : aylikBirimFiyat; 
  const odenecekToplamTutar = isYearly ? gosterilenAylikFiyat * 12 : aylikBirimFiyat;
  const SHOPIER_LINKLER: Record<PaketTip, { aylik: string; yillik: string }> = { starter: { aylik: "https://www.shopier.com/yikanio/45250042", yillik: "https://www.shopier.com/yikanio/STARTER_YILLIK" }, pro: { aylik: "https://www.shopier.com/yikanio/45250349", yillik: "https://www.shopier.com/yikanio/PRO_YILLIK" }, enterprise: { aylik: "https://www.shopier.com/yikanio/45250439", yillik: "https://www.shopier.com/yikanio/ENT_YILLIK" } };
  const shopierOdemeBaslat = async () => {
    setYukleniyor(true);
    try {
      const link = SHOPIER_LINKLER[secilenPaket][isYearly ? "yillik" : "aylik"];
      window.open(`${link}?email=${encodeURIComponent(firma.email)}&name=${encodeURIComponent(firma.yetkili_ad || firma.ad)}`, "_blank");
      setYukleniyor(false); alert(`Shopier ödeme sayfası açıldı.\n\nÖdemeniz onaylandıktan sonra hesabınız sistem tarafından otomatik olarak aktif edilecektir.\n\nBilgi: info@yikanio.com`); onBasarili();
    } catch (e) { setYukleniyor(false); alert("Bir hata oluştu, lütfen tekrar deneyin."); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 3000, fontFamily: "'Poppins', sans-serif" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 24px 40px", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: "#E2E8F0", borderRadius: 4, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div><h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0F172A" }}>💳 Abonelik Satın Al</h2><p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>Güvenli ödeme — Shopier altyapısı</p></div>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        <div style={{ display: "flex", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 4, marginBottom: 20 }}>
          <button onClick={() => setIsYearly(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: !isYearly ? "#fff" : "transparent", color: !isYearly ? "#0F172A" : "#64748B", fontWeight: !isYearly ? 700 : 500, boxShadow: !isYearly ? "0 2px 8px rgba(0,0,0,0.05)" : "none", cursor: "pointer", transition: "all 0.2s" }}>Aylık Ödeme</button>
          <button onClick={() => setIsYearly(true)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: isYearly ? "#fff" : "transparent", color: isYearly ? "#0F172A" : "#64748B", fontWeight: isYearly ? 700 : 500, boxShadow: isYearly ? "0 2px 8px rgba(0,0,0,0.05)" : "none", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>Yıllık Ödeme <span style={{ background: "#FEF3C7", color: "#D97706", fontSize: 10, padding: "2px 6px", borderRadius: 10, fontWeight: 800 }}>%20 İNDİRİM</span></button>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 10, textTransform: "uppercase" }}>{mevcutDurum === "demo" ? "Başlamak istediğiniz paketi seçin" : "Yükseltmek istediğiniz paketi seçin"}</div>
        <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
          {paketSirasi.map((key) => {
            const p = PAKETLER[key]; const seciliMi = key === secilenPaket; const mevcutMu = key === mevcutPaket && mevcutDurum !== "demo"; const kilitli = mevcutDurum !== "demo" && paketSirasi.indexOf(key) < mevcutIndex; const paketAylikFiyat = isYearly ? Math.round(p.fiyat * 0.8) : p.fiyat;
            return (
              <button key={key} onClick={() => !mevcutMu && !kilitli && setSecilenPaket(key)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: 14, textAlign: "left", border: `2px solid ${seciliMi ? p.renk : "#E2E8F0"}`, background: seciliMi ? p.bg : (mevcutMu || kilitli) ? "#F8FAFC" : "#fff", cursor: (mevcutMu || kilitli) ? "not-allowed" : "pointer", opacity: kilitli ? 0.4 : 1, fontFamily: "inherit", transition: "all 0.2s" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: seciliMi ? p.renk : kilitli ? "#94A3B8" : "#334155", display: "flex", alignItems: "center", gap: 8 }}>{p.ad} {mevcutMu && <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>(Mevcut paket)</span>}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>{p.ozellikler.slice(0, 2).join(" · ")}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                  {isYearly && <div style={{ fontSize: 11, color: "#94A3B8", textDecoration: "line-through", marginBottom: -2 }}>₺{p.fiyat}</div>}
                  <div style={{ fontSize: 20, fontWeight: 800, color: seciliMi ? p.renk : "#0F172A" }}>₺{paketAylikFiyat.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>/ay</div>
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ background: "linear-gradient(135deg,#0F172A,#1E293B)", borderRadius: 16, padding: 20, marginBottom: 20, color: "#fff" }}>
          <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Sipariş Özeti</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div><div style={{ fontSize: 16, fontWeight: 700 }}>Yıkanio {secilenPaketBilgi.ad}</div><div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{isYearly ? "Yıllık abonelik (Tek çekim)" : "Aylık abonelik"}</div></div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>₺{odenecekToplamTutar.toLocaleString()}</div>
          </div>
          <div style={{ borderTop: "1px solid #334155", paddingTop: 10, fontSize: 13, color: "#94A3B8" }}>{firma.ad} · {firma.email}</div>
        </div>
        <button onClick={shopierOdemeBaslat} disabled={yukleniyor || secilenPaket === mevcutPaket && mevcutDurum !== "demo"} style={{ width: "100%", padding: "18px", borderRadius: 14, border: "none", background: yukleniyor ? "#E2E8F0" : "linear-gradient(135deg,#2563EB,#3B82F6)", color: yukleniyor ? "#94A3B8" : "#fff", cursor: yukleniyor ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 16, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {yukleniyor ? "Yönlendiriliyor..." : <><span style={{ fontSize: 20 }}>💳</span> Güvenli Öde — ₺{odenecekToplamTutar.toLocaleString()}</>}
        </button>
      </div>
    </div>
  );
}