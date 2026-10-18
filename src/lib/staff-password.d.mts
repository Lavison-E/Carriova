export const DUMMY_PASSWORD_HASH: string;
export function hashPassword(password: string): Promise<string>;
export function verifyPassword(password: string, encoded: string): Promise<boolean>;
