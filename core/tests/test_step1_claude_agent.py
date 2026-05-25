import json
from pathlib import Path

import anyio
from claude_agent_sdk import ResultMessage

from core.infra.ai import claude_agent
from core.pipeline import steps


def _valid_raw(target_segments: int = 70) -> dict:
    return {
        "source_name": "正义论",
        "video_titles": ["为什么正义不只是好心"],
        "cover_titles": ["正义之问"],
        "cover_subtitles": ["制度如何塑造命运"],
        "golden_quotes": ["真正的正义，要先问最弱的人站在哪里。"],
        "comment_hook_options": ["你觉得公平更像结果，还是更像规则？"],
        "share_hook_options": ["这条适合转给正在讨论公平的人。"],
        "content": "这是一段没有换行的完整口播终稿。",
        "total_length": 17,
        "target_segments": target_segments,
    }


def test_run_step_1_uses_claude_agent_skill_and_loads_raw_json(monkeypatch, tmp_path: Path):
    input_file = tmp_path / "book.md"
    input_file.write_text("source text", encoding="utf-8")

    captured = {}

    def fake_run_step1_agent(
        *,
        input_file,
        output_json,
        extract_path,
        coverage_ledger_path,
        session_log_path,
        text_dir,
        num_segments,
        skill_path,
        repo_root,
        extra_requirements="",
    ):
        captured.update(
            input_file=input_file,
            output_json=output_json,
            extract_path=extract_path,
            coverage_ledger_path=coverage_ledger_path,
            session_log_path=session_log_path,
            text_dir=text_dir,
            num_segments=num_segments,
            skill_path=skill_path,
            repo_root=repo_root,
            extra_requirements=extra_requirements,
        )
        Path(output_json).write_text(json.dumps(_valid_raw(num_segments), ensure_ascii=False), encoding="utf-8")

    monkeypatch.setattr(steps, "run_step1_agent", fake_run_step1_agent)
    monkeypatch.setattr(steps, "export_raw_to_docx", lambda *args, **kwargs: None)

    result = steps.run_step_1(str(input_file), str(tmp_path / "output"), num_segments=70)

    assert result["success"] is True
    raw_json_path = Path(result["raw"]["raw_json_path"])
    assert raw_json_path.name == "raw.json"
    assert raw_json_path.parent.name == "text"
    assert captured["input_file"] == str(input_file)
    assert captured["output_json"] == str(raw_json_path)
    assert Path(captured["extract_path"]).name == claude_agent.STEP1_EXTRACT_NAME
    assert Path(captured["coverage_ledger_path"]).name == claude_agent.STEP1_COVERAGE_LEDGER_NAME
    assert Path(captured["session_log_path"]).name == claude_agent.STEP1_SESSION_LOG_NAME
    assert captured["num_segments"] == 70
    assert captured["skill_path"].endswith("core/skills/video-book-direct-read")
    assert captured["repo_root"] == steps._get_project_root()
    assert captured["extra_requirements"] == ""
    assert result["raw"]["total_length"] == 17


def test_run_step_1_passes_extra_requirements_to_agent(monkeypatch, tmp_path: Path):
    input_file = tmp_path / "book.md"
    input_file.write_text("source text", encoding="utf-8")
    captured = {}

    def fake_run_step1_agent(**kwargs):
        captured.update(kwargs)
        Path(kwargs["output_json"]).write_text(json.dumps(_valid_raw(), ensure_ascii=False), encoding="utf-8")

    monkeypatch.setattr(steps, "run_step1_agent", fake_run_step1_agent)
    monkeypatch.setattr(steps, "export_raw_to_docx", lambda *args, **kwargs: None)

    result = steps.run_step_1(
        str(input_file),
        str(tmp_path / "output"),
        num_segments=70,
        extra_requirements="重点突出女性命运，不要写成王朝史摘要",
    )

    assert result["success"] is True
    assert captured["extra_requirements"] == "重点突出女性命运，不要写成王朝史摘要"


def test_step_1_rejects_agent_output_that_does_not_match_raw_contract(tmp_path: Path):
    invalid_path = tmp_path / "raw.json"
    invalid_path.write_text(json.dumps({"content": "缺少字段"}, ensure_ascii=False), encoding="utf-8")

    try:
        steps.load_step1_agent_raw(str(invalid_path), expected_segments=70)
    except ValueError as exc:
        assert "comment_hook_options" in str(exc)
    else:
        raise AssertionError("invalid Step 1 raw JSON should be rejected")


def test_step_1_normalizes_target_segments_in_raw_json(tmp_path: Path):
    raw_path = tmp_path / "raw.json"
    raw_data = _valid_raw(target_segments=1)
    raw_path.write_text(json.dumps(raw_data, ensure_ascii=False), encoding="utf-8")

    loaded = steps.load_step1_agent_raw(str(raw_path), expected_segments=70)
    persisted = json.loads(raw_path.read_text(encoding="utf-8"))

    assert loaded["target_segments"] == 70
    assert persisted["target_segments"] == 70


def test_build_step1_agent_env_uses_mimo_gateway(monkeypatch):
    monkeypatch.setattr(
        "core.infra.ai.claude_agent.config.MIMO_API_KEY",
        "test-mimo-key",
        raising=False,
    )
    env = claude_agent.build_step1_agent_env()
    assert env["ANTHROPIC_BASE_URL"] == "https://token-plan-sgp.xiaomimimo.com/anthropic"
    assert env["ANTHROPIC_API_KEY"] == "test-mimo-key"
    assert env["ANTHROPIC_MODEL"] == "mimo-v2.5"


def test_step1_agent_allows_200_turns(monkeypatch, tmp_path: Path):
    captured = {}
    output_json = tmp_path / "text" / "raw.json"

    async def fake_query(*, prompt, options):
        captured["max_turns"] = options.max_turns
        output_json.parent.mkdir(parents=True, exist_ok=True)
        output_json.write_text(json.dumps(_valid_raw(), ensure_ascii=False), encoding="utf-8")
        yield ResultMessage(
            subtype="success",
            duration_ms=0,
            duration_api_ms=0,
            is_error=False,
            num_turns=1,
            session_id="test-session",
        )

    monkeypatch.setattr(claude_agent, "query", fake_query)
    monkeypatch.setattr(claude_agent, "build_step1_agent_env", lambda: {})

    async def run_agent():
        await claude_agent._run_step1_agent_async(
            input_file=str(tmp_path / "book.pdf"),
            output_json=str(output_json),
            extract_path=str(tmp_path / "text" / claude_agent.STEP1_EXTRACT_NAME),
            coverage_ledger_path=str(tmp_path / "text" / claude_agent.STEP1_COVERAGE_LEDGER_NAME),
            session_log_path=str(tmp_path / "text" / claude_agent.STEP1_SESSION_LOG_NAME),
            text_dir=str(tmp_path / "text"),
            num_segments=70,
            skill_path=str(tmp_path / "core" / "skills" / "video-book-direct-read"),
            repo_root=str(tmp_path),
        )

    anyio.run(run_agent)

    assert captured["max_turns"] == 200


def test_step1_agent_adds_input_directory_to_options(monkeypatch, tmp_path: Path):
    captured = {}
    output_json = tmp_path / "text" / "raw.json"
    input_dir = tmp_path / "input" / "book_folder"
    input_dir.mkdir(parents=True)

    async def fake_query(*, prompt, options):
        captured["add_dirs"] = [str(path) for path in options.add_dirs]
        output_json.parent.mkdir(parents=True, exist_ok=True)
        output_json.write_text(json.dumps(_valid_raw(), ensure_ascii=False), encoding="utf-8")
        yield ResultMessage(
            subtype="success",
            duration_ms=0,
            duration_api_ms=0,
            is_error=False,
            num_turns=1,
            session_id="test-session",
        )

    monkeypatch.setattr(claude_agent, "query", fake_query)
    monkeypatch.setattr(claude_agent, "build_step1_agent_env", lambda: {})

    async def run_agent():
        await claude_agent._run_step1_agent_async(
            input_file=str(input_dir),
            output_json=str(output_json),
            extract_path=str(tmp_path / "text" / claude_agent.STEP1_EXTRACT_NAME),
            coverage_ledger_path=str(tmp_path / "text" / claude_agent.STEP1_COVERAGE_LEDGER_NAME),
            session_log_path=str(tmp_path / "text" / claude_agent.STEP1_SESSION_LOG_NAME),
            text_dir=str(tmp_path / "text"),
            num_segments=70,
            skill_path=str(tmp_path / "core" / "skills" / "video-book-direct-read"),
            repo_root=str(tmp_path),
        )

    anyio.run(run_agent)

    assert str(input_dir) in captured["add_dirs"]


def test_step1_agent_prompt_includes_absolute_skill_path(tmp_path: Path):
    from core.prompts import build_step1_agent_prompt

    skill_path = tmp_path / "core" / "skills" / "video-book-direct-read"
    skill_path.mkdir(parents=True)

    prompt = build_step1_agent_prompt(
        input_file=str(tmp_path / "book.pdf"),
        output_json=str(tmp_path / "output" / "text" / "raw.json"),
        text_dir=str(tmp_path / "output" / "text"),
        skill_path=str(skill_path),
    )

    assert str(skill_path) in prompt
    assert str(skill_path).startswith("/")
    assert "target_segments" not in prompt
    assert str(tmp_path / "output" / "text") in prompt
    assert "_coverage_ledger.json" not in prompt
    assert "_extract.txt" not in prompt
    assert "不要绕过" in prompt
    assert "使用已启用的原生 skill" not in prompt
    assert "json.loads" in prompt


def test_step1_agent_prompt_includes_extra_requirements(tmp_path: Path):
    from core.prompts import build_step1_agent_prompt

    prompt = build_step1_agent_prompt(
        input_file=str(tmp_path / "book.pdf"),
        output_json=str(tmp_path / "output" / "text" / "raw.json"),
        text_dir=str(tmp_path / "output" / "text"),
        skill_path=str(tmp_path / "core" / "skills" / "video-book-direct-read"),
        extra_requirements="重点突出女性命运，不要写成王朝史摘要",
    )

    assert "用户额外要求" in prompt
    assert "重点突出女性命运，不要写成王朝史摘要" in prompt


def test_agent_session_log_appends_jsonl_records(tmp_path: Path):
    log_path = tmp_path / "text" / claude_agent.STEP1_SESSION_LOG_NAME
    session_log = claude_agent.AgentSessionLog(log_path)
    session_log.append("session_start", {"step": "step_1"})
    session_log.append("message", {"message": {"kind": "UserMessage", "content": "hi"}})

    lines = log_path.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 2
    first = json.loads(lines[0])
    second = json.loads(lines[1])
    assert first["event"] == "session_start"
    assert first["seq"] == 1
    assert second["event"] == "message"
    assert second["seq"] == 2
    assert "ts" in first


def test_agent_session_log_omits_bash_extract_window_output(tmp_path: Path):
    log_path = tmp_path / "text" / claude_agent.STEP1_SESSION_LOG_NAME
    session_log = claude_agent.AgentSessionLog(log_path)
    large_stdout = "正文" * 10000
    session_log.append(
        "message",
        {
            "message": {
                "kind": "AssistantMessage",
                "content": [
                    {
                        "id": "call_read_window",
                        "name": "Bash",
                        "input": {
                            "command": 'EXTRACT="/tmp/output/text/_extract.txt"\nsed -n \'1,120p\' "$EXTRACT"',
                            "description": "Read window 1 (lines 1-120)",
                        },
                    }
                ],
            }
        },
    )
    session_log.append(
        "message",
        {
            "message": {
                "kind": "UserMessage",
                "content": [
                    {
                        "tool_use_id": "call_read_window",
                        "content": large_stdout,
                        "is_error": False,
                    }
                ],
                "tool_use_result": {
                    "tool_use_id": "call_read_window",
                    "stdout": large_stdout,
                    "stderr": "",
                    "is_error": False,
                },
            }
        },
    )

    first, second = [json.loads(line) for line in log_path.read_text(encoding="utf-8").splitlines()]
    assistant_item = first["message"]["content"][0]
    user_item = second["message"]["content"][0]
    assert assistant_item["input"]["command"].startswith("[omitted:")
    assert assistant_item["log_omitted"] == "bash_extract_window_read"
    assert user_item["content"].startswith("[omitted:")
    assert user_item["content_length"] == len("正文" * 10000)
    assert user_item["log_omitted"] == "bash_extract_window_output"
    tool_result = second["message"]["tool_use_result"]
    assert tool_result["stdout"].startswith("[omitted:")
    assert tool_result["stdout_length"] == len(large_stdout)
    assert tool_result["log_omitted"] == "bash_extract_window_output"


def test_agent_session_log_keeps_bash_extract_window_errors(tmp_path: Path):
    log_path = tmp_path / "text" / claude_agent.STEP1_SESSION_LOG_NAME
    session_log = claude_agent.AgentSessionLog(log_path)
    session_log.append(
        "message",
        {
            "message": {
                "kind": "AssistantMessage",
                "content": [
                    {
                        "id": "call_read_window",
                        "name": "Bash",
                        "input": {"command": "sed -n '1,120p' /tmp/output/text/_extract.txt"},
                    }
                ],
            }
        },
    )
    session_log.append(
        "message",
        {
            "message": {
                "kind": "UserMessage",
                "content": [
                    {
                        "tool_use_id": "call_read_window",
                        "content": "sed: file not found",
                        "is_error": True,
                    }
                ],
                "tool_use_result": {
                    "tool_use_id": "call_read_window",
                    "stdout": "",
                    "stderr": "sed: file not found",
                    "is_error": True,
                },
            }
        },
    )

    second = json.loads(log_path.read_text(encoding="utf-8").splitlines()[1])
    assert second["message"]["content"][0]["content"] == "sed: file not found"
    assert second["message"]["tool_use_result"]["stderr"] == "sed: file not found"
