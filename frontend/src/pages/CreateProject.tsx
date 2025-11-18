import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Upload,
  Button,
  message,
  Divider,
  Collapse,
  Space,
} from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';

import apiService from '@/services/api';
import ConfigPanel from '@/components/ConfigPanel';
import { DEFAULT_PROJECT_CONFIG } from '@/utils/config';
import type { ProjectConfig } from '@/types';

const { TextArea } = Input;

function CreateProject() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);

  const handleSubmit = async (values: any) => {
    if (fileList.length === 0) {
      message.warning('请上传输入文件');
      return;
    }

    setLoading(true);
    try {
      const file = fileList[0].originFileObj as File;
      const project = await apiService.createProject({
        name: values.name,
        description: values.description,
        config: config,
        file: file,
      });

      message.success('项目创建成功！');
      navigate(`/projects/${project.id}`);
    } catch (error) {
      message.error('创建项目失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="创建新项目">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="项目名称"
            name="name"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="例如：认知觉醒" />
          </Form.Item>

          <Form.Item label="项目描述" name="description">
            <TextArea
              rows={3}
              placeholder="可选，描述项目用途或备注信息"
            />
          </Form.Item>

          <Form.Item label="输入文件" required>
            <Upload
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              accept=".pdf,.epub,.mobi,.txt"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>
                选择文件 (支持 PDF, EPUB, MOBI, TXT)
              </Button>
            </Upload>
            <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
              请上传书籍文件，系统将自动提取内容并生成视频
            </div>
          </Form.Item>

          <Divider />

          <Collapse
            defaultActiveKey={['basic']}
            items={[
              {
                key: 'basic',
                label: '基础配置',
                children: (
                  <ConfigPanel
                    config={config}
                    onChange={setConfig}
                    sections={['basic']}
                  />
                ),
              },
              {
                key: 'advanced',
                label: '高级配置',
                children: (
                  <ConfigPanel
                    config={config}
                    onChange={setConfig}
                    sections={['advanced']}
                  />
                ),
              },
            ]}
          />

          <Divider />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                创建项目
              </Button>
              <Button onClick={() => navigate('/projects')} size="large">
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default CreateProject;
