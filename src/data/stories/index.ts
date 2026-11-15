import { kepler, pioneer10, voyager1 } from "./deep-space";
import { opportunity } from "./mars";
import { apollo11, falcon, intrepid, surveyor3 } from "./moon";
import type { Story } from "./types";

export type { Beat, Story, StoryImage } from "./types";

/** Every story, in the order the home page lists the machines. */
export const STORIES: Story[] = [apollo11, intrepid, falcon, surveyor3, pioneer10, voyager1, kepler, opportunity];

export const getStory = (slug: string): Story | undefined => STORIES.find((story) => story.slug === slug);
