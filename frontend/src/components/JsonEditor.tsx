import { useState } from 'react';
import { Card, Button, Space, message, Modal, Select } from 'antd';
import {
  SaveOutlined,
  UndoOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';

interface JsonEditorProps {
  title: string;
  data: any;
  onSave: (data: any) => Promise<void>;
  onLoadHistory?: () => Promise<any[]>;
  onRestoreVersion?: (version: number) => Promise<void>;
  height?: number;
  readOnly?: boolean;
}

function JsonEditor({
  title,
  data,
  onSave,
  onLoadHistory,
  onRestoreVersion,
  height = 600,
  readOnly = false,
}: JsonEditorProps) {
  const [editorValue, setEditorValue] = useState(
    JSON.stringify(data, null, 2)
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorValue(value);
      setHasChanges(value !== JSON.stringify(data, null, 2));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 验证JSON格式
      const parsedData = JSON.parse(editorValue);

      // 调用保存函数
      await onSave(parsedData);

      message.success('保存成功！');
      setHasChanges(false);
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        message.error('JSON格式错误，请检查语法');
      } else {
        message.error('保存失败：' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      content: '确定要放弃所有未保存的更改吗？',
      onOk: () => {
        setEditorValue(JSON.stringify(data, null, 2));
        setHasChanges(false);
        message.info('已重置');
      },
    });
  };

  const handleFormat = () => {
    try {
      const parsedData = JSON.parse(editorValue);
      const formatted = JSON.stringify(parsedData, null, 2);
      setEditorValue(formatted);
      message.success('已格式化');
    } catch (error) {
      message.error('JSON格式错误，无法格式化');
    }
  };

  const handleShowHistory = async () => {
    if (!onLoadHistory) {
      message.warning('版本历史功能未启用');
      return;
    }

    setShowHistory(true);
    setLoadingHistory(true);
    try {
      const historyData = await onLoadHistory();
      setHistory(historyData);
    } catch (error: any) {
      message.error('加载历史失败：' + error.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRestoreVersion = async (version: number) => {
    if (!onRestoreVersion) return;

    Modal.confirm({
      title: '确认恢复版本',
      content: `确定要恢复到版本 ${version} 吗？当前未保存的更改将丢失。`,
      onOk: async () => {
        try {
          await onRestoreVersion(version);
          message.success(`已恢复到版本 ${version}`);
          setShowHistory(false);
          // 重新加载数据
          window.location.reload();
        } catch (error: any) {
          message.error('恢复版本失败：' + error.message);
        }
      },
    });
  };

  return (
    <>
      <Card
        title={title}
        extra={
          <Space>
            {hasChanges && (
              <span style={{ color: '#ff4d4f', marginRight: 8 }}>
                未保存
              </span>
            )}
            <Button
              icon={<CheckCircleOutlined />}
              onClick={handleFormat}
            >
              格式化
            </Button>
            {onLoadHistory && (
              <Button
                icon={<HistoryOutlined />}
                onClick={handleShowHistory}
              >
                历史版本
              </Button>
            )}
            <Button
              icon={<UndoOutlined />}
              onClick={handleReset}
              disabled={!hasChanges}
            >
              重置
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!hasChanges || readOnly}
            >
              保存
            </Button>
          </Space>
        }
      >
        <Editor
          height={height}
          defaultLanguage="json"
          value={editorValue}
          onChange={handleEditorChange}
          options={{
            readOnly: readOnly,
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            formatOnPaste: true,
            formatOnType: true,
            automaticLayout: true,
          }}
          theme="vs-dark"
        />
      </Card>

      {/* 历史版本对话框 */}
      <Modal
        title="版本历史"
        open={showHistory}
        onCancel={() => setShowHistory(false)}
        footer={null}
        width={800}
      >
        {loadingHistory ? (
          <div>加载中...</div>
        ) : history.length === 0 ? (
          <div>暂无历史版本</div>
        ) : (
          <div>
            {history.map((item, index) => (
              <Card
                key={index}
                size="small"
                style={{ marginBottom: 8 }}
                title={`版本 ${item.version}`}
                extra={
                  <Space>
                    <span>{item.timestamp}</span>
                    <Button
                      size="small"
                      onClick={() => handleRestoreVersion(item.version)}
                    >
                      恢复此版本
                    </Button>
                  </Space>
                }
              >
                <pre style={{ maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
                  {JSON.stringify(item.data, null, 2)}
                </pre>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}

export default JsonEditor;
