from pathlib import Path

from core.domain.composer import VideoComposer


class _FakeClip:
    def __init__(self, duration: float):
        self.duration = duration
        self.freeze_at = None
        self.requested_duration = None

    def without_audio(self):
        return self

    def with_audio(self, _audio_clip):
        return self

    def to_ImageClip(self, t: float):
        freeze = _FakeClip(duration=0.0)
        freeze.freeze_at = t
        return freeze

    def with_duration(self, duration: float):
        self.requested_duration = duration
        self.duration = duration
        return self


def test_opening_video_aligns_to_opening_audio_duration(monkeypatch, tmp_path: Path):
    opening_video = tmp_path / "opening.mp4"
    opening_audio = tmp_path / "opening.mp3"
    opening_video.write_bytes(b"video")
    opening_audio.write_bytes(b"audio")

    composer = VideoComposer()
    captured = {}

    monkeypatch.setattr(
        "core.domain.composer.AudioFileClip",
        lambda _path: _FakeClip(duration=4.0),
    )
    monkeypatch.setattr(
        "core.domain.composer.VideoFileClip",
        lambda _path: _FakeClip(duration=1.5),
    )
    monkeypatch.setattr(composer, "_resize_video", lambda clip, _target_size: clip)

    def fake_fit_opening_video_duration(video_clip, target_duration, clip_label):
        captured["target_duration"] = target_duration
        captured["clip_label"] = clip_label
        return video_clip

    monkeypatch.setattr(composer, "_fit_opening_video_duration", fake_fit_opening_video_duration)

    clips = []
    opening_seconds = composer._create_opening_segment(
        opening_image_path=str(opening_video),
        opening_narration_audio_path=str(opening_audio),
        video_clips=clips,
        target_size=(1280, 720),
        opening_quote=True,
    )

    assert opening_seconds == 4.0
    assert captured["target_duration"] == 4.0
    assert captured["clip_label"] == "开场视频"
    assert len(clips) == 1


def test_fit_opening_video_duration_freezes_last_frame_when_audio_is_longer(monkeypatch):
    composer = VideoComposer()
    opening_video = _FakeClip(duration=1.5)
    captured = {}

    def fake_concatenate(clips, method):
        captured["clips"] = clips
        captured["method"] = method
        result = _FakeClip(duration=sum(clip.duration for clip in clips))
        return result

    monkeypatch.setattr("core.domain.composer.concatenate_videoclips", fake_concatenate)

    result = composer._fit_opening_video_duration(
        opening_video,
        target_duration=4.0,
        clip_label="开场视频",
    )

    assert result.duration == 4.0
    assert captured["method"] == "compose"
    assert len(captured["clips"]) == 2
    assert captured["clips"][0] is opening_video
    assert captured["clips"][1].freeze_at == 1.5
    assert captured["clips"][1].requested_duration == 2.5


def test_fit_opening_video_duration_compresses_when_audio_is_shorter(monkeypatch):
    composer = VideoComposer()
    opening_video = _FakeClip(duration=4.0)
    captured = {}

    def fake_align(video_clip, target_duration, long_video_mode, clip_label):
        captured["video_clip"] = video_clip
        captured["target_duration"] = target_duration
        captured["long_video_mode"] = long_video_mode
        captured["clip_label"] = clip_label
        return "compressed-clip"

    monkeypatch.setattr(composer, "_align_video_duration", fake_align)

    result = composer._fit_opening_video_duration(
        opening_video,
        target_duration=2.0,
        clip_label="开场视频",
    )

    assert result == "compressed-clip"
    assert captured["video_clip"] is opening_video
    assert captured["target_duration"] == 2.0
    assert captured["long_video_mode"] in {"crop", "compress"}
    assert captured["clip_label"] == "开场视频"
