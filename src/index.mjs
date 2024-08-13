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
    const fileName = `index.json`;
    const fileContents = JSON.stringify(emoji);

    // make emoji -> shortname endpoints
    // /😃/index.json
    const emojiPath = path.join(OUTPUT_DIR, emoji.emoji);
    acc.push(
      fs
        .mkdir(emojiPath)
        .then(() => fs.writeFile(path.join(emojiPath, fileName), fileContents))
    );

    // make shortname -> emoji endpoints
    // /:shortname:/index.json
    // /shortname/index.json
    const shortnamePath = path.join(OUTPUT_DIR, emoji.shortname);
    const rawShortnamePath = path.join(
      OUTPUT_DIR,
      emoji.shortname.replace(/:/g, "")
    );
    acc.push(
      fs
        .mkdir(shortnamePath)
        .then(() =>
          fs.writeFile(path.join(shortnamePath, fileName), fileContents)
        ),
      fs
        .mkdir(rawShortnamePath)
        .then(() =>
          fs.writeFile(path.join(rawShortnamePath, fileName), fileContents)
        )
    );

    // make alternative shortnames -> emoji endpoints
    // /:alt-shortname:/index.json
    // /alt-shortname/index.json
    acc.push(
      ...emoji.shortnames.reduce((a, shortname) => {
        const altnamePath = path.join(OUTPUT_DIR, shortname);
        const rawAltnamePath = path.join(
          OUTPUT_DIR,
          shortname.replace(/:/g, "")
        );
        return [
          ...a,
          fs
            .mkdir(altnamePath)
            .then(() =>
              fs.writeFile(path.join(altnamePath, fileName), fileContents)
            ),
          fs
            .mkdir(rawAltnamePath)
            .then(() =>
              fs.writeFile(path.join(rawAltnamePath, fileName), fileContents)
            ),
        ];
      }, [])
    );

    return acc;
  }, [])
);
