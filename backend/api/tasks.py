"""
任务管理API路由
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from backend.database import get_db
from backend.models import Project, ProjectStatus, Task, TaskStatus, TaskType
from backend.schemas import (
    StepExecuteSchema,
    RegenerateImagesSchema,
    TaskResponseSchema,
    TaskListResponseSchema,
)
from backend.tasks import execute_full_auto, execute_step, regenerate_images

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.post("/projects/{project_id}/full-auto", response_model=TaskResponseSchema)
async def start_full_auto(project_id: int, db: Session = Depends(get_db)):
    """
    启动全自动模式
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.input_file_path:
        raise HTTPException(status_code=400, detail="No input file uploaded")

    # 创建任务记录
    task = Task(
        project_id=project_id,
        task_type=TaskType.FULL_AUTO,
        status=TaskStatus.PENDING,
        parameters={}
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # 提交Celery任务
    celery_task = execute_full_auto.delay(project_id, project.config or {})
    task.celery_task_id = celery_task.id
    db.commit()

    return task.to_dict()


@router.post("/projects/{project_id}/step", response_model=TaskResponseSchema)
async def execute_project_step(
    project_id: int,
    step_data: StepExecuteSchema,
    db: Session = Depends(get_db)
):
    """
    执行单个步骤
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 验证步骤顺序
    step = step_data.step
    if step == 1 and not project.input_file_path:
        raise HTTPException(status_code=400, detail="No input file uploaded")

    # 创建任务记录
    task_type_map = {
        1: TaskType.STEP1,
        1.5: TaskType.STEP1_5,
        2: TaskType.STEP2,
        3: TaskType.STEP3,
        4: TaskType.STEP4,
        5: TaskType.STEP5,
        6: TaskType.STEP6,
    }

    task = Task(
        project_id=project_id,
        task_type=task_type_map.get(step, TaskType.STEP1),
        status=TaskStatus.PENDING,
        parameters={
            "step": step,
            "force_regenerate": step_data.force_regenerate,
            "custom_params": step_data.custom_params
        }
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # 提交Celery任务
    celery_task = execute_step.delay(
        project_id,
        step,
        step_data.force_regenerate,
        step_data.custom_params
    )
    task.celery_task_id = celery_task.id
    db.commit()

    return task.to_dict()


@router.post("/projects/{project_id}/regenerate-images", response_model=TaskResponseSchema)
async def regenerate_project_images(
    project_id: int,
    data: RegenerateImagesSchema,
    db: Session = Depends(get_db)
):
    """
    重新生成指定段落的图片
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.step2_completed:
        raise HTTPException(status_code=400, detail="Step 2 must be completed first")

    # 创建任务记录
    task = Task(
        project_id=project_id,
        task_type=TaskType.STEP3_REGENERATE,
        status=TaskStatus.PENDING,
        parameters={"segment_indices": data.segment_indices}
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # 提交Celery任务
    celery_task = regenerate_images.delay(project_id, data.segment_indices)
    task.celery_task_id = celery_task.id
    db.commit()

    return task.to_dict()


@router.get("/projects/{project_id}/tasks", response_model=TaskListResponseSchema)
async def list_project_tasks(
    project_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    获取项目的所有任务
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    query = db.query(Task).filter(Task.project_id == project_id)
    query = query.order_by(Task.created_at.desc())

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": [item.to_dict() for item in items]
    }


@router.get("/tasks/{task_id}", response_model=TaskResponseSchema)
async def get_task(task_id: int, db: Session = Depends(get_db)):
    """
    获取任务详情
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task.to_dict()


@router.post("/tasks/{task_id}/cancel")
async def cancel_task(task_id: int, db: Session = Depends(get_db)):
    """
    取消任务
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status in [TaskStatus.SUCCESS, TaskStatus.FAILED, TaskStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Task already completed or cancelled")

    # 取消Celery任务
    from backend.celery_app import celery_app
    if task.celery_task_id:
        celery_app.control.revoke(task.celery_task_id, terminate=True)

    # 更新任务状态
    task.status = TaskStatus.CANCELLED
    task.completed_at = datetime.now()
    db.commit()

    return {"status": "success", "message": "Task cancelled"}
