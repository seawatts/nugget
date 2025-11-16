'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import { NuggetAvatar } from '@nugget/ui/custom/nugget-avatar';
import { H3, P } from '@nugget/ui/custom/typography';
import { cn } from '@nugget/ui/lib/utils';
import { Markdown } from '@nugget/ui/magicui/markdown';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@nugget/ui/sheet';
import { Menu, MessageSquarePlus, Send, Sparkles, Trash2 } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useQueryState } from 'nuqs';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createNewChatAction,
  deleteChatAction,
  getChatHistoryAction,
  getChatMessagesAction,
  sendChatMessageAction,
} from './actions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export default function ChatPage() {
  const { userId: _userId } = useAuth();
  const { user } = useUser();
  const [question, setQuestion] = useQueryState('question');
  const [babyId, setBabyId] = useState<string | null>(null);
  const [chats, setChats] = useState<
    Array<{ id: string; title: string; updatedAt: Date }>
  >([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoSentQuestion = useRef(false);

  const {
    execute: loadChatHistory,
    result: chatHistoryResult,
    isPending: _isLoadingHistory,
  } = useAction(getChatHistoryAction);
  const {
    execute: loadChatMessages,
    result: chatMessagesResult,
    isPending: _isLoadingMessages,
  } = useAction(getChatMessagesAction);
  const {
    execute: sendMessage,
    result: sendMessageResult,
    isPending: isSending,
  } = useAction(sendChatMessageAction);
  const {
    execute: _createNewChat,
    result: _createChatResult,
    isPending: _isCreatingChat,
  } = useAction(createNewChatAction);
  const { execute: deleteChat } = useAction(deleteChatAction);

  // Get baby ID from localStorage or API
  useEffect(() => {
    const storedBabyId = localStorage.getItem('selectedBabyId');
    if (storedBabyId) {
      setBabyId(storedBabyId);
    } else {
      // Fallback: try to get from API
      // For now, we'll just show an error if no baby is selected
      console.error('No baby selected');
    }
  }, []);

  // Load chat history when baby ID is available
  useEffect(() => {
    if (babyId) {
      void loadChatHistory({ babyId });
    }
  }, [babyId, loadChatHistory]);

  // Update chats when chat history result changes
  useEffect(() => {
    if (chatHistoryResult?.data) {
      setChats(
        chatHistoryResult.data.map((chat) => ({
          id: chat.id,
          title: chat.title,
          updatedAt: new Date(chat.updatedAt || chat.createdAt),
        })),
      );
    }
  }, [chatHistoryResult]);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      void loadChatMessages({ chatId: activeChat });
    }
  }, [activeChat, loadChatMessages]);

  // Update messages when chat messages result changes
  useEffect(() => {
    if (chatMessagesResult?.data) {
      setMessages(
        chatMessagesResult.data.map((msg) => ({
          content: msg.content,
          createdAt: new Date(msg.createdAt),
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
        })),
      );
    }
  }, [chatMessagesResult]);

  // Handle send message result
  useEffect(() => {
    if (sendMessageResult?.data) {
      // If this was a new chat, set it as active and refresh chat list
      if (!activeChat) {
        setActiveChat(sendMessageResult.data.chatId);
        // Refresh chat history
        if (babyId) {
          void loadChatHistory({ babyId });
        }
      }

      // Add assistant message if present
      if (sendMessageResult.data.assistantMessage) {
        const assistantMsg: Message = {
          content: sendMessageResult.data.assistantMessage.content,
          createdAt: new Date(),
          id:
            sendMessageResult.data.assistantMessage.id ||
            `assistant-${Date.now()}`,
          role: 'assistant',
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }

      // Clear the URL question parameter after successful send
      if (question) {
        void setQuestion(null);
      }
    } else if (
      sendMessageResult?.serverError ||
      sendMessageResult?.validationErrors
    ) {
      console.error(
        'Error sending message:',
        sendMessageResult.serverError || sendMessageResult.validationErrors,
      );
    }
  }, [
    sendMessageResult,
    activeChat,
    babyId,
    loadChatHistory,
    question,
    setQuestion,
  ]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmedInput = input.trim();
      if (!trimmedInput || !babyId) return;

      // Add user message optimistically
      const userMsg: Message = {
        content: trimmedInput,
        createdAt: new Date(),
        id: `temp-${Date.now()}`,
        role: 'user',
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');

      // Send message
      void sendMessage({
        babyId,
        chatId: activeChat || undefined,
        message: trimmedInput,
      });
    },
    [input, babyId, activeChat, sendMessage],
  );

  // Auto-send question from URL parameter
  useEffect(() => {
    if (
      question &&
      !hasAutoSentQuestion.current &&
      messages.length === 0 &&
      !isSending
    ) {
      hasAutoSentQuestion.current = true;
      setInput(question);
      // Auto-submit after a brief delay
      setTimeout(() => {
        handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent<HTMLFormElement>);
      }, 100);
    }
  }, [question, messages.length, isSending, handleSubmit]);

  const handleNewChat = async () => {
    if (!babyId) return;
    setActiveChat(null);
    setMessages([]);
    setIsSheetOpen(false);
    inputRef.current?.focus();
  };

  const handleSelectChat = async (chatId: string) => {
    setActiveChat(chatId);
    setIsSheetOpen(false);
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chat?')) return;

    void deleteChat({ chatId });
    // Optimistically remove the chat
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChat === chatId) {
      setActiveChat(null);
      setMessages([]);
    }
  };

  const ChatList = () => (
    <div className="flex flex-col gap-2">
      <Button
        className="w-full justify-start gap-2"
        onClick={handleNewChat}
        variant="outline"
      >
        <MessageSquarePlus className="size-4" />
        New Chat
      </Button>
      <div className="flex flex-col gap-1">
        {chats.map((chat) => (
          <button
            className={cn(
              'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
              activeChat === chat.id && 'bg-muted',
            )}
            key={chat.id}
            onClick={() => handleSelectChat(chat.id)}
            type="button"
          >
            <span className="flex-1 truncate">{chat.title}</span>
            <Button
              className="size-6 shrink-0"
              onClick={(e) => handleDeleteChat(chat.id, e)}
              size="icon"
              variant="ghost"
            >
              <Trash2 className="size-3" />
            </Button>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet onOpenChange={setIsSheetOpen} open={isSheetOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-80" side="left">
              <SheetHeader>
                <SheetTitle>Chat History</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <ChatList />
              </div>
            </SheetContent>
          </Sheet>
          <NuggetAvatar letter="N" name="Nugget" size="sm" />
          <H3 className="font-semibold">Nugget AI</H3>
        </div>
      </div>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-6">
            <div className="size-20 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="size-10 text-primary-foreground" />
            </div>
            <div>
              <H3 className="mb-2 text-balance">
                Ask me anything about your baby
              </H3>
              <P className="text-pretty" variant="muted">
                Get personalized advice on sleep, feeding, development, and more
              </P>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full max-w-md mt-4">
              {[
                "How can I improve my baby's sleep?",
                "What's a normal feeding schedule?",
                'When should I start solid foods?',
                'Tips for tummy time?',
              ].map((suggestion) => (
                <button
                  className="px-4 py-3 bg-card hover:bg-muted rounded-xl text-left text-sm text-foreground transition-colors"
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6 py-6">
            {messages.map((message) => (
              <div
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start',
                )}
                key={message.id}
              >
                {message.role === 'assistant' && (
                  <div className="shrink-0">
                    <NuggetAvatar letter="N" name="Nugget" size="sm" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 max-w-[80%] select-text',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground',
                  )}
                >
                  {message.role === 'assistant' ? (
                    <Markdown prose>{message.content}</Markdown>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap select-text">
                      {message.content}
                    </p>
                  )}
                </div>
                {message.role === 'user' && (
                  <Avatar className="size-8 shrink-0">
                    <AvatarImage
                      alt={user?.firstName || 'User'}
                      src={user?.imageUrl}
                    />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
                      {user?.firstName?.[0] ||
                        user?.emailAddresses?.[0]?.emailAddress?.[0] ||
                        'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-linear-to-t from-background via-background to-transparent pt-6">
        <form className="max-w-3xl mx-auto" onSubmit={handleSubmit}>
          <div className="flex gap-2 bg-card rounded-2xl p-2 shadow-lg border border-border">
            <input
              className="flex-1 bg-transparent px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
              disabled={isSending || !babyId}
              name="message"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your baby..."
              ref={inputRef}
              type="text"
              value={input}
            />
            <Button
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSending || !input.trim() || !babyId}
              size="icon"
              type="submit"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
