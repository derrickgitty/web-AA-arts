import { customAlphabet } from "nanoid";

const WORDS_A = ["kitty", "bunny", "panda", "puppy", "honey", "berry", "fairy", "sunny", "petal", "daisy"];
const WORDS_B = ["rose", "moon", "star", "cloud", "dream", "glow", "snow", "mint", "lila", "pearl"];
const digits = customAlphabet("0123456789", 3);

export function generateFriendlyPassword() {
  const a = WORDS_A[Math.floor(Math.random() * WORDS_A.length)];
  const b = WORDS_B[Math.floor(Math.random() * WORDS_B.length)];
  return `${a}-${b}-${digits()}`;
}

export const shareToken = customAlphabet(
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789",
  32
);
