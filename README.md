# Introduction

tilavize is a program to "televize tilawahs" i.e. generate videos of Qurʿān recitations.

# Examples

Verse 1:1:
https://git.sr.ht/~rehandaphedar/tilavize/blob/main/examples/001001.webm

Chapter 85:
https://git.sr.ht/~rehandaphedar/tilavize/blob/main/examples/085.webm

# Installation

Clone the repository:
```sh
git clone git@git.sr.ht:~rehandaphedar/tilavize
cd tilavize
```

Install dependencies:
```sh
npm i
```

# Preparation

## Static Data

For rendering, you need the following files somewhere in `public`:
- A [rabtize](https://sr.ht/~rehandaphedar/rabtize) compatible translation JSON
- A [QUL](https://qul.tarteel.ai/resources/quran-script) compatible word by word Arabic text JSON
- A [QUL](https://qul.tarteel.ai/resources/quran-metadata/70) compatible surah names metadata JSON
- A font index JSON file along with font files

The format of the font index JSON file is as follows:
```json
[
	{
		"family": "[Family Name]",
		"url": "[URL]",
	}
]
```

Note that the URL must be absolute (considering `public/` as root).

Additional [options supported by loadFont](https://www.remotion.dev/docs/fonts-api/load-font#options) can also be included. They will be passed verbatim except for [url](https://www.remotion.dev/docs/fonts-api/load-font#url), which will be passed to [staticFile](https://www.remotion.dev/docs/staticfile) first.

## Runtime Data

You will need the following served at a URL:
- A recitation audio
- A [lafzize](https://sr.ht/~rehandaphedar/lafzize) compatible timings JSON

CORS must be enabled.

The URL can also be localhost. Example: `npx serve --cors`.

# Props

- `audio_url`: URL of the recitation audio
- `timings_url`: URL of the timings JSON
- `words_path`: Path of the word by word Arabic text JSON
- `translation_path`: Path of the translation JSON
- `metadata_path`: Path to the surah names metadata JSON
- `fonts_path`: Path to the font index JSON file
- `max_words`: Maximum number of words that should be present on a single frame; Note that you will have to calibrate it based on your font size and other styling paramters
- `fps`: FPS of the output video
- `width`: Width of the output video
- `height`: Height of the output video

# Previewing Renders In Remotion Studio

You can launch the Remotion Studio to help you preview the video:
```sh
npm run dev
```

Also, you can use it to check out the props and their default values.

# Rendering From The CLI

```sh
pnpm exec remotion render Video [output]
```

To pass, you will need to pass a JSON string via `--props`.

To help in the generation of the string, a helper script `generate_props_json.sh` with common options is included:
- `-a`: `audio_url`
- `-t`: `timings_url`
- `-w`: `words_path`
- `-r`: `translation_path`
- `-m`: `metadata_path`

Example:
```sh
pnpm exec remotion render \
  Video \
  out/001001 \
  --props="$(
    ./generate_props_json.sh \
      -a 'http://localhost:8000/001001.mp3' \
      -t 'http://localhost:8000/001001.json'
  )"
```

# Dark Mode Glitch

In the default `remotion.config.ts`, `Config.setChromiumDarkMode(true)` has been included.
However, it does not seem to have an effect.
This has been reported in [remotion/7766](https://github.com/remotion-dev/remotion/issues/7766).

Therefore, you should set `Dark Mode` to true in `Render -> Video -> Other -> Dark Mode` or append `--dark-mode` to `pnpm exec remotion render` if your styling requires it until the issue is fixed.
