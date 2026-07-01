import { getItems } from "@/lib/queries";
import { PageIntro } from "@/components/page-intro";
import { ItemBrowser } from "@/components/item-browser";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const items = await getItems("article");
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <PageIntro titleKey="articles.title" subKey="articles.sub" />
      <ItemBrowser items={items} kind="article" />
    </div>
  );
}
