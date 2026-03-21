export const ADRES_DATA: Record<string, Record<string, string[]>> = {
  "İstanbul": {
    "Avcılar": ["Ambarlı", "Cihangir", "Gümüşpala", "Denizköşkler", "Üniversite"],
    "Bayrampaşa": ["Yıldırım", "Kocatepe", "Muratpaşa", "Kartaltepe", "Altıntepsi"],
    "Kadıköy": ["Bostancı", "Caddebostan", "Suadiye", "Göztepe"]
  },
  "Kocaeli": {
    "İzmit": ["Yahya Kaptan", "Yenişehir", "Tepeköy", "Kadıköy"],
    "Kartepe": ["Fatih Sultan Mehmet", "Ataşehir", "İstasyon", "Ertuğrul Gazi"]
  }
};

export const ILLER = Object.keys(ADRES_DATA);