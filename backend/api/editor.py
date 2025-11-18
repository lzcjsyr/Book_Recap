"""
精细化控制API路由 - 支持单个元素操作
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import json
from datetime import datetime

from backend.database import get_db
from backend.models import Project, Task, TaskStatus, TaskType
from backend.schemas.project import ProjectResponseSchema
from backend.tasks import regenerate_images, execute_step
from core.project_paths import ProjectPaths

router = APIRouter(prefix="/api/editor", tags=["editor"])


@router.post("/projects/{project_id}/segments/{segment_index}/regenerate-image")
async def regenerate_single_image(
    project_id: int,
    segment_index: int,
    custom_prompt: Optional[str] = None,
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

    # 创建任务
    task = Task(
        project_id=project_id,
        task_type=TaskType.STEP3_REGENERATE,
        status=TaskStatus.PENDING,
        parameters={
            "segment_indices": [segment_index],
            "custom_prompt": custom_prompt
        }
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # 提交Celery任务
    celery_task = regenerate_images.delay(project_id, [segment_index])
    task.celery_task_id = celery_task.id
    db.commit()

    return {"task_id": task.id, "message": f"正在重新生成第{segment_index}段的图片"}


@router.post("/projects/{project_id}/segments/{segment_index}/regenerate-audio")
async def regenerate_single_audio(
    project_id: int,
    segment_index: int,
    custom_params: Optional[dict] = None,
    db: Session = Depends(get_db)
):
    """
    重新生成指定段落的音频
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.script_data:
        raise HTTPException(status_code=400, detail="Script data not found")

    # 验证segment_index
    segments = project.script_data.get("segments", [])
    if segment_index < 1 or segment_index > len(segments):
        raise HTTPException(status_code=400, detail="Invalid segment index")

    # 创建任务 - 只重新生成指定段的音频
    task = Task(
        project_id=project_id,
        task_type=TaskType.STEP4,
        status=TaskStatus.PENDING,
        parameters={
            "segment_index": segment_index,
            "custom_params": custom_params,
            "regenerate_single": True
        }
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # TODO: 需要实现单段音频重新生成的Celery任务
    # celery_task = regenerate_single_audio_task.delay(project_id, segment_index, custom_params)

    return {"task_id": task.id, "message": f"正在重新生成第{segment_index}段的音频"}


@router.put("/projects/{project_id}/raw-data")
async def update_raw_data(
    project_id: int,
    data: dict,
    db: Session = Depends(get_db)
):
    """
    更新raw.json数据（带验证）
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 验证数据结构
    required_fields = ["title", "content"]
    for field in required_fields:
        if field not in data:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required field: {field}"
            )

    # 保存旧版本（版本控制）
    if project.raw_data:
        version_history = project.config.get("raw_data_history", [])
        version_history.append({
            "data": project.raw_data,
            "timestamp": datetime.now().isoformat(),
            "version": len(version_history) + 1
        })
        project.config["raw_data_history"] = version_history

    # 更新数据库
    project.raw_data = data

    # 更新文件
    project_paths = ProjectPaths(project.project_dir)
    raw_json_path = project_paths.get_raw_json_path()
    with open(raw_json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    db.commit()

    return {"status": "success", "message": "Raw data updated successfully"}


@router.put("/projects/{project_id}/script-data")
async def update_script_data(
    project_id: int,
    data: dict,
    db: Session = Depends(get_db)
):
    """
    更新script.json数据（带验证）
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 验证数据结构
    if "segments" not in data:
        raise HTTPException(status_code=400, detail="Missing 'segments' field")

    segments = data["segments"]
    if not isinstance(segments, list):
        raise HTTPException(status_code=400, detail="'segments' must be a list")

    # 验证每个segment
    for i, segment in enumerate(segments):
        required_fields = ["index", "content"]
        for field in required_fields:
            if field not in segment:
                raise HTTPException(
                    status_code=400,
                    detail=f"Segment {i}: missing required field '{field}'"
                )

    # 保存旧版本
    if project.script_data:
        version_history = project.config.get("script_data_history", [])
        version_history.append({
            "data": project.script_data,
            "timestamp": datetime.now().isoformat(),
            "version": len(version_history) + 1
        })
        project.config["script_data_history"] = version_history

    # 更新数据库
    project.script_data = data

    # 更新文件
    project_paths = ProjectPaths(project.project_dir)
    script_json_path = project_paths.get_script_json_path()
    with open(script_json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    db.commit()

    return {"status": "success", "message": "Script data updated successfully"}


@router.get("/projects/{project_id}/history/raw-data")
async def get_raw_data_history(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    获取raw.json的历史版本
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    history = project.config.get("raw_data_history", [])
    return {"history": history, "current": project.raw_data}


@router.get("/projects/{project_id}/history/script-data")
async def get_script_data_history(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    获取script.json的历史版本
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    history = project.config.get("script_data_history", [])
    return {"history": history, "current": project.script_data}


@router.post("/projects/{project_id}/history/raw-data/restore/{version}")
async def restore_raw_data_version(
    project_id: int,
    version: int,
    db: Session = Depends(get_db)
):
    """
    恢复raw.json的历史版本
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    history = project.config.get("raw_data_history", [])
    if version < 1 or version > len(history):
        raise HTTPException(status_code=400, detail="Invalid version number")

    # 恢复指定版本
    version_data = history[version - 1]["data"]

    # 保存当前版本到历史
    history.append({
        "data": project.raw_data,
        "timestamp": datetime.now().isoformat(),
        "version": len(history) + 1
    })
    project.config["raw_data_history"] = history

    # 恢复数据
    project.raw_data = version_data

    # 更新文件
    project_paths = ProjectPaths(project.project_dir)
    raw_json_path = project_paths.get_raw_json_path()
    with open(raw_json_path, 'w', encoding='utf-8') as f:
        json.dump(version_data, f, ensure_ascii=False, indent=2)

    db.commit()

    return {"status": "success", "message": f"Restored to version {version}"}


@router.post("/projects/{project_id}/segments/merge")
async def merge_segments(
    project_id: int,
    segment_indices: List[int],
    db: Session = Depends(get_db)
):
    """
    合并多个段落
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.script_data:
        raise HTTPException(status_code=400, detail="Script data not found")

    segments = project.script_data.get("segments", [])
    if len(segment_indices) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 segments to merge")

    # 验证索引
    for idx in segment_indices:
        if idx < 1 or idx > len(segments):
            raise HTTPException(status_code=400, detail=f"Invalid segment index: {idx}")

    # 排序索引
    segment_indices = sorted(segment_indices)

    # 合并内容
    merged_content = " ".join([segments[idx - 1]["content"] for idx in segment_indices])
    merged_segment = {
        "index": segment_indices[0],
        "content": merged_content,
        "character_count": len(merged_content)
    }

    # 删除被合并的段落，保留第一个
    new_segments = []
    for i, seg in enumerate(segments):
        if (i + 1) in segment_indices:
            if i + 1 == segment_indices[0]:
                new_segments.append(merged_segment)
        else:
            new_segments.append(seg)

    # 重新编号
    for i, seg in enumerate(new_segments):
        seg["index"] = i + 1

    # 更新数据
    project.script_data["segments"] = new_segments
    project.script_data["actual_segments"] = len(new_segments)

    # 保存到文件
    project_paths = ProjectPaths(project.project_dir)
    script_json_path = project_paths.get_script_json_path()
    with open(script_json_path, 'w', encoding='utf-8') as f:
        json.dump(project.script_data, f, ensure_ascii=False, indent=2)

    db.commit()

    return {
        "status": "success",
        "message": f"Merged segments {segment_indices}",
        "new_segment_count": len(new_segments)
    }


@router.post("/projects/{project_id}/segments/{segment_index}/split")
async def split_segment(
    project_id: int,
    segment_index: int,
    split_position: int,  # 字符位置
    db: Session = Depends(get_db)
):
    """
    拆分一个段落
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.script_data:
        raise HTTPException(status_code=400, detail="Script data not found")

    segments = project.script_data.get("segments", [])
    if segment_index < 1 or segment_index > len(segments):
        raise HTTPException(status_code=400, detail="Invalid segment index")

    segment = segments[segment_index - 1]
    content = segment["content"]

    if split_position < 1 or split_position >= len(content):
        raise HTTPException(status_code=400, detail="Invalid split position")

    # 拆分内容
    part1 = content[:split_position].strip()
    part2 = content[split_position:].strip()

    # 创建两个新段落
    segment1 = {
        "index": segment_index,
        "content": part1,
        "character_count": len(part1)
    }
    segment2 = {
        "index": segment_index + 1,
        "content": part2,
        "character_count": len(part2)
    }

    # 更新段落列表
    new_segments = segments[:segment_index - 1] + [segment1, segment2] + segments[segment_index:]

    # 重新编号
    for i, seg in enumerate(new_segments):
        seg["index"] = i + 1

    # 更新数据
    project.script_data["segments"] = new_segments
    project.script_data["actual_segments"] = len(new_segments)

    # 保存到文件
    project_paths = ProjectPaths(project.project_dir)
    script_json_path = project_paths.get_script_json_path()
    with open(script_json_path, 'w', encoding='utf-8') as f:
        json.dump(project.script_data, f, ensure_ascii=False, indent=2)

    db.commit()

    return {
        "status": "success",
        "message": f"Split segment {segment_index} into 2 segments",
        "new_segment_count": len(new_segments)
    }


@router.post("/projects/{project_id}/images/{filename}/upload")
async def upload_custom_image(
    project_id: int,
    filename: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    上传自定义图片替换生成的图片
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 验证文件类型
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    # 保存文件
    images_dir = os.path.join(project.project_dir, "images")
    os.makedirs(images_dir, exist_ok=True)

    file_path = os.path.join(images_dir, filename)

    # 备份原文件
    if os.path.exists(file_path):
        backup_path = file_path + f".backup.{int(datetime.now().timestamp())}"
        os.rename(file_path, backup_path)

    # 保存新文件
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    return {"status": "success", "message": f"Image {filename} uploaded successfully"}


@router.get("/projects/{project_id}/validate")
async def validate_project_data(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    验证项目数据完整性
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    issues = []
    warnings = []

    # 检查raw_data
    if project.step1_completed and not project.raw_data:
        issues.append("Step 1 completed but raw_data is missing")

    # 检查script_data
    if project.step1_5_completed and not project.script_data:
        issues.append("Step 1.5 completed but script_data is missing")

    # 检查图片数量
    if project.step3_completed:
        images_dir = os.path.join(project.project_dir, "images")
        if os.path.exists(images_dir):
            image_count = len([f for f in os.listdir(images_dir) if f.endswith('.png')])
            expected_count = len(project.script_data.get("segments", []))
            if project.config.get("opening_quote"):
                expected_count += 1

            if image_count < expected_count:
                warnings.append(f"Expected {expected_count} images, found {image_count}")

    # 检查音频数量
    if project.step4_completed:
        voice_dir = os.path.join(project.project_dir, "voice")
        if os.path.exists(voice_dir):
            audio_count = len([f for f in os.listdir(voice_dir) if f.endswith(('.mp3', '.wav'))])
            expected_count = len(project.script_data.get("segments", []))
            if project.config.get("opening_quote"):
                expected_count += 1

            if audio_count < expected_count:
                warnings.append(f"Expected {expected_count} audio files, found {audio_count}")

    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings
    }
