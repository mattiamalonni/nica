import { default as google } from "./google";
import { default as github } from "./github";
import { default as facebook } from "./facebook";
import { default as linkedin } from "./linkedin";
import { default as slack } from "./slack";
import { default as twitter } from "./twitter";
import { default as microsoft } from "./microsoft";
import { default as twitch } from "./twitch";
import { default as discord } from "./discord";

export const PROVIDERS = {
  google,
  github,
  facebook,
  linkedin,
  slack,
  twitter,
  microsoft,
  twitch,
  discord,
} as const;
