import { useState } from "react";
import { Siparis, HaliTuru } from "../types";
import { STATUS_CONFIG } from "../constants";
import { smsMesaji } from "../lib/sms";

interface SmsModalProps {
  order: Siparis;
  ht: HaliTuru[];
  firmaAd: string;
  onClose: () => void;
  onSend: (durum: string, mesaj: string) => Promise<void>;
}

export function SmsModal({ order, ht, firmaAd, onClose, onSend }: SmsModalProps) {
  const [sel, setSel] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const txt = sel ? smsMesaji(sel, order, ht, firmaAd) : "";

  const handleSend = async () => {
    if (!sel) return;
    setSending(true);
    let tel = order.telefon.replace(/[^0-9]/g, "");
    if (tel.startsWith("0")) tel = "9" + tel;
    else if (tel.startsWith("5")) tel = "90" + tel;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(txt)}`, "_blank");
    await onSend(sel, txt);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 2000, fontFamily: "'Poppins', sans-serif" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 32px", width: "100%", maxWidth: 600, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: "#E2E8F0", borderRadius: 4, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>📱 WhatsApp Mesajı</h2>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 14, color: "#334155", border: "1px solid #E2E8F0" }}>
          <strong>{order.musteri}</strong><br />{order.telefon}
        </div>
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
        <button onClick={handleSend} disabled={!sel || sending} style={{
          width: "100%", padding: 16, borderRadius: 12, border: "none",
          background: sel ? "#25D366" : "#E2E8F0",
          color: sel ? "#fff" : "#94A3B8",
          cursor: sel ? "pointer" : "not-allowed",
          fontWeight: 700, fontSize: 16, fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {sending ? "WhatsApp Açılıyor..." : <><span style={{ fontSize: 18 }}>💬</span> WhatsApp ile Gönder</>}
        </button>
      </div>
    </div>
  );
}