import { Button, Input } from 'antd';

interface ChatComposerProps {
  value: string;
  loading: boolean;
  placeholder: string;
  sendText: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

export function ChatComposer(props: ChatComposerProps) {
  const { value, loading, placeholder, sendText, onChange, onSend } = props;
  return (
    <>
      <Input.TextArea
        value={value}
        rows={4}
        autoSize={{ minRows: 4, maxRows: 12 }}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        onPressEnter={event => {
          if (!event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" loading={loading} onClick={onSend}>
          {sendText}
        </Button>
      </div>
    </>
  );
}
