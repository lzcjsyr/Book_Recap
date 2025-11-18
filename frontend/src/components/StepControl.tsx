import { Card, Button, Space, Descriptions, Tag } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { Project } from '@/types';
import { STEP_NAMES } from '@/utils/config';

interface StepControlProps {
  project: Project;
  onExecuteStep: (step: number) => void;
  executing: boolean;
}

function StepControl({ project, onExecuteStep, executing }: StepControlProps) {
  const stepConfigs = [
    {
      step: 1,
      name: STEP_NAMES[1],
      completed: project.step1_completed,
      description: '从输入文件中提取内容并进行智能总结',
      canExecute: true,
    },
    {
      step: 1.5,
      name: STEP_NAMES[1.5],
      completed: project.step1_5_completed,
      description: '将总结内容分段，准备后续处理',
      canExecute: project.step1_completed,
    },
    {
      step: 2,
      name: STEP_NAMES[2],
      completed: project.step2_completed,
      description: '提取每段的关键要点或描述',
      canExecute: project.step1_5_completed,
    },
    {
      step: 3,
      name: STEP_NAMES[3],
      completed: project.step3_completed,
      description: '根据要点生成配图',
      canExecute: project.step2_completed,
    },
    {
      step: 4,
      name: STEP_NAMES[4],
      completed: project.step4_completed,
      description: '将文本转换为语音',
      canExecute: project.step1_5_completed,
    },
    {
      step: 5,
      name: STEP_NAMES[5],
      completed: project.step5_completed,
      description: '合成最终视频',
      canExecute: project.step3_completed && project.step4_completed,
    },
    {
      step: 6,
      name: STEP_NAMES[6],
      completed: project.step6_completed,
      description: '生成视频封面（可选）',
      canExecute: project.step5_completed,
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {stepConfigs.map((config) => (
        <Card
          key={config.step}
          size="small"
          title={
            <Space>
              <span>步骤{config.step}: {config.name}</span>
              {config.completed && (
                <Tag icon={<CheckCircleOutlined />} color="success">
                  已完成
                </Tag>
              )}
            </Space>
          }
          extra={
            <Button
              type={config.completed ? 'default' : 'primary'}
              icon={<PlayCircleOutlined />}
              onClick={() => onExecuteStep(config.step)}
              disabled={!config.canExecute || executing}
              loading={executing}
            >
              {config.completed ? '重新执行' : '执行'}
            </Button>
          }
        >
          <Descriptions column={1} size="small">
            <Descriptions.Item label="说明">
              {config.description}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {config.completed ? (
                <Tag color="success">已完成</Tag>
              ) : config.canExecute ? (
                <Tag color="default">可执行</Tag>
              ) : (
                <Tag color="warning">等待前置步骤</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ))}
    </Space>
  );
}

export default StepControl;
