import React from "react";
import {Composition, type CalculateMetadataFunction} from "remotion";

import {
	OpeningComposition,
	type OpeningCompositionProps,
} from "./OpeningComposition";

export type OpeningCompositionInput = OpeningCompositionProps & {
	durationInFrames?: number;
	fps?: number;
	height?: number;
	lineAppearTimes?: number[];
	width?: number;
};

const calculateMetadata: CalculateMetadataFunction<OpeningCompositionInput> = async ({
	props,
}) => {
	const fps = props.fps ?? 30;
	return {
		durationInFrames: props.durationInFrames ?? 120,
		fps,
		height: props.height ?? 720,
		width: props.width ?? 1280,
	};
};

export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="OpeningQuote"
			component={OpeningComposition}
			durationInFrames={120}
			fps={30}
			width={1280}
			height={720}
			defaultProps={{
				bookTitle: "-- 系统思维 --",
				focusWords: ["系统"],
				ipName: "Cody叩底",
				lineAppearTimes: [0.5, 1.25, 2.0],
				quoteLines: ["真正拉开差距的，", "不是努力，", "而是你能不能看懂系统。"],
			} satisfies OpeningCompositionInput}
			calculateMetadata={calculateMetadata}
		/>
	);
};

export default RemotionRoot;
