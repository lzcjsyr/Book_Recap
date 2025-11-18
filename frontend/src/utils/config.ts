/**
 * 配置常量和默认值
 */
import type { ProjectConfig } from '@/types';

/**
 * 默认项目配置
 */
export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  // 步骤1：智能总结
  target_length: 2000,
  llm_temperature_script: 0.7,
  llm_model_step1: 'moonshotai/Kimi-K2-Instruct-0905',
  llm_server_step1: 'openrouter',

  // 步骤1.5：脚本分段
  num_segments: 15,

  // 步骤2：要点提取
  images_method: 'description',
  llm_model_step2: 'moonshotai/Kimi-K2-Instruct-0905',
  llm_server_step2: 'openrouter',
  llm_temperature_keywords: 0.5,

  // 步骤3：图像生成
  image_size: '2560x1440',
  image_model: 'doubao-seedream-4-0-250828',
  image_server: 'doubao',
  image_style_preset: 'style01',
  opening_image_style: 'des02',
  max_concurrent_image_generation: 5,

  // 步骤4：语音合成
  voice: 'S_MfnRsKLH1',
  resource_id: 'seed-icl-2.0',
  tts_server: 'bytedance',
  tts_emotion: 'neutral',
  tts_emotion_scale: 5,
  tts_speech_rate: 20,
  tts_loudness_rate: 0,
  max_concurrent_voice_synthesis: 5,

  // 步骤5：视频合成
  video_size: '1280x720',
  enable_subtitles: true,
  bgm_filename: 'Light of the Seven.mp3',
  bgm_default_volume: 0.15,
  narration_default_volume: 2.0,
  narration_speed_factor: 1.15,
  enable_transitions: false,
  transition_duration: 0.8,
  transition_style: 'slide_right',

  // 字幕配置
  subtitle_font_size: 38,
  subtitle_font_family: '/System/Library/Fonts/STHeiti Light.ttc',
  subtitle_color: 'white',
  subtitle_stroke_color: 'black',

  // 开场配置
  opening_quote: true,
  opening_quote_show_text: true,
  opening_quote_show_title: true,
  opening_quote_font_size: 55,
  opening_fadein_seconds: 2.0,

  // 步骤6：封面生成
  cover_image_size: '2250x3000',
  cover_image_model: 'doubao-seedream-4-0-250828',
  cover_image_style: 'cover01',
  cover_image_count: 1,
};

/**
 * 步骤名称映射
 */
export const STEP_NAMES: Record<number, string> = {
  1: '智能总结',
  1.5: '脚本分段',
  2: '要点提取',
  3: '图像生成',
  4: '语音合成',
  5: '视频合成',
  6: '封面生成',
};

/**
 * 任务状态映射
 */
export const TASK_STATUS_MAP: Record<string, { text: string; color: string }> = {
  pending: { text: '等待中', color: 'default' },
  running: { text: '运行中', color: 'processing' },
  success: { text: '成功', color: 'success' },
  failed: { text: '失败', color: 'error' },
  cancelled: { text: '已取消', color: 'warning' },
};

/**
 * 项目状态映射
 */
export const PROJECT_STATUS_MAP: Record<
  string,
  { text: string; color: string }
> = {
  created: { text: '已创建', color: 'default' },
  processing: { text: '处理中', color: 'processing' },
  step1_completed: { text: '步骤1完成', color: 'processing' },
  step1_5_completed: { text: '步骤1.5完成', color: 'processing' },
  step2_completed: { text: '步骤2完成', color: 'processing' },
  step3_completed: { text: '步骤3完成', color: 'processing' },
  step4_completed: { text: '步骤4完成', color: 'processing' },
  step5_completed: { text: '步骤5完成', color: 'processing' },
  completed: { text: '已完成', color: 'success' },
  failed: { text: '失败', color: 'error' },
  cancelled: { text: '已取消', color: 'warning' },
};

/**
 * 可选的视频尺寸
 */
export const VIDEO_SIZE_OPTIONS = [
  { label: '横屏 1280x720 (16:9)', value: '1280x720' },
  { label: '横屏 1920x1080 (16:9)', value: '1920x1080' },
  { label: '横屏 2560x1440 (16:9)', value: '2560x1440' },
  { label: '竖屏 720x1280 (9:16)', value: '720x1280' },
  { label: '竖屏 1080x1920 (9:16)', value: '1080x1920' },
  { label: '方形 1024x1024 (1:1)', value: '1024x1024' },
];

/**
 * 可选的图像风格
 */
export const IMAGE_STYLE_OPTIONS = [
  { label: '概念极简 (style01)', value: 'style01' },
  { label: '俯视古典 (style02)', value: 'style02' },
  { label: '综合平衡 (style05)', value: 'style05' },
  { label: '科技未来 (style08)', value: 'style08' },
];

/**
 * 可选的过渡效果
 */
export const TRANSITION_OPTIONS = [
  { label: '无过渡', value: 'cut' },
  { label: '淡化', value: 'crossfade' },
  { label: '右滑', value: 'slide_right' },
  { label: '左滑', value: 'slide_left' },
];
