import { listTaxonomies } from "@/actions/content";
import { ClientsPage } from "@/components/clients/client-page";

export default async function Page() {
  const result = await listTaxonomies();
  if (!result.ok) {
    return <div>Error: {result.error.message}</div>;
  }
  return <ClientsPage taxonomies={result.data} />;
}
