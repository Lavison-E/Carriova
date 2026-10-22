import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode as PhoneCountryCode } from "libphonenumber-js/min";
import { countryOptions } from "@/lib/countries";

const supported = new Set<string>(getCountries());
export const whatsappCountryOptions = countryOptions.filter((country) => supported.has(country.value)).map((country) => ({ ...country, dialCode: `+${getCountryCallingCode(country.value as PhoneCountryCode)}` }));
export function normalizeWhatsApp(input: unknown, country: unknown): string | null {
  if (typeof input !== "string" || typeof country !== "string" || !supported.has(country) || input.length > 40) return null;
  const value = input.trim().replace(/^00/, "+");
  if (!/^\+?[\d\s().-]+$/.test(value)) return null;
  try {
    const phone = parsePhoneNumberFromString(value, { defaultCountry: country as PhoneCountryCode, extract: false });
    return phone?.isValid() && /^\+[1-9]\d{7,14}$/.test(phone.number) ? phone.number : null;
  } catch { return null; }
}
export function whatsAppCountryFor(number: string | null) {
  return number ? parsePhoneNumberFromString(number)?.country ?? "CI" : "CI";
}
export type WhatsAppActionState = { ok: boolean; message: string; fieldErrors?: Record<string, string>; whatsapp?: string };
