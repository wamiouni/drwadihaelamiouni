import { getLatest } from "@/lib/queries";
import { Hero } from "@/components/hero";
import { AboutSection } from "@/components/about-section";
import { Rail } from "@/components/rail";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [articles, media] = await Promise.all([
    getLatest("article", 10),
    getLatest("media", 10),
  ]);

  return (
    <>
      <Hero />
      <AboutSection />
      <Rail
        titleKey="home.latestArticles"
        viewAllHref="/articles"
        items={articles}
      />
      <Rail titleKey="home.latestMedia" viewAllHref="/media" items={media} />
    </>
  );
}
