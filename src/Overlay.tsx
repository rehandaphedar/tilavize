import React, { useEffect, useState } from "react";
import { AbsoluteFill, delayRender, Html5Audio } from "remotion";
import { OverlayMetadata, Segment, TimingPhrase } from "./schemas";
import { loadFonts, useActiveTiming } from "./utils";
import clsx from "clsx";

const Phrase: React.FC<{ phraseKey: string; chapterNumber: number }> = ({
	phraseKey,
	chapterNumber,
}) => {
	return (
		<div>
			{phraseKey} {chapterNumber}
		</div>
	);
};

const Arabic: React.FC<{
	chunk: Segment[];
	isLastChunk: boolean;
	activeKey: string;
	verseKey: string;
	wordNumber: number;
	words: Record<string, { text: string }>;
}> = ({ chunk, isLastChunk, activeKey: key, verseKey, wordNumber, words }) => {
	return (
		<div style={undefined} className="leading-[1.5]">
			{chunk.map((segment, segIdx) => {
				const { start, end } = segment.word_range;
				const isSegmentActive = wordNumber >= start && wordNumber <= end;

				// Generate array of word indices for this segment [start...end]
				const indices = Array.from(
					{ length: end - start + 1 },
					(_, i) => start + i,
				);

				return (
					<span
						key={`${verseKey}-seg-${segIdx}`}
						className={isSegmentActive ? "text-ctp-sapphire" : ""}
						// className="rounded-lg"
					>
						{indices.map((idx) => {
							const lookupKey = `${verseKey}:${idx}`;
							const wordText = words[lookupKey]?.text || "";
							const isHighlighted = lookupKey === key;
							console.log(lookupKey, key);

							return (
								<React.Fragment key={lookupKey}>
									<span
										style={isHighlighted ? undefined : undefined}
										className={clsx(
											"font-[Hafs]",
											isHighlighted && "highlight",
										)}
									>
										{wordText}
									</span>{" "}
								</React.Fragment>
							);
						})}
					</span>
				);
			})}
			{isLastChunk ? (
				<span>
					{
						words[`${verseKey}:${chunk[chunk.length - 1].word_range.end + 1}`]
							.text
					}
				</span>
			) : null}
		</div>
	);
};

const Translation: React.FC<{
	chunk: Segment[];
	wordNumber: number;
}> = ({ chunk, wordNumber: word }) => {
	return (
		<div className="text-[40px] font-[EB_Garamond] mt-[20px]">
			{chunk.map((segment, idx) => {
				const { start, end } = segment.word_range;
				const isSegmentActive = word >= start && word <= end;

				return (
					<span
						key={`trans-${idx}`}
						className={clsx(isSegmentActive && "text-ctp-sapphire")}
					>
						{segment.t}{" "}
					</span>
				);
			})}
		</div>
	);
};

export const Overlay: React.FC<OverlayMetadata> = ({
	audio_url,
	timings,
	words,
	translation,
	fonts_path,
}) => {
	const [handle] = useState(() => delayRender());
	useEffect(() => {
		loadFonts(fonts_path, handle);
	}, [fonts_path, handle]);

	const activeTiming = useActiveTiming(timings);
	if (!activeTiming) return null;

	switch (activeTiming.type) {
		case "phrase":
			// TODO: Implement Phrase
			return (
				<Phrase
					phraseKey={activeTiming.key}
					chapterNumber={activeTiming.chapterNumber || 0}
				/>
			);
		case "word":
			if (activeTiming.chunkIndex == null || activeTiming.isLastChunk == null)
				return (
					<AbsoluteFill className="bg-ctp-base text-ctp-text "></AbsoluteFill>
				);

			const [chapterNumberStr, verseNumberStr, wordNumberStr] =
				activeTiming.key.split(":");
			const wordNumber = Number(wordNumberStr);
			const verseKey = `${chapterNumberStr}:${verseNumberStr}`;

			const chunk = translation[verseKey].chunks[activeTiming.chunkIndex];

			return (
				<AbsoluteFill className="bg-ctp-base text-ctp-text text-[64px] font-[Hafs] text-center">
					<div className="m-auto w-[60%] px-10">
						<Arabic
							chunk={chunk}
							activeKey={activeTiming.key}
							isLastChunk={activeTiming.isLastChunk}
							verseKey={verseKey}
							wordNumber={wordNumber}
							words={words}
						/>

						<div className="w-fit mx-auto my-8 py-2 px-4 text-ctp-base bg-ctp-mauve font-bold text-2xl font-[Roboto]">
							{activeTiming.key}
						</div>

						<Translation chunk={chunk} wordNumber={wordNumber} />
					</div>
					<Html5Audio src={audio_url} />
				</AbsoluteFill>
			);
	}
};
