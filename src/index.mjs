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

console.table(allEmojis)