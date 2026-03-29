import React, { useState } from 'react';

interface Props {
  onCreate: (name: string, description: string) => void;
  onCancel: () => void;
}

export default function CreateRoomForm({ onCreate, onCancel }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate(name, description);
    setName('');
    setDescription('');
  };

  return (
    <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <input
        placeholder="Room name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: '5px' }}
      />
      <input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ padding: '5px' }}
      />
      <div style={{ display: 'flex', gap: '5px' }}>
        <button onClick={handleSubmit} style={{ padding: '5px', cursor: 'pointer', flex: 1 }}>Create</button>
        <button onClick={onCancel} style={{ padding: '5px', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}
