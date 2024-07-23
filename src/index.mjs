import fs from 'fs/promises';
import path from 'path';

// Powered by https://github.com/iamcal/emoji-data
const emojiList = 'https://raw.githubusercontent.com/iamcal/emoji-data/master/emoji.json';

const res = await fetch(emojiList);
const emojis = await res.json();

const fromCodePoint = s => String.fromCodePoint(...s.split('-').map(cp => parseInt(cp, 16)))

const allEmojis = emojis.reduce((acc, emoji) => {
  acc.push({
    shortname: `:${emoji.short_name}:`,
    emoji: fromCodePoint(emoji.unified),
  });

  if (emoji.skin_variations) {
    Object.entries(emoji.skin_variations).forEach(([tones, skin]) => {
      acc.push({
        shortname: `:${emoji.short_name}::skin-tone-${tones.split('-').map(c => parseInt(c.slice(-1), 16) - 9).join('-')}:`,
        emoji: fromCodePoint(skin.unified),
      });
    });
  }

  return acc;
}, []);

const OUTPUT_DIR = './_site';
const EMOJI_DIR_NAME = 'emoji';
const EMOJI_DIR_PATH = path.join(OUTPUT_DIR, EMOJI_DIR_NAME);
const SHORTNAME_DIR_NAME = 'shortname';
const SHORTNAME_DIR_PATH = path.join(OUTPUT_DIR, SHORTNAME_DIR_NAME);

await fs.rm(EMOJI_DIR_PATH, { recursive: true }).catch(() => {});
await fs.rm(SHORTNAME_DIR_PATH, { recursive: true }).catch(() => {});

await fs.mkdir(EMOJI_DIR_PATH, { recursive: true });
await fs.mkdir(SHORTNAME_DIR_PATH, { recursive: true });

const fileWrites = allEmojis.reduce((acc, emoji) => {
  // make emoji -> shortname endpoints
  const emojiPath = path.join(SHORTNAME_DIR_PATH, emoji.emoji)
  acc.push(
    fs.mkdir(emojiPath, { recursive: true })
    .then(() => fs.writeFile(path.join(emojiPath, 'index.json'), JSON.stringify(emoji)))
  );

  // make shortname -> emoji endpoints
  const shortnamePath = path.join(EMOJI_DIR_PATH, emoji.shortname)
  acc.push(
    fs.mkdir(shortnamePath, { recursive: true })
    .then(() => fs.writeFile(path.join(shortnamePath, 'index.json'), JSON.stringify(emoji)))
  );

  return acc;
}, []);

await Promise.all(fileWrites);
