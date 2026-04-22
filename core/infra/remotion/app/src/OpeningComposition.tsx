import React from "react";
import {
	AbsoluteFill,
	Easing,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";

export type OpeningCompositionProps = {
	bookTitle: string;
	focusWords: string[];
	ipName: string;
	lineAppearTimes: number[];
	quoteLines: string[];
};

const BG = "#121920";
const TEXT = "#f3eee4";
const MUTED = "rgba(236,231,222,0.78)";
const ACCENT = "#e7c992";

const highlightLine = (line: string, focusWords: string[]) => {
	if (focusWords.length === 0) {
		return [{text: line, focused: false}];
	}

	const escaped = focusWords
		.filter(Boolean)
		.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

	if (escaped.length === 0) {
		return [{text: line, focused: false}];
	}

	const regex = new RegExp(`(${escaped.join("|")})`, "g");
	return line.split(regex).filter(Boolean).map((part) => ({
		text: part,
		focused: focusWords.includes(part),
	}));
};

export const OpeningComposition: React.FC<OpeningCompositionProps> = ({
	bookTitle,
	focusWords,
	ipName,
	lineAppearTimes,
	quoteLines,
}) => {
	const frame = useCurrentFrame();
	const {fps, height, width} = useVideoConfig();
	const lineCount = Math.max(quoteLines.length, 1);
	const longestLine = quoteLines.reduce((max, line) => Math.max(max, line.length), 0);

	const backgroundScale = interpolate(frame, [0, 4 * fps], [1.03, 1], {
		easing: Easing.out(Easing.cubic),
		extrapolateRight: "clamp",
	});
	const backgroundShift = interpolate(frame, [0, 4 * fps], [14, -6], {
		easing: Easing.inOut(Easing.ease),
		extrapolateRight: "clamp",
	});

	const maxByHeight = Math.round(height * 0.152);
	const maxByWidth = longestLine > 0
		? Math.round((width * 0.94) / Math.max(longestLine, 1))
		: maxByHeight;
	const quoteFontSize = Math.max(88, Math.min(maxByHeight, maxByWidth, 122));
	const lineGap = Math.max(18, Math.round(quoteFontSize * 0.18));
	const bookFontSize = Math.max(44, Math.round(quoteFontSize * 0.44));
	const ipFontSize = Math.max(26, Math.round(quoteFontSize * 0.24));
	const quoteOffsetY = lineCount >= 4 ? -0.6 : lineCount >= 3 ? -0.56 : -0.53;
	const mastheadDraw = interpolate(frame, [0.08 * fps, 0.72 * fps], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	});
	const mastheadGlow = interpolate(frame, [0.08 * fps, 0.72 * fps, 1.5 * fps], [0.15, 1, 0.55], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});
	const focusPulse = interpolate(frame, [1.05 * fps, 1.65 * fps, 2.6 * fps, 3.4 * fps], [0, 0.6, 0.22, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{backgroundColor: BG, fontFamily: "PingFang SC, Hiragino Sans GB, system-ui, sans-serif"}}>
			<AbsoluteFill
				style={{
					background:
						"radial-gradient(circle at 50% 22%, rgba(225, 201, 164, 0.12), transparent 24%), linear-gradient(180deg, rgba(6,10,14,0.18), rgba(6,10,14,0.5)), linear-gradient(135deg, #101820 0%, #26343d 52%, #131b22 100%)",
					transform: `scale(${backgroundScale}) translateX(${backgroundShift}px)`,
				}}
			/>
			<AbsoluteFill
				style={{
					background:
						"repeating-linear-gradient(90deg, transparent 0 36px, rgba(255,255,255,0.018) 36px 37px), linear-gradient(180deg, rgba(255,255,255,0.02), transparent 18%, transparent 82%, rgba(255,255,255,0.02))",
					opacity: 0.7,
				}}
			/>
			<AbsoluteFill
				style={{
					background:
						"radial-gradient(circle at center, transparent 46%, rgba(0,0,0,0.22) 100%), linear-gradient(180deg, rgba(0,0,0,0.44), transparent 24%, transparent 78%, rgba(0,0,0,0.48))",
				}}
			/>
			<AbsoluteFill
				style={{
					background:
						"radial-gradient(circle at 50% 45%, rgba(231,201,146,0.2), transparent 24%), radial-gradient(circle at 50% 45%, rgba(255,244,213,0.08), transparent 40%)",
					opacity: focusPulse,
					mixBlendMode: "screen",
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: 52,
					left: 58,
					right: 58,
					display: "flex",
					alignItems: "center",
					gap: 18,
					opacity: interpolate(frame, [0.08 * fps, 0.8 * fps], [0, 1], {
						extrapolateRight: "clamp",
					}),
					transform: `translateY(${interpolate(frame, [0.08 * fps, 0.8 * fps], [10, 0], {
						extrapolateRight: "clamp",
					})}px)`,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 10,
						flexShrink: 0,
					}}
				>
					<div
						style={{
							width: 18,
							height: 2,
							borderRadius: 999,
							background: "linear-gradient(90deg, rgba(231,201,146,0.08), rgba(231,201,146,0.96))",
							boxShadow: `0 0 12px rgba(231,201,146,${0.22 * mastheadGlow})`,
						}}
					/>
					<div
						style={{
							fontSize: ipFontSize,
							letterSpacing: `${Math.max(1, Math.round(ipFontSize * 0.06))}px`,
							color: MUTED,
							fontWeight: 600,
							whiteSpace: "nowrap",
						}}
					>
						{ipName}
					</div>
				</div>
				<div
					style={{
						height: 1,
						flex: 1,
						background: "linear-gradient(90deg, rgba(255,255,255,0.58), rgba(255,255,255,0.16), transparent)",
						transform: `scaleX(${mastheadDraw})`,
						transformOrigin: "left",
						opacity: mastheadGlow,
						boxShadow: `0 0 18px rgba(231,201,146,${0.12 * mastheadGlow})`,
					}}
				/>
			</div>
			<div
				style={{
					position: "absolute",
					left: 20,
					right: 20,
					top: "50%",
					transform: `translateY(${quoteOffsetY * 100}%)`,
					textAlign: "center",
				}}
				>
					{quoteLines.map((line, index) => {
						const lineAppearTime = lineAppearTimes[index] ?? 0.5;
						const lineFrameStart = lineAppearTime * fps;
						const entrance = spring({
							fps,
							frame: Math.max(0, frame - lineFrameStart),
						config: {
							damping: 200,
							stiffness: 120,
							mass: 0.6,
						},
					});
					const opacity = interpolate(entrance, [0, 1], [0, 1], {
						extrapolateRight: "clamp",
					});
					const translateY = interpolate(entrance, [0, 1], [18, 0], {
						extrapolateRight: "clamp",
					});

					return (
						<div
							key={`${line}-${index}`}
							style={{
								fontSize: quoteFontSize,
								lineHeight: 1.2,
								fontWeight: 800,
								color: TEXT,
								textShadow: "0 10px 28px rgba(0,0,0,0.38)",
								marginTop: index === 0 ? 0 : lineGap,
								opacity,
								transform: `translateY(${translateY}px)`,
								position: "relative",
								display: "inline-block",
								padding: "0 20px",
								overflow: "hidden",
							}}
						>
							{(() => {
								const sweepDelay = (lineAppearTime + 0.32) * fps;
								const sweepProgress = interpolate(
									frame,
									[sweepDelay, sweepDelay + 0.62 * fps],
									[0, 1],
									{
										extrapolateLeft: "clamp",
										extrapolateRight: "clamp",
										easing: Easing.out(Easing.cubic),
									},
								);
								const lineSweepTranslate = interpolate(sweepProgress, [0, 1], [-40, 340], {
									extrapolateLeft: "clamp",
									extrapolateRight: "clamp",
								});
								const lineSweepOpacity = interpolate(sweepProgress, [0, 0.2, 0.7, 1], [0, 0.35, 0.3, 0], {
									extrapolateLeft: "clamp",
									extrapolateRight: "clamp",
								});

								return (
									<span
										style={{
											position: "absolute",
											top: "-8%",
											bottom: "-8%",
											left: "-24%",
											width: "36%",
											background:
												"linear-gradient(90deg, rgba(255,255,255,0), rgba(255,244,213,0.08), rgba(255,244,213,0.5), rgba(255,255,255,0))",
											transform: `translateX(${lineSweepTranslate}%) skewX(-18deg)`,
											opacity: lineSweepOpacity,
											mixBlendMode: "screen",
											pointerEvents: "none",
										}}
									/>
								);
							})()}
							{highlightLine(line, focusWords).map((part, partIndex) => {
								const glowOpacity = interpolate(frame, [1.4 * fps, 2.5 * fps], [0, 1], {
									extrapolateLeft: "clamp",
									extrapolateRight: "clamp",
								});
								return (
									<span
										key={`${part.text}-${partIndex}`}
										style={
											part.focused
												? {
													color: ACCENT,
													background: `linear-gradient(transparent 64%, rgba(231,201,146,${0.2 + 0.12 * glowOpacity}) 0)`,
													textShadow: `0 0 12px rgba(231,201,146,${0.12 + 0.08 * glowOpacity})`,
												}
												: undefined
										}
									>
										{part.text}
									</span>
								);
							})}
						</div>
					);
				})}
			</div>
			<div
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					bottom: 96,
					textAlign: "center",
					fontSize: bookFontSize,
					letterSpacing: `${Math.max(1, Math.round(bookFontSize * 0.08))}px`,
					color: "rgba(236,231,222,0.8)",
					opacity: interpolate(frame, [1.8 * fps, 2.8 * fps], [0, 1], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					}),
					transform: `translateY(${interpolate(frame, [1.8 * fps, 2.8 * fps], [8, 0], {
						extrapolateLeft: "clamp",
						extrapolateRight: "clamp",
					})}px)`,
				}}
			>
				{bookTitle}
			</div>
		</AbsoluteFill>
	);
};
