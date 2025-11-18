"""
Celery应用配置
"""
from celery import Celery
import os

# Redis配置
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# 创建Celery应用
celery_app = Celery(
    "book_recap_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["backend.tasks.video_generation"]
)

# Celery配置
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600 * 6,  # 6小时任务超时
    task_soft_time_limit=3600 * 5,  # 5小时软超时
    worker_prefetch_multiplier=1,  # 一次只预取一个任务
    worker_max_tasks_per_child=10,  # 每个worker最多执行10个任务后重启
)

# 路由配置
celery_app.conf.task_routes = {
    "backend.tasks.video_generation.*": {"queue": "video_generation"},
}
