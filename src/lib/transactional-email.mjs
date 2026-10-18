/** Render a transactional email without external assets or tracking content. */
function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function requiredText(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} must be a non-empty string`);
  return value.trim();
}

function safeActionUrl(value) {
  let url;
  try { url = new URL(requiredText(value, "actionUrl")); }
  catch { throw new TypeError("actionUrl must be an absolute HTTPS URL"); }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
    throw new TypeError("actionUrl must be an absolute HTTPS URL without credentials");
  }
  return url.href;
}

export function renderTransactionalEmail({ title, body, actionLabel, actionUrl, supportEmail, note }) {
  const safeTitle = escapeHtml(requiredText(title, "title"));
  const safeLabel = escapeHtml(requiredText(actionLabel, "actionLabel"));
  const url = escapeHtml(safeActionUrl(actionUrl));
  const support = requiredText(supportEmail, "supportEmail");
  if (support.length > 254 || !/^[^\s<>@"(),:;\\]+@[^\s<>@"(),:;\\]+\.[^\s<>@"(),:;\\]+$/.test(support)) {
    throw new TypeError("supportEmail must be a valid email address");
  }
  const safeSupport = escapeHtml(support);
  const mailto = escapeHtml(`mailto:${encodeURIComponent(support)}`);
  const paragraphs = requiredText(body, "body").replace(/\r\n?/g, "\n").split(/\n\s*\n/)
    .map((paragraph) => `<p style="margin:0 0 18px;font-size:15px;line-height:26px;color:#4d5870;">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("\n");
  if (note !== undefined && typeof note !== "string") throw new TypeError("note must be a string");
  const noteBlock = note?.trim() ? `<tr><td style="padding:0 32px 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-left:3px solid #bd470d;background-color:#f7f5ef;padding:16px 18px;color:#4d5870;font-size:12px;line-height:21px;">${escapeHtml(note.trim()).replace(/\r\n?|\n/g, "<br>")}</td></tr></table></td></tr>` : "";

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#f7f5ef;color:#001252;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#f7f5ef;">
    <tr><td align="center" style="padding:24px 12px 32px;">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e2e4e9;border-collapse:separate;border-spacing:0;border-radius:12px;">
        <tr><td style="padding:27px 32px;background-color:#001252;border-radius:11px 11px 0 0;">
          <p style="margin:0;color:#ffffff;font-size:19px;font-weight:700;letter-spacing:3px;line-height:27px;">CARRIOVA</p>
          <p style="margin:7px 0 0;color:#c6cde0;font-size:10px;letter-spacing:1.6px;line-height:17px;">VOTRE PARCOURS, À VOS CÔTÉS.</p>
        </td></tr>
        <tr><td style="padding:32px 32px 0;">
          <table role="presentation" width="40" cellpadding="0" cellspacing="0" border="0"><tr><td height="3" style="height:3px;line-height:3px;font-size:3px;background-color:#bd470d;">&nbsp;</td></tr></table>
          <h1 style="margin:23px 0 24px;color:#001252;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:39px;font-weight:400;font-style:italic;overflow-wrap:anywhere;">${safeTitle}</h1>
          ${paragraphs}
        </td></tr>
        <tr><td style="padding:8px 32px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#bd470d" style="border-radius:7px;background-color:#bd470d;text-align:center;">
            <a href="${url}" style="display:inline-block;border:1px solid #bd470d;border-radius:7px;padding:15px 22px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:21px;font-weight:700;text-decoration:none;mso-padding-alt:0;"><!--[if mso]><i style="mso-font-width:140%;mso-text-raise:22pt;" hidden>&emsp;</i><![endif]--><span style="mso-text-raise:11pt;">${safeLabel}</span><!--[if mso]><i style="mso-font-width:140%;" hidden>&emsp;&#8203;</i><![endif]--></a>
          </td></tr></table>
        </td></tr>
        ${noteBlock}
        <tr><td style="padding:0 32px 30px;">
          <p style="margin:0;color:#6b7285;font-size:11px;line-height:19px;">Si le bouton ne s’ouvre pas, copiez ce lien dans votre navigateur :</p>
          <p style="margin:7px 0 0;font-size:11px;line-height:19px;word-break:break-all;overflow-wrap:anywhere;"><a href="${url}" style="color:#001252;text-decoration:underline;word-break:break-all;">${url}</a></p>
        </td></tr>
        <tr><td style="padding:23px 32px 25px;border-top:1px solid #e2e4e9;background-color:#faf9f5;border-radius:0 0 11px 11px;">
          <p style="margin:0;color:#001252;font-size:12px;font-weight:700;line-height:21px;">Une question ? Nous sommes là.</p>
          <p style="margin:7px 0 0;color:#4d5870;font-size:12px;line-height:21px;">Écrivez-nous à <a href="${mailto}" style="color:#001252;text-decoration:underline;word-break:break-all;">${safeSupport}</a>.</p>
          <p style="margin:17px 0 0;color:#6b7285;font-size:11px;line-height:19px;">L’équipe CARRIOVA</p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
      <p style="margin:18px 0 0;color:#6b7285;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:17px;">CARRIOVA · Votre carrière, votre prochaine étape.</p>
    </td></tr>
  </table>
</body>
</html>`;
}
