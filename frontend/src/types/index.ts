/**
 * TypeScript类型定义
 */

export interface ProjectConfig {
  // 步骤1：智能总结
  target_length: number;
  llm_temperature_script: number;
  llm_model_step1: string;
  llm_server_step1: string;

  // 步骤1.5：脚本分段
  num_segments: number;

  // 步骤2：要点提取
  images_method: 'keywords' | 'description';
  llm_model_step2: string;
  llm_server_step2: string;
  llm_temperature_keywords: number;

  // 步骤3：图像生成
  image_size: string;
  image_model: string;
  image_server: string;
  image_style_preset: string;
  opening_image_style: string;
  max_concurrent_image_generation: number;

  // 步骤4：语音合成
  voice: string;
  resource_id: string;
  tts_server: string;
  tts_emotion: string;
  tts_emotion_scale: number;
  tts_speech_rate: number;
  tts_loudness_rate: number;
  max_concurrent_voice_synthesis: number;

  // 步骤5：视频合成
  video_size: string;
  enable_subtitles: boolean;
  bgm_filename?: string;
  bgm_default_volume: number;
  narration_default_volume: number;
  narration_speed_factor: number;
  enable_transitions: boolean;
  transition_duration: number;
  transition_style: string;

  // 字幕配置
  subtitle_font_size: number;
  subtitle_font_family: string;
  subtitle_color: string;
  subtitle_stroke_color: string;

  // 开场配置
  opening_quote: boolean;
  opening_quote_show_text: boolean;
  opening_quote_show_title: boolean;
  opening_quote_font_size: number;
  opening_fadein_seconds: number;

  // 步骤6：封面生成
  cover_image_size: string;
  cover_image_model: string;
  cover_image_style: string;
  cover_image_count: number;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  input_filename?: string;
  input_file_path?: string;
  project_dir: string;
  config: ProjectConfig;

  // 步骤完成状态
  step1_completed: boolean;
  step1_5_completed: boolean;
  step2_completed: boolean;
  step3_completed: boolean;
  step4_completed: boolean;
  step5_completed: boolean;
  step6_completed: boolean;

  // 当前进度
  current_step: number;
  current_step_progress: number;

  // 错误信息
  error_message?: string;

  // 时间戳
  created_at?: string;
  updated_at?: string;
  completed_at?: string;

  // 数据
  raw_data?: any;
  script_data?: any;
  keywords_data?: any;

  // 结果文件
  final_video_path?: string;
  cover_image_paths?: string[];
}

export interface Task {
  id: number;
  project_id: number;
  celery_task_id?: string;
  task_type: string;
  status: string;
  progress: number;
  current_operation?: string;
  parameters?: any;
  result?: any;
  error_message?: string;
  error_traceback?: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface ProjectListResponse {
  total: number;
  items: Project[];
}

export interface TaskListResponse {
  total: number;
  items: Task[];
}

export interface CreateProjectData {
  name: string;
  description?: string;
  config: Partial<ProjectConfig>;
  file?: File;
}

export interface ExecuteStepData {
  step: number;
  force_regenerate?: boolean;
  custom_params?: Record<string, any>;
}

export interface RegenerateImagesData {
  segment_indices: number[];
}

export interface WebSocketMessage {
  type: 'project_update' | 'task_update' | 'pong';
  data?: any;
}
