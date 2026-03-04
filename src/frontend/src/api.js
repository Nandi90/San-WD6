/**
 * ═══════════════════════════════════════════════════════════════════
 * API Client - Ersetzt window.storage komplett
 * ═══════════════════════════════════════════════════════════════════
 */

const API = {
  _sessionExpired: false,
  _onSessionExpired: null, // Callback für UI-Benachrichtigung

  async _fetch(url, opts = {}) {
    const res = await fetch(url, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...opts.headers },
      ...opts,
    });
    if (res.status === 401) {
      // Nicht sofort redirect – nur Flag setzen
      if (!this._sessionExpired) {
        this._sessionExpired = true;
        if (this._onSessionExpired) this._onSessionExpired();
      }
      throw new Error("Sitzung abgelaufen");
    }
    // Bei erfolgreichem Request: Session ist OK
    this._sessionExpired = false;
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || "API Fehler");
    }
    return res;
  },

  async json(url, opts) {
    const res = await this._fetch(url, opts);
    return res.json();
  },

  // ── Auth ─────────────────────────────────────────────────────
  async getStatus() {
    return this.json("/auth/status");
  },

  // ── Stammdaten ───────────────────────────────────────────────
  async getStammdaten() {
    return this.json("/api/stammdaten/me");
  },

  async saveBereitschaftsleiter(data) {
    const r = await fetch("/api/stammdaten/bereitschaftsleiter", {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data),credentials:"include"});
    return r.json();
  },
  async getAllBereitschaftenDetails() {
    return this.json("/api/stammdaten/bereitschaften/details");
  },
  async updateBereitschaftAdmin(code, data) {
    return this.json(`/api/stammdaten/bereitschaften/${code}`, { method: "PUT", body: JSON.stringify(data) });
  },
  async saveStammdaten(data) {
    return this.json("/api/stammdaten", { method: "PUT", body: JSON.stringify(data) });
  },

  async saveKostensaetze(data) {
    return this.json("/api/stammdaten/kostensaetze", { method: "PUT", body: JSON.stringify(data) });
  },

  async uploadLogo(file) {
    const fd = new FormData();
    fd.append("logo", file);
    const res = await fetch("/api/stammdaten/logo", { method: "POST", credentials: "include", body: fd });
    return res.json();
  },

  async deleteLogo() {
    return this.json("/api/stammdaten/logo", { method: "DELETE" });
  },

  async getCounter(year) {
    return this.json(`/api/stammdaten/counter/${year}`);
  },

  async incrementCounter(year) {
    return this.json(`/api/stammdaten/counter/${year}/increment`, { method: "POST" });
  },

  // ── Vorgänge ─────────────────────────────────────────────────
  async getVorgaenge(year, bc) {
    const q = (bc === "" || bc === "ALL") ? "?bc=ALL" : (bc ? `?bc=${bc}` : "");
    return this.json(`/api/vorgaenge/${year}${q}`);
  },

  async getVorgang(year, id) {
    return this.json(`/api/vorgaenge/${year}/${id}`);
  },

  async saveVorgang(id, data) {
    return this.json(`/api/vorgaenge/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },

  async deleteVorgang(id) {
    return this.json(`/api/vorgaenge/${id}`, { method: "DELETE" });
  },

  // ── Kunden ───────────────────────────────────────────────────
  async getKunden() {
    return this.json("/api/kunden");
  },

  async saveKunde(data) {
    return this.json("/api/kunden", { method: "POST", body: JSON.stringify(data) });
  },

  async updateKunde(id, data) {
    return this.json(`/api/kunden/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },

  async importKunden(csv) {
    return this.json("/api/kunden/import", { method: "POST", body: JSON.stringify({ csv }) });
  },

  async deleteKunde(id) {
    return this.json(`/api/kunden/${id}`, { method: "DELETE" });
  },

  async batchDeleteKunden(ids) {
    return this.json("/api/kunden/batch-delete", { method: "POST", body: JSON.stringify({ ids }) });
  },

  // ── PDF ──────────────────────────────────────────────────────
  async generateILS(vorgangId) {
    const res = await this._fetch(`/api/pdf/ils/${vorgangId}`, { method: "POST" });
    return res.blob();
  },

  async syncToNextcloud(vorgangId, body) {
    return this.json(`/api/pdf/sync/${vorgangId}`, { method: "POST", body: JSON.stringify(body || {}) });
  },

  // ── Templates (Admin) ───────────────────────────────────────
  async getTemplates() {
    return this.json("/api/templates");
  },

  async uploadTemplate(file, name, type, description) {
    const fd = new FormData();
    fd.append("template", file);
    fd.append("name", name);
    fd.append("type", type);
    fd.append("description", description || "");
    const res = await fetch("/api/templates", { method: "POST", credentials: "include", body: fd });
    return res.json();
  },

  async getTemplateFields(id) {
    return this.json(`/api/templates/${id}/fields`);
  },

  async saveFieldMapping(id, mapping) {
    return this.json(`/api/templates/${id}/mapping`, { method: "PUT", body: JSON.stringify({ mapping }) });
  },

  async deleteTemplate(id) {
    return this.json(`/api/templates/${id}`, { method: "DELETE" });
  },

  // ── Admin ────────────────────────────────────────────────────
  async getUsers() {
    return this.json("/api/admin/users");
  },

  async setUserRole(sub, rolle) {
    return this.json(`/api/admin/users/${sub}/rolle`, { method: "PUT", body: JSON.stringify({ rolle }) });
  },

  async setUserBereitschaft(sub, bereitschaft_code) {
    return this.json(`/api/admin/users/${sub}/bereitschaft`, { method: "PUT", body: JSON.stringify({ bereitschaft_code }) });
  },

  async getAllBereitschaften() {
    return this.json("/api/stammdaten/alle");
  },

  async getStats() {
    return this.json("/api/admin/stats");
  },

  // ── Profil ───────────────────────────────────────────────────
  async getProfile() {
    return this.json("/api/profile");
  },

  async saveProfile(data) {
    return this.json("/api/profile", { method: "PUT", body: JSON.stringify(data) });
  },

  // ── Admin ────────────────────────────────────────────────────
  async getAuditLog(limit = 100) {
    return this.json(`/api/admin/audit?limit=${limit}`);
  },
  // ── Klauseln ─────────────────────────────────────────────────
  // ── ILS ──────────────────────────────────────────────────────────
  getILSTage: function(vorgangId) { return this.json("/api/ils/" + vorgangId); },
  getILSPDF: async function(vorgangId, dayIdx) {
    const res = await this._fetch("/api/ils/" + vorgangId + "/" + dayIdx);
    return res.blob();
  },
  getKlauseln: function() { return this.json("/api/klauseln"); },
  saveKlausel: async function(id, inhalt) {
    return this.json(`/api/klauseln/${id}`, { method: "PUT", body: JSON.stringify({ inhalt }) });
  },
  // ── PDF serverseitig ─────────────────────────────────────────
  generateGefahrenPDF: async function(vorgangId, dayCalcs, activeDays) {
    const res = await this._fetch(`/api/pdf/gefahren/${vorgangId}`, {
      method: "POST", body: JSON.stringify({ dayCalcs, activeDays }),
    });
    return res.blob();
  },
  generateAngebotPDF: async function(vorgangId, dayCalcs, totalCosts, activeDays) {
    const res = await this._fetch(`/api/pdf/angebot/${vorgangId}`, {
      method: "POST", body: JSON.stringify({ dayCalcs, totalCosts, activeDays }),
    });
    return res.blob();
  },
  generateAABPDF: async function(vorgangId) {
    const res = await this._fetch(`/api/pdf/aab/${vorgangId}`, { method: "POST" });
    return res.blob();
  },
  generateMappePDF: async function(vorgangId, dayCalcs, totalCosts, activeDays, skipOpts) {
    const q = [];
    if (skipOpts) {
      if (skipOpts.skipDeckblatt) q.push("skipDeckblatt=1");
      if (skipOpts.skipAngebot) q.push("skipAngebot=1");
      if (skipOpts.skipVertrag) q.push("skipVertrag=1");
      if (skipOpts.skipAAB) q.push("skipAAB=1");
      if (skipOpts.skipGefahren) q.push("skipGefahren=1");
    }
    const qs = q.length ? "?" + q.join("&") : "";
    const res = await this._fetch(`/api/pdf/mappe/${vorgangId}${qs}`, {
      method: "POST", body: JSON.stringify({ dayCalcs, totalCosts, activeDays }),
    });
    return res.blob();
  },

  // Nextcloud Config
  // Statistik
  async getStatistik(year, bc) { return this.json(`/api/statistik/${year}?bc=${bc || "ALL"}`); },

  // Einsatzprotokoll
  async getProtokoll(id) { return this.json(`/api/protokoll/${id}`); },
  async saveProtokoll(id, dayIdx, protokoll) { return this.json(`/api/protokoll/${id}`, { method: "PUT", body: JSON.stringify({ dayIdx, protokoll }) }); },

  // SMTP / E-Mail Config
  async getSmtpConfig() { return this.json("/api/config/smtp"); },
  async saveSmtpConfig(cfg) { return this.json("/api/config/smtp", { method: "PUT", body: JSON.stringify(cfg) }); },
  async testSmtp() { return this.json("/api/config/smtp/test", { method: "POST" }); },
  async sendMail(vorgangId, data) { return this.json(`/api/mail/send/${vorgangId}`, { method: "POST", body: JSON.stringify(data) }); },
  async sendFiBuMail(vorgangId, data) { return this.json(`/api/mail/fibu/${vorgangId}`, { method: "POST", body: JSON.stringify(data) }); },
  async getFiBuConfig() { return this.json("/api/config/fibu"); },
  async saveFiBuConfig(data) { return this.json("/api/config/fibu", { method: "PUT", body: JSON.stringify(data) }); },

  async getNextcloudConfig() { return this.json("/api/config/nextcloud"); },
  async saveNextcloudConfig(cfg) { return this.json("/api/config/nextcloud", { method: "PUT", body: JSON.stringify(cfg) }); },
  async testNextcloud() { return this.json("/api/config/nextcloud/test", { method: "POST" }); },
  
  submitFeedback: async function(data) {
    return this.json("/api/feedback", { method: "POST", body: JSON.stringify(data) });
  },
  // ── Vorgang Lock/Status ──────────────────────────────────────
  async lockVorgang(id) { return this.json("/api/vorgaenge/"+id+"/lock",{method:"POST"}); },
  async unlockVorgang(id) { return this.json("/api/vorgaenge/"+id+"/lock",{method:"DELETE"}); },
  async getLockStatus(id) { return this.json("/api/vorgaenge/"+id+"/lock"); },
  async setVorgangStatus(id,status,reason) { return this.json("/api/vorgaenge/"+id+"/status",{method:"POST",body:JSON.stringify({status,reason})}); },
  async entsperrenVorgang(id, begruendung) { return this.json("/api/vorgaenge/"+id+"/entsperren",{method:"POST",body:JSON.stringify({begruendung})}); },
  async kompetenzOverride(id, data) { return this.json("/api/vorgaenge/"+id+"/kompetenz-override",{method:"POST",body:JSON.stringify(data)}); },
  async getVorgangHistory(id) { return this.json("/api/vorgaenge/"+id+"/history"); },
  async getStatusLog(id) { return this.json("/api/vorgaenge/"+id+"/status-log"); },
  async getAnfragen() { return this.json("/api/anfragen"); },
  async getAnfragenCount() { return this.json("/api/anfragen/count"); },
  async updateAnfrageStatus(id,status,grund) { return this.json("/api/anfragen/"+id+"/status",{method:"PUT",body:JSON.stringify({status,grund})}); },
  async anfrageAnnehmen(id, bc) { return this.json(`/api/anfragen/${id}/annehmen`, { method: "POST", body: JSON.stringify({ bereitschaft_code: bc }) }); },
  async anfrageUmzuweisen(id, bc) { return this.json(`/api/anfragen/${id}/umzuweisen`, { method: "POST", body: JSON.stringify({ bereitschaft_code: bc }) }); },
  async deleteAnfrage(id) { return this.json("/api/anfragen/"+id,{method:"DELETE"}); },
  async getEinsatzprotokollPDF(id, dayIdx) {
    const r = await fetch(`/api/pdf/einsatzprotokoll/${id}`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayIdx: dayIdx || 0 })
    });
    if (!r.ok) { const e = await r.json().catch(()=>({error:"Fehler"})); throw new Error(e.error||"PDF Fehler"); }
    return r.blob();
  },
};
export default API;
// Papierkorb
export const getPapierkorb = (bcAll) => API.json(`/api/vorgaenge/papierkorb/liste${bcAll ? "?bc=ALL" : ""}`);
export const restoreVorgang = (id) => API.json(`/api/vorgaenge/${id}/restore`, { method: "PUT" });
export const purgeVorgang   = (id) => API.json(`/api/vorgaenge/${id}/purge`,   { method: "DELETE" });
