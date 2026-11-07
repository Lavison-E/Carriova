import type { Metadata } from "next";
import { CareerProfileOverview } from "@/components/profile/CareerProfileOverview";
import { WorkspaceHeading, WorkspaceUnavailable } from "@/components/workspace/WorkspaceUi";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { getCustomerCareerProfile, getCustomerWhatsApp } from "@/lib/career-profile-queries";
import { requireCustomer } from "@/lib/customer-auth";
import { listCustomerCvs } from "@/lib/cv-store";

export const metadata: Metadata = { title: "Mon profil professionnel" };
export default async function CareerProfilePage({ searchParams }: { searchParams: Promise<{ bienvenue?: string; enregistre?: string }> }) {
  const query = await searchParams;
  const result = await loadWorkspaceData(async () => {
    const customer = await requireCustomer();
    const [record, whatsapp, cvs] = await Promise.all([
      getCustomerCareerProfile(), getCustomerWhatsApp(),
      listCustomerCvs(customer.id).then((rows) => rows.map(({ id, title }) => ({ id, title }))).catch(() => null),
    ]);
    return { customer, record, whatsapp, cvs };
  });
  if (!result) return <WorkspaceUnavailable href="/espace/profil" />;
  const { customer, record, whatsapp, cvs } = result.data;
  return <>
    <WorkspaceHeading eyebrow="Votre profil privé" title="Votre parcours, vos ambitions." text="Retrouvez ici vos informations enregistrées et les prochaines étapes de votre recherche." />
    <CareerProfileOverview customer={customer} record={record} whatsapp={whatsapp} cvs={cvs ?? []} cvsAvailable={cvs !== null} welcome={query.bienvenue === "1"} saved={query.enregistre === "1" && record.version > 0} />
  </>;
}
