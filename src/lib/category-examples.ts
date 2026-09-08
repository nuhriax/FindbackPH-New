import type { ItemCategory } from "@/types/database";

/**
 * Category-aware examples & helper copy.
 *
 * The platform covers 12 item categories — not just phones. These maps let the
 * report wizard, ownership verification, and search UI speak the user's
 * category language instead of defaulting to "Black iPhone 15 Pro" for a lost
 * wallet, pet, or school bag.
 */

/** Example item names shown as the report title placeholder, per category. */
export const TITLE_EXAMPLES: Record<ItemCategory, string> = {
  phones: "e.g. Black iPhone 15 Pro with clear case",
  wallets: "e.g. Brown leather wallet with GCash card",
  ids: "e.g. PhilHealth ID — blue card",
  bags: "e.g. Black Jansport backpack, laptop inside",
  keys: "e.g. Keychain with 3 keys and a red carabiner",
  jewelry: "e.g. Gold necklace with small heart pendant",
  electronics: "e.g. Anker power bank, 20000mAh, black",
  documents: "e.g. Brown envelope with school documents",
  clothing: "e.g. Navy Uniqlo jacket, size M",
  pets: "e.g. Brown asong pinoy, medium build, red collar",
  school_items: "e.g. Plastic envelope with notebooks and ballpens",
  other: "e.g. Black umbrella with wooden handle",
};

/**
 * Suggested ownership-verification questions per category — things only the
 * true owner would know. The manager still accepts free-form questions; these
 * are quick-fill suggestions that make the feature accessible for every
 * category, not just phones ("What wallpaper is on the phone?").
 */
export const OWNERSHIP_QUESTION_EXAMPLES: Record<ItemCategory, string> = {
  phones: "What wallpaper is on the phone?",
  wallets: "What cards or IDs are inside the wallet?",
  ids: "What is the ID number's last digit?",
  bags: "What items are inside the bag?",
  keys: "How many keys are on the keychain, and what do they open?",
  jewelry: "Is there an engraving or marking on the item?",
  electronics: "Any stickers, scratches, or saved files that identify it?",
  documents: "What documents are in the envelope, and whose names are on them?",
  clothing: "What size is it, and is anything written on the tag or pocket?",
  pets: "What is the pet's name, and does it respond to it?",
  school_items: "What names or labels are written on the items?",
  other: "What hidden detail would only the owner know?",
};

/** Short, human guidance line per category for the ownership challenge UI. */
export const OWNERSHIP_HINTS: Record<ItemCategory, string> = {
  phones: "wallpaper, case, stickers, screen crack…",
  wallets: "card count, photo inside, zipper pull…",
  ids: "ID number, photo, signature style…",
  bags: "contents, pin badges, inner pocket items…",
  keys: "key count, keychain charms, fob…",
  jewelry: "engravings, gem count, clasp type…",
  electronics: "stickers, saved files, serial numbers…",
  documents: "document names, page count, annotations…",
  clothing: "size, tag marks, items left in pockets…",
  pets: "name, markings, collar color, microchip…",
  school_items: "written labels, notebook names, contents…",
  other: "hidden marks only the owner would know…",
};
