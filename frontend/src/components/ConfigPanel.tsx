import { Form, InputNumber, Select, Switch, Input, Slider } from 'antd';
import type { ProjectConfig } from '@/types';
import {
  VIDEO_SIZE_OPTIONS,
  IMAGE_STYLE_OPTIONS,
  TRANSITION_OPTIONS,
} from '@/utils/config';

interface ConfigPanelProps {
  config: ProjectConfig;
  onChange: (config: ProjectConfig) => void;
  sections?: string[]; // 可选：只显示特定部分
}

function ConfigPanel({ config, onChange, sections = ['all'] }: ConfigPanelProps) {
  const updateConfig = (key: keyof ProjectConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const showSection = (section: string) =>
    sections.includes('all') || sections.includes(section);

  return (
    <div>
      {/* 基础配置 */}
      {showSection('basic') && (
        <>
          <h3>步骤1：智能总结</h3>
          <Form layout="vertical">
            <Form.Item label="目标字数 (500-5000)">
              <InputNumber
                min={500}
                max={5000}
                value={config.target_length}
                onChange={(v) => updateConfig('target_length', v || 2000)}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item label="分段数量 (5-50)">
              <InputNumber
                min={5}
                max={50}
                value={config.num_segments}
                onChange={(v) => updateConfig('num_segments', v || 15)}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>

          <h3>步骤2：要点提取</h3>
          <Form layout="vertical">
            <Form.Item label="图像生成方式">
              <Select
                value={config.images_method}
                onChange={(v) => updateConfig('images_method', v)}
                options={[
                  { label: '关键词模式', value: 'keywords' },
                  { label: '描述模式', value: 'description' },
                ]}
              />
            </Form.Item>
          </Form>

          <h3>步骤3：图像生成</h3>
          <Form layout="vertical">
            <Form.Item label="图像尺寸">
              <Input
                value={config.image_size}
                onChange={(e) => updateConfig('image_size', e.target.value)}
                placeholder="2560x1440"
              />
            </Form.Item>

            <Form.Item label="图像风格">
              <Select
                value={config.image_style_preset}
                onChange={(v) => updateConfig('image_style_preset', v)}
                options={IMAGE_STYLE_OPTIONS}
              />
            </Form.Item>
          </Form>

          <h3>步骤4：语音合成</h3>
          <Form layout="vertical">
            <Form.Item label="语速调整 (-50 到 100)">
              <Slider
                min={-50}
                max={100}
                value={config.tts_speech_rate}
                onChange={(v) => updateConfig('tts_speech_rate', v)}
                marks={{ '-50': '-50', 0: '0', 50: '50', 100: '100' }}
              />
            </Form.Item>

            <Form.Item label="情感">
              <Select
                value={config.tts_emotion}
                onChange={(v) => updateConfig('tts_emotion', v)}
                options={[
                  { label: '中性', value: 'neutral' },
                  { label: '开心', value: 'happy' },
                  { label: '悲伤', value: 'sad' },
                ]}
              />
            </Form.Item>
          </Form>

          <h3>步骤5：视频合成</h3>
          <Form layout="vertical">
            <Form.Item label="视频尺寸">
              <Select
                value={config.video_size}
                onChange={(v) => updateConfig('video_size', v)}
                options={VIDEO_SIZE_OPTIONS}
              />
            </Form.Item>

            <Form.Item label="启用字幕">
              <Switch
                checked={config.enable_subtitles}
                onChange={(v) => updateConfig('enable_subtitles', v)}
              />
            </Form.Item>

            <Form.Item label="启用开场金句">
              <Switch
                checked={config.opening_quote}
                onChange={(v) => updateConfig('opening_quote', v)}
              />
            </Form.Item>

            <Form.Item label="背景音乐文件名">
              <Input
                value={config.bgm_filename}
                onChange={(e) => updateConfig('bgm_filename', e.target.value)}
                placeholder="Light of the Seven.mp3"
              />
            </Form.Item>

            <Form.Item label="BGM音量 (0-1)">
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={config.bgm_default_volume}
                onChange={(v) => updateConfig('bgm_default_volume', v)}
                marks={{ 0: '0', 0.5: '0.5', 1: '1' }}
              />
            </Form.Item>
          </Form>
        </>
      )}

      {/* 高级配置 */}
      {showSection('advanced') && (
        <>
          <h3>高级视频设置</h3>
          <Form layout="vertical">
            <Form.Item label="启用过渡效果">
              <Switch
                checked={config.enable_transitions}
                onChange={(v) => updateConfig('enable_transitions', v)}
              />
            </Form.Item>

            {config.enable_transitions && (
              <>
                <Form.Item label="过渡效果类型">
                  <Select
                    value={config.transition_style}
                    onChange={(v) => updateConfig('transition_style', v)}
                    options={TRANSITION_OPTIONS}
                  />
                </Form.Item>

                <Form.Item label="过渡时长 (秒)">
                  <InputNumber
                    min={0}
                    max={5}
                    step={0.1}
                    value={config.transition_duration}
                    onChange={(v) => updateConfig('transition_duration', v || 0.8)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </>
            )}

            <Form.Item label="口播变速系数 (0.5-2.0)">
              <Slider
                min={0.5}
                max={2.0}
                step={0.05}
                value={config.narration_speed_factor}
                onChange={(v) => updateConfig('narration_speed_factor', v)}
                marks={{ 0.5: '0.5x', 1: '1.0x', 1.5: '1.5x', 2: '2.0x' }}
              />
            </Form.Item>
          </Form>

          <h3>步骤6：封面生成</h3>
          <Form layout="vertical">
            <Form.Item label="封面生成数量">
              <InputNumber
                min={0}
                max={5}
                value={config.cover_image_count}
                onChange={(v) => updateConfig('cover_image_count', v || 1)}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item label="封面尺寸">
              <Input
                value={config.cover_image_size}
                onChange={(e) => updateConfig('cover_image_size', e.target.value)}
                placeholder="2250x3000"
              />
            </Form.Item>
          </Form>
        </>
      )}
    </div>
  );
}

export default ConfigPanel;
