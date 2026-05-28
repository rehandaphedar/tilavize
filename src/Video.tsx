import React, { useEffect, useState } from "react";
import { AbsoluteFill, delayRender, Html5Audio } from "remotion";
import {
	VideoMetadata,
	Word,
	TranslationVerse,
	Segment,
	Timing,
	TimingWord,
	TimingPhrase,
	MetadataChapter,
} from "./schemas";
import { loadFonts, useActiveTiming, titleCaseWord } from "./utils";
import clsx from "clsx";

export const Video: React.FC<VideoMetadata> = ({
	audio_url,
	timings,
	words,
	translation,
	metadata,
	fonts_path,
}) => {
	const [handle] = useState(() => delayRender());
	useEffect(() => {
		loadFonts(fonts_path, handle);
	}, [fonts_path, handle]);

	const activeTimingIndex = useActiveTiming(timings);
	const activeTiming = timings[activeTimingIndex] as Timing;

	return (
		<AbsoluteFill className="bg-ctp-base text-ctp-text text-[64px] font-[Hafs] text-center">
			<ActiveTiming
				activeTiming={activeTiming}
				words={words}
				translation={translation}
				metadata={metadata}
			/>
			<Html5Audio src={audio_url} />
		</AbsoluteFill>
	);
};

const ActiveTiming: React.FC<{
	activeTiming: Timing;
	words: Record<string, Word>;
	translation: Record<string, TranslationVerse>;
	metadata: Record<string, MetadataChapter>;
}> = ({ activeTiming, words, translation, metadata }) => {
	if (!activeTiming) return null;

	switch (activeTiming.type) {
		case "phrase":
			if (activeTiming.nextWord === null) {
				return null;
			}

			return (
				<PhraseChunk
					activeTiming={activeTiming}
					metadataChapter={
						metadata[activeTiming.nextWord.chapterNumber]
					}
				/>
			);
		case "word":
			if (
				activeTiming.chunkIndex === null ||
				activeTiming.isLastChunk === null
			)
				return null;

			const chunk =
				translation[activeTiming.verseKey].chunks[
					activeTiming.chunkIndex
				];

			return (
				<WordChunk
					activeTiming={activeTiming}
					chunk={chunk}
					words={words}
				></WordChunk>
			);
	}
};

const PhraseChunk: React.FC<{
	activeTiming: TimingPhrase;
	metadataChapter: MetadataChapter;
}> = ({ activeTiming, metadataChapter }) => {
	return (
		<div className="my-auto">
			<div className="font-[Scheherazade_New] leading-[2.25] text-[48px]">
				<div
					className={clsx(
						activeTiming.key === "taawwudh" &&
							"highlight text-ctp-sapphire",
					)}
				>
					أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ
				</div>
				<div
					className={clsx(
						activeTiming.key === "basmalah" &&
							"highlight text-ctp-sapphire",
						!metadataChapter.bismillah_pre && "invisible",
					)}
				>
					بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِیمِ
				</div>
			</div>
			<div className="my-[32px] text-ctp-teal">
				<div className="font-[Scheherazade_New] leading-[2.0] text-[192px]">
					{metadataChapter.name_arabic}
				</div>
				<div className="font-[EB_Garamond] text-[64px]">
					Sūrah {metadataChapter.id}: {metadataChapter.name} (
					{metadataChapter.verses_count} Verses)
				</div>
			</div>
			<div className="font-[EB_Garamond] text-left w-fit mx-auto">
				<div>
					Revealed in{" "}
					{titleCaseWord(metadataChapter.revelation_place)}
				</div>
				<div>Revelation Order: {metadataChapter.revelation_order}</div>
			</div>
		</div>
	);
};

const WordChunk: React.FC<{
	activeTiming: TimingWord;
	chunk: Segment[];
	words: Record<string, { text: string }>;
}> = ({ chunk, activeTiming, words }) => (
	<div className="m-auto w-[60%] px-10">
		<WordChunkArabic
			chunk={chunk}
			activeKey={activeTiming.key}
			isLastChunk={activeTiming.isLastChunk}
			verseKey={activeTiming.verseKey}
			wordNumber={activeTiming.wordNumber}
			words={words}
		/>

		<div className="w-fit mx-auto my-8 py-2 px-4 text-ctp-base bg-ctp-mauve font-bold text-2xl font-[Roboto]">
			{activeTiming.verseKey}
		</div>

		<WordChunkTranslation
			chunk={chunk}
			wordNumber={activeTiming.wordNumber}
		/>
	</div>
);

const WordChunkArabic: React.FC<{
	chunk: Segment[];
	isLastChunk: boolean;
	activeKey: string;
	verseKey: string;
	wordNumber: number;
	words: Record<string, { text: string }>;
}> = ({ chunk, isLastChunk, activeKey, verseKey, wordNumber, words }) => (
	<div className="leading-[1.85] font-[Hafs]" dir="rtl">
		{chunk.map((segment, segmentIndex) => {
			const isLastSegment = segmentIndex === chunk.length - 1;
			const trailingSpace = !isLastChunk && isLastSegment;
			return (
				<WordChunkArabicSegment
					key={`${verseKey}-segment_${segmentIndex}`}
					segment={segment}
					skipTrailingSpace={trailingSpace}
					activeKey={activeKey}
					verseKey={verseKey}
					activeWordNumber={wordNumber}
					words={words}
				></WordChunkArabicSegment>
			);
		})}
		{isLastChunk ? (
			<span>
				{
					words[
						`${verseKey}:${chunk[chunk.length - 1].word_range.end + 1}`
					].text
				}
			</span>
		) : null}
	</div>
);

const WordChunkArabicSegment: React.FC<{
	segment: Segment;
	skipTrailingSpace: boolean;
	activeKey: string;
	verseKey: string;
	activeWordNumber: number;
	words: Record<string, { text: string }>;
}> = ({
	segment,
	skipTrailingSpace,
	activeKey,
	verseKey,
	activeWordNumber,
	words,
}) => {
	const { start, end } = segment.word_range;
	const isSegmentActive =
		activeWordNumber >= start && activeWordNumber <= end;

	const wordNumbers = Array.from(
		{ length: end - start + 1 },
		(_, i) => start + i,
	);

	return (
		<span className={clsx(isSegmentActive && "text-ctp-sapphire")}>
			{wordNumbers.map((wordNumber) => {
				const lookupKey = `${verseKey}:${wordNumber}`;
				const wordText = words[lookupKey]?.text || "";
				const isHighlighted = lookupKey === activeKey;
				const isLastWord = wordNumber === end;

				return (
					<React.Fragment key={lookupKey}>
						<span className={clsx(isHighlighted && "highlight")}>
							{wordText}
						</span>

						{skipTrailingSpace && isLastWord ? null : (
							<span> </span>
						)}
					</React.Fragment>
				);
			})}
		</span>
	);
};

const WordChunkTranslation: React.FC<{
	chunk: Segment[];
	wordNumber: number;
}> = ({ chunk, wordNumber: word }) => {
	return (
		<div className="text-[40px] font-[EB_Garamond] mt-[20px]">
			{chunk.map((segment, segmentIndex) => {
				const { start, end } = segment.word_range;
				const isSegmentActive = word >= start && word <= end;

				return (
					<span
						key={`trans-${segmentIndex}`}
						className={clsx(isSegmentActive && "text-ctp-sapphire")}
					>
						{segment.t}{" "}
					</span>
				);
			})}
		</div>
	);
};
