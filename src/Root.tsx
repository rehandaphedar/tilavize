import "./index.css";
import { Composition } from "remotion";
import { Overlay } from "./Overlay";
import { calculateMetadata } from "./utils";
import { overlayInputPropsSchema } from "./schemas";

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="Overlay"
				component={Overlay}
				durationInFrames={30}
				fps={30}
				width={1920}
				height={1080}
				schema={overlayInputPropsSchema}
				defaultProps={{
					audio_url: "http://localhost:8000/001001.mp3",
					timings_url: "http://localhost:8000/001001.json",
					words_path: "qpc-hafs-word-by-word.json",
					translation_path: "en-sahih-international-simple.json",
					fonts_path: "fonts.json",
					max_words: 12,
					fps: 30,
					width: 1920,
					height: 1080,
					timings: [],
					words: {},
					translation: {},
				}}
				calculateMetadata={calculateMetadata}
			/>
		</>
	);
};
