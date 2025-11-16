'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import { NuggetAvatar } from '@nugget/ui/custom/nugget-avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@nugget/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import { useMediaQuery } from '@nugget/ui/hooks/use-media-query';
import { cn } from '@nugget/ui/lib/utils';
import { Markdown } from '@nugget/ui/magicui/markdown';
import { Send, Sparkles } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getChatMessagesAction,
  sendChatMessageStreamingAction,
} from '../chat/actions';

/**
 * UI Message type - extends the basic ChatMessage from @nugget/ai/types
 * with additional fields needed for UI rendering (id, createdAt)
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

interface ChatDialogProps {
  babyId: string;
  chatId?: string;
  initialMessages?: Message[];
  systemPrompt?: string;
  compact?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChatDialogContent({
  babyId,
  chatId,
  initialMessages = [],
  systemPrompt,
  compact = false,
}: Omit<ChatDialogProps, 'open' | 'onOpenChange'>) {
  useAuth();
  const { user } = useUser();
  const [activeChat, setActiveChat] = useState<string | null>(chatId || null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { executeAsync: loadChatMessages } = useAction(getChatMessagesAction);

  // Set activeChat when chatId prop changes
  useEffect(() => {
    if (chatId) {
      setActiveChat(chatId);
    }
  }, [chatId]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      void loadChatMessages({ chatId: activeChat }).then(
        // biome-ignore lint/suspicious/noExplicitAny: result type from action
        (result: any) => {
          if (result?.data) {
            setMessages(
              // biome-ignore lint/suspicious/noExplicitAny: message type from database
              result.data.map((msg: any) => ({
                content: msg.content,
                createdAt: new Date(msg.createdAt),
                id: msg.id,
                role: msg.role as 'user' | 'assistant',
              })),
            );
          }
        },
      );
    }
  }, [activeChat, loadChatMessages]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      const trimmedInput = input.trim();
      if (!trimmedInput || !babyId || isSending) return;

      setIsSending(true);

      // Add user message optimistically
      const userMsg: Message = {
        content: trimmedInput,
        createdAt: new Date(),
        id: `temp-user-${Date.now()}`,
        role: 'user',
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');

      // Create a placeholder for the streaming assistant message
      const assistantMsgId = `temp-assistant-${Date.now()}`;
      const assistantMsg: Message = {
        content: '',
        createdAt: new Date(),
        id: assistantMsgId,
        role: 'assistant',
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        // Call the streaming action
        const result = await sendChatMessageStreamingAction({
          babyId,
          chatId: activeChat || undefined,
          message: trimmedInput,
          systemPrompt,
        });

        // If this was a new chat, set it as active
        if (!activeChat) {
          setActiveChat(result.chatId);
        }

        // Update user message with actual ID
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsg.id ? { ...m, id: result.userMessageId } : m,
          ),
        );

        // Process the stream
        const reader = result.stream.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          try {
            const parsed = JSON.parse(chunk);

            // Update the assistant message with partial response
            if (parsed.partial?.response) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: parsed.partial.response }
                    : m,
                ),
              );
            }

            // Update with final response
            if (parsed.final?.response) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: parsed.final.response }
                    : m,
                ),
              );
            }
          } catch (e) {
            // Chunk might not be complete JSON, continue
            console.error('Error parsing streaming chunk:', e);
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // Remove optimistic messages on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== userMsg.id && m.id !== assistantMsgId),
        );
      } finally {
        setIsSending(false);
      }
    },
    [input, babyId, activeChat, systemPrompt, isSending],
  );

  return (
    <div className={cn('flex flex-col', compact ? 'h-[500px]' : 'h-[600px]')}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="size-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="size-8 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-lg">Ask About Your Baby</p>
              <p className="text-sm text-muted-foreground">
                Get personalized parenting advice
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                className={cn(
                  'flex gap-2',
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
                    'rounded-xl px-3 py-2 max-w-[85%] select-text',
                    compact ? 'text-xs' : 'text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground border border-border',
                  )}
                >
                  {message.role === 'assistant' ? (
                    <Markdown prose>{message.content}</Markdown>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap select-text">
                      {message.content}
                    </p>
                  )}
                </div>
                {message.role === 'user' && (
                  <Avatar className="size-7 shrink-0">
                    <AvatarImage
                      alt={user?.firstName || 'User'}
                      src={user?.imageUrl}
                    />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
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
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 bg-card rounded-xl p-2 border border-border">
            <input
              className={cn(
                'flex-1 bg-transparent px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50',
                compact ? 'text-xs' : 'text-sm',
              )}
              disabled={isSending || !babyId}
              name="message"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question..."
              ref={inputRef}
              type="text"
              value={input}
            />
            <Button
              className="rounded-lg"
              disabled={isSending || !input.trim() || !babyId}
              size={compact ? 'sm' : 'default'}
              type="submit"
            >
              <Send className={cn(compact ? 'size-3' : 'size-4')} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Portable chat component that can be used in dialogs or drawers
 *
 * @example
 * ```tsx
 * // As a dialog
 * <ChatDialog
 *   babyId={baby.id}
 *   initialMessages={[
 *     {
 *       id: 'initial',
 *       role: 'user',
 *       content: 'How can I help my baby sleep?',
 *       createdAt: new Date(),
 *     },
 *   ]}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 * ```
 */
export function ChatDialog({
  babyId,
  chatId,
  initialMessages,
  systemPrompt,
  compact = false,
  open = false,
  onOpenChange,
}: ChatDialogProps) {
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="sm:max-w-2xl p-0">
          <DialogHeader className="px-6 pt-6">
            <div className="flex items-center gap-2">
              <NuggetAvatar letter="N" name="Nugget" size="sm" />
              <DialogTitle>Nugget AI</DialogTitle>
            </div>
          </DialogHeader>
          <ChatDialogContent
            babyId={babyId}
            chatId={chatId}
            compact={compact}
            initialMessages={initialMessages}
            systemPrompt={systemPrompt}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center gap-2">
            <NuggetAvatar letter="N" name="Nugget" size="sm" />
            <DrawerTitle>Nugget AI</DrawerTitle>
          </div>
        </DrawerHeader>
        <ChatDialogContent
          babyId={babyId}
          chatId={chatId}
          compact={compact}
          initialMessages={initialMessages}
          systemPrompt={systemPrompt}
        />
      </DrawerContent>
    </Drawer>
  );
}
