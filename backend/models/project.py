"""
项目数据模型
"""
from sqlalchemy import Column, Integer, String, DateTime, JSON, Enum, Text
from sqlalchemy.sql import func
from datetime import datetime
import enum

from backend.database import Base


class ProjectStatus(str, enum.Enum):
    """项目状态枚举"""
    CREATED = "created"              # 已创建
    PROCESSING = "processing"        # 处理中
    STEP1_COMPLETED = "step1_completed"        # 步骤1完成
    STEP1_5_COMPLETED = "step1_5_completed"    # 步骤1.5完成
    STEP2_COMPLETED = "step2_completed"        # 步骤2完成
    STEP3_COMPLETED = "step3_completed"        # 步骤3完成
    STEP4_COMPLETED = "step4_completed"        # 步骤4完成
    STEP5_COMPLETED = "step5_completed"        # 步骤5完成
    COMPLETED = "completed"          # 全部完成
    FAILED = "failed"                # 失败
    CANCELLED = "cancelled"          # 已取消


class Project(Base):
    """项目模型"""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)

    # 基本信息
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.CREATED, index=True)

    # 输入文件信息
    input_filename = Column(String(500), nullable=True)
    input_file_path = Column(String(1000), nullable=True)

    # 项目路径（output目录下的项目文件夹）
    project_dir = Column(String(1000), nullable=False)

    # 配置参数（JSON格式存储所有配置）
    config = Column(JSON, nullable=False)

    # 步骤完成状态
    step1_completed = Column(Integer, default=0)    # 智能总结
    step1_5_completed = Column(Integer, default=0)  # 脚本分段
    step2_completed = Column(Integer, default=0)    # 要点提取
    step3_completed = Column(Integer, default=0)    # 图像生成
    step4_completed = Column(Integer, default=0)    # 语音合成
    step5_completed = Column(Integer, default=0)    # 视频合成
    step6_completed = Column(Integer, default=0)    # 封面生成

    # 当前执行的步骤
    current_step = Column(Integer, default=0)
    current_step_progress = Column(Integer, default=0)  # 当前步骤进度（0-100）

    # 错误信息
    error_message = Column(Text, nullable=True)

    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # 结果数据（JSON格式）
    raw_data = Column(JSON, nullable=True)           # raw.json内容
    script_data = Column(JSON, nullable=True)        # script.json内容
    keywords_data = Column(JSON, nullable=True)      # keywords.json或mini_summary.json

    # 生成的文件路径
    final_video_path = Column(String(1000), nullable=True)
    cover_image_paths = Column(JSON, nullable=True)  # 封面图片路径列表

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', status='{self.status}')>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "status": self.status.value if self.status else None,
            "input_filename": self.input_filename,
            "input_file_path": self.input_file_path,
            "project_dir": self.project_dir,
            "config": self.config,
            "step1_completed": bool(self.step1_completed),
            "step1_5_completed": bool(self.step1_5_completed),
            "step2_completed": bool(self.step2_completed),
            "step3_completed": bool(self.step3_completed),
            "step4_completed": bool(self.step4_completed),
            "step5_completed": bool(self.step5_completed),
            "step6_completed": bool(self.step6_completed),
            "current_step": self.current_step,
            "current_step_progress": self.current_step_progress,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "raw_data": self.raw_data,
            "script_data": self.script_data,
            "keywords_data": self.keywords_data,
            "final_video_path": self.final_video_path,
            "cover_image_paths": self.cover_image_paths,
        }
