import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';

interface Message {
  id: number;
  content: string;
  username: string;
  senderName: string;
  createdAt: string;
  userId: number;
  user_id?: number;
}

interface Props {
  messages: Message[];
  userId: number;
  loading: boolean;
}

export default function MessageList({ messages, userId, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return <p style={{ padding: '10px' }}>Loading messages...</p>;
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          message={msg}
          isOwn={(msg.userId ?? msg.user_id) === userId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
