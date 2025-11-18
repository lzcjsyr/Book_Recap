"""
WebSocket API路由（实时进度推送）
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict, Set
import asyncio
import json
from datetime import datetime

from backend.database import get_db, SessionLocal
from backend.models import Project, Task

router = APIRouter()


class ConnectionManager:
    """WebSocket连接管理器"""

    def __init__(self):
        # 项目ID -> WebSocket连接集合
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: int):
        """接受新连接"""
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = set()
        self.active_connections[project_id].add(websocket)

    def disconnect(self, websocket: WebSocket, project_id: int):
        """断开连接"""
        if project_id in self.active_connections:
            self.active_connections[project_id].discard(websocket)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """发送个人消息"""
        await websocket.send_text(message)

    async def broadcast_to_project(self, message: str, project_id: int):
        """向项目的所有连接广播消息"""
        if project_id in self.active_connections:
            for connection in self.active_connections[project_id]:
                try:
                    await connection.send_text(message)
                except:
                    pass

    async def send_project_update(self, project_id: int):
        """发送项目更新"""
        db = SessionLocal()
        try:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                message = json.dumps({
                    "type": "project_update",
                    "data": project.to_dict()
                })
                await self.broadcast_to_project(message, project_id)
        finally:
            db.close()

    async def send_task_update(self, task_id: int):
        """发送任务更新"""
        db = SessionLocal()
        try:
            task = db.query(Task).filter(Task.id == task_id).first()
            if task:
                message = json.dumps({
                    "type": "task_update",
                    "data": task.to_dict()
                })
                await self.broadcast_to_project(message, task.project_id)
        finally:
            db.close()


manager = ConnectionManager()


@router.websocket("/ws/projects/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: int):
    """
    WebSocket端点：项目实时更新
    """
    await manager.connect(websocket, project_id)
    try:
        while True:
            # 接收客户端消息（保持连接）
            data = await websocket.receive_text()

            # 可以处理客户端发来的命令
            try:
                message = json.loads(data)
                if message.get("type") == "ping":
                    await manager.send_personal_message(
                        json.dumps({"type": "pong", "timestamp": datetime.now().isoformat()}),
                        websocket
                    )
                elif message.get("type") == "get_status":
                    # 发送当前项目状态
                    await manager.send_project_update(project_id)
            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)


async def notify_project_update(project_id: int):
    """通知项目更新（供外部调用）"""
    await manager.send_project_update(project_id)


async def notify_task_update(task_id: int):
    """通知任务更新（供外部调用）"""
    await manager.send_task_update(task_id)
