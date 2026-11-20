export interface AnimatedEmojiItem {
  id: string;
  name: string;
  unicode: string;
  code: string;
  url: string;
}

const NOTO_EMOJI_BASE = "https://fonts.gstatic.com/s/e/notoemoji/latest";

export const ANIMATED_EMOJIS: AnimatedEmojiItem[] = [
  // Row 1
  {
    id: "star-struck",
    name: "Star-struck",
    unicode: "🤩",
    code: "1f929",
    url: `${NOTO_EMOJI_BASE}/1f929/512.webp`,
  },
  {
    id: "heart-eyes",
    name: "Heart eyes",
    unicode: "😍",
    code: "1f60d",
    url: `${NOTO_EMOJI_BASE}/1f60d/512.webp`,
  },
  {
    id: "heart",
    name: "Heart",
    unicode: "❤️",
    code: "2764_fe0f",
    url: `${NOTO_EMOJI_BASE}/2764_fe0f/512.webp`,
  },
  {
    id: "fire",
    name: "Fire",
    unicode: "🔥",
    code: "1f525",
    url: `${NOTO_EMOJI_BASE}/1f525/512.webp`,
  },
  {
    id: "party",
    name: "Party",
    unicode: "🎉",
    code: "1f389",
    url: `${NOTO_EMOJI_BASE}/1f389/512.webp`,
  },
  {
    id: "hundred",
    name: "100",
    unicode: "💯",
    code: "1f4af",
    url: `${NOTO_EMOJI_BASE}/1f4af/512.webp`,
  },
  {
    id: "clap",
    name: "Clap",
    unicode: "👏",
    code: "1f44f",
    url: `${NOTO_EMOJI_BASE}/1f44f/512.webp`,
  },

  // Row 2
  {
    id: "hatching-chick",
    name: "Hatching chick",
    unicode: "🐣",
    code: "1f423",
    url: `${NOTO_EMOJI_BASE}/1f423/512.webp`,
  },
  {
    id: "sparkles",
    name: "Sparkles",
    unicode: "✨",
    code: "2728",
    url: `${NOTO_EMOJI_BASE}/2728/512.webp`,
  },
  {
    id: "rainbow",
    name: "Rainbow",
    unicode: "🌈",
    code: "1f308",
    url: `${NOTO_EMOJI_BASE}/1f308/512.webp`,
  },
  {
    id: "butterfly",
    name: "Butterfly",
    unicode: "🦋",
    code: "1f98b",
    url: `${NOTO_EMOJI_BASE}/1f98b/512.webp`,
  },
  {
    id: "cherry-blossom",
    name: "Cherry blossom",
    unicode: "🌸",
    code: "1f338",
    url: `${NOTO_EMOJI_BASE}/1f338/512.webp`,
  },
  {
    id: "glowing-star",
    name: "Glowing star",
    unicode: "🌟",
    code: "1f31f",
    url: `${NOTO_EMOJI_BASE}/1f31f/512.webp`,
  },
  {
    id: "diamond",
    name: "Diamond",
    unicode: "💎",
    code: "1f48e",
    url: `${NOTO_EMOJI_BASE}/1f48e/512.webp`,
  },

  // Row 3
  {
    id: "trophy",
    name: "Trophy",
    unicode: "🏆",
    code: "1f3c6",
    url: `${NOTO_EMOJI_BASE}/1f3c6/512.webp`,
  },
  {
    id: "tulip",
    name: "Tulip",
    unicode: "🌷",
    code: "1f337",
    url: `${NOTO_EMOJI_BASE}/1f337/512.webp`,
  },
  {
    id: "unicorn",
    name: "Unicorn",
    unicode: "🦄",
    code: "1f984",
    url: `${NOTO_EMOJI_BASE}/1f984/512.webp`,
  },
  {
    id: "four-leaf-clover",
    name: "Four-leaf clover",
    unicode: "🍀",
    code: "1f340",
    url: `${NOTO_EMOJI_BASE}/1f340/512.webp`,
  },
  {
    id: "dizzy",
    name: "Dizzy",
    unicode: "💫",
    code: "1f4ab",
    url: `${NOTO_EMOJI_BASE}/1f4ab/512.webp`,
  },
  {
    id: "confetti",
    name: "Confetti",
    unicode: "🎊",
    code: "1f38a",
    url: `${NOTO_EMOJI_BASE}/1f38a/512.webp`,
  },
  {
    id: "rose",
    name: "Rose",
    unicode: "🌹",
    code: "1f339",
    url: `${NOTO_EMOJI_BASE}/1f339/512.webp`,
  },

  // Row 4
  {
    id: "hugging-face",
    name: "Hugging face",
    unicode: "🤗",
    code: "1f917",
    url: `${NOTO_EMOJI_BASE}/1f917/512.webp`,
  },
  {
    id: "partying-face",
    name: "Partying face",
    unicode: "🥳",
    code: "1f973",
    url: `${NOTO_EMOJI_BASE}/1f973/512.webp`,
  },
  {
    id: "strength",
    name: "Strength",
    unicode: "💪",
    code: "1f4aa",
    url: `${NOTO_EMOJI_BASE}/1f4aa/512.webp`,
  },
  {
    id: "balloon",
    name: "Balloon",
    unicode: "🎈",
    code: "1f388",
    url: `${NOTO_EMOJI_BASE}/1f388/512.webp`,
  },
  {
    id: "star",
    name: "Star",
    unicode: "⭐",
    code: "2b50",
    url: `${NOTO_EMOJI_BASE}/2b50/512.webp`,
  },
  {
    id: "bouquet",
    name: "Bouquet",
    unicode: "💐",
    code: "1f490",
    url: `${NOTO_EMOJI_BASE}/1f490/512.webp`,
  },
  {
    id: "quarter-moon",
    name: "Quarter moon",
    unicode: "🌛",
    code: "1f31b",
    url: `${NOTO_EMOJI_BASE}/1f31b/512.webp`,
  },
];

// Lookup map by unicode, code, id, or url
const EMOJI_MAP = new Map<string, AnimatedEmojiItem>();
ANIMATED_EMOJIS.forEach((item) => {
  EMOJI_MAP.set(item.unicode, item);
  EMOJI_MAP.set(item.code, item);
  EMOJI_MAP.set(item.id, item);
  EMOJI_MAP.set(item.url, item);
});

// Extra mappings for previous aliases / variants
const ALIAS_MAP: Record<string, string> = {
  "❤️️": "❤️",
  "🐥": "🐣",
  "baby-chick": "🐣",
  "party-popper": "🎉",
  "hundred-points": "💯",
  "clapping-hands": "👏",
  "flexed-biceps": "💪",
  "moon-face": "🌛",
  "crescent-moon": "🌛",
  "🌙": "🌛",
  "shooting-star": "✨",
  "🌠": "✨",
  "rocket": "💎",
  "🚀": "💎",
  "victory-hand": "👏",
  "✌️": "👏",
  "sparkling-heart": "❤️",
  "💖": "❤️",
  "crossed-fingers": "🍀",
  "🤞": "🍀",
  "ringed-planet": "💫",
  "🪐": "💫",
  "money-mouth-face": "💯",
  "🤑": "💯",
  "heart-on-fire": "🔥",
  "❤️‍🔥": "🔥",
  "birthday-cake": "🎉",
  "🎂": "🎉",
  "smiling-face-with-hearts": "😍",
  "🥰": "😍",
  "honeybee": "🦋",
  "🐝": "🦋",
};

Object.entries(ALIAS_MAP).forEach(([alias, targetKey]) => {
  const target = EMOJI_MAP.get(targetKey);
  if (target) {
    EMOJI_MAP.set(alias, target);
  }
});

/**
 * Returns the animated 3D emoji item or fallback
 */
export function getAnimatedEmoji(identifier: string): AnimatedEmojiItem {
  if (!identifier) return ANIMATED_EMOJIS[0];

  // If already matches unicode, code, id, or url
  if (EMOJI_MAP.has(identifier)) {
    return EMOJI_MAP.get(identifier)!;
  }

  // If it's a direct url
  if (identifier.startsWith("http://") || identifier.startsWith("https://")) {
    return {
      id: "custom",
      name: "Custom Emoji",
      unicode: "✨",
      code: "2728",
      url: identifier,
    };
  }

  // Fallback to first
  return ANIMATED_EMOJIS[0];
}

/**
 * Returns the URL for an animated emoji
 */
export function getAnimatedEmojiUrl(identifier: string): string {
  if (identifier.startsWith("http://") || identifier.startsWith("https://")) {
    return identifier;
  }
  return getAnimatedEmoji(identifier).url;
}

/**
 * Returns the URL for a lightweight, static 128px 3D emoji (prevents GPU frame decode loops)
 */
export function getStaticEmojiUrl(identifier: string): string {
  if (identifier.startsWith("http://") || identifier.startsWith("https://")) {
    return identifier;
  }
  const item = getAnimatedEmoji(identifier);
  if (item && item.code) {
    return `${NOTO_EMOJI_BASE}/${item.code}/128.png`;
  }
  return item?.url || identifier;
}
