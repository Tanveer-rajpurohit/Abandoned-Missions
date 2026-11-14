import type { Metadata } from "next";
import { CollageStory } from "@/components/story/CollageStory";
import { VersionSwitcher } from "@/components/story/StoryChrome";

export const metadata: Metadata = {
  title: "Eagle, the half that stayed on the Moon (Collage)",
  description: "The Apollo 11 lunar module tells its own story. Collage version.",
};

export default function Page() {
  return (
    <main id="main">
      <VersionSwitcher current="/stories/apollo-11/version1" />
      <CollageStory />
    </main>
  );
}
