import { Siparis, HaliTuru, Firma } from "../types";
import { dbKaydet, dbSil } from "../lib/db";
import { sbFetch } from "../lib/supabase";
import { OrderForm } from "../components/OrderModal"; 

interface UseOrderActionsParams {
  user: { token: string } | null;
  orders: Siparis[];
  setOrders: React.Dispatch<React.SetStateAction<Siparis[]>>;
  ht: HaliTuru[];
  firmaId: string;
  firma?: Firma | null;
  isAdmin: boolean;
  hesapAktif: boolean;
  showToast: (msg: string, type?: string) => void;
}

export function useOrderActions({
  user,
  orders,
  setOrders,
  ht,
  firma,
  firmaId,
  isAdmin,
  hesapAktif,
  showToast,
}: UseOrderActionsParams) {

  const isStarter = !firma?.paket || firma?.paket === "starter" || firma?.hesap_durum === "demo";

  const handleSave = async (form: OrderForm, editingId: string | null) => {
    if (!user) return;
    if (!isAdmin && !hesapAktif) {
      showToast("Hesabınız aktif değil.", "error");
      return;
    }
    const resolvedFirmaId = isAdmin ? form.firmaId : firmaId;
    await dbKaydet(form, editingId, ht, user.token, resolvedFirmaId);
    showToast(editingId ? "Sipariş güncellendi!" : "Sipariş oluşturuldu!");
  };

  const handleStatus = async (id: string, durum: string) => {
    if (!user) return;

    // 1. Durumu Veritabanında Güncelle
    await sbFetch(
      `siparisler?id=eq.${id}`,
      { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ durum }) },
      user.token
    );
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, durum } : o));
    showToast("Durum güncellendi!");

    // 2. OTOMATİK SMS KONTROLÜ (Sadece Pro/Ent paketlerde çalışır)
    const ilgiliSiparis = orders.find((o) => o.id === id);

    if (!isStarter && firma?.oto_sms_aktif && firma?.oto_sms_durumlar?.includes(durum) && ilgiliSiparis) {
      const baslik = firma?.netgsm_baslik || firma?.ad || "Hali Yikama";
      const otoMesaj = `Sayin ${ilgiliSiparis.musteri},\nSiparisiniz "${durum}" asamasina gecmistir.\nBizi tercih ettiginiz icin tesekkurler.\n${baslik}`;
      
      await handleSms(ilgiliSiparis, durum, otoMesaj, "sms", true);
    }
  };

  const handleSms = async (
    smsOrder: Siparis | null,
    durum: string,
    mesaj: string,
    kanal: "wa_me" | "wa_api" | "sms",
    otomatikMi: boolean = false
  ) => {
    if (!user || !smsOrder) return;
    
    // Sadece Starter'da WhatsApp kredisi düşür
    if (kanal === "wa_me" && isStarter) {
      const guncelWaKredi = firma?.wa_kredisi || 0;
      if (guncelWaKredi > 0) {
        await sbFetch(
          `firmalar?id=eq.${firmaId}`,
          { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ wa_kredisi: guncelWaKredi - 1 }) },
          user.token
        );
      }
    }

    if (kanal === "sms") {
      if (isStarter) return; // Güvenlik kilidi

      const netgsmUser = firma?.netgsm_user;
      const netgsmPass = firma?.netgsm_pass;
      const smsBaslik = firma?.netgsm_baslik || firma?.ad?.slice(0, 11) || "Hali Yikama";

      if (!netgsmUser || !netgsmPass) {
        if (!otomatikMi) showToast("NetGSM ayarlarınız eksik!", "error");
        return;
      }
      
      let tel = smsOrder.telefon.replace(/[^0-9]/g, "");
      if (tel.startsWith("0")) tel = "9" + tel;
      else if (tel.startsWith("5")) tel = "90" + tel;

      const params = new URLSearchParams({
        usercode: netgsmUser,
        password: netgsmPass,
        gsmno: tel,
        message: mesaj,
        msgheader: smsBaslik,
        dil: "TR",
      });

      // Gerçek NetGSM İsteği atılır, Kredi Yıkanio'dan DEĞİL NetGSM'den düşer.
      try {
        fetch(`https://api.netgsm.com.tr/sms/send/get/?${params.toString()}`, { mode: 'no-cors' }).catch(console.error);
        if (!otomatikMi) showToast("SMS başarıyla gönderildi!", "success");
      } catch(e) {
        if (!otomatikMi) showToast("SMS gönderim hatası.", "error");
      }
    } else if (kanal === "wa_me" && !otomatikMi) {
      showToast("WhatsApp bildirimi kaydedildi!", "success");
    }

    // LOGLAMA VE ARAYÜZ GÜNCELLEME
    const yeniSmsDurum = { ...smsOrder.smsDurum, [durum]: true };
    await sbFetch(
      `siparisler?id=eq.${smsOrder.id}`,
      { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ sms_durum: yeniSmsDurum }) },
      user.token
    );
    await sbFetch(
      "sms_log",
      { method: "POST", body: JSON.stringify({ siparis_id: smsOrder.id, telefon: smsOrder.telefon, mesaj, durum_adi: durum, kanal }) },
      user.token
    );
    setOrders((prev) =>
      prev.map((o) => o.id === smsOrder.id ? { ...o, smsDurum: yeniSmsDurum } : o)
    );
  };

  const handleSil = async (id: string) => {
    if (!user) return;
    await dbSil(user.token, id);
    setOrders((prev) => prev.filter((o) => o.id !== id));
    showToast("Sipariş silindi!");
  };

  return { handleSave, handleStatus, handleSms, handleSil };
}