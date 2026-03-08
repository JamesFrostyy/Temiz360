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

export interface Firma {
  id: string;
  ad: string;
  email: string;
  aktif: boolean;
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