import { getLatest } from "@/lib/queries";
import { Hero } from "@/components/hero";
import { AboutSection } from "@/components/about-section";
import { Rail } from "@/components/rail";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [articles, media, statements] = await Promise.all([
    getLatest("article", 10),
    getLatest("media", 10),
    getLatest("statement", 10),
  ]);

  return (
    <>
      <Hero />
      <AboutSection />
      <Rail
        titleKey="home.latestArticles"
        viewAllHref="/articles"
        items={articles}
        index={1}
      />
      <Rail
        titleKey="home.latestMedia"
        viewAllHref="/media"
        items={media}
        index={2}
      />
      <Rail
        titleKey="home.latestStatements"
        viewAllHref="/statements"
        items={statements}
        index={3}
      />
    </>
  );
}
