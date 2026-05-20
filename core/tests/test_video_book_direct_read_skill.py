from pathlib import Path


SKILL_DIR = Path(__file__).resolve().parents[1] / "skills" / "video-book-direct-read"


def test_writing_standard_carries_short_video_book_script_requirements():
    standard = (SKILL_DIR / "references" / "writing-standard.md").read_text(encoding="utf-8")

    assert "抖音" in standard
    assert "微信视频号" in standard
    assert "第一遍速读" in standard
    assert "中国观众" in standard
    assert "收益承诺" in standard
    assert "约每 250 字" in standard


def test_writing_standard_keeps_single_clean_raw_json_schema():
    standard = (SKILL_DIR / "references" / "writing-standard.md").read_text(encoding="utf-8")

    for field in [
        "source_name",
        "video_titles",
        "cover_titles",
        "cover_subtitles",
        "golden_quotes",
        "comment_hook_options",
        "share_hook_options",
        "content",
        "total_length",
        "target_segments",
    ]:
        assert standard.count(f'"{field}"') == 1

    assert "不要使用 Markdown" in standard
    assert "JSON 没有尾随逗号" in standard


def test_skill_no_longer_references_separate_output_contract():
    assert not (SKILL_DIR / "references" / "output-contract.md").exists()

    for path in [
        SKILL_DIR / "SKILL.md",
        SKILL_DIR / "references" / "writing-standard.md",
        SKILL_DIR / "references" / "revision-workflow.md",
    ]:
        assert "output-contract.md" not in path.read_text(encoding="utf-8")
