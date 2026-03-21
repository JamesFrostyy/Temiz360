export interface HaliTuru {
  id: string;
  ad: string;
  birimFiyat: number;
  icon: string;
}

export interface HaliKalemi {
  turId: string;
  adet: number;
  m2: number;
  birimFiyat?: number;
}

export interface Siparis {
  id: string;
  musteri: string;
  telefon: string;
  il?: string;
  ilce?: string;
  mahalle?: string;
  acik_adres?: string;
  adres: string;
  durum: string;
  notlar: string;
  fiyat: number;
  tarih: string;
  smsDurum: Record<string, boolean>;
  haliKalemleri: HaliKalemi[];
  firmaId?: string;
  firmaAd?: string;
}

export type PaketTip = 'starter' | 'pro' | 'enterprise';

export type AddonTip = 'ek_sube' | 'ek_kullanici';

export interface Firma {
  id: string;
  ad: string;
  email: string;
  aktif: boolean;
  paket?: PaketTip;
  addonlar?: AddonTip[];
  netgsm_user?: string;
  netgsm_pass?: string;
  netgsm_baslik?: string; 
  sms_kredisi?: number;
  wa_api_key?: string;
  wa_phone_id?: string;
  yetkili_ad?: string;
  telefon?: string;
  hesap_durum?: "demo" | "aktif" | "gecikme" | "pasif" | "iptal";
  demo_baslangic?: string;
  demo_bitis?: string;
  abonelik_baslangic?: string;
  son_odeme_tarihi?: string;
  sonraki_odeme_tarihi?: string;
  oto_sms_aktif?: boolean; 
  oto_sms_durumlar?: string[]; // Örn: ['hazir', 'teslim_edildi']
  wa_kredisi?: number;
  hizmet_ili?: string;
  hizmet_ilceleri?: string[];
}

// Paket tanımları
export const PAKETLER: Record<PaketTip, {
  ad: string;
  fiyat: number;
  renk: string;
  bg: string;
  ozellikler: string[];
}> = {
  starter: {
    ad: 'Starter',
    fiyat: 1250,
    renk: '#6366F1',
    bg: '#EEF2FF',
    ozellikler: [
      'Sipariş yönetimi (Dijital Defter)',
      'Manuel SMS Gönderimi',
      'Aylık 50 SMS Hediye',
      'Fiyat listesi & Müşteri rehberi',
      'Temel raporlar',
    ],
  },
  pro: {
    ad: 'Pro',
    fiyat: 2450,
    renk: '#0EA5E9',
    bg: '#F0F9FF',
    ozellikler: [
      'Starter paketindeki her şey',
      'Otomatik SMS Bildirimleri',
      'WhatsApp (wa.me) Entegrasyonu',
      'Aylık 200 SMS Hediye',
      'PDF fatura & Gelişmiş raporlar',
    ],
  },
  enterprise: {
    ad: 'Enterprise',
    fiyat: 4500,
    renk: '#8B5CF6',
    bg: '#F5F3FF',
    ozellikler: [
      'Pro paketindeki her şey',
      'WhatsApp Business API',
      'Aylık 400 SMS Hediye',
      'Çoklu şube yönetimi',
      'Öncelikli destek & Özel entegrasyonlar',
    ],
  },
};

// Addon tanımları — sadece kapasite addları
export const ADDONLAR: Record<AddonTip, {
  ad: string;
  fiyat: number;
  icon: string;
  aciklama: string;
  minPaket: PaketTip;
}> = {
  ek_sube: {
    ad: 'Ek Şube',
    fiyat: 300,
    icon: '🏪',
    aciklama: 'Her ek şube için +₺300/ay',
    minPaket: 'pro',
  },
  ek_kullanici: {
    ad: 'Ek Kullanıcı',
    fiyat: 150,
    icon: '👤',
    aciklama: 'Her ek kullanıcı için +₺150/ay',
    minPaket: 'pro',
  },
};
// Paket yetki kontrolü — addon değil, paket bazlı
export function firmaOzellikVar(
  firma: Firma | null | undefined,
  ozellik:
    | 'wa_me'          // SADECE PRO+
    | 'wa_api'         // Pro+
    | 'sms'            // TÜM PAKETLER (Starter Manuel, Pro+ Otomatik)
    | 'pdf_fatura'     // Pro+
    | 'gelismis_raporlar' // Pro+
    | 'coklu_sube'     // Enterprise
    | 'oncelikli_destek'  // Enterprise
    | 'yol_tarifi'      // Pro+
): boolean {
  if (!firma) return false;
  const paket = firma.paket || 'starter';

  switch (ozellik) {
    // 👇 WhatsApp, Fatura ve Gelişmiş Raporlar sadece Pro ve Kurumsal'a özel
    case 'wa_me':
    case 'wa_api':
    case 'pdf_fatura':
    case 'gelismis_raporlar':
    case 'yol_tarifi':
      return paket === 'pro' || paket === 'enterprise';
      
    // 👇 SMS özelliği hepsinde var (Starter manuel kullanacak)
    case 'sms':
      return true;
      
    // 👇 Şube ve Destek sadece Kurumsal'a özel
    case 'coklu_sube':
    case 'oncelikli_destek':
      return paket === 'enterprise';
      
    default:
      return false;
  }
}

export interface StatusCfg {
  label: string;
  color: string;
  bg: string;
  icon: string;
}

export interface ToastState {
  msg: string | null;
  type: string;
}

export interface AuthUser {
  id: string;
  email: string;
  token: string;
  rol?: string | null;
}
export interface AuthUser {
  id: string;
  email: string;
  token: string;
  rol?: string | null;
  refreshToken?: string;   // ← ekle
  expiresIn?: number;      // ← ekle
}