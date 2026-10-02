/**
 * Exécuté une fois au démarrage du serveur Next.js.
 * Journalise l’état de la configuration et des intégrations, sans jamais afficher de secret.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { envIssues, serverEnv } = await import("./lib/env");
    const { publicIntegrations } = await import("./lib/site");
    const flag = (enabled: boolean) => (enabled ? "on" : "off");

    console.info(
      `[env] CARRIOVA - site=${serverEnv.NEXT_PUBLIC_SITE_URL} contact=${serverEnv.CONTACT_EMAIL} database=${
        serverEnv.DATABASE_URL ? "configured" : "missing"
      }`,
    );
    console.info(
      [
        "[env] integrations -",
        `email=${flag(serverEnv.email.enabled)}`,
        `whatsapp_link=${flag(Boolean(publicIntegrations.whatsappNumber))}`,
        `whatsapp_api=${flag(serverEnv.whatsappApi.enabled)}`,
        `crm=${flag(serverEnv.crm.enabled)}`,
        `admin_export=${flag(Boolean(serverEnv.adminApiToken))}`,
        `analytics=${flag(Boolean(publicIntegrations.plausibleDomain))}`,
        `search_console=${flag(Boolean(serverEnv.verification.google || serverEnv.verification.bing))}`,
      ].join(" "),
    );
    for (const issue of envIssues) {
      const line = `[env] ${issue.level === "error" ? "ERROR" : "WARNING"} ${issue.key} ${issue.message}`;
      if (issue.level === "error") console.error(line);
      else console.warn(line);
    }
  } catch (error) {
    console.error(
      "[env] Unable to validate environment:",
      error instanceof Error ? error.message : String(error),
    );
  }
}
