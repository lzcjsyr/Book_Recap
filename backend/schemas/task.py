"""
任务数据模式（Pydantic）
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class TaskCreateSchema(BaseModel):
    """创建任务的请求模式"""
    task_type: str = Field(..., pattern="^(full_auto|step1|step1_5|step2|step3|step3_regenerate|step4|step5|step6)$")
    parameters: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class TaskResponseSchema(BaseModel):
    """任务响应模式"""
    id: int
    project_id: int
    celery_task_id: Optional[str]
    task_type: str
    status: str
    progress: int
    current_operation: Optional[str]
    parameters: Optional[Dict[str, Any]]
    result: Optional[Dict[str, Any]]
    error_message: Optional[str]
    error_traceback: Optional[str]
    created_at: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class TaskListResponseSchema(BaseModel):
    """任务列表响应模式"""
    total: int
    items: List[TaskResponseSchema]

    class Config:
        from_attributes = True


class StepExecuteSchema(BaseModel):
    """执行步骤的请求模式"""
    step: int = Field(..., ge=1, le=6)
    force_regenerate: bool = False
    custom_params: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class RegenerateImagesSchema(BaseModel):
    """重新生成图片的请求模式"""
    segment_indices: List[int] = Field(..., min_items=1)

    class Config:
        from_attributes = True
