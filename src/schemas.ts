import { z } from "zod";

const baseTimingSchema = z.object({
	start: z.number(),
	end: z.number(),
	type: z.string(),
	key: z.string(),
});

const wordSchema = z.object({
	id: z.number().int(),
	surah: z.string(),
	ayah: z.string(),
	word: z.string(),
	location: z.string(),
	text: z.string(),
});

const wordRangeSchema = z.object({
	start: z.number().int(),
	end: z.number().int(),
});

const segmentSchema = z.object({
	t: z.string(),
	word_range: wordRangeSchema,
});

const translationVerseSchema = z.object({
	t: z.string(),
	segments: z.array(segmentSchema),
	chunks: z.array(z.array(segmentSchema)),
});

export const overlayInputPropsSchema = z.object({
	audio_url: z.string(),
	timings_url: z.string(),
	words_path: z.string(),
	translation_path: z.string(),
	fonts_path: z.string(),
	max_words: z.number().int(),
	fps: z.number(),
	width: z.number().int(),
	height: z.number().int(),
});

const overlayMetadataSchema = overlayInputPropsSchema.extend({
	timings: z.array(baseTimingSchema),
	words: z.record(wordSchema),
	translation: z.record(translationVerseSchema),
});

export type BaseTiming = z.infer<typeof baseTimingSchema>;
export type Word = z.infer<typeof wordSchema>;
export type Segment = z.infer<typeof segmentSchema>;
export type TranslationVerse = z.infer<typeof translationVerseSchema>;

export type OverlayMetadata = z.infer<typeof overlayMetadataSchema>;

export type TimingWord = BaseTiming & {
	type: "word";
	verseKey: string;
	chapterNumber: number;
	verseNumber: number;
	wordNumber: number;
	chunkIndex: number;
	isLastChunk: boolean;
};

export type TimingPhrase = BaseTiming & {
	type: "phrase";
	chapterNumber: number;
};

export type Timing = TimingWord | TimingPhrase;
