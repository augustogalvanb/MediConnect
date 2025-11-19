'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PatientChatPage() {
  const { user } = useAuth();
  const { connected, roomId, messages, isTyping, startChat, sendMessage, setTyping } = useChat();
  const [inputMessage, setInputMessage] = useState('');
  const [chatStarted, setChatStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartChat = () => {
    if (!inputMessage.trim()) return;
    startChat(inputMessage, user?.firstName, user?.email);
    setChatStarted(true);
    setInputMessage('');
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
      if (chatStarted) {
        handleSendMessage();
      } else {
        handleStartChat();
      }
    }
  };

  if (!connected) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Conectando al chat...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Chat de Soporte</h1>
        <p className="text-gray-600 mt-1">
          Comunícate con nuestro equipo de recepción
        </p>
      </div>

      {!chatStarted ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Iniciar Conversación</span>
            </CardTitle>
            <CardDescription>
              Escribe tu mensaje para comenzar a chatear con un agente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Input
                placeholder="Escribe tu consulta aquí..."
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleStartChat} disabled={!inputMessage.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Iniciar Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <span>Chat en Vivo</span>
                </CardTitle>
                <CardDescription>
                  {connected ? 'Conectado' : 'Desconectado'}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {connected ? 'En línea' : 'Desconectado'}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Esperando respuesta del agente...</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.senderType === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                      message.senderType === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : message.senderType === 'system'
                        ? 'bg-yellow-50 text-yellow-900 text-sm italic border border-yellow-200 mx-auto'
                        : 'bg-white text-gray-900 border border-gray-300 rounded-bl-none'
                    }`}
                  >
                    {message.senderType !== 'system' && (
                      <p className={`text-xs font-medium mb-1 ${
                        message.senderType === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.senderType === 'user' ? 'Tú' : 'Recepcionista'}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.senderType === 'user' ? 'text-blue-200' : 'text-gray-400'
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
                <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 border border-gray-300 shadow-sm">
                  <p className="text-xs font-medium mb-2 text-gray-500">Recepcionista está escribiendo...</p>
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
                placeholder="Escribe tu mensaje..."
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
        </Card>
      )}
    </div>
  );
}