export const DEFAULT_CHAT_MODEL = "deepseek/deepseek-v4-flash";

/**
 * Model used for short, non-interactive generations such as chat titles.
 * Keep this as an application-level policy; the model catalog itself is
 * resolved dynamically from RouterAI in providers.ts.
 */
export const TITLE_MODEL_ID = DEFAULT_CHAT_MODEL;
