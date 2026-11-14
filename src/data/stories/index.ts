import { kepler, pioneer10, voyager1 } from "./deep-space";
import { insight, opportunity, sojourner, viking1 } from "./mars";
import { alsep, apollo11, apollo15Rover, surveyor3 } from "./moon";
import type { Story } from "./types";

export type { Beat, Story, StoryImage } from "./types";

/** Every story, in the order the home page lists the machines. */
export const STORIES: Story[] = [apollo11, apollo15Rover, alsep, surveyor3, pioneer10, voyager1, kepler, sojourner, opportunity, viking1, insight];

export const getStory = (slug: string): Story | undefined => STORIES.find((story) => story.slug === slug);
