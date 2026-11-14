import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollageStory } from "@/components/story/CollageStory";
import { getStory, STORIES } from "@/data/stories";

type Props = PageProps<"/stories/[slug]">;

export const generateStaticParams = () => STORIES.map(({ slug }) => ({ slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const story = getStory((await params).slug);
  if (!story) return {};
  return { title: `${story.title}, ${story.subtitle.toLowerCase()}`, description: `${story.title} tells its own story. ${story.beats[0].lines[0]}` };
}

async function Story({ params }: Pick<Props, "params">) {
  const story = getStory((await params).slug);
  if (!story) notFound();
  return <CollageStory story={story} />;
}

// The slug is read inside Suspense so the page shell (an empty sheet of paper) can be sent
// straight away; every known slug is prerendered by generateStaticParams anyway.
export default function StoryPage({ params }: Props) {
  return (
    <main id="main" className="min-h-svh bg-[var(--paper)]">
      <Suspense fallback={null}>
        <Story params={params} />
      </Suspense>
    </main>
  );
}
