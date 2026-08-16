import { Code, File, Pen, Sparkles } from "lucide-react";
import { generateDummyPassword } from "./db/utils";

export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

export const guestRegex = /^guest-\d+$/;

export const DUMMY_PASSWORD = generateDummyPassword();

export const suggestions = [
  { icon: <Code size={14} />, text: "Write the code" },
  { icon: <File size={14} />, text: "Create a table" },
  { icon: <Pen size={14} />, text: "Write the text" },
  { icon: <Sparkles size={14} />, text: "What's the weather like in" },
];
