import { Button, Input } from 'antd';
import { SendOutlined } from '@ant-design/icons';

interface ChatComposerProps {
  value: string;
  loading: boolean;
  placeholder: string;
  sendText: string;
  /** Compact layout for mobile: single-row input with inline send button. */
  compact?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}

export function ChatComposer(props: ChatComposerProps) {
  const { value, loading, placeholder, sendText, compact = false, onChange, onSend } = props;

  const handlePressEnter = (event: React.KeyboardEvent) => {
    if (!event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <Input.TextArea
          value={value}
          autoSize={{ minRows: 1, maxRows: 6 }}
          placeholder={placeholder}
          onChange={event => onChange(event.target.value)}
          onPressEnter={handlePressEnter}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={loading}
          onClick={onSend}
          style={{ flexShrink: 0 }}
        />
      </div>
    );
  }

  return (
    <>
      <Input.TextArea
        value={value}
        rows={4}
        autoSize={{ minRows: 4, maxRows: 12 }}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        onPressEnter={handlePressEnter}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" loading={loading} onClick={onSend}>
          {sendText}
        </Button>
      </div>
    </>
  );
}
