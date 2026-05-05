import { useMemo } from "react";
import {
	CalculateMetadataFunction,
	continueRender,
	staticFile,
	useCurrentFrame,
} from "remotion";
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { loadFont } from "@remotion/fonts";

import {
	VideoMetadata,
	Segment,
	BaseTiming,
	TranslationVerse,
	Word,
	Timing,
	TimingWord,
	TimingPhrase,
	MetadataChapter,
} from "./schemas";

export const calculateMetadata: CalculateMetadataFunction<
	VideoMetadata
> = async ({ props }) => {
	const [timingsData, wordsData, translationData, metadataData] =
		await Promise.all([
			fetch(props.timings_url),
			fetch(staticFile(props.words_path)),
			fetch(staticFile(props.translation_path)),
			fetch(staticFile(props.metadata_path)),
		]);

	const rawTimings: BaseTiming[] = await timingsData.json();
	const fullWords: Record<string, Word> = await wordsData.json();
	const fullTranslation: Record<string, TranslationVerse> =
		await translationData.json();
	const fullMetadata: Record<string, MetadataChapter> =
		await metadataData.json();

	const words: Record<string, Word> = {};
	const translation: Record<string, TranslationVerse> = {};
	const metadata: Record<string, MetadataChapter> = {};

	for (const verseKey in fullTranslation) {
		fullTranslation[verseKey].chunks = generateChunks(
			fullTranslation[verseKey].segments,
			props.max_words,
		);
	}

	// TODO: Normalise/Continueize rawTimings?
	// Is normalise = continueize or something different? i think they are the same

	const timings: Timing[] = rawTimings.map((timing): Timing => {
		timing.start *= props.fps / 1000;
		timing.end *= props.fps / 1000;

		switch (timing.type) {
			case "phrase":
				return {
					...timing,
					type: timing.type,
					previousWord: null,
					nextWord: null,
				} satisfies TimingPhrase;
			case "word":
				const [chapterNumberStr, verseNumberStr, wordNumberStr] =
					timing.key.split(":");
				const chapterNumber = Number(chapterNumberStr);
				const verseNumber = Number(verseNumberStr);
				const wordNumber = Number(wordNumberStr);
				const verseKey = `${chapterNumber}:${verseNumber}`;

				const chunks = fullTranslation[verseKey].chunks;

				let chunkIndex = 0;
				let isLastChunk = false;
				for (let i = 0; i < chunks.length; i++) {
					const chunk = chunks[i];
					const firstSegment = chunk[0];
					const lastSegment = chunk[chunk.length - 1];

					if (
						wordNumber >= firstSegment.word_range.start &&
						wordNumber <= lastSegment.word_range.end
					) {
						chunkIndex = i;
						isLastChunk = i === chunks.length - 1;
						break;
					}
				}

				return {
					...timing,
					type: timing.type,
					verseKey,
					chapterNumber,
					verseNumber,
					wordNumber,
					chunkIndex,
					isLastChunk,
				} satisfies TimingWord;
		}
	});

	for (const [timingIndex, timing] of timings.entries()) {
		switch (timing.type) {
			case "phrase":
				const previousWord =
					timings
						.slice(0, timingIndex)
						.reverse()
						.find((t) => t.type === "word") || null;
				const nextWord =
					timings.slice(timingIndex).find((t) => t.type === "word") ||
					null;
				timing.previousWord = previousWord;
				timing.nextWord = nextWord;
				break;
			case "word": {
				words[timing.key] = fullWords[timing.key];
				translation[timing.verseKey] = fullTranslation[timing.verseKey];
				metadata[timing.chapterNumber] =
					fullMetadata[timing.chapterNumber];

				const segments = translation[timing.verseKey].segments;
				const lastWordNumber =
					segments[segments.length - 1].word_range.end + 1;
				if (timing.wordNumber === lastWordNumber - 1) {
					const lastWordKey = `${timing.verseKey}:${lastWordNumber}`;
					words[lastWordKey] = fullWords[lastWordKey];
				}

				break;
			}
		}
	}

	const input = new Input({
		formats: ALL_FORMATS,
		source: new UrlSource(props.audio_url, { getRetryDelay: () => null }),
	});
	const durationInSeconds = await input.computeDuration();
	const durationInFrames = Math.floor(durationInSeconds * props.fps);

	return {
		durationInFrames,
		fps: props.fps,
		width: props.width,
		height: props.height,
		props: {
			...props,
			timings,
			words,
			translation,
			metadata,
		},
	};
};

const generateChunks = (segments: Segment[] = [], maxWords: number) => {
	const chunks: Segment[][] = [];

	let currentChunk: Segment[] = [];
	let currentWordCount = 0;
	for (const segment of segments) {
		const segmentLength =
			segment.word_range.end - segment.word_range.start + 1;
		const nextWordCount = currentWordCount + segmentLength;
		if (nextWordCount > maxWords && currentChunk.length > 0) {
			chunks.push(currentChunk);
			currentChunk = [];
			currentWordCount = 0;
		}
		currentChunk.push(segment);
		currentWordCount += segmentLength;
	}
	if (currentChunk.length > 0) {
		chunks.push(currentChunk);
	}

	return chunks;
};

export const useActiveTiming = (timings: BaseTiming[]) => {
	const frame = useCurrentFrame();

	return useMemo(() => {
		if (!timings || timings.length === 0) return -1;

		let low = 0;
		let high = timings.length - 1;
		let foundIndex = -1;

		while (low <= high) {
			const mid = Math.floor((low + high) / 2);
			if (timings[mid].start <= frame) {
				foundIndex = mid;
				low = mid + 1;
			} else {
				high = mid - 1;
			}
		}
		if (foundIndex === -1) {
			let minDiff = Infinity;
			foundIndex = 0;

			for (let i = 0; i < timings.length; i++) {
				const diff = Math.abs(timings[i].start - frame);
				if (diff < minDiff) {
					minDiff = diff;
					foundIndex = i;
				}
			}
		}

		return foundIndex;
	}, [frame, timings]);
};

export const loadFonts = async (fonts_path: string, handle: number) => {
	const fontsData = await fetch(staticFile(fonts_path));
	const fonts = await fontsData.json();

	for (const font of fonts) {
		await loadFont({ ...font, url: staticFile(font.url) });
	}
	continueRender(handle);
};

// Only works for a single word
export const titleCase = (input: string) => {
	return input[0].toUpperCase() + input.slice(1).toLowerCase();
};
