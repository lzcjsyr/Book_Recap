from core.config import config, get_generation_params
from core.generation_config import VideoGenerationConfig


def test_generation_params_drop_legacy_opening_image_style():
    params = get_generation_params()

    assert "opening_image_style" not in params
    assert "image_style_preset" in params


def test_generation_config_ignores_legacy_opening_image_style_override():
    config = VideoGenerationConfig.from_dict(
        {
            "input_file": "input.docx",
            "output_dir": "output",
            "opening_image_style": "des01",
        }
    )

    assert not hasattr(config, "opening_image_style")


def test_config_exposes_only_active_remotion_opening_params():
    assert hasattr(config, "OPENING_REMOTION_IP_NAME")
    assert hasattr(config, "OPENING_REMOTION_DURATION_SECONDS")
    assert hasattr(config, "OPENING_REMOTION_FPS")
    assert hasattr(config, "OPENING_REMOTION_FIRST_LINE_SECONDS")
    assert hasattr(config, "OPENING_REMOTION_LAST_LINE_SECONDS")
    assert hasattr(config, "OPENING_REMOTION_MAX_LINES")
    assert hasattr(config, "OPENING_REMOTION_MAX_CHARS_PER_LINE")

    assert not hasattr(config, "OPENING_IP_NAME")
    assert not hasattr(config, "OPENING_QUOTE_SHOW_TEXT")
    assert not hasattr(config, "OPENING_QUOTE_FONT_SIZE")
    assert not hasattr(config, "OPENING_QUOTE_TITLE_FONT_SIZE")
