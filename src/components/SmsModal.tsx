import { useState } from "react";
import { Siparis, HaliTuru, Firma, firmaOzellikVar } from "../types";
import { STATUS_CONFIG } from "../constants";
import { smsMesaji } from "../lib/sms";

interface SmsModalProps {
  order: Siparis;
  ht: HaliTuru[];
  firmaAd: string;
  firma: Firma | null | undefined;
  onClose: () => void;
  onSend: (durum: string, mesaj: string, kanal: "wa_me" | "wa_api" | "sms") => Promise<void>;
  onError: (msg: string) => void;
  onKrediDus?: () => void;
}

type Kanal = "wa_me" | "wa_api" | "sms";

const KANAL_BILGI: Record<Kanal, { label: string; icon: string; renk: string; bg: string; aciklama: string }> = {
  wa_me: {
    label: "WhatsApp (Manuel)",
    icon: "💬",
    renk: "#25D366",
    bg: "#F0FDF4",
    aciklama: "WhatsApp açılır, mesajı siz gönderirsiniz",
  },
  wa_api: {
    label: "WhatsApp Business API",
    icon: "🤖",
    renk: "#0EA5E9",
    bg: "#F0F9FF",
    aciklama: "Otomatik gönderilir — müşteri anında alır",
  },
  sms: {
    label: "SMS (Netgsm)",
    icon: "📱",
    renk: "#8B5CF6",
    bg: "#F5F3FF",
    aciklama: "Her telefona ulaşır, WhatsApp gerekmez",
  },
};

export function SmsModal({ order, ht, firmaAd, firma, onClose, onSend, onError, onKrediDus }: SmsModalProps) {
  const [sel, setSel] = useState<string | null>(null);
  
  const hasWaMe = firmaOzellikVar(firma, "wa_me");
  const hasWaApi = firmaOzellikVar(firma, "wa_api");
  const hasSms = firmaOzellikVar(firma, "sms");

  const [kanal, setKanal] = useState<Kanal>("sms");
  const [sending, setSending] = useState(false);
  const [waBekleniyor, setWaBekleniyor] = useState(false);

  // --- PAKET VE KREDİ KONTROLLERİ ---
  const isStarter = !firma?.paket || firma?.paket === "starter";
  
  const smsKredisi = firma?.sms_kredisi ?? 0;
  const waKredisi = firma?.wa_kredisi ?? 0;

  const smsKredisiYok = kanal === "sms" && smsKredisi <= 0;
  const waKredisiYok = kanal === "wa_me" && isStarter && waKredisi <= 0;
  const engelli = smsKredisiYok || waKredisiYok;

  const smsBaslik = firma?.netgsm_baslik || firmaAd.slice(0, 11);
  const txt = sel ? smsMesaji(sel, order, ht, firmaAd) : "";

  const handleSend = async () => {
    if (!sel || sending) return;

    if (kanal === "sms" && smsKredisiYok) {
      onError("SMS krediniz tükendi. Yöneticinizden yeni paket talep edin.");
      return;
    }

    if (kanal === "wa_me" && waKredisiYok) {
      onError("WhatsApp kotanız doldu. Sınırsız gönderim için Pro pakete geçin.");
      return;
    }

    setSending(true);

    try {
      let tel = order.telefon.replace(/[^0-9]/g, "");
      if (tel.startsWith("0")) tel = "9" + tel;
      else if (tel.startsWith("5")) tel = "90" + tel;

      if (kanal === "wa_me") {
        window.open(`https://wa.me/${tel}?text=${encodeURIComponent(txt)}`, "_blank");
        setSending(false);
        setWaBekleniyor(true);
        return;
      }

      if (kanal === "wa_api") {
        if (firma?.wa_api_key && firma?.wa_phone_id) {
          await fetch(
            `https://graph.facebook.com/v18.0/${firma.wa_phone_id}/messages`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${firma.wa_api_key}` },
              body: JSON.stringify({ messaging_product: "whatsapp", to: tel, type: "text", text: { body: txt } }),
            }
          );
        } else {
          onError("WhatsApp API bilgileri eksik. Admin panelinden firma ayarlarını güncelleyin.");
          setSending(false);
          return;
        }
      } else if (kanal === "sms") {
        const netgsmUser = firma?.netgsm_user;
        const netgsmPass = firma?.netgsm_pass;

        if (!netgsmUser || !netgsmPass) {
          onError("NetGSM bilgileri eksik! Lütfen Ayarlar > Entegrasyonlar bölümünden bilgilerinizi giriniz.");
          setSending(false);
          return;
        }

        const params = new URLSearchParams({
          usercode: netgsmUser,
          password: netgsmPass,
          gsmno: tel,
          message: txt,
          msgheader: smsBaslik,
          dil: "TR",
        });

        console.log("🟢 [MANUEL] NETGSM'E GİDECEK OLAN URL:", `https://api.netgsm.com.tr/sms/send/get/?${params.toString()}`);
        console.log("🟢 [MANUEL] TEST: İstek başarılı (00) varsayıldı.");
        onKrediDus?.(); 
      }

      await onSend(sel, txt, kanal);
      onClose();
    } catch (e) {
      console.error("Gönderim hatası:", e);
      onError("Gönderim sırasında bir hata oluştu.");
    } finally {
      setSending(false);
    }
  };

  const waOnayEvet = async () => {
    if (!sel) return;
    setSending(true);
    try {
      await onSend(sel, txt, "wa_me");
      onClose();
    } catch {
      onError("Log kaydedilemedi.");
    } finally {
      setSending(false);
      setWaBekleniyor(false);
    }
  };

  const waOnayHayir = () => {
    setWaBekleniyor(false);
    setSending(false);
  };

  const kanalInfo = KANAL_BILGI[kanal];

  if (waBekleniyor) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 2000, fontFamily: "'Poppins', sans-serif" }}>
        <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 600 }}>
          <div style={{ width: 40, height: 4, background: "#E2E8F0", borderRadius: 4, margin: "0 auto 24px" }} />
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0F172A" }}>WhatsApp açıldı</h2>
            <p style={{ margin: "8px 0 0", color: "#64748B", fontSize: 15, lineHeight: 1.5 }}>
              Mesajı <strong>{order.musteri}</strong>'e gönderebildiniz mi?
            </p>
          </div>
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#15803D", lineHeight: 1.5, whiteSpace: "pre-line" }}>
            {txt}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button
              onClick={waOnayHayir}
              style={{ padding: 16, borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", cursor: "pointer", fontWeight: 700, fontSize: 15, fontFamily: "inherit" }}
            >
              ✕ Gönderemedim
            </button>
            <button
              onClick={waOnayEvet}
              disabled={sending}
              style={{ padding: 16, borderRadius: 12, border: "none", background: "#25D366", color: "#fff", cursor: sending ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 15, fontFamily: "inherit" }}
            >
              {sending ? "Kaydediliyor..." : "✓ Gönderdim"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 2000, fontFamily: "'Poppins', sans-serif" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px", width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, background: "#E2E8F0", borderRadius: 4, margin: "0 auto 20px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>📨 Bildirim Gönder</h2>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 14, color: "#334155", border: "1px solid #E2E8F0" }}>
          <strong>{order.musteri}</strong> · {order.telefon}
        </div>

        {/* ================== UPSELL (PAZARLAMA) AFİŞİ ================== */}
        {kanal === "wa_me" && isStarter && waKredisi <= 0 && (
          <div style={{ background: "#F0FDF4", border: "2px solid #22C55E", borderRadius: 16, padding: "20px 16px", marginBottom: 20, textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
            <h3 style={{ margin: "0 0 8px 0", color: "#166534", fontSize: 16, fontWeight: 800 }}>İşler Tıkırında Anlaşılan!</h3>
            <p style={{ margin: 0, color: "#15803D", fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              Aylık ücretsiz WhatsApp kotanızı doldurdunuz. Büyüyen işinize artık manuel tıklamalar yetmez! Sınırsız WhatsApp ve Otomatik SMS için hemen paket yükseltin.
            </p>
            <button style={{ background: "#16A34A", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
              🚀 Pro Pakete Geç
            </button>
          </div>
        )}
        {/* ============================================================== */}

        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 10, textTransform: "uppercase" }}>Kanal Seç</div>
        <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
          {(Object.entries(KANAL_BILGI) as [Kanal, typeof KANAL_BILGI[Kanal]][]).map(([k, info]) => {
            const kilitli = (k === "wa_api" && !hasWaApi) || (k === "sms" && !hasSms) || (k === "wa_me" && !hasWaMe);
            const secili = kanal === k;
            
            // Limit etiketini belirle
            let etiket = null;
            if (k === "sms" && !kilitli) {
              etiket = <span style={{ marginLeft: 6, fontSize: 10, background: smsKredisi > 0 ? "#F0FDF4" : "#FEE2E2", color: smsKredisi > 0 ? "#059669" : "#DC2626", padding: "2px 6px", borderRadius: 10, fontWeight: 700 }}>{smsKredisi > 0 ? `${smsKredisi} kredi` : "Kredi Yok"}</span>;
            } else if (k === "wa_me" && !kilitli) {
              if (isStarter) {
                etiket = <span style={{ marginLeft: 6, fontSize: 10, background: waKredisi > 0 ? "#F0FDF4" : "#FEE2E2", color: waKredisi > 0 ? "#059669" : "#DC2626", padding: "2px 6px", borderRadius: 10, fontWeight: 700 }}>{waKredisi > 0 ? `${waKredisi} kota kaldı` : "Kota Doldu"}</span>;
              } else {
                etiket = <span style={{ marginLeft: 6, fontSize: 10, background: "#EFF6FF", color: "#2563EB", padding: "2px 6px", borderRadius: 10, fontWeight: 700 }}>∞ Sınırsız</span>;
              }
            }

            return (
              <button
                key={k}
                onClick={() => !kilitli && setKanal(k)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", borderRadius: 12, textAlign: "left",
                  border: `1.5px solid ${secili ? info.renk : "#E2E8F0"}`,
                  background: secili ? info.bg : kilitli ? "#F8FAFC" : "#fff",
                  cursor: kilitli ? "not-allowed" : "pointer",
                  opacity: kilitli ? 0.55 : 1,
                  fontFamily: "inherit", transition: "all 0.2s",
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: secili ? info.renk + "20" : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {info.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: secili ? info.renk : kilitli ? "#94A3B8" : "#334155", display: "flex", alignItems: "center" }}>
                    {info.label}
                    {kilitli && <span style={{ marginLeft: 6, fontSize: 10, background: "#FEF3C7", color: "#92400E", padding: "2px 6px", borderRadius: 10, fontWeight: 700 }}>Pro gerekli</span>}
                    {etiket}
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                    {k === "sms" && smsBaslik ? `${info.aciklama} · Gönderen: ${smsBaslik}` : info.aciklama}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 10, textTransform: "uppercase" }}>Bildirim Türü</div>
        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          {Object.keys(STATUS_CONFIG).filter((s) => s !== "bekliyor").map((s) => {
            const cfg = STATUS_CONFIG[s];
            const gone = order.smsDurum?.[s];
            const aktif = sel === s;
            return (
              <button key={s} onClick={() => !gone && setSel(s)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", borderRadius: 12,
                border: `1.5px solid ${aktif ? cfg.color : "#E2E8F0"}`,
                background: aktif ? cfg.bg : gone ? "#F8FAFC" : "#fff",
                cursor: gone ? "not-allowed" : "pointer",
                opacity: gone ? 0.6 : 1, fontFamily: "inherit", transition: "all 0.2s",
              }}>
                <span style={{ fontWeight: 600, fontSize: 15, color: aktif ? cfg.color : "#334155" }}>
                  {cfg.icon} {cfg.label}
                </span>
                {gone && <span style={{ fontSize: 12, color: "#10B981", fontWeight: 700 }}>✓ Gönderildi</span>}
              </button>
            );
          })}
        </div>

        {txt && (
          <div style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", marginBottom: 8 }}>MESAJ ÖNİZLEME</div>
            <div style={{ fontSize: 14, color: "#15803D", lineHeight: 1.6, whiteSpace: "pre-line" }}>{txt}</div>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={!sel || sending || engelli}
          style={{
            width: "100%", padding: 16, borderRadius: 12, border: "none",
            background: sel && !engelli ? kanalInfo.renk : "#E2E8F0",
            color: sel && !engelli ? "#fff" : "#94A3B8",
            cursor: sel && !engelli ? "pointer" : "not-allowed",
            fontWeight: 700, fontSize: 16, fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s",
          }}
        >
          {sending ? "Gönderiliyor..." : <><span style={{ fontSize: 18 }}>{kanalInfo.icon}</span> {kanalInfo.label} ile Gönder</>}
        </button>
      </div>
    </div>
  );
}