import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SlidesStory } from "@/components/story/SlidesStory";
import { getStory, STORIES } from "@/data/stories";

type Props = PageProps<"/stories/[slug]/play">;

export const generateStaticParams = () => STORIES.map(({ slug }) => ({ slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const story = getStory((await params).slug);
  if (!story) return {};
  return { title: `Play the story of ${story.title}`, description: `${story.title} tells its own story, one card at a time, by hand or on auto-play.` };
}

async function Story({ params }: Pick<Props, "params">) {
  const story = getStory((await params).slug);
  if (!story) notFound();
  return <SlidesStory story={story} />;
}

// The slug is read inside Suspense so the page shell (an empty sheet of paper) can be sent
// straight away; every known slug is prerendered by generateStaticParams anyway.
export default function StoryPlayPage({ params }: Props) {
  return (
    <main id="main" className="min-h-svh bg-[var(--paper)]">
      <Suspense fallback={null}>
        <Story params={params} />
      </Suspense>
    </main>
  );
}
