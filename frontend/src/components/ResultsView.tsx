import { useState } from 'react';
import { Card, Tabs, Image, Empty, Button, Space, Typography, Divider } from 'antd';
import {
  DownloadOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { Project } from '@/types';
import apiService from '@/services/api';

const { Paragraph, Text } = Typography;

interface ResultsViewProps {
  project: Project;
}

function ResultsView({ project }: ResultsViewProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);

  // 加载图片列表
  const loadImages = async () => {
    try {
      const { images } = await apiService.getProjectImages(project.id);
      setImageUrls(images.map((img: any) => img.url));
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  };

  // 加载音频列表
  const loadAudio = async () => {
    try {
      const { audio } = await apiService.getProjectAudio(project.id);
      setAudioUrls(audio.map((a: any) => a.url));
    } catch (error) {
      console.error('Failed to load audio:', error);
    }
  };

  const tabItems = [
    {
      key: 'text',
      label: '文本数据',
      children: (
        <Card>
          {project.raw_data && (
            <div>
              <h3>原始数据 (raw.json)</h3>
              <Descriptions bordered size="small">
                <Descriptions.Item label="标题">
                  {project.raw_data.title}
                </Descriptions.Item>
                <Descriptions.Item label="内容标题">
                  {project.raw_data.content_title}
                </Descriptions.Item>
                <Descriptions.Item label="开场金句">
                  {project.raw_data.golden_quote}
                </Descriptions.Item>
                <Descriptions.Item label="总字数" span={2}>
                  {project.raw_data.total_length}
                </Descriptions.Item>
              </Descriptions>

              {project.raw_data.content && (
                <>
                  <Divider />
                  <h4>内容预览：</h4>
                  <Paragraph ellipsis={{ rows: 5, expandable: true }}>
                    {project.raw_data.content}
                  </Paragraph>
                </>
              )}
            </div>
          )}

          {project.script_data && (
            <div style={{ marginTop: 24 }}>
              <h3>脚本数据 (script.json)</h3>
              <Text>共 {project.script_data.segments?.length || 0} 段</Text>
              <Button
                type="link"
                icon={<FileTextOutlined />}
                onClick={() => {
                  // 下载script.json
                  const url = `/api/projects/${project.id}/files/script_json`;
                  window.open(url, '_blank');
                }}
              >
                查看完整脚本
              </Button>
            </div>
          )}

          {!project.raw_data && !project.script_data && (
            <Empty description="暂无文本数据" />
          )}
        </Card>
      ),
    },
    {
      key: 'images',
      label: `图片 (${imageUrls.length})`,
      children: (
        <Card>
          <Button onClick={loadImages} style={{ marginBottom: 16 }}>
            加载图片
          </Button>
          {imageUrls.length > 0 ? (
            <Image.PreviewGroup>
              <Space wrap>
                {imageUrls.map((url, index) => (
                  <Image
                    key={index}
                    width={200}
                    src={url}
                    alt={`Segment ${index + 1}`}
                  />
                ))}
              </Space>
            </Image.PreviewGroup>
          ) : (
            <Empty description="暂无图片" />
          )}
        </Card>
      ),
    },
    {
      key: 'audio',
      label: `音频 (${audioUrls.length})`,
      children: (
        <Card>
          <Button onClick={loadAudio} style={{ marginBottom: 16 }}>
            加载音频
          </Button>
          {audioUrls.length > 0 ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              {audioUrls.map((url, index) => (
                <div key={index}>
                  <Text>Segment {index + 1}:</Text>
                  <audio controls src={url} style={{ width: '100%' }} />
                </div>
              ))}
            </Space>
          ) : (
            <Empty description="暂无音频" />
          )}
        </Card>
      ),
    },
    {
      key: 'video',
      label: '最终视频',
      children: (
        <Card>
          {project.final_video_path ? (
            <div>
              <video
                controls
                style={{ width: '100%', maxWidth: 800 }}
                src={apiService.getVideoUrl(project.id)}
              />
              <div style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    window.open(apiService.getVideoUrl(project.id), '_blank');
                  }}
                >
                  下载视频
                </Button>
              </div>
            </div>
          ) : (
            <Empty description="视频尚未生成" />
          )}
        </Card>
      ),
    },
  ];

  return <Tabs items={tabItems} />;
}

// Descriptions组件导入
import { Descriptions } from 'antd';

export default ResultsView;
