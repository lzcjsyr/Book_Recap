"""Core package marker."""

from core.config import VideoGenerationConfig
from core.infra.project_paths import ProjectPaths
from core.pipeline import run_auto
from core.pipeline.steps import (
    run_step_1,
    run_step_1_5,
    run_step_2,
    run_step_3,
    run_step_4,
    run_step_5,
    run_step_6,
)

__all__ = [
    "ProjectPaths",
    "VideoGenerationConfig",
    "run_auto",
    "run_step_1",
    "run_step_1_5",
    "run_step_2",
    "run_step_3",
    "run_step_4",
    "run_step_5",
    "run_step_6",
]
