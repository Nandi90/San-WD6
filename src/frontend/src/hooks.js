import { useState, useEffect, useCallback, useRef } from "react";
import API from "./api";

// ── Auth Hook ────────────────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getStatus()
      .then(d => { if (d.authenticated) setUser(d.user); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const logout = () => { window.location.href = "/auth/logout"; };
  const login = () => { window.location.href = "/auth/login"; };

  return { user, loading, login, logout };
}

// ── Stammdaten Hook ──────────────────────────────────────────────
export function useStammdaten(user) {
  const [stammdaten, setStammdaten] = useState(null);
  const [kostensaetze, setKostensaetze] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!user) return;
    API.getStammdaten().then(d => {
      setStammdaten(d);
      setKostensaetze(d.kostensaetze);
    }).catch(console.error);
  }, [user]);

  const updateStammdaten = useCallback((key, value) => {
    setStammdaten(prev => {
      const next = { ...prev, [key]: value };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        API.saveStammdaten(next).catch(console.error);
      }, 1500);
      return next;
    });
  }, []);

  const updateRate = useCallback((key, value) => {
    setKostensaetze(prev => {
      const next = { ...prev, [key]: value };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        API.saveKostensaetze(next).catch(console.error);
      }, 1500);
      return next;
    });
  }, []);

  const uploadLogo = useCallback(async (file) => {
    const result = await API.uploadLogo(file);
    if (result.logo) setStammdaten(prev => ({ ...prev, logo: result.logo }));
    return result;
  }, []);

  const deleteLogo = useCallback(async () => {
    await API.deleteLogo();
    setStammdaten(prev => ({ ...prev, logo: null }));
  }, []);

  return { stammdaten, kostensaetze, updateStammdaten, updateRate, uploadLogo, deleteLogo };
}

// ── Vorgänge Hook ────────────────────────────────────────────────
export function useVorgaenge(user, year) {
  const [vorgaenge, setVorgaenge] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await API.getVorgaenge(year);
      setVorgaenge(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [user, year]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (id, data) => {
    await API.saveVorgang(id, { ...data, year });
    load();
  }, [year, load]);

  const remove = useCallback(async (id) => {
    await API.deleteVorgang(id);
    load();
  }, [load]);

  return { vorgaenge, loading, reload: load, save, remove };
}

// ── Kunden Hook ──────────────────────────────────────────────────
export function useKunden(user) {
  const [kunden, setKunden] = useState([]);

  useEffect(() => {
    if (!user) return;
    API.getKunden().then(setKunden).catch(console.error);
  }, [user]);

  const saveKunde = useCallback(async (data) => {
    await API.saveKunde(data);
    const updated = await API.getKunden();
    setKunden(updated);
  }, []);

  return { kunden, saveKunde };
}
