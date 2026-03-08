import { Siparis, HaliTuru } from "../types";
import { toplamAdet, toplamM2 } from "./db";

export function smsMesaji(
  durum: string,
  order: Siparis,
  ht: HaliTuru[],
  firmaAd: string
): string {
  const tl = (order.haliKalemleri || [])
    .map((k) => {
      const t = ht.find((x) => x.id === k.turId);
      return `${t?.ad || k.turId} (${k.m2}m²)`;
    })
    .join(", ");
  const adet = toplamAdet(order.haliKalemleri);
  const m2 = toplamM2(order.haliKalemleri);
  const firma = firmaAd || "Temiz360";

  const m: Record<string, string> = {
    toplandı: `Sayın ${order.musteri}, halılarınız teslim alındı.\nSipariş No: ${order.id}\nHalılar: ${tl}\nAdet: ${adet}\nToplam m²: ${m2}\nTutar: ₺${order.fiyat}\n${firma}`,
    yıkamada: `Sayın ${order.musteri}, halılarınız yıkamaya alındı.\nSipariş No: ${order.id}\nHalılar: ${tl}\n${firma}`,
    kurutuluyor: `Sayın ${order.musteri}, halılarınız kurutuluyor.\nSipariş No: ${order.id}\n${firma}`,
    hazır: `Sayın ${order.musteri}, halılarınız HAZIR!\nSipariş No: ${order.id}\nHalılar: ${tl}\nÖdenecek: ₺${order.fiyat}\n${firma}`,
    dağıtımda: `Sayın ${order.musteri}, halılarınız yola çıktı!\nSipariş No: ${order.id}\nÖdenecek: ₺${order.fiyat}\n${firma}`,
    teslim_edildi: `Sayın ${order.musteri}, halılarınız teslim edildi.\nToplam: ₺${order.fiyat}\n${firma}'ı tercih ettiğiniz için teşekkürler!`,
  };
  return m[durum] || "";
}