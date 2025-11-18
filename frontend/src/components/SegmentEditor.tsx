import { useState } from 'react';
import {
  Card,
  List,
  Button,
  Space,
  Input,
  Modal,
  message,
  Tag,
  Checkbox,
  Tooltip,
  InputNumber,
} from 'antd';
import {
  MergeOutlined,
  ScissorOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;

interface Segment {
  index: number;
  content: string;
  character_count?: number;
  duration_seconds?: number;
}

interface SegmentEditorProps {
  projectId: number;
  segments: Segment[];
  onUpdate: (segments: Segment[]) => Promise<void>;
  onMerge?: (indices: number[]) => Promise<void>;
  onSplit?: (index: number, position: number) => Promise<void>;
}

function SegmentEditor({
  projectId,
  segments: initialSegments,
  onUpdate,
  onMerge,
  onSplit,
}: SegmentEditorProps) {
  const [segments, setSegments] = useState<Segment[]>(initialSegments);
  const [selectedSegments, setSelectedSegments] = useState<number[]>([]);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [splitSegment, setSplitSegment] = useState<Segment | null>(null);
  const [splitPosition, setSplitPosition] = useState(0);

  // 选择/取消选择段落
  const toggleSelectSegment = (index: number) => {
    setSelectedSegments((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index].sort((a, b) => a - b)
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedSegments.length === segments.length) {
      setSelectedSegments([]);
    } else {
      setSelectedSegments(segments.map((s) => s.index));
    }
  };

  // 合并段落
  const handleMerge = async () => {
    if (selectedSegments.length < 2) {
      message.warning('请选择至少2个段落进行合并');
      return;
    }

    Modal.confirm({
      title: '确认合并',
      content: `确定要合并选中的 ${selectedSegments.length} 个段落吗？`,
      onOk: async () => {
        try {
          if (onMerge) {
            await onMerge(selectedSegments);
            message.success('合并成功！页面将刷新');
            setTimeout(() => window.location.reload(), 1000);
          } else {
            // 本地合并（如果没有提供API）
            const newSegments = [...segments];
            const mergedContent = selectedSegments
              .map((idx) => newSegments.find((s) => s.index === idx)?.content)
              .join(' ');

            // 删除被合并的段落，保留第一个
            const filteredSegments = newSegments.filter(
              (s) =>
                !selectedSegments.includes(s.index) ||
                s.index === selectedSegments[0]
            );

            // 更新第一个段落的内容
            const firstSegment = filteredSegments.find(
              (s) => s.index === selectedSegments[0]
            );
            if (firstSegment) {
              firstSegment.content = mergedContent;
              firstSegment.character_count = mergedContent.length;
            }

            // 重新编号
            filteredSegments.forEach((seg, idx) => {
              seg.index = idx + 1;
            });

            setSegments(filteredSegments);
            setSelectedSegments([]);
            await onUpdate(filteredSegments);
            message.success('合并成功！');
          }
        } catch (error: any) {
          message.error('合并失败：' + error.message);
        }
      },
    });
  };

  // 打开拆分对话框
  const handleOpenSplit = (segment: Segment) => {
    setSplitSegment(segment);
    setSplitPosition(Math.floor(segment.content.length / 2));
    setSplitModalVisible(true);
  };

  // 拆分段落
  const handleSplit = async () => {
    if (!splitSegment) return;

    if (splitPosition <= 0 || splitPosition >= splitSegment.content.length) {
      message.error('拆分位置无效');
      return;
    }

    try {
      if (onSplit) {
        await onSplit(splitSegment.index, splitPosition);
        message.success('拆分成功！页面将刷新');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        // 本地拆分
        const newSegments = [...segments];
        const targetIndex = newSegments.findIndex(
          (s) => s.index === splitSegment.index
        );

        if (targetIndex === -1) return;

        const part1 = splitSegment.content.substring(0, splitPosition).trim();
        const part2 = splitSegment.content.substring(splitPosition).trim();

        const segment1 = {
          index: splitSegment.index,
          content: part1,
          character_count: part1.length,
        };

        const segment2 = {
          index: splitSegment.index + 1,
          content: part2,
          character_count: part2.length,
        };

        newSegments.splice(targetIndex, 1, segment1, segment2);

        // 重新编号
        newSegments.forEach((seg, idx) => {
          seg.index = idx + 1;
        });

        setSegments(newSegments);
        await onUpdate(newSegments);
        message.success('拆分成功！');
      }

      setSplitModalVisible(false);
      setSplitSegment(null);
    } catch (error: any) {
      message.error('拆分失败：' + error.message);
    }
  };

  // 编辑段落内容
  const handleEditSegment = (segment: Segment) => {
    setEditingSegment({ ...segment });
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingSegment) return;

    const newSegments = segments.map((s) =>
      s.index === editingSegment.index
        ? {
            ...editingSegment,
            character_count: editingSegment.content.length,
          }
        : s
    );

    setSegments(newSegments);
    await onUpdate(newSegments);
    setEditingSegment(null);
    message.success('保存成功！');
  };

  // 删除段落
  const handleDelete = (index: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个段落吗？',
      onOk: async () => {
        const newSegments = segments.filter((s) => s.index !== index);
        // 重新编号
        newSegments.forEach((seg, idx) => {
          seg.index = idx + 1;
        });
        setSegments(newSegments);
        await onUpdate(newSegments);
        message.success('删除成功！');
      },
    });
  };

  // 添加新段落
  const handleAddSegment = () => {
    const newSegment: Segment = {
      index: segments.length + 1,
      content: '',
      character_count: 0,
    };
    setEditingSegment(newSegment);
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <span>分段编辑器</span>
            <Tag color="blue">{segments.length} 个段落</Tag>
            {selectedSegments.length > 0 && (
              <Tag color="orange">已选择 {selectedSegments.length} 个</Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <Checkbox
              checked={selectedSegments.length === segments.length}
              indeterminate={
                selectedSegments.length > 0 &&
                selectedSegments.length < segments.length
              }
              onChange={toggleSelectAll}
            >
              全选
            </Checkbox>
            <Button
              icon={<MergeOutlined />}
              onClick={handleMerge}
              disabled={selectedSegments.length < 2}
            >
              合并选中
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={handleAddSegment}
              type="primary"
            >
              添加段落
            </Button>
          </Space>
        }
      >
        <List
          dataSource={segments}
          renderItem={(segment) => (
            <List.Item
              key={segment.index}
              actions={[
                <Checkbox
                  checked={selectedSegments.includes(segment.index)}
                  onChange={() => toggleSelectSegment(segment.index)}
                />,
                <Tooltip title="编辑">
                  <Button
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => handleEditSegment(segment)}
                  />
                </Tooltip>,
                <Tooltip title="拆分">
                  <Button
                    icon={<ScissorOutlined />}
                    size="small"
                    onClick={() => handleOpenSplit(segment)}
                  />
                </Tooltip>,
                <Tooltip title="删除">
                  <Button
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                    onClick={() => handleDelete(segment.index)}
                  />
                </Tooltip>,
              ]}
              style={{
                backgroundColor: selectedSegments.includes(segment.index)
                  ? '#e6f7ff'
                  : 'white',
              }}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Tag color="blue">段落 {segment.index}</Tag>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      {segment.character_count || segment.content.length} 字
                    </span>
                    {segment.duration_seconds && (
                      <span style={{ color: '#999', fontSize: 12 }}>
                        约 {segment.duration_seconds.toFixed(1)} 秒
                      </span>
                    )}
                  </Space>
                }
                description={
                  <div
                    style={{
                      maxHeight: 100,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {segment.content}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 编辑对话框 */}
      <Modal
        title={`编辑段落 ${editingSegment?.index}`}
        open={!!editingSegment}
        onOk={handleSaveEdit}
        onCancel={() => setEditingSegment(null)}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        {editingSegment && (
          <div>
            <TextArea
              value={editingSegment.content}
              onChange={(e) =>
                setEditingSegment({
                  ...editingSegment,
                  content: e.target.value,
                })
              }
              rows={10}
              showCount
              maxLength={5000}
            />
            <div style={{ marginTop: 8, color: '#999' }}>
              字数: {editingSegment.content.length}
            </div>
          </div>
        )}
      </Modal>

      {/* 拆分对话框 */}
      <Modal
        title={`拆分段落 ${splitSegment?.index}`}
        open={splitModalVisible}
        onOk={handleSplit}
        onCancel={() => setSplitModalVisible(false)}
        width={800}
        okText="确认拆分"
        cancelText="取消"
      >
        {splitSegment && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label>拆分位置（字符索引）：</label>
              <InputNumber
                min={1}
                max={splitSegment.content.length - 1}
                value={splitPosition}
                onChange={(val) => setSplitPosition(val || 0)}
                style={{ width: 120, marginLeft: 8 }}
              />
              <span style={{ marginLeft: 8, color: '#999' }}>
                / {splitSegment.content.length}
              </span>
            </div>

            <Card title="预览拆分结果" size="small">
              <div style={{ marginBottom: 16 }}>
                <Tag color="blue">段落 {splitSegment.index}</Tag>
                <div
                  style={{
                    padding: 8,
                    background: '#f0f0f0',
                    borderRadius: 4,
                    marginTop: 8,
                  }}
                >
                  {splitSegment.content.substring(0, splitPosition)}
                </div>
                <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>
                  {splitPosition} 字
                </div>
              </div>

              <div>
                <Tag color="green">段落 {splitSegment.index + 1} (新)</Tag>
                <div
                  style={{
                    padding: 8,
                    background: '#f0f0f0',
                    borderRadius: 4,
                    marginTop: 8,
                  }}
                >
                  {splitSegment.content.substring(splitPosition)}
                </div>
                <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>
                  {splitSegment.content.length - splitPosition} 字
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SegmentEditor;
