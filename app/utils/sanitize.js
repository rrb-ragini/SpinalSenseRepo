const profanityList = [
  "fuck",
  "shit",
  "bitch",
  "bastard",
  "dick",
  "cunt",
  "slut",
  "whore",
  "faggot",
  "nigger",
  "asshole"
];

export function sanitizeContent(str) {
  if (!str) return "";
  return str.replace(/[\x00-\x1F\x7F]/g, "").trim();
}

export function containsProfanity(str) {
  const lower = str.toLowerCase();
  return profanityList.some((w) => lower.includes(w));
}
