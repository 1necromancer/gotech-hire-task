import React, { useState } from 'react';

interface Props {
  onSend: (content: string) => void;
}

export default function MessageInput({ onSend }: Props) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (!value.trim()) return;
    onSend(value);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', padding: '10px', borderTop: '1px solid #ddd', gap: '10px' }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        style={{ flex: 1, padding: '8px', fontSize: '16px' }}
      />
      <button
        onClick={handleSend}
        style={{ padding: '8px 16px', fontSize: '16px', cursor: 'pointer' }}
      >
        Send
      </button>
    </div>
  );
}
