import type { Metadata } from "next";
import { CareerProfileForm } from "@/components/profile/CareerProfileForm";
import { WorkspaceHeading, WorkspaceUnavailable } from "@/components/workspace/WorkspaceUi";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { getCustomerCareerProfile } from "@/lib/career-profile-queries";
import { requireCustomer } from "@/lib/customer-auth";
import { listCustomerCvs } from "@/lib/cv-store";

export const metadata: Metadata = { title: "Compléter mon profil" };
export default async function EditCareerProfilePage() {
  const result = await loadWorkspaceData(async () => {
    const customer = await requireCustomer();
    const [record, cvs] = await Promise.all([getCustomerCareerProfile(), listCustomerCvs(customer.id)]);
    return { record, cvs: cvs.map(({ id, title }) => ({ id, title })) };
  });
  if (!result) return <WorkspaceUnavailable href="/espace/profil/modifier" />;
  return <>
    <WorkspaceHeading eyebrow="Mon profil · Modification" title="Parlons de votre prochain poste." text="Commencez par votre métier cible, votre niveau et les pays qui vous intéressent. Les autres rubriques peuvent attendre." />
    <CareerProfileForm initialRecord={result.data.record} cvs={result.data.cvs} />
  </>;
}
