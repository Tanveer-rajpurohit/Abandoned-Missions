import { redirect } from "next/navigation";

// The 3D view is switched off for now. The old page lives in git history (and EagleStory /
// MoonScene are untouched); restore it from there and put `scene3d` back in moon.ts to re-enable.
export default function EagleStoryPage() {
  redirect("/stories/apollo-11");
}
