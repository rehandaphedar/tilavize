import React, { useEffect, useState } from "react";
import { AbsoluteFill, delayRender, Html5Audio } from "remotion";
import { OverlayMetadata, Segment } from "./schemas";
import { loadFonts, useActiveTiming } from "./utils";

const hafsFontFamily = "Hafs";
const ebGaramondFontFamily = "EB Garamond";

const highlight: React.CSSProperties = {
	textShadow: `
      0 0 16px rgba(145, 215, 227, 0.25),
      0 0 8px rgba(145, 215, 227, 0.6),
      0 0 2px rgba(145, 215, 227, 1),
      -0.5px -0.5px 0.8px rgba(110, 115, 141, 0.8)
    `,
};

// const STYLES: Record<string, React.CSSProperties> = {
// 	container: {
// 		fontFamily: hafsFontFamily,
// 		fontSize: 64,
// 		textAlign: "center",
// 		lineHeight: 1.5,
// 	},
// 	phrase: {
// 		fontFamily: hafsFontFamily,
// 		fontSize: 64,
// 	},
// 	translation: {
// 		// fontWeight: "bold" as const,
// 		fontFamily: ebGaramondFontFamily,
// 		fontSize: 40,
// 		textAlign: "center",
// 		// color: "#4290F5",
// 		marginTop: 20,
// 	},
// 	highlight: {
// 		color: "#4290F5",
// 	},
// 	segmentActive: {
// 		color: "var(--catppuccin-color-sapphire)",
// 	},
// };

const PhraseDisplay: React.FC<{ text: string }> = () => <div></div>;

const Word: React.FC<{
	chunk: Segment[];
	isLastChunk: boolean;
	activeKey: string;
	verseKey: string;
	wordNumber: number;
	words: Record<string, { text: string }>;
}> = ({ chunk, isLastChunk, activeKey: key, verseKey, wordNumber, words }) => {
	return (
		<div style={undefined}>
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
						style={isSegmentActive ? undefined : undefined}
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
									<span style={isHighlighted ? highlight : undefined}>
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
		<div style={undefined}>
			{chunk.map((segment, idx) => {
				const { start, end } = segment.word_range;
				const isSegmentActive = word >= start && word <= end;

				return (
					<span
						key={`trans-${idx}`}
						style={isSegmentActive ? undefined : undefined}
					>
						{segment.t}{" "}
					</span>
				);
			})}
		</div>
	);
};

// --- MAIN COMPONENT ---

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

	if (!activeTiming)
		return <AbsoluteFill className="bg-ctp-base text-ctp-text "></AbsoluteFill>;

	if (activeTiming.type == "phrase") {
		return <PhraseDisplay text={activeTiming.key} />;
	}

	if (activeTiming.chunkIndex == null || activeTiming.isLastChunk == null)
		return <AbsoluteFill className="bg-ctp-base text-ctp-text "></AbsoluteFill>;

	const [chapterNumberStr, verseNumberStr, wordNumberStr] =
		activeTiming.key.split(":");
	const wordNumber = Number(wordNumberStr);
	const verseKey = `${chapterNumberStr}:${verseNumberStr}`;

	const chunk = translation[verseKey].chunks[activeTiming.chunkIndex];

	return (
		<AbsoluteFill className="bg-ctp-base text-ctp-text @container">
			<div className="m-auto w-[40%] px-10">
				<Word
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
};
