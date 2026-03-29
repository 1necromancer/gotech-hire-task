import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import RoomList from './RoomList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import CreateRoomForm from './CreateRoomForm';
import Header from './Header';

interface Room {
  id: number;
  name: string;
  description?: string;
}

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
  onLogout: () => void;
}

export default function ChatPage({ onLogout }: Props) {
  const { token, userId, socket, apiUrl } = useAppContext();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  const fetchRooms = useCallback(async () => {
    const res = await fetch(`${apiUrl}/chat/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setRooms(data);
  }, [apiUrl, token]);

  const fetchCurrentUser = useCallback(async () => {
    const res = await fetch(`${apiUrl}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await res.json();
    const current = users.find((u: { id: number }) => u.id === userId);
    if (current) {
      setUsername(current.username);
    }
  }, [apiUrl, token, userId]);

  const fetchMessages = useCallback(async (roomId: number) => {
    setLoadingMessages(true);
    const res = await fetch(`${apiUrl}/chat/rooms/${roomId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setMessages(data);
    setLoadingMessages(false);
  }, [apiUrl, token]);

  useEffect(() => {
    fetchRooms();
    fetchCurrentUser();
  }, [fetchRooms, fetchCurrentUser]);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onNewMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('newMessage', onNewMessage);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('newMessage', onNewMessage);
    };
  }, [socket]);

  const handleRoomSelect = useCallback((room: Room) => {
    if (selectedRoom) {
      socket.emit('leaveRoom', { roomId: selectedRoom.id });
    }
    setSelectedRoom(room);
    socket.emit('joinRoom', { roomId: room.id });
    fetchMessages(room.id);
  }, [selectedRoom, socket, fetchMessages]);

  const handleSendMessage = useCallback((content: string) => {
    if (!selectedRoom) return;
    socket.emit('sendMessage', {
      roomId: selectedRoom.id,
      content,
    });
  }, [selectedRoom, socket]);

  const handleCreateRoom = useCallback(async (name: string, description: string) => {
    await fetch(`${apiUrl}/chat/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });
    setShowCreateRoom(false);
    fetchRooms();
  }, [apiUrl, token, fetchRooms]);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '250px', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <Header username={username} isConnected={isConnected} onLogout={onLogout} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>Rooms</h3>
          <button onClick={() => setShowCreateRoom(!showCreateRoom)} style={{ fontSize: '20px', cursor: 'pointer', border: 'none', background: 'none' }}>+</button>
        </div>

        {showCreateRoom && (
          <CreateRoomForm
            onCreate={handleCreateRoom}
            onCancel={() => setShowCreateRoom(false)}
          />
        )}

        <RoomList
          rooms={rooms}
          selectedRoom={selectedRoom}
          onSelectRoom={handleRoomSelect}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedRoom ? (
          <>
            <div style={{ padding: '10px', borderBottom: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
              <h3 style={{ margin: 0 }}>#{selectedRoom.name}</h3>
              {selectedRoom.description && <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>{selectedRoom.description}</p>}
            </div>
            <MessageList messages={messages} userId={userId} loading={loadingMessages} />
            <MessageInput onSend={handleSendMessage} />
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <p style={{ color: '#666' }}>Select a room to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
