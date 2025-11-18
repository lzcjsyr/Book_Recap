"""
项目管理API路由
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime
import json

from backend.database import get_db
from backend.models import Project, ProjectStatus
from backend.schemas import (
    ProjectCreateSchema,
    ProjectUpdateSchema,
    ProjectResponseSchema,
    ProjectListResponseSchema,
)
from core.project_paths import ProjectPaths

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("/", response_model=ProjectResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_project(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    config: str = Form("{}"),  # JSON字符串
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    创建新项目
    """
    # 解析配置
    try:
        config_dict = json.loads(config)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid config JSON")

    # 生成项目目录名称
    timestamp = datetime.now().strftime("%m%d_%H%M")
    project_name = f"{name}_{timestamp}"
    output_dir = os.path.abspath("output")
    project_dir = os.path.join(output_dir, project_name)

    # 创建项目目录结构
    os.makedirs(project_dir, exist_ok=True)
    os.makedirs(os.path.join(project_dir, "text"), exist_ok=True)
    os.makedirs(os.path.join(project_dir, "images"), exist_ok=True)
    os.makedirs(os.path.join(project_dir, "voice"), exist_ok=True)

    # 处理上传的文件
    input_filename = None
    input_file_path = None
    if file:
        input_dir = os.path.abspath("input")
        os.makedirs(input_dir, exist_ok=True)
        input_filename = file.filename
        input_file_path = os.path.join(input_dir, input_filename)

        # 保存文件
        with open(input_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    # 创建项目记录
    project = Project(
        name=name,
        description=description,
        status=ProjectStatus.CREATED,
        input_filename=input_filename,
        input_file_path=input_file_path,
        project_dir=project_dir,
        config=config_dict,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project.to_dict()


@router.get("/", response_model=ProjectListResponseSchema)
async def list_projects(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    获取项目列表
    """
    query = db.query(Project)

    # 状态过滤
    if status_filter:
        try:
            status_enum = ProjectStatus(status_filter)
            query = query.filter(Project.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status filter")

    # 排序：最新创建的在前
    query = query.order_by(Project.created_at.desc())

    # 分页
    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": [item.to_dict() for item in items]
    }


@router.get("/{project_id}", response_model=ProjectResponseSchema)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    """
    获取项目详情
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project.to_dict()


@router.put("/{project_id}", response_model=ProjectResponseSchema)
async def update_project(
    project_id: int,
    update_data: ProjectUpdateSchema,
    db: Session = Depends(get_db)
):
    """
    更新项目信息
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 更新字段
    if update_data.name is not None:
        project.name = update_data.name
    if update_data.description is not None:
        project.description = update_data.description
    if update_data.config is not None:
        project.config = update_data.config.dict()

    db.commit()
    db.refresh(project)

    return project.to_dict()


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: int, db: Session = Depends(get_db)):
    """
    删除项目
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 删除项目目录（可选，谨慎操作）
    # if os.path.exists(project.project_dir):
    #     shutil.rmtree(project.project_dir)

    # 删除输入文件（可选）
    # if project.input_file_path and os.path.exists(project.input_file_path):
    #     os.remove(project.input_file_path)

    db.delete(project)
    db.commit()

    return None


@router.get("/{project_id}/files/{file_type}")
async def get_project_file(
    project_id: int,
    file_type: str,
    db: Session = Depends(get_db)
):
    """
    获取项目文件内容
    file_type: raw_json, raw_docx, script_json, script_docx, keywords, srt, etc.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project_paths = ProjectPaths(project.project_dir)

    # 根据类型返回文件
    file_map = {
        "raw_json": project_paths.get_raw_json_path(),
        "raw_docx": project_paths.get_raw_docx_path(),
        "script_json": project_paths.get_script_json_path(),
        "script_docx": project_paths.get_script_docx_path(),
        "keywords": project_paths.get_keywords_json_path(),
        "mini_summary": project_paths.get_mini_summary_json_path(),
        "srt": project_paths.get_srt_path(),
    }

    file_path = file_map.get(file_type)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # 读取文件内容
    if file_path.endswith(".json") or file_path.endswith(".srt"):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return {"content": content, "file_type": file_type}
    else:
        # 对于docx文件，返回文件路径供下载
        return {"file_path": file_path, "file_type": file_type}


@router.put("/{project_id}/files/{file_type}")
async def update_project_file(
    project_id: int,
    file_type: str,
    content: dict,  # {"content": "..."}
    db: Session = Depends(get_db)
):
    """
    更新项目文件内容
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project_paths = ProjectPaths(project.project_dir)

    file_map = {
        "raw_json": project_paths.get_raw_json_path(),
        "script_json": project_paths.get_script_json_path(),
    }

    file_path = file_map.get(file_type)
    if not file_path:
        raise HTTPException(status_code=400, detail="File type not supported for editing")

    # 写入文件
    file_content = content.get("content", "")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(file_content)

    # 更新数据库中的数据
    if file_type == "raw_json":
        try:
            project.raw_data = json.loads(file_content)
        except json.JSONDecodeError:
            pass
    elif file_type == "script_json":
        try:
            project.script_data = json.loads(file_content)
        except json.JSONDecodeError:
            pass

    db.commit()

    return {"status": "success", "message": "File updated successfully"}


@router.get("/{project_id}/images")
async def list_project_images(project_id: int, db: Session = Depends(get_db)):
    """
    获取项目图片列表
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    images_dir = os.path.join(project.project_dir, "images")
    if not os.path.exists(images_dir):
        return {"images": []}

    images = []
    for file in sorted(os.listdir(images_dir)):
        if file.endswith(('.png', '.jpg', '.jpeg')):
            images.append({
                "filename": file,
                "path": os.path.join(images_dir, file),
                "url": f"/api/projects/{project_id}/images/{file}"
            })

    return {"images": images}


@router.get("/{project_id}/audio")
async def list_project_audio(project_id: int, db: Session = Depends(get_db)):
    """
    获取项目音频列表
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    voice_dir = os.path.join(project.project_dir, "voice")
    if not os.path.exists(voice_dir):
        return {"audio": []}

    audio_files = []
    for file in sorted(os.listdir(voice_dir)):
        if file.endswith(('.mp3', '.wav')):
            audio_files.append({
                "filename": file,
                "path": os.path.join(voice_dir, file),
                "url": f"/api/projects/{project_id}/audio/{file}"
            })

    return {"audio": audio_files}
