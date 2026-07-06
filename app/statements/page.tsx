import { getItems } from "@/lib/queries";
import { PageIntro } from "@/components/page-intro";
import { ItemBrowser } from "@/components/item-browser";

export const dynamic = "force-dynamic";

export default async function StatementsPage() {
  const items = await getItems("statement");
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <PageIntro titleKey="statements.title" subKey="statements.sub" />
      <ItemBrowser items={items} kind="statement" />
    </div>
  );
}
