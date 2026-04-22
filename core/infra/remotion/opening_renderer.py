import json
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional

from core.config import config
from core.domain.composer import VideoComposer
from core.domain.metadata import get_primary_golden_quote, parse_marked_focus_text
from core.shared import logger


_QUOTE_BREAK_PUNCTUATION = {"。", "！", "？", "!", "?", "；", ";", "，", ",", "：", ":"}


def _parse_size(size: str) -> tuple[int, int]:
    raw = (size or "1280x720").lower().replace(" ", "")
    width, height = raw.split("x", 1)
    return int(width), int(height)


def _remotion_app_dir() -> Path:
    return Path(__file__).resolve().parent / "app"


def _ensure_remotion_app_dependencies(app_dir: Path) -> None:
    if (app_dir / "node_modules" / "@remotion" / "renderer").exists():
        return

    logger.info("Opening Remotion dependencies missing, running npm install")
    subprocess.run(
        ["npm", "install", "--no-fund", "--no-audit"],
        cwd=app_dir,
        check=True,
        stdin=subprocess.DEVNULL,
    )


def _split_quote_fragments(quote: str) -> List[str]:
    fragments: List[str] = []
    normalized = (quote or "").replace("\r\n", "\n").replace("\r", "\n")

    for raw_line in normalized.split("\n"):
        line = raw_line.strip()
        if not line:
            continue

        current = ""
        for char in line:
            current += char
            if char in _QUOTE_BREAK_PUNCTUATION:
                cleaned = current.strip()
                if cleaned:
                    fragments.append(cleaned)
                current = ""

        cleaned = current.strip()
        if cleaned:
            fragments.append(cleaned)

    return fragments


def _split_quote_lines(quote: str) -> List[str]:
    max_chars = int(getattr(config, "OPENING_REMOTION_MAX_CHARS_PER_LINE", 20))
    max_lines = int(getattr(config, "OPENING_REMOTION_MAX_LINES", 6))
    composer = VideoComposer()
    lines: List[str] = []

    for fragment in _split_quote_fragments(quote):
        if len(fragment) <= max_chars:
            lines.append(fragment)
            continue

        lines.extend(composer.split_text_for_subtitle(fragment, max_chars, max_lines or 999))

    if max_lines > 0 and len(lines) > max_lines:
        return lines[: max_lines - 1] + ["".join(lines[max_lines - 1 :])]
    return lines


def _pick_focus_words(lines: List[str]) -> List[str]:
    for candidate in ("系统", "规则", "机制", "权力", "金钱", "认知"):
        if any(candidate in line for line in lines):
            return [candidate]
    return []


def _build_line_appear_times(
    line_count: int,
    first_line_seconds: float,
    last_line_seconds: float,
) -> List[float]:
    if line_count <= 0:
        return []
    if line_count == 1:
        return [round(first_line_seconds, 3)]

    step = (last_line_seconds - first_line_seconds) / (line_count - 1)
    return [round(first_line_seconds + step * index, 3) for index in range(line_count)]


def _resolve_timeline_config() -> tuple[float, int, int]:
    duration_seconds = float(getattr(config, "OPENING_REMOTION_DURATION_SECONDS", 4.0) or 4.0)
    fps = int(getattr(config, "OPENING_REMOTION_FPS", 30) or 30)

    duration_seconds = max(0.1, duration_seconds)
    fps = max(1, fps)
    duration_in_frames = max(1, round(duration_seconds * fps))
    return duration_seconds, fps, duration_in_frames


def _resolve_line_timing(duration_seconds: float, fps: int) -> tuple[float, float]:
    first_line_seconds = float(getattr(config, "OPENING_REMOTION_FIRST_LINE_SECONDS", 0.5) or 0.5)
    last_line_seconds = float(getattr(config, "OPENING_REMOTION_LAST_LINE_SECONDS", 2.0) or 2.0)

    max_visible_time = max(0.0, duration_seconds - (1.0 / fps))
    first_line_seconds = min(max(0.0, first_line_seconds), max_visible_time)
    last_line_seconds = min(max(first_line_seconds, last_line_seconds), max_visible_time)
    return first_line_seconds, last_line_seconds


def render_opening_video(
    *,
    image_size: str,
    output_dir: str,
    script_data: Optional[Dict[str, Any]],
    opening_quote: bool = True,
) -> Optional[str]:
    if not opening_quote:
        return None

    quote = get_primary_golden_quote(script_data or {}, "").strip()
    if not quote:
        return None

    clean_quote, marked_focus_words = parse_marked_focus_text(quote)
    if not clean_quote:
        return None

    width, height = _parse_size(image_size)
    quote_lines = _split_quote_lines(clean_quote)
    app_dir = _remotion_app_dir()
    output_path = Path(output_dir).resolve() / "opening.mp4"
    duration_seconds, fps, duration_in_frames = _resolve_timeline_config()
    first_line_seconds, last_line_seconds = _resolve_line_timing(duration_seconds, fps)
    raw_source_name = (script_data or {}).get("source_name")
    book_title = raw_source_name.strip() if isinstance(raw_source_name, str) else ""
    if not book_title:
        book_title = "未命名作品"
    book_title = f"——{book_title}——"
    props = {
        "bookTitle": book_title,
        "durationInFrames": duration_in_frames,
        "focusWords": marked_focus_words or _pick_focus_words(quote_lines),
        "fps": fps,
        "height": height,
        "ipName": str(getattr(config, "OPENING_REMOTION_IP_NAME", "Cody叩底")).strip() or "Cody叩底",
        "lineAppearTimes": _build_line_appear_times(
            len(quote_lines),
            first_line_seconds=first_line_seconds,
            last_line_seconds=last_line_seconds,
        ),
        "quoteLines": quote_lines,
        "width": width,
    }

    _ensure_remotion_app_dependencies(app_dir)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    command = [
        "node",
        "render-opening.mjs",
        json.dumps(props, ensure_ascii=False),
        str(output_path),
    ]

    try:
        subprocess.run(
            command,
            cwd=app_dir,
            check=True,
            stdin=subprocess.DEVNULL,
        )
        logger.info("Opening Remotion video rendered: %s", output_path)
        return str(output_path)
    except subprocess.CalledProcessError as exc:
        logger.warning("Opening Remotion render failed: %s", exc)
        return None
