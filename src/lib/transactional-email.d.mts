export interface TransactionalEmailOptions {
  title: string;
  /** Plain text. Blank lines separate paragraphs; single newlines remain line breaks. */
  body: string;
  actionLabel: string;
  /** Absolute HTTPS URL; HTTP URLs and embedded credentials are rejected. */
  actionUrl: string;
  supportEmail: string;
  /** Optional plain-text notice below the action. */
  note?: string;
}

/** Produces accessible HTML with escaped text and validated URLs. Throws TypeError for invalid input. */
export function renderTransactionalEmail(options: TransactionalEmailOptions): string;
