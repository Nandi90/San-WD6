/**
 * ═══════════════════════════════════════════════════════════════════
 * Datenbank - SQLite mit sauberem Schema
 * ═══════════════════════════════════════════════════════════════════
 */

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = process.env.DATABASE_PATH || "/data/sanwd.db";
let db;

function getDb() { return db; }

function init() {
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate();
  seedDefaults();

    // ── User-Profil Erweiterung ──────────────────────────────────
    try {
      getDb().prepare("ALTER TABLE users ADD COLUMN telefon TEXT DEFAULT ''").run();
    } catch {}
    try {
      getDb().prepare("ALTER TABLE users ADD COLUMN mobil TEXT DEFAULT ''").run();
    } catch {}
    try {
      getDb().prepare("ALTER TABLE users ADD COLUMN titel TEXT DEFAULT ''").run();
    } catch {}
    try {
      getDb().prepare("ALTER TABLE users ADD COLUMN ort TEXT DEFAULT ''").run();
    } catch {}
    // ── Papierkorb: Soft-Delete ──────────────────────────────────
    try {
      getDb().prepare("ALTER TABLE vorgaenge ADD COLUMN deleted_at TEXT DEFAULT NULL").run();
    } catch {}
    try {
      getDb().prepare("ALTER TABLE anfragen ADD COLUMN deleted_at TEXT DEFAULT NULL").run();
    } catch {}
    try {
      getDb().prepare("ALTER TABLE anfragen ADD COLUMN bereitschaft_code TEXT DEFAULT NULL").run();
    } catch {}
    try {
      getDb().prepare("ALTER TABLE anfragen ADD COLUMN vorgang_id TEXT DEFAULT NULL").run();
    } catch {}
    try {
      getDb().prepare("ALTER TABLE anfragen ADD COLUMN plz TEXT DEFAULT NULL").run();
    } catch {}
    try {
      getDb().prepare("ALTER TABLE anfragen ADD COLUMN suggested_bc TEXT DEFAULT NULL").run();
    } catch {}
    try {
      getDb().prepare("ALTER TABLE anfragen ADD COLUMN rechnungsempfaenger TEXT DEFAULT ''").run();
    } catch {}
    try {
      getDb().prepare("ALTER TABLE anfragen ADD COLUMN re_strasse TEXT DEFAULT ''").run();
    } catch {}
    try {
      getDb().prepare("ALTER TABLE anfragen ADD COLUMN re_plz_ort TEXT DEFAULT ''").run();
    } catch {}
    try {
      getDb().prepare("ALTER TABLE anfragen ADD COLUMN ablehnung_grund TEXT DEFAULT NULL").run();
    } catch {}
    // Backfill: angenommene Anfragen mit BC + Vorgang-ID aus verknüpften Vorgängen
    try {
      const orphans = getDb().prepare("SELECT id FROM anfragen WHERE status='angenommen' AND (bereitschaft_code IS NULL OR vorgang_id IS NULL)").all();
      if (orphans.length > 0) {
        const vorgaenge = getDb().prepare("SELECT id, bereitschaft_code, data FROM vorgaenge").all();
        for (const o of orphans) {
          const match = vorgaenge.find(v => {
            try { const d = JSON.parse(v.data); return d.event?.anfrageId === o.id; } catch { return false; }
          });
          if (match) {
            getDb().prepare("UPDATE anfragen SET bereitschaft_code=?, vorgang_id=? WHERE id=?").run(match.bereitschaft_code, match.id, o.id);
          }
        }
        console.log(`Backfill: ${orphans.length} Anfragen geprüft`);
      }
    } catch (e) { console.warn("Backfill Anfragen:", e.message); }

  // Nextcloud Defaults
  const cfgIns = getDb().prepare("INSERT OR IGNORE INTO app_config (key, value) VALUES (?, ?)");
  cfgIns.run("nextcloud_url", "https://office.brkndsob.org");
  cfgIns.run("nextcloud_base_path", "Verwaltung Bereitschaft $bereitschaft/SanWD");
  cfgIns.run("nextcloud_enabled", "false");
  cfgIns.run("nextcloud_subfolder", "$auftragsnr - $veranstaltung");
  cfgIns.run("smtp_enabled", "false");
  cfgIns.run("smtp_mode", "smtp");
  cfgIns.run("smtp_host", "");
  cfgIns.run("smtp_port", "587");
  cfgIns.run("smtp_secure", "false");
  cfgIns.run("smtp_user", "");
  cfgIns.run("smtp_password", "");
  cfgIns.run("smtp_from_email", "");
  cfgIns.run("smtp_from_name", "BRK Sanitätswachdienst");
  cfgIns.run("smtp_cc_bereitschaft", "true");
  cfgIns.run("smtp_on_behalf", "true");
  cfgIns.run("fibu_email", "");
  cfgIns.run("smtp_notify_recipients", "");
  cfgIns.run("smtp_anfrage_confirm", "true");
  cfgIns.run("nextcloud_auth_mode", "service");
  cfgIns.run("nextcloud_service_user", "");
  cfgIns.run("nextcloud_service_password", "");

  console.log("✅ Datenbank initialisiert:", DB_PATH);
}

function migrate() {
  db.exec(`
    -- ── Bereitschaften ──────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS bereitschaften (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short TEXT NOT NULL,
      kv_name TEXT DEFAULT 'Kreisverband Neuburg-Schrobenhausen',
      kgf TEXT DEFAULT 'Robert Augustin',
      kv_adresse TEXT DEFAULT 'Karl Konrad Str. 3',
      kv_plz_ort TEXT DEFAULT '86633 Neuburg',
      leiter_name TEXT DEFAULT '',
      leiter_title TEXT DEFAULT 'Bereitschaftsleiter',
      telefon TEXT DEFAULT '',
      fax TEXT DEFAULT '',
      mobil TEXT DEFAULT '',
      email TEXT DEFAULT '',
      funkgruppe TEXT DEFAULT '',
      logo BLOB,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- ── Kostensätze (pro Bereitschaft) ──────────────────────────
    CREATE TABLE IF NOT EXISTS kostensaetze (
      bereitschaft_code TEXT PRIMARY KEY REFERENCES bereitschaften(code),
      helfer REAL DEFAULT 14,
      ktw REAL DEFAULT 125,
      rtw REAL DEFAULT 155,
      gktw REAL DEFAULT 105,
      einsatzleiter REAL DEFAULT 14,
      einsatzleiter_kfz REAL DEFAULT 155,
      seg_lkw REAL DEFAULT 125,
      mtw REAL DEFAULT 50,
      zelt REAL DEFAULT 60,
      km_ktw REAL DEFAULT 0.4,
      km_rtw REAL DEFAULT 0.4,
      km_gktw REAL DEFAULT 0.4,
      km_el_kfz REAL DEFAULT 0.6,
      km_seg_lkw REAL DEFAULT 0.6,
      km_mtw REAL DEFAULT 0.4,
      verpflegung REAL DEFAULT 17,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- ── Benutzer (Cache aus Keycloak) ───────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      sub TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT DEFAULT '',
      rolle TEXT DEFAULT 'helfer',
      bereitschaft_code TEXT REFERENCES bereitschaften(code),
      last_login TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ── Vorgänge ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS vorgaenge (
      id TEXT PRIMARY KEY,
      bereitschaft_code TEXT NOT NULL REFERENCES bereitschaften(code),
      year INTEGER NOT NULL,
      status TEXT DEFAULT 'entwurf',
      data JSON NOT NULL,
      created_by TEXT REFERENCES users(sub),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      synced_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_vorgaenge_bc_year
      ON vorgaenge(bereitschaft_code, year);

    -- ── Kundenstamm ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS kunden (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bereitschaft_code TEXT NOT NULL REFERENCES bereitschaften(code),
      name TEXT NOT NULL,
      ansprechpartner TEXT DEFAULT '',
      telefon TEXT DEFAULT '',
      email TEXT DEFAULT '',
      rechnungsempfaenger TEXT DEFAULT '',
      re_strasse TEXT DEFAULT '',
      re_plz_ort TEXT DEFAULT '',
      anrede TEXT DEFAULT 'Sehr geehrte Damen und Herren,',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(bereitschaft_code, name)
    );

    -- ── PDF Templates ───────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS pdf_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      type TEXT NOT NULL,
      data BLOB,
      field_mapping JSON,
      uploaded_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- ── Laufende Nummern ────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS counter (
      bereitschaft_code TEXT NOT NULL REFERENCES bereitschaften(code),
      year INTEGER NOT NULL,
      next_nr INTEGER DEFAULT 1,
      PRIMARY KEY(bereitschaft_code, year)
    );

    -- ── Audit Log ───────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS vorgang_locks (
      vorgang_id TEXT PRIMARY KEY,
      user_sub TEXT NOT NULL,
      user_name TEXT NOT NULL,
      locked_at TEXT DEFAULT (datetime('now')),
      heartbeat TEXT DEFAULT (datetime('now'))
    );

    -- ── Status-Änderungslog ─────────────────────────────────────
    CREATE TABLE IF NOT EXISTS vorgang_status_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vorgang_id TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by_sub TEXT,
      changed_by_name TEXT,
      reason TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_sub TEXT,
      user_name TEXT,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- ── App-Konfiguration ─────────────────────────────────────
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS klauseln (
      id TEXT PRIMARY KEY,
      titel TEXT NOT NULL,
      dokument TEXT NOT NULL,
      inhalt TEXT NOT NULL,
      reihenfolge INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    );


  `);
  try { db.exec("ALTER TABLE kunden ADD COLUMN kundennummer TEXT DEFAULT ''"); } catch(e) {}
  try { db.exec("ALTER TABLE kunden ADD COLUMN bemerkung TEXT DEFAULT ''"); } catch(e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN unterschrift TEXT DEFAULT ''"); } catch(e) {}

  try { db.exec("ALTER TABLE bereitschaften ADD COLUMN datenschutz_url TEXT DEFAULT ''"); } catch(e) {}
  try { db.exec("ALTER TABLE bereitschaften ADD COLUMN fertig_url TEXT DEFAULT ''"); } catch(e) {}
  db.exec(`CREATE TABLE IF NOT EXISTS anfragen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, ort TEXT, adresse TEXT, datum TEXT,
    zeit_von TEXT, zeit_bis TEXT, besucher INTEGER,
    veranstalter TEXT, ansprechpartner TEXT, telefon TEXT,
    email TEXT, bemerkung TEXT, art TEXT,
    status TEXT DEFAULT 'neu',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  seedKlauseln();
}

function seedDefaults() {
  const count = db.prepare("SELECT COUNT(*) as c FROM bereitschaften").get().c;
  if (count > 0) return;

  console.log("🌱 Seed: Bereitschaften + Kostensätze...");
  const bereitschaften = [
    { code: "KBL", name: "Kreisbereitschaftsleitung", short: "KBL" },
    { code: "BSOB", name: "Bereitschaft Schrobenhausen", short: "SOB" },
    { code: "BND", name: "Bereitschaft Neuburg", short: "ND" },
    { code: "BKAHU", name: "Bereitschaft Karlshuld", short: "KAHU" },
    { code: "BKK", name: "Bereitschaft Karlskron", short: "KK" },
    { code: "BBGH", name: "Bereitschaft Burgheim", short: "BGH" },
    { code: "BWEIG", name: "Bereitschaft Weichering", short: "WEIG" },
  ];

  const insertB = db.prepare("INSERT OR IGNORE INTO bereitschaften (code, name, short) VALUES (?,?,?)");
  const insertK = db.prepare("INSERT OR IGNORE INTO kostensaetze (bereitschaft_code) VALUES (?)");

  const tx = db.transaction(() => {
    for (const b of bereitschaften) {
      insertB.run(b.code, b.name, b.short);
      insertK.run(b.code);
    }
  });
  tx();
}

// ── Audit ────────────────────────────────────────────────────────
function audit(user, action, entity, entityId, details) {
  db.prepare("INSERT INTO audit_log (user_sub, user_name, action, entity, entity_id, details) VALUES (?,?,?,?,?,?)")
    .run(user?.sub, user?.name, action, entity, entityId, typeof details === "string" ? details : JSON.stringify(details));
}

function seedKlauseln() {
  const count = db.prepare("SELECT COUNT(*) as c FROM klauseln").get().c;
  if (count > 0) return;
  const ins = db.prepare("INSERT OR IGNORE INTO klauseln (id, titel, dokument, inhalt, reihenfolge) VALUES (?, ?, ?, ?, ?)");
  const aabDefaults = [
    ["aab_1","1. Dienstanforderung, nachträgliche Verstärkung","aab",
`1.1 Die Anforderung eines Sanitätswachdienstes sollte rechtzeitig, spätestens jedoch einen Monat vor Veranstaltungsbeginn, erfolgen, um uns und unseren ehrenamtlichen Mitarbeitern eine entsprechende langfristige Disposition zu ermöglichen. Kurzfristige Anforderungen versuchen wir nach Möglichkeit ebenfalls zu erfüllen.

1.2 In Fragen der erforderlichen Personalstärke, sowie bezüglich der Notwendigkeit zum Einsatz von Fahrzeugen, beraten wir den Anforderer gerne. Diesbezüglich müssen die Auflagen der Genehmigungs- bzw. Ordnungsbehörde beigefügt werden.

1.3 Soweit das anwesende Personal und/oder das eingesetzte Material nicht ausreichen und wir auf Weisung des Einsatzleiters Sanitätswachdienst oder der Ordnungsbehörde kurzfristig bzw. während des laufenden Einsatzes zusätzliche Kräfte oder Ausrüstung nachführen müssen, berechnen wir den doppelten Satz der regulären Vergütung.`,1],
    ["aab_2","2. Personal, Material, Einsatzfahrzeuge","aab",
`2.1 Unsere Helfer verfügen über eine organisationsinterne Ausbildung in erweiterter Erster Hilfe und sanitätsdienstlichen Maßnahmen, die zur Erstversorgung von Patienten bzw. zur Arztassistenz qualifizieren. Rettungssanitäter haben die staatliche Prüfung nach der jeweils geltenden Landesprüfungsordnung abgelegt.

2.2 Die für die sanitätsdienstliche Versorgung erforderliche Grundausstattung (Verbandmittel, Notfallausstattung, Decken) führen unsere Helfer mit. Weiteren Ausstattungswünschen und Auflagen kommen wir, soweit möglich, gerne nach.

2.3 Soweit wir Krankentransport- und/oder Rettungswagen zur Verfügung stellen, entsprechen diese mindestens der DIN 75080.

2.4 Das beim Sanitätswachdienst eingesetzte ärztliche Personal handelt in eigenem Namen und auf eigene Rechnung. Das BRK wird hier nur vermittelnd tätig und übernimmt keine Haftung für das ärztliche Personal.

2.5 Den Vorgaben des Einsatzleiters Sanitätswachdienst ist, hinsichtlich der Einsatztaktik, dem Aufstellungsort der Fahrzeuge sowie Sanitätszelte, mobilen Sanitätsstationen und Gerätschaften, absolut Folge zu leisten.

2.6 Vom Veranstalter ist sicherzustellen, dass unserem Personal zu allen Bereichen der Veranstaltung ungehinderter Zugang gewährt wird und außerdem ist er für ungehinderte An- bzw. Abfahrt der Sanitäts- wie auch der Rettungsfahrzeuge zu jeder Zeit verantwortlich.

2.7 Die Haftung des BRK wird auf Vorsatz und grobe Fahrlässigkeit beschränkt.`,2],
    ["aab_3","3. Abrechnungsmodalitäten, weitere Kosten","aab",
`3.1 Personal berechnen wir nach Einsatzstunden, ab Eintreffen am Einsatzort, angebrochene Stunden werden zur nächsten vollen Stunde aufgerundet. Entscheidend für die Berechnung sind nicht die vorgeplanten Zeiten, sondern die tatsächliche Anwesenheit. Die Fahrzeuge werden pauschal zuzüglich der gefahrenen Kilometer abgerechnet.

3.2 Alle Hilfeleistungen durch unser Personal sind mit den Bereitstellungskosten abgegolten. Den unvorhersehbaren Materialaufwand stellen wir dem Veranstalter/Anforderer gesondert in Rechnung. Anfallende Krankentransporte und Rettungsdiensteinsätze mit unseren Fahrzeugen rechnet der Rettungsdienst Bayern gesondert ab.

3.3 Die Verpflegung des BRK-Personals obliegt dem Veranstalter (ab 4 Stunden Warmverpflegung). Sollte dies nicht möglich sein, so berechnen wir einen höheren Stundensatz.

3.4 Die Bezahlung erfolgt gegen Rechnung, die sofort ab Zugang, ohne Abzug zu begleichen ist.`,3],
    ["aab_4","4. Ende eines Sanitätswachdienstes","aab",
`4.1 Das Ende eines Sanitätswachdienstes ist spätestens eine Stunde nach der im Auftrag festgelegten Endzeit. Damit endet auch unsere Verantwortung für diesen Einsatz.

4.2 Die Nichteinhaltung unserer Auftragsbedingungen kann einen sofortigen Abbruch des Sanitätswachdienstes zur Folge haben. Für die möglicherweise hieraus resultierenden Folgen übernehmen wir keine Haftung.`,4],
    ["aab_5","5. Nebenabreden, salvatorische Klausel","aab",
`5.1 Soweit wir im Rahmen des Sanitätswachdienstes personenbezogene Daten erheben, werden wir diese nicht an unbefugte Dritte weitergeben.

5.2 Mündliche Nebenabreden wurden und werden nicht getroffen. Bei Unwirksamkeit einer der vorstehenden Regelung bleibt die Wirksamkeit der Übrigen unberührt.

5.3 Eventuelle Änderungen bedürfen der Schriftform.`,5],
    ["vertrag_§2","§2 Verpflichtung des BRK","vertrag",
`1. Das BRK verpflichtet sich, nach Maßgabe dieser Vereinbarung einschließlich Anlagen die vorstehende Veranstaltung sanitätsdienstlich abzusichern. Hierzu stellt das BRK geeignetes Personal und die erforderliche Ausrüstung. Anzahl und Qualifikation des eingesetzten Personals, die erforderliche Ausstattung und Ausrüstung sowie die Bereitstellungszeiten richten sich nach Anlage 1, die Bestandteil dieser Vereinbarung ist.

2. Das BRK ist gegenüber den Besuchern der Veranstaltung, die einer sanitätsdienstlichen Betreuung bedürfen (Patienten) verpflichtet, die sanitätsdienstliche Hilfe zu erbringen. Die Patienten haben gegen das BRK einen unmittelbaren Anspruch auf diese Leistungen. Die Leistungen werden vom Veranstalter gem. §5 dieses Vertrages vergütet. Die vorliegende Vereinbarung ist somit ein Vertrag zugunsten Dritter.

3. Die medizinische Versorgung und der Transport von Notfallpatienten im Sinne des Art. 2 Abs. 2 BayRDG ist nicht Gegenstand dieser Vereinbarung. Soweit Versorgung und/oder Transport von Notfallpatienten erforderlich ist, wird dies durch die Rettungsleitstelle/Integrierte Leitstelle Ingolstadt gemäß Art. 9 BayRDG erledigt. Das BRK wird zur Erstversorgung der Patienten tätig, bis ein Rettungsmittel des öffentlich-rechtlichen Rettungsdienstes eingetroffen ist.

4. Die Verpflichtungen in den Ziffern 1-3 dieses Abschnitts beschränken sich (auch gegenüber dritten) auf eine sanitätsdienstliche Absicherung, die im Regelfall nach billigem Ermessen des BRK auf der Grundlage der mitgeteilten Daten des Veranstalters (§§ 1, 3 Abs. 1) voraussichtlich als angemessen zu erwarten ist. Das BRK behält sich für den Katastrophenfall (auch außerhalb der Veranstaltung) nach dem BayKSG vor, Einsatzkräfte nach billigem Ermessen unter Beachtung der Verhältnismäßigkeit und den Anforderungen des BayKSG jederzeit von der Veranstaltung abzuziehen. Hierüber ist der Veranstalter unverzüglich zu unterrichten. In diesem Falle vermindert sich das nach §4 zu entrichtende Entgelt anteilig im Verhältnis der abgezogenen Einsatzkräfte.

5. Das BRK übernimmt keinerlei Aufgaben der Veranstaltungsorganisation und -durchführung. Sämtliche Aufgaben der Veranstaltungsorganisation und -durchführung obliegen allein dem Veranstalter.`,1],
    ["vertrag_§3","§3 Verpflichtung des Veranstalters","vertrag",
`1. Der Veranstalter informiert das BRK rechtzeitig und vollständig über alle Umstände, die für die Planung des sanitätsdienstlichen Einsatzes erforderlich sind.

2. Der Veranstalter stellt während der gesamten Veranstaltung und in angemessene Zeit vorher und nachher einen gesicherten Kommunikationsweg zwischen dem BRK und einer verantwortlichen Person des Veranstalters sicher (z.B. Festnetz- oder gesicherte Mobilnetzverbindung, Funkverbindung über Veranstaltungsfunk, etc.).

3. Der Veranstalter stellt dem BRK die für den Sanitätswachdienst erforderlichen Stellflächen gemäß im Vorfeld zu treffender Abstimmung zur Verfügung und stellt die notwendige Strom- und Wasserversorgung sicher.

4. Der Veranstalter informiert das BRK während des Verlaufes der Veranstaltung über alle Vorkommnisse und Ereignisse, die für die sanitätsdienstliche Absicherung und etwaige rettungsdienstliche Einsätze von Bedeutung sind.

5. Der Veranstalter verpflichtet sich, das BRK bei rettungs- oder sanitätsdienstlichen Einsätzen nach Kräften zu unterstützen.

6. Der Veranstalter verpflichtet sich ferner, dem BRK alle etwaigen Auflagen von Genehmigungsbehörden oder sonstigen Behörden und Organisationen, die die Veranstaltung betreffen, rechtzeitig und vollständig bekannt zu geben.`,2],
    ["vertrag_§5","§5 Haftung","vertrag","Die Haftung des BRK aus dieser Vereinbarung wird auf Vorsatz und grobe Fahrlässigkeit beschränkt.",3],
    ["vertrag_§6","§6 Allgemeine Regeln","vertrag",
`Änderungen oder Ergänzungen dieser Vereinbarung bedürfen der Schriftform. Mündliche Nebenabreden sind nicht getroffen worden.

Soweit eine der Regelungen dieser Vereinbarung unwirksam ist oder wird, berührt dies nicht die Wirksamkeit der Vereinbarung insgesamt. In diesem Fall verpflichten sich die Parteien, die unwirksame Regelung durch eine wirksame zu ersetzen, die dem wirtschaftlichen Zweck der unwirksamen Regelung möglichst nahe kommt.`,4],
  ];
  for (const [id,titel,dok,inhalt,reihen] of aabDefaults) {
    ins.run(id, titel, dok, inhalt, reihen);
  }
  console.log("Klauseln Seed: " + aabDefaults.length + " Einträge");
}

function getConfig(key, fallback) {
  const row = getDb().prepare("SELECT value FROM app_config WHERE key=?").get(key);
  return row ? row.value : (fallback || "");
}

function setConfig(key, value) {
  getDb().prepare("INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES (?, ?, datetime('now'))").run(key, value);
}

function getAllConfig(prefix) {
  if (prefix) return getDb().prepare("SELECT key, value FROM app_config WHERE key LIKE ?").all(prefix + "%");
  return getDb().prepare("SELECT key, value FROM app_config").all();
}

module.exports = {
  seedKlauseln, init, getDb, audit, getConfig, setConfig, getAllConfig };
