import "./index.css";
import { Composition } from "remotion";
import { Video } from "./Video";
import { calculateMetadata } from "./utils";
import { videoInputPropsSchema } from "./schemas";

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="Video"
				component={Video}
				durationInFrames={30}
				fps={30}
				width={1920}
				height={1080}
				schema={videoInputPropsSchema}
				defaultProps={{
					audio_url: "http://localhost:8000/001001.mp3",
					timings_url: "http://localhost:8000/001001.json",
					words_path: "data/qpc-hafs-word-by-word.json",
					translation_path: "data/en-sahih-international-simple.json",
					metadata_path: "data/quran-metadata-surah-name.json",
					fonts_path: "fonts/index.json",
					max_words: 12,
					fps: 30,
					width: 1920,
					height: 1080,
					timings: [],
					words: {},
					translation: {},
					metadata: {},
				}}
				calculateMetadata={calculateMetadata}
			/>
		</>
	);
};
