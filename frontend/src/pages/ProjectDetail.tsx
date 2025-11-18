import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Steps,
  Button,
  Progress,
  Space,
  message,
  Tabs,
  Alert,
  Modal,
  Spin,
} from 'antd';
import {
  PlayCircleOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import apiService from '@/services/api';
import wsService from '@/services/websocket';
import type { Project, WebSocketMessage } from '@/types';
import { STEP_NAMES } from '@/utils/config';
import StepControl from '@/components/StepControl';
import ResultsView from '@/components/ResultsView';
import TaskList from '@/components/TaskList';

function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = parseInt(id || '0');

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  // 加载项目详情
  const loadProject = useCallback(async () => {
    if (!projectId) return;

    try {
      const data = await apiService.getProject(projectId);
      setProject(data);
    } catch (error) {
      message.error('加载项目失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // WebSocket消息处理
  const handleWebSocketMessage = useCallback((msg: WebSocketMessage) => {
    if (msg.type === 'project_update' && msg.data) {
      setProject(msg.data);
    } else if (msg.type === 'task_update') {
      // 任务更新时重新加载项目
      loadProject();
    }
  }, [loadProject]);

  useEffect(() => {
    loadProject();

    // 连接WebSocket
    if (projectId) {
      wsService.connect(projectId);
      wsService.addListener(projectId, handleWebSocketMessage);

      return () => {
        wsService.removeListener(projectId, handleWebSocketMessage);
        wsService.disconnect(projectId);
      };
    }
  }, [projectId, loadProject, handleWebSocketMessage]);

  // 启动全自动模式
  const handleFullAuto = async () => {
    Modal.confirm({
      title: '启动全自动模式',
      content: '将自动执行所有步骤（1-6），此过程可能需要较长时间，确定继续？',
      onOk: async () => {
        setExecuting(true);
        try {
          await apiService.startFullAuto(projectId);
          message.success('全自动模式已启动！');
        } catch (error) {
          message.error('启动失败');
          console.error(error);
        } finally {
          setExecuting(false);
        }
      },
    });
  };

  // 执行单个步骤
  const handleExecuteStep = async (step: number) => {
    setExecuting(true);
    try {
      await apiService.executeStep(projectId, {
        step,
        force_regenerate: false,
      });
      message.success(`步骤${step}已启动！`);
    } catch (error) {
      message.error(`执行步骤${step}失败`);
      console.error(error);
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return (
      <Card>
        <Alert message="项目不存在" type="error" />
      </Card>
    );
  }

  // 计算当前步骤
  const currentStep = (() => {
    if (project.step5_completed) return 6;
    if (project.step4_completed) return 5;
    if (project.step3_completed) return 4;
    if (project.step2_completed) return 3;
    if (project.step1_5_completed) return 2;
    if (project.step1_completed) return 1;
    return 0;
  })();

  // 步骤配置
  const steps = [
    {
      title: STEP_NAMES[1],
      status: project.step1_completed ? 'finish' : 'wait',
      icon: project.step1_completed ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
    },
    {
      title: STEP_NAMES[1.5],
      status: project.step1_5_completed ? 'finish' : 'wait',
      icon: project.step1_5_completed ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
    },
    {
      title: STEP_NAMES[2],
      status: project.step2_completed ? 'finish' : 'wait',
      icon: project.step2_completed ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
    },
    {
      title: STEP_NAMES[3],
      status: project.step3_completed ? 'finish' : 'wait',
      icon: project.step3_completed ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
    },
    {
      title: STEP_NAMES[4],
      status: project.step4_completed ? 'finish' : 'wait',
      icon: project.step4_completed ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
    },
    {
      title: STEP_NAMES[5],
      status: project.step5_completed ? 'finish' : 'wait',
      icon: project.step5_completed ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>
          返回列表
        </Button>
        <Button icon={<ReloadOutlined />} onClick={loadProject}>
          刷新
        </Button>
        {!project.step5_completed && (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleFullAuto}
            loading={executing}
          >
            全自动模式
          </Button>
        )}
      </Space>

      {/* 项目基本信息 */}
      <Card title="项目信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="项目名称">{project.name}</Descriptions.Item>
          <Descriptions.Item label="状态">{project.status}</Descriptions.Item>
          <Descriptions.Item label="输入文件">
            {project.input_filename || '无'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(project.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          {project.description && (
            <Descriptions.Item label="描述" span={2}>
              {project.description}
            </Descriptions.Item>
          )}
          {project.error_message && (
            <Descriptions.Item label="错误信息" span={2}>
              <Alert message={project.error_message} type="error" />
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 进度显示 */}
      <Card title="执行进度" style={{ marginBottom: 16 }}>
        <Steps current={currentStep} items={steps} />
        {project.status === 'processing' && project.current_step > 0 && (
          <div style={{ marginTop: 24 }}>
            <Progress
              percent={project.current_step_progress}
              status="active"
              format={(percent) => `${STEP_NAMES[project.current_step]}: ${percent}%`}
            />
          </div>
        )}
      </Card>

      {/* 步骤控制和结果展示 */}
      <Tabs
        defaultActiveKey="control"
        items={[
          {
            key: 'control',
            label: '步骤控制',
            children: (
              <StepControl
                project={project}
                onExecuteStep={handleExecuteStep}
                executing={executing}
              />
            ),
          },
          {
            key: 'results',
            label: '结果查看',
            children: <ResultsView project={project} />,
          },
          {
            key: 'tasks',
            label: '任务历史',
            children: <TaskList projectId={projectId} />,
          },
        ]}
      />
    </div>
  );
}

export default ProjectDetail;
