import {
	CalculateMetadataFunction,
	continueRender,
	staticFile,
	useCurrentFrame,
} from "remotion";
import {
	OverlayMetadata,
	Segment,
	Timing,
	TranslationVerse,
	Word,
} from "./schemas";
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { useMemo } from "react";
import { loadFont } from "@remotion/fonts";

export const calculateMetadata: CalculateMetadataFunction<
	OverlayMetadata
> = async ({ props }) => {
	const [timingsData, wordsData, translationData] = await Promise.all([
		fetch(props.timings_url),
		fetch(staticFile(props.words_path)),
		fetch(staticFile(props.translation_path)),
	]);

	const rawTimings: Array<Timing> = await timingsData.json();
	const fullWords: Record<string, Word> = await wordsData.json();
	const fullTranslation: Record<string, TranslationVerse> =
		await translationData.json();

	const words: Record<string, Word> = {};
	const translation: Record<string, TranslationVerse> = {};

	// TODO: Normalise/Continueize rawTimings?

	for (const timing of rawTimings) {
		switch (timing.type) {
			case "word": {
				const wordKey = timing.key;
				const [chapterNumberStr, verseNumberStr, wordNumberStr] =
					wordKey.split(":");
				const chapterNumber = Number(chapterNumberStr);
				const verseNumber = Number(verseNumberStr);
				const wordNumber = Number(wordNumberStr);
				const verseKey = `${chapterNumber}:${verseNumber}`;

				words[wordKey] = fullWords[wordKey];
				translation[verseKey] = fullTranslation[verseKey];

				const segments = translation[verseKey].segments;
				const lastWordNumber = segments[segments.length - 1].word_range.end + 1;
				if (wordNumber == lastWordNumber - 1) {
					const lastWordKey = `${verseKey}:${lastWordNumber}`;
					words[lastWordKey] = fullWords[lastWordKey];
				}
			}
		}
	}

	for (const verseKey in translation) {
		translation[verseKey].chunks = generateChunks(
			translation[verseKey].segments,
			props.max_words,
		);
	}

	const timings: Timing[] = rawTimings.map((timing) => {
		timing.start *= props.fps / 1000;
		timing.end *= props.fps / 1000;

		if (timing.type === "phrase") {
			return timing;
		}

		const [chapterNumberStr, verseNumberStr, wordNumberStr] =
			timing.key.split(":");
		const wordNumber = Number(wordNumberStr);
		const verseKey = `${chapterNumberStr}:${verseNumberStr}`;
		const chunks = translation[verseKey].chunks;

		if (!chunks) return timing;

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
			chunkIndex,
			isLastChunk,
		};
	});

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
		},
	};
};

const generateChunks = (segments: Segment[] = [], maxWords: number) => {
	const chunks: Segment[][] = [];

	let currentChunk: Segment[] = [];
	let currentWordCount = 0;
	for (const segment of segments) {
		const segmentLength = segment.word_range.end - segment.word_range.start + 1;
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

export const useActiveTiming = (timings: Timing[]) => {
	const frame = useCurrentFrame();

	return useMemo(() => {
		if (!timings || timings.length === 0) return null;

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

		return timings[foundIndex];
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
