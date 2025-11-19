'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AdminChatPage() {
  const { user } = useAuth();
  const { connected, roomId, messages, isTyping, sendMessage, joinRoom, setTyping } = useChat();
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchActiveChats();
    const interval = setInterval(fetchActiveChats, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, messages]);

  useEffect(() => {
    // Sincronizar mensajes del context con el estado local
    if (roomId && messages.length > 0) {
      // Solo agregar mensajes nuevos, no reemplazar todos
      setChatMessages(prevMessages => {
        // Si no hay mensajes previos, usar los del context
        if (prevMessages.length === 0) {
          return messages;
        }
        
        // Verificar si el último mensaje es nuevo
        const lastContextMessage = messages[messages.length - 1];
        const lastLocalMessage = prevMessages[prevMessages.length - 1];
        
        // Comparar por timestamp y contenido para evitar duplicados
        if (
          lastContextMessage.timestamp !== lastLocalMessage.timestamp ||
          lastContextMessage.content !== lastLocalMessage.content
        ) {
          // Agregar solo el nuevo mensaje
          return [...prevMessages, lastContextMessage];
        }
        
        return prevMessages;
      });
      
      // Actualizar el chat activo en la lista después de recibir un nuevo mensaje
      setActiveChats(prevChats => 
        prevChats.map(chat => 
          chat.roomId === roomId 
            ? { ...chat, messages: [...(chat.messages || []), messages[messages.length - 1]] }
            : chat
        )
      );
    }
  }, [messages, roomId]);

  const fetchActiveChats = async () => {
    try {
      const response = await api.get('/chats/active');
      setActiveChats(response.data);
      
      // Contar mensajes no leídos SOLO si no estamos en ese chat
      const unread = response.data.reduce((acc: number, chat: any) => {
        // No contar como no leídos los mensajes del chat actual que estamos viendo
        if (chat.roomId === roomId) {
          return acc;
        }
        const unreadInChat = chat.messages.filter((m: any) => !m.isRead && m.senderType === 'user').length;
        return acc + unreadInChat;
      }, 0);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error al cargar chats:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectChat = async (chat: any) => {
    setSelectedChat(chat);
    
    try {
      // Cargar los mensajes que ya tenemos del chat activo
      setChatMessages(chat.messages || []);
      
      // Unirse a la sala (esto hará que empiecen a llegar mensajes por WebSocket)
      joinRoom(chat.roomId, true);
      
      // Marcar como leído
      try {
        await api.post(`/chats/${chat.roomId}/mark-read`);
      } catch (markReadError) {
        console.error('Error al marcar como leído:', markReadError);
      }
      
      // IMPORTANTE: Actualizar inmediatamente los chats activos para reflejar que ya no hay no leídos
      setTimeout(() => {
        fetchActiveChats();
      }, 500);
    } catch (error) {
      toast.error('Error al cargar chat');
      console.error(error);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !roomId) return;

    sendMessage(inputMessage);
    setInputMessage('');
    setTyping(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    if (roomId) {
      setTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chat de Soporte</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las conversaciones con los pacientes
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {unreadCount} nuevo{unreadCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Lista de Chats */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Conversaciones</span>
              </div>
              <Badge variant="secondary">
                {activeChats.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Chats activos
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {activeChats.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-sm">No hay chats activos</p>
              </div>
            ) : (
              <div className="divide-y">
                {activeChats.map((chat) => {
                  const unreadInChat = chat.messages.filter((m: any) => !m.isRead && m.senderType === 'user').length;
                  const lastMessage = chat.messages[chat.messages.length - 1];
                  
                  return (
                    <button
                      key={chat._id}
                      onClick={() => handleSelectChat(chat)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                        selectedChat?._id === chat._id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-gray-900 truncate">
                              {chat.user?.firstName || chat.guestName || 'Usuario'}
                            </p>
                            {unreadInChat > 0 && (
                              <Badge variant="destructive" className="ml-2">
                                {unreadInChat}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {lastMessage?.content || 'Sin mensajes'}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {format(new Date(chat.lastMessageAt), 'HH:mm', { locale: es })}
                            </span>
                            {chat.assignedAgent && (
                              <Badge variant="outline" className="text-xs">
                                Asignado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Área de Chat */}
        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {!selectedChat ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Selecciona un chat para comenzar</p>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>
                        {selectedChat.user?.firstName || selectedChat.guestName || 'Usuario'}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      {selectedChat.user?.email || selectedChat.guestEmail || 'Invitado'}
                    </CardDescription>
                  </div>
                  <Badge variant={connected ? 'default' : 'secondary'}>
                    {connected ? 'Conectado' : 'Desconectado'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>No hay mensajes en esta conversación</p>
                  </div>
                ) : (
                  chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.senderType === 'agent' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                          message.senderType === 'agent'
                            ? 'bg-green-600 text-white rounded-br-none'
                            : message.senderType === 'system'
                            ? 'bg-yellow-50 text-yellow-900 text-sm italic border border-yellow-200 mx-auto'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                        }`}
                      >
                        {message.senderType !== 'system' && (
                          <p className={`text-xs font-medium mb-1 ${
                            message.senderType === 'agent' ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            {message.senderType === 'agent' ? 'Tú (Agente)' : 'Paciente'}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.senderType === 'agent' ? 'text-green-200' : 'text-gray-400'
                          }`}
                        >
                          {format(new Date(message.timestamp), 'HH:mm', { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 border border-gray-200 shadow-sm">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              <div className="border-t p-4 bg-white">
                <div className="flex items-center space-x-3">
                  <Input
                    placeholder="Escribe tu respuesta..."
                    value={inputMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!inputMessage.trim()}
                    className="px-6"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}