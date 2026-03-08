import { useState, useCallback } from "react";
import { Siparis, HaliTuru, Firma } from "../types";
import { dbGetir, dbFirmalariGetir, dbHaliTurleriniGetir } from "../lib/db";
import { sbFetch } from "../lib/supabase";

export function useOrders(token: string, isAdmin: boolean, userEmail?: string) {
  const [orders, setOrders] = useState<Siparis[]>([]);
  const [firmalar, setFirmalar] = useState<Firma[]>([]);
  const [ht, setHt] = useState<HaliTuru[]>([]);
  const [firmaId, setFirmaId] = useState<string>("");
  const [firmaAd, setFirmaAd] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const yukle = useCallback(async () => {
    if (!token || !userEmail) return;
    setLoading(true);
    setErr(null);
    try {
      const firmaSonuc = await sbFetch(
        `firmalar?email=eq.${userEmail}&select=id,ad`,
        {},
        token
      ) as { id: string; ad: string }[];

      const resolvedFirmaId = firmaSonuc?.[0]?.id || "";
      const resolvedFirmaAd = firmaSonuc?.[0]?.ad || "";
      setFirmaId(resolvedFirmaId);
      setFirmaAd(resolvedFirmaAd);

      const [siparisler, firms] = await Promise.all([
        dbGetir(token, isAdmin),
        isAdmin ? dbFirmalariGetir(token) : Promise.resolve([]),
      ]);

      setOrders(siparisler);
      setFirmalar(firms);

      if (!isAdmin && resolvedFirmaId) {
        const haliTurleri = await dbHaliTurleriniGetir(token, resolvedFirmaId);
        setHt(haliTurleri);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, userEmail]);

  return { orders, setOrders, firmalar, ht, setHt, firmaId, firmaAd, loading, err, yukle };
}