import { listTaxonomies } from "@/actions/content";
import { ClientsPage } from "@/components/clients/client-page";

export default async function Page() {
  const taxonomies = await listTaxonomies();
  return <ClientsPage taxonomies={taxonomies} />;
}
