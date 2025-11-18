import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  message,
  Popconfirm,
  Input,
  Select,
} from 'antd';
import {
  EyeOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

import apiService from '@/services/api';
import type { Project } from '@/types';
import { PROJECT_STATUS_MAP } from '@/utils/config';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Search } = Input;

function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  // 加载项目列表
  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await apiService.getProjects({
        skip: (currentPage - 1) * pageSize,
        limit: pageSize,
        status_filter: statusFilter,
      });
      setProjects(response.items);
      setTotal(response.total);
    } catch (error) {
      message.error('加载项目列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [currentPage, pageSize, statusFilter]);

  // 删除项目
  const handleDelete = async (projectId: number) => {
    try {
      await apiService.deleteProject(projectId);
      message.success('项目已删除');
      loadProjects();
    } catch (error) {
      message.error('删除项目失败');
      console.error(error);
    }
  };

  // 表格列配置
  const columns: ColumnsType<Project> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusInfo = PROJECT_STATUS_MAP[status] || {
          text: status,
          color: 'default',
        };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: '进度',
      key: 'progress',
      width: 150,
      render: (_, record) => {
        const steps = [
          record.step1_completed,
          record.step1_5_completed,
          record.step2_completed,
          record.step3_completed,
          record.step4_completed,
          record.step5_completed,
        ];
        const completedSteps = steps.filter((s) => s).length;
        const totalSteps = 6;
        return (
          <span>
            {completedSteps}/{totalSteps} 步骤
          </span>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/projects/${record.id}`)}
          >
            查看
          </Button>
          <Popconfirm
            title="确定删除此项目？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="项目列表"
        extra={
          <Space>
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: 150 }}
              onChange={setStatusFilter}
              options={[
                { label: '已创建', value: 'created' },
                { label: '处理中', value: 'processing' },
                { label: '已完成', value: 'completed' },
                { label: '失败', value: 'failed' },
              ]}
            />
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => navigate('/projects/create')}
            >
              创建新项目
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadProjects}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个项目`,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}

export default ProjectList;
