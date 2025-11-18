"""
任务数据模型（用于跟踪Celery任务）
"""
from sqlalchemy import Column, Integer, String, DateTime, JSON, Enum, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from backend.database import Base


class TaskStatus(str, enum.Enum):
    """任务状态枚举"""
    PENDING = "pending"      # 等待中
    RUNNING = "running"      # 运行中
    SUCCESS = "success"      # 成功
    FAILED = "failed"        # 失败
    CANCELLED = "cancelled"  # 已取消


class TaskType(str, enum.Enum):
    """任务类型枚举"""
    FULL_AUTO = "full_auto"               # 全自动模式
    STEP1 = "step1"                       # 智能总结
    STEP1_5 = "step1_5"                   # 脚本分段
    STEP2 = "step2"                       # 要点提取
    STEP3 = "step3"                       # 图像生成
    STEP3_REGENERATE = "step3_regenerate" # 重新生成指定图片
    STEP4 = "step4"                       # 语音合成
    STEP5 = "step5"                       # 视频合成
    STEP6 = "step6"                       # 封面生成


class Task(Base):
    """任务模型"""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)

    # 关联项目
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)

    # Celery任务ID
    celery_task_id = Column(String(255), unique=True, index=True)

    # 任务类型
    task_type = Column(Enum(TaskType), nullable=False)

    # 任务状态
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, index=True)

    # 进度（0-100）
    progress = Column(Integer, default=0)

    # 当前操作描述
    current_operation = Column(String(500), nullable=True)

    # 任务参数（JSON格式）
    parameters = Column(JSON, nullable=True)

    # 结果数据（JSON格式）
    result = Column(JSON, nullable=True)

    # 错误信息
    error_message = Column(Text, nullable=True)
    error_traceback = Column(Text, nullable=True)

    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Task(id={self.id}, type='{self.task_type}', status='{self.status}')>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "project_id": self.project_id,
            "celery_task_id": self.celery_task_id,
            "task_type": self.task_type.value if self.task_type else None,
            "status": self.status.value if self.status else None,
            "progress": self.progress,
            "current_operation": self.current_operation,
            "parameters": self.parameters,
            "result": self.result,
            "error_message": self.error_message,
            "error_traceback": self.error_traceback,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
