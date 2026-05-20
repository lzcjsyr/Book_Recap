def test_recovered_prompts_keep_summarizer_importable():
    import core.domain.summarizer as summarizer

    assert hasattr(summarizer, "intelligent_summarize")


def test_recovered_config_keeps_legacy_cli_params():
    from core.config import config, get_generation_params

    params = get_generation_params()

    assert params["target_length"] == 3500
    assert params["llm_server_step1"] == "siliconflow"
    assert params["llm_server_step2"] == "siliconflow"

    config.validate_parameters(
        params["target_length"],
        params["num_segments"],
        params["llm_server_step1"],
        params["image_server"],
        "bytedance",
        params["image_model"],
        params["image_size"],
        images_method=params["images_method"],
        llm_model=params["llm_model_step1"],
    )
