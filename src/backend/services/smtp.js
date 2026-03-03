/**
 * SMTP / E-Mail Service
 * Unterstützt: Standard SMTP, Microsoft 365 (OAuth2-ready), Exchange
 */

const nodemailer = require("nodemailer");

function cfg(key, fallback) {
  try {
    const { getConfig } = require("../db");
    return getConfig(key, fallback || "");
  } catch { return fallback || ""; }
}

function createTransport() {
  const mode = cfg("smtp_mode", "smtp");
  const host = cfg("smtp_host");
  const port = parseInt(cfg("smtp_port", "587"));
  const secure = cfg("smtp_secure", "false") === "true";
  const user = cfg("smtp_user");
  const pass = cfg("smtp_password");

  if (!host || !user) return null;

  if (mode === "365") {
    return nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: { user, pass },
      tls: { ciphers: "SSLv3", rejectUnauthorized: false }
    });
  }

  if (mode === "exchange") {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  }

  // Standard SMTP
  return nodemailer.createTransport({
    host, port, secure,
    auth: { user, pass }
  });
}

async function sendMail({ to, subject, html, text, attachments, onBehalf, ccBereitschaft }) {
  const transport = createTransport();
  if (!transport) throw new Error("E-Mail nicht konfiguriert (SMTP-Einstellungen prüfen)");

  const fromEmail = cfg("smtp_from_email") || cfg("smtp_user");
  const fromName = cfg("smtp_from_name", "BRK Sanitätswachdienst");
  
  const mailOpts = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html: html || undefined,
    text: text || undefined,
    attachments: attachments || []
  };

  // "Im Auftrag von" Header
  if (onBehalf && cfg("smtp_on_behalf", "true") === "true") {
    mailOpts.replyTo = onBehalf;
    mailOpts.headers = { "X-On-Behalf-Of": onBehalf };
  }

  // CC an Bereitschafts-E-Mail
  if (ccBereitschaft && cfg("smtp_cc_bereitschaft", "true") === "true") {
    mailOpts.cc = ccBereitschaft;
  }

  const result = await transport.sendMail(mailOpts);
  console.log("Mail gesendet:", result.messageId, "an:", to);
  return { success: true, messageId: result.messageId };
}

async function testConnection() {
  const transport = createTransport();
  if (!transport) throw new Error("SMTP nicht konfiguriert");
  await transport.verify();
  return { success: true, message: "SMTP-Verbindung erfolgreich" };
}

function isConfigured() {
  return cfg("smtp_enabled", "false") === "true" && !!cfg("smtp_host") && !!cfg("smtp_user");
}

module.exports = { sendMail, testConnection, isConfigured, cfg };
