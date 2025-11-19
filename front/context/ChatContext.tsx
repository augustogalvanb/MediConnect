'use client';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
interface Message {
sender?: string;
senderType: 'user' | 'agent' | 'system';
content: string;
timestamp: Date;
isRead?: boolean;
}
interface ChatContextType {
connected: boolean;
roomId: string | null;
messages: Message[];
isTyping: boolean;
startChat: (initialMessage: string, guestName?: string, guestEmail?: string) => void;
sendMessage: (content: string) => void;
joinRoom: (roomId: string, isAgent?: boolean) => void;
setTyping: (isTyping: boolean) => void;
disconnect: () => void;
}
const ChatContext = createContext<ChatContextType | undefined>(undefined);
export function ChatProvider({ children }: { children: React.ReactNode }) {
const { user } = useAuth();
const [socket, setSocket] = useState<Socket | null>(null);
const [connected, setConnected] = useState(false);
const [roomId, setRoomId] = useState<string | null>(null);
const [messages, setMessages] = useState<Message[]>([]);
const [isTyping, setIsTyping] = useState(false);
const socketRef = useRef<Socket | null>(null);
useEffect(() => {
const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';
const newSocket = io(`${socketUrl}/chat`, {
  auth: {
    userId: user?.id,
  },
  transports: ['websocket', 'polling'],
});

socketRef.current = newSocket;
setSocket(newSocket);

newSocket.on('connect', () => {
  console.log('Socket conectado');
  setConnected(true);
});

newSocket.on('disconnect', () => {
  console.log('Socket desconectado');
  setConnected(false);
});

newSocket.on('newMessage', (data: any) => {
  console.log('Nuevo mensaje recibido:', data);
  setMessages((prev) => [...prev, data.message]);
});

newSocket.on('userTyping', (data: any) => {
  if (data.isTyping && data.userId !== user?.id) {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 3000);
  }
});

newSocket.on('agentAssigned', (data: any) => {
  toast.success('Un agente se ha unido al chat');
});

newSocket.on('error', (error: any) => {
  console.error('Socket error:', error);
  toast.error('Error en la conexión del chat');
});

return () => {
  newSocket.disconnect();
};
}, [user?.id]);
const startChat = (initialMessage: string, guestName?: string, guestEmail?: string) => {
if (!socket) {
toast.error('No hay conexión con el servidor');
return;
}
socket.emit('startChat', {
  initialMessage,
  guestName: guestName || user?.firstName,
  guestEmail: guestEmail || user?.email,
}, (response: any) => {
  if (response.success) {
    setRoomId(response.chat.roomId);
    setMessages([{
      senderType: 'user',
      content: initialMessage,
      timestamp: new Date(),
    }]);
    toast.success('Chat iniciado');
  } else {
    toast.error(response.error || 'Error al iniciar chat');
  }
});
};
const sendMessage = (content: string) => {
if (!socket || !roomId) {
toast.error('No hay conexión activa');
return;
}
socket.emit('sendMessage', {
  roomId,
  content,
}, (response: any) => {
  if (!response.success) {
    toast.error(response.error || 'Error al enviar mensaje');
  }
});
};
const joinRoom = (newRoomId: string, isAgent: boolean = false) => {
if (!socket) {
toast.error('No hay conexión con el servidor');
return;
}
socket.emit('joinRoom', {
  roomId: newRoomId,
  userId: user?.id,
  isAgent,
}, (response: any) => {
  if (response.success) {
    setRoomId(newRoomId);
  } else {
    toast.error('Error al unirse a la sala');
  }
});
};
const setTypingStatus = (typing: boolean) => {
if (socket && roomId) {
socket.emit('typing', {
roomId,
isTyping: typing,
});
}
};
const disconnect = () => {
if (socket) {
socket.disconnect();
setConnected(false);
setRoomId(null);
setMessages([]);
}
};
return (
<ChatContext.Provider
value={{
connected,
roomId,
messages,
isTyping,
startChat,
sendMessage,
joinRoom,
setTyping: setTypingStatus,
disconnect,
}}
>
{children}
</ChatContext.Provider>
);
}
export function useChat() {
const context = useContext(ChatContext);
if (context === undefined) {
throw new Error('useChat must be used within a ChatProvider');
}
return context;
}