import { useState, useEffect } from 'react';
import {
  Card,
  Image,
  Space,
  Button,
  Upload,
  Modal,
  Input,
  message,
  Row,
  Col,
} from 'antd';
import {
  ReloadOutlined,
  UploadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import apiService from '@/services/api';
import editorApiService from '@/services/editor-api';

interface ImageManagerProps {
  projectId: number;
  segmentCount: number;
  hasOpeningQuote?: boolean;
}

interface ImageItem {
  filename: string;
  url: string;
  segmentIndex?: number;
}

function ImageManager({
  projectId,
  segmentCount,
  hasOpeningQuote = false,
}: ImageManagerProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [regenerateModal, setRegenerateModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [uploading, setUploading] = useState(false);

  // 加载图片列表
  const loadImages = async () => {
    setLoading(true);
    try {
      const { images: imageList } = await apiService.getProjectImages(projectId);
      setImages(imageList);
    } catch (error: any) {
      message.error('加载图片失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [projectId]);

  // 打开重新生成对话框
  const handleOpenRegenerate = (segmentIndex: number) => {
    setSelectedSegment(segmentIndex);
    setCustomPrompt('');
    setRegenerateModal(true);
  };

  // 重新生成图片
  const handleRegenerate = async () => {
    if (selectedSegment === null) return;

    try {
      await editorApiService.regenerateSegmentImage(
        projectId,
        selectedSegment,
        customPrompt || undefined
      );
      message.success(`正在重新生成第${selectedSegment}段的图片，请稍候...`);
      setRegenerateModal(false);
      setSelectedSegment(null);
      setCustomPrompt('');

      // 轮询检查是否完成（简化版，实际应该用WebSocket）
      setTimeout(loadImages, 10000);
    } catch (error: any) {
      message.error('重新生成失败：' + error.message);
    }
  };

  // 上传自定义图片
  const handleUpload = async (file: File, filename: string) => {
    setUploading(true);
    try {
      await editorApiService.uploadCustomImage(projectId, filename, file);
      message.success('图片上传成功！');
      loadImages();
    } catch (error: any) {
      message.error('上传失败：' + error.message);
    } finally {
      setUploading(false);
    }
    return false; // 阻止自动上传
  };

  return (
    <div>
      <Card
        title="图片管理"
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadImages} loading={loading}>
            刷新
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          {/* 开场图片 */}
          {hasOpeningQuote && images.some((img) => img.filename === 'opening.png') && (
            <Col xs={12} sm={8} md={6} lg={4}>
              <Card
                size="small"
                title="开场图片"
                cover={
                  <Image
                    src={apiService.getImageUrl(projectId, 'opening.png')}
                    alt="Opening"
                    style={{ width: '100%', height: 200, objectFit: 'cover' }}
                  />
                }
                actions={[
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => handleOpenRegenerate(0)}
                  >
                    重新生成
                  </Button>,
                  <Upload
                    showUploadList={false}
                    beforeUpload={(file) => handleUpload(file, 'opening.png')}
                    accept="image/*"
                  >
                    <Button size="small" icon={<UploadOutlined />}>
                      上传替换
                    </Button>
                  </Upload>,
                ]}
              >
              </Card>
            </Col>
          )}

          {/* 段落图片 */}
          {Array.from({ length: segmentCount }, (_, i) => i + 1).map((segmentIndex) => {
            const filename = `segment_${segmentIndex}.png`;
            const imageUrl = apiService.getImageUrl(projectId, filename);

            return (
              <Col xs={12} sm={8} md={6} lg={4} key={segmentIndex}>
                <Card
                  size="small"
                  title={`段落 ${segmentIndex}`}
                  cover={
                    <Image
                      src={imageUrl}
                      alt={`Segment ${segmentIndex}`}
                      style={{ width: '100%', height: 200, objectFit: 'cover' }}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    />
                  }
                  actions={[
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={() => handleOpenRegenerate(segmentIndex)}
                    >
                      重新生成
                    </Button>,
                    <Upload
                      showUploadList={false}
                      beforeUpload={(file) => handleUpload(file, filename)}
                      accept="image/*"
                    >
                      <Button size="small" icon={<UploadOutlined />} loading={uploading}>
                        上传替换
                      </Button>
                    </Upload>,
                  ]}
                >
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* 重新生成对话框 */}
      <Modal
        title={`重新生成图片 - 段落 ${selectedSegment}`}
        open={regenerateModal}
        onOk={handleRegenerate}
        onCancel={() => setRegenerateModal(false)}
        okText="确认重新生成"
        cancelText="取消"
      >
        <div>
          <p>选择性提供自定义提示词，留空则使用原有关键词：</p>
          <Input.TextArea
            rows={4}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="例如：温馨的家庭场景，暖色调，阳光明媚"
            maxLength={500}
            showCount
          />
          <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
            重新生成将使用AI根据关键词或自定义提示词生成新图片
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ImageManager;
