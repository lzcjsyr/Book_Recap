"""
项目数据模式（Pydantic）
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from backend.models.project import ProjectStatus


class ProjectConfigSchema(BaseModel):
    """项目配置模式"""
    # 步骤1：智能总结
    target_length: int = Field(default=2000, ge=500, le=5000)
    llm_temperature_script: float = Field(default=0.7, ge=0, le=1)
    llm_model_step1: str = "moonshotai/Kimi-K2-Instruct-0905"
    llm_server_step1: str = "openrouter"

    # 步骤1.5：脚本分段
    num_segments: int = Field(default=15, ge=5, le=50)

    # 步骤2：要点提取
    images_method: str = Field(default="description", pattern="^(keywords|description)$")
    llm_model_step2: str = "moonshotai/Kimi-K2-Instruct-0905"
    llm_server_step2: str = "openrouter"
    llm_temperature_keywords: float = Field(default=0.5, ge=0, le=1)

    # 步骤3：图像生成
    image_size: str = "2560x1440"
    image_model: str = "doubao-seedream-4-0-250828"
    image_server: str = "doubao"
    image_style_preset: str = "style01"
    opening_image_style: str = "des02"
    max_concurrent_image_generation: int = Field(default=5, ge=1, le=10)

    # 步骤4：语音合成
    voice: str = "S_MfnRsKLH1"
    resource_id: str = "seed-icl-2.0"
    tts_server: str = "bytedance"
    tts_emotion: str = "neutral"
    tts_emotion_scale: int = Field(default=5, ge=1, le=5)
    tts_speech_rate: int = Field(default=20, ge=-50, le=100)
    tts_loudness_rate: int = Field(default=0, ge=-50, le=100)
    max_concurrent_voice_synthesis: int = Field(default=5, ge=1, le=10)

    # 步骤5：视频合成
    video_size: str = "1280x720"
    enable_subtitles: bool = True
    bgm_filename: Optional[str] = "Light of the Seven.mp3"
    bgm_default_volume: float = Field(default=0.15, ge=0, le=1)
    narration_default_volume: float = Field(default=2.0, ge=0, le=5)
    narration_speed_factor: float = Field(default=1.15, ge=0.5, le=2.0)
    enable_transitions: bool = False
    transition_duration: float = Field(default=0.8, ge=0, le=5)
    transition_style: str = "slide_right"

    # 字幕配置
    subtitle_font_size: int = Field(default=38, ge=10, le=100)
    subtitle_font_family: str = "/System/Library/Fonts/STHeiti Light.ttc"
    subtitle_color: str = "white"
    subtitle_stroke_color: str = "black"

    # 开场配置
    opening_quote: bool = True
    opening_quote_show_text: bool = True
    opening_quote_show_title: bool = True
    opening_quote_font_size: int = Field(default=55, ge=20, le=120)
    opening_fadein_seconds: float = Field(default=2.0, ge=0, le=10)

    # 步骤6：封面生成
    cover_image_size: str = "2250x3000"
    cover_image_model: str = "doubao-seedream-4-0-250828"
    cover_image_style: str = "cover01"
    cover_image_count: int = Field(default=1, ge=1, le=5)

    class Config:
        from_attributes = True


class ProjectCreateSchema(BaseModel):
    """创建项目的请求模式"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    config: ProjectConfigSchema = Field(default_factory=ProjectConfigSchema)

    class Config:
        from_attributes = True


class ProjectUpdateSchema(BaseModel):
    """更新项目的请求模式"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    config: Optional[ProjectConfigSchema] = None

    class Config:
        from_attributes = True


class ProjectResponseSchema(BaseModel):
    """项目响应模式"""
    id: int
    name: str
    description: Optional[str]
    status: str
    input_filename: Optional[str]
    input_file_path: Optional[str]
    project_dir: str
    config: Dict[str, Any]

    # 步骤完成状态
    step1_completed: bool
    step1_5_completed: bool
    step2_completed: bool
    step3_completed: bool
    step4_completed: bool
    step5_completed: bool
    step6_completed: bool

    # 当前进度
    current_step: int
    current_step_progress: int

    # 错误信息
    error_message: Optional[str]

    # 时间戳
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    completed_at: Optional[datetime]

    # 数据
    raw_data: Optional[Dict[str, Any]]
    script_data: Optional[Dict[str, Any]]
    keywords_data: Optional[Dict[str, Any]]

    # 结果文件
    final_video_path: Optional[str]
    cover_image_paths: Optional[List[str]]

    class Config:
        from_attributes = True


class ProjectListResponseSchema(BaseModel):
    """项目列表响应模式"""
    total: int
    items: List[ProjectResponseSchema]

    class Config:
        from_attributes = True
