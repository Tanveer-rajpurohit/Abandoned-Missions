import type { Metadata } from "next";
import { SlidesStory } from "@/components/story/SlidesStory";
import { VersionSwitcher } from "@/components/story/StoryChrome";

export const metadata: Metadata = {
  title: "Eagle, the half that stayed on the Moon (Slides)",
  description: "The Apollo 11 lunar module tells its own story. Slides version.",
};

export default function Page() {
  return (
    <main id="main">
      <VersionSwitcher current="/stories/apollo-11/version2" />
      <SlidesStory />
    </main>
  );
}
