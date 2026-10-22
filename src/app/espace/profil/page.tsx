import type { Metadata } from "next";
import Link from "next/link";
import { CareerProfileForm } from "@/components/profile/CareerProfileForm";
import { WorkspaceHeading, WorkspaceUnavailable } from "@/components/workspace/WorkspaceUi";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { getCustomerCareerProfile, getCustomerWhatsApp } from "@/lib/career-profile-queries";
import { requireCustomer } from "@/lib/customer-auth";
import { listCustomerCvs } from "@/lib/cv-store";

export const metadata: Metadata = { title: "Mon profil professionnel" };
export default async function CareerProfilePage() {
  const result = await loadWorkspaceData(async () => {
    const customer = await requireCustomer();
    const [record, whatsapp, cvs] = await Promise.all([getCustomerCareerProfile(), getCustomerWhatsApp(), listCustomerCvs(customer.id)]);
    return { record, whatsapp, cvs: cvs.map(({ id, title }) => ({ id, title })) };
  });
  if (!result) return <WorkspaceUnavailable href="/espace/profil" />;
  const { record, whatsapp, cvs } = result.data;
  return <><WorkspaceHeading eyebrow="Votre profil privé" title="Un projet qui vous ressemble." text="Vos compétences, votre parcours et vos envies. Renseignez votre profil pour mieux orienter votre recherche d’opportunités." />{!whatsapp ? <div className="mb-5 rounded-xl border border-orange/20 bg-[#fff7f0] p-5"><p className="text-xs leading-7 text-night">Ajoutez votre numéro WhatsApp pour faciliter le suivi de votre compte. Votre accès reste disponible.</p><Link href="/espace/compte" className="mt-2 inline-flex min-h-10 items-center text-xs font-semibold text-orange">Compléter mon numéro →</Link></div> : null}<CareerProfileForm initialRecord={record} cvs={cvs} /></>;
}
