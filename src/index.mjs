import fs from "fs/promises";
import path from "path";

// Powered by https://github.com/iamcal/emoji-data
const emojiList =
  "https://raw.githubusercontent.com/iamcal/emoji-data/master/emoji.json";

const res = await fetch(emojiList);
const emojis = await res.json();

const fromCodePoint = (s) =>
  String.fromCodePoint(...s.split("-").map((cp) => parseInt(cp, 16)));

const allEmojis = emojis.reduce((acc, emoji) => {
  const base = {
    emoji: fromCodePoint(emoji.unified),
    shortname: `:${emoji.short_name}:`,
    shortnames: emoji.short_names
      .filter((s) => s !== emoji.short_name)
      .map((s) => `:${s}:`),
  };

  const variations = Object.entries(emoji.skin_variations || []).map(
    ([tones, skin]) => ({
      emoji: fromCodePoint(skin.unified),
      shortname: `:${emoji.short_name}::skin-tone-${tones
        .split("-")
        .map((c) => parseInt(c.slice(-1), 16) - 9)
        .join("-")}:`,
      shortnames: emoji.short_names
        .filter((s) => s !== emoji.short_name)
        .map(
          (s) =>
            `:${s}::skin-tone-${tones
              .split("-")
              .map((c) => parseInt(c.slice(-1), 16) - 9)
              .join("-")}:`
        ),
    })
  );

  acc.push(
    ...variations.map((v) => ({
      ...v,
      variations: [
        base,
        ...variations.filter((e) => e.shortname !== v.shortname),
      ],
    }))
  );
  acc.push({ ...base, variations });

  return acc;
}, []);

const OUTPUT_DIR = "./_site";
const PUBLIC_DIR = "./public";
await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
await fs.cp(PUBLIC_DIR, OUTPUT_DIR, { recursive: true });

await fs.writeFile(
  path.join(OUTPUT_DIR, "emojis.json"),
  JSON.stringify(allEmojis)
);

await Promise.all(
  allEmojis.reduce((acc, emoji) => {
    // make emoji -> shortname endpoints
    acc.push(
      fs.writeFile(path.join(OUTPUT_DIR, emoji.emoji), JSON.stringify(emoji))
    );
    acc.push(
      fs.writeFile(path.join(OUTPUT_DIR, emoji.emoji), JSON.stringify(emoji))
    );

    // make shortname -> emoji endpoints
    acc.push(
      fs.writeFile(
        path.join(OUTPUT_DIR, emoji.shortname),
        JSON.stringify(emoji)
      )
    );
    acc.push(
      fs.writeFile(
        path.join(OUTPUT_DIR, emoji.shortname),
        JSON.stringify(emoji)
      )
    );

    // make alternative shortnames -> emoji endpoints as well
    acc.push(
      ...emoji.shortnames.map((shortname) =>
        fs.writeFile(path.join(OUTPUT_DIR, shortname), JSON.stringify(emoji))
      )
    );

    return acc;
  }, [])
);
