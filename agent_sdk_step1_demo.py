"""
Claude Agent SDK — 面向「内容生产全链路」的试配示例

典型链路（与你 README 对齐）：
  资料入 input → 文案/结构化稿 → Remotion / CLI 成片 → output 产物

本脚本配置重点：
  • `tools` + `allowed_tools` 收窄为链路常用能力（读写仓库、检索、必要时联网、跑 uv/CLI）。
  • `skills` 固定加载本仓库 `.codex/skills` 里定义的写作 + Remotion + 素材工厂技能。
  • 需在 Agent 运行时可索引这些 skill（必要时把 `.codex/skills` 软链或同步到 Claude Code 约定目录）。

安装：`uv pip install -r requirements-agent-sdk.txt`
运行：`uv run python agent_sdk_step1_demo.py`

鉴权：本机需可用的 Claude Code / ANTHROPIC_API_KEY 等（以官方文档为准）。
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import anyio

from claude_agent_sdk import (
    CLIConnectionError,
    CLINotFoundError,
    ClaudeAgentOptions,
    ResultMessage,
    query,
)

# 与仓库内各 SKILL.md 的 YAML `name` 一致（缺一可在列表里注释掉）。
PIPELINE_SKILLS: tuple[str, ...] = (
    "wechat-video-book-script",
    "content-factory",
    "remotion-best-practices",
)

# 全链路试配：读/写工程内文件、检索、执行本机命令（uv、python -m cli、ffmpeg 等）、
# 调用 Skill、偶尔联网核对事实。不需要子代理 / LSP / Notebook / Cron / 计划模式时可保持精简。
# 若你不上网，删掉 WebSearch、WebFetch；若完全不让改文件，删掉 Write、Edit。
CONTENT_PIPELINE_TOOLS: tuple[str, ...] = (
    "Read",
    "Glob",
    "Grep",
    "Write",
    "Edit",
    "Bash",
    "Skill",
    "AskUserQuestion",
    "WebSearch",
    "WebFetch",
    "TodoWrite",
    "TaskCreate",
    "TaskGet",
    "TaskList",
    "TaskUpdate",
    "TaskStop",
)


def _default_prompt(source_path: str, out_hint: str) -> str:
    return f"""你在本仓库 root 工作，任务是「视频内容生产全链路」的编排与产出（可与用户多轮澄清）。

已定参数：
  - 主要源文档路径（PDF/EPUB/DOCX 等）：{source_path}
  - 希望你把关键终稿写到这里或附近（JSON/文本路径提示）：{out_hint}

请你按顺序推进（量力而行，缺信息就用 AskUserQuestion）：
  1) 确认源文件可读；若超大 PDF，可用 Bash + 本仓库已有的 Python/uv 方式抽取文本摘要（不要捏造原文）。
  2) 载入并遵从技能 wechat-video-book-script：忠于资料写口播结构化产出（格式以该 skill 为准）。
  3) 若还需要多形态衍生稿，可参照 content-factory。
  4) 若涉及 Remotion 工程、合成注意点，参照 remotion-best-practices。
  5) 需要跑 CLI 管线时，使用 Bash（例如 `uv run python -m cli`），仅在用户已配置好 .env 的前提下执行。

最后给出：已创建/修改的文件路径列表 + 下一步人工该点的按钮或命令。"""


async def _run(prompt: str, repo_root: Path) -> None:
    options = ClaudeAgentOptions(
        cwd=str(repo_root),
        tools=list(CONTENT_PIPELINE_TOOLS),
        allowed_tools=list(CONTENT_PIPELINE_TOOLS),
        skills=list(PIPELINE_SKILLS),
        permission_mode="default",
        max_turns=60,
        setting_sources=["user", "project"],
    )

    async for message in query(prompt=prompt, options=options):
        if isinstance(message, ResultMessage):
            print(message.result)
            return

    print("未收到 ResultMessage：请检查 SDK/CLI 版本与鉴权配置。", file=sys.stderr)
    raise SystemExit(2)


def main() -> None:
    parser = argparse.ArgumentParser(description="Agent SDK 内容生产链路试配")
    parser.add_argument(
        "--source",
        default="input/示例.pdf",
        help="源文档路径（相对仓库根目录）",
    )
    parser.add_argument(
        "--out",
        default="output/agent_pipeline_result.json",
        help="期望产出路径提示（相对仓库根目录或可改）",
    )
    parser.add_argument(
        "--prompt-file",
        type=Path,
        default=None,
        help="可选：从此文件读取完整 user prompt（覆盖内置模板）",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent
    if args.prompt_file is not None:
        prompt = args.prompt_file.read_text(encoding="utf-8")
    else:
        prompt = _default_prompt(args.source, args.out)

    try:
        anyio.run(_run, prompt, repo_root)
    except CLINotFoundError:
        print(
            "未找到 Claude Code CLI。请先按 Anthropic 文档安装 Claude Code，"
            "并确认 `claude_agent_sdk` 版本与文档一致。",
            file=sys.stderr,
        )
        raise SystemExit(1) from None
    except CLIConnectionError as exc:
        print(f"无法连接 Agent 运行时：{exc}", file=sys.stderr)
        raise SystemExit(1) from None


if __name__ == "__main__":
    main()
