import { getItems } from "@/lib/queries";
import { PageIntro } from "@/components/page-intro";
import { ItemBrowser } from "@/components/item-browser";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const items = await getItems("media");
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <PageIntro titleKey="media.title" subKey="media.sub" />
      <ItemBrowser items={items} kind="media" />
    </div>
  );
}
