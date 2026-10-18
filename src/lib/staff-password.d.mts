export const DUMMY_PASSWORD_HASH: string;
export function hashPassword(password: string, options?: { minLength?: 8 | 15 }): Promise<string>;
export function verifyPassword(password: string, encoded: string): Promise<boolean>;
