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
  DialogTrigger,
} from '@nugget/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@nugget/ui/drawer';
import { useMediaQuery } from '@nugget/ui/hooks/use-media-query';
import { cn } from '@nugget/ui/lib/utils';
import { Markdown } from '@nugget/ui/magicui/markdown';
import { MessageSquare, Send, Sparkles } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  findOrCreateContextChatAction,
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

interface QuickChatDialogContentProps {
  babyId: string;
  systemPrompt?: string;
  initialMessages?: Message[];
  placeholder?: string;
  title?: string;
  contextType?: string; // e.g., 'learning_tip', 'milestone'
  contextId?: string; // e.g., tip ID
  prefillMessage?: string; // Pre-fill the input with this message
  autoSendPrefill?: boolean; // Auto-send the pre-filled message
}

export function QuickChatDialogContent({
  babyId,
  systemPrompt,
  initialMessages = [],
  placeholder = 'Ask a question...',
  title = 'Quick Chat',
  contextType,
  contextId,
  prefillMessage,
  autoSendPrefill = false,
}: QuickChatDialogContentProps) {
  const { userId } = useAuth();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState(prefillMessage || '');
  const [isSending, setIsSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const hasAttemptedAutoSend = useRef(false);

  const { executeAsync: findOrCreateChat } = useAction(
    findOrCreateContextChatAction,
  );

  // Reset auto-send flag when prefillMessage changes (new session)
  useEffect(() => {
    hasAttemptedAutoSend.current = false;
  }, [prefillMessage]);

  // Load or create chat when component mounts (if context is provided)
  useEffect(() => {
    if (contextType && contextId && babyId) {
      setIsLoadingChat(true);
      findOrCreateChat({
        babyId,
        contextId,
        contextType,
        // Pass initial messages to be saved when creating new chat
        initialMessages:
          initialMessages.length > 0
            ? initialMessages.map((msg) => ({
                content: msg.content,
                role: msg.role,
              }))
            : undefined,
        title,
      })
        // biome-ignore lint/suspicious/noExplicitAny: result type from action
        .then((result: any) => {
          if (result?.data) {
            setChatId(result.data.chat.id);
            // Load existing messages if any
            if (result.data.messages.length > 0) {
              // biome-ignore lint/suspicious/noExplicitAny: message type from database
              const loadedMessages = result.data.messages.map((msg: any) => ({
                content: msg.content,
                createdAt: new Date(msg.createdAt),
                id: msg.id,
                role: msg.role as 'user' | 'assistant',
              }));
              // Replace initial messages with loaded messages from DB
              setMessages(loadedMessages);
            } else if (initialMessages.length > 0) {
              // If new chat was created, initial messages are already in state
              // No need to do anything
            }
          }
        })
        // biome-ignore lint/suspicious/noExplicitAny: error type
        .catch((error: any) => {
          console.error('Error loading/creating chat:', error);
        })
        .finally(() => {
          setIsLoadingChat(false);
        });
    }
  }, [
    contextType,
    contextId,
    babyId,
    title,
    initialMessages,
    findOrCreateChat,
  ]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Auto-send prefilled message if requested
  useEffect(() => {
    if (
      autoSendPrefill &&
      prefillMessage &&
      !hasAttemptedAutoSend.current &&
      !isLoadingChat &&
      chatId &&
      !isSending
    ) {
      hasAttemptedAutoSend.current = true;
      // Set the input value first
      setInput(prefillMessage);
    }
  }, [autoSendPrefill, prefillMessage, isLoadingChat, chatId, isSending]);

  // Trigger send after input state has been updated
  // biome-ignore lint/correctness/useExhaustiveDependencies: we only want this to run when input matches prefillMessage after auto-send sets it
  useEffect(() => {
    if (
      hasAttemptedAutoSend.current &&
      input === prefillMessage &&
      prefillMessage &&
      !isSending &&
      chatId
    ) {
      // Give a moment for drawer animation, then send
      const timer = setTimeout(() => {
        void handleSendMessage();
      }, 200);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, prefillMessage, isSending, chatId]);

  // Auto-scroll to bottom when messages change (including during streaming)
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages is intentionally included to trigger scroll on every message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputFocus = useCallback(() => {
    // Small delay to allow keyboard to appear
    setTimeout(() => {
      inputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 300);
  }, []);

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || !userId || isSending) return;

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

    // Create placeholder for streaming assistant message
    const assistantMsgId = `temp-assistant-${Date.now()}`;
    const assistantMsg: Message = {
      content: '',
      createdAt: new Date(),
      id: assistantMsgId,
      role: 'assistant',
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      // Call the streaming action with chatId if available
      const result = await sendChatMessageStreamingAction({
        babyId,
        chatId: chatId || undefined,
        message: trimmedInput,
        systemPrompt,
      });

      // Update chatId if this was the first message
      if (!chatId) {
        setChatId(result.chatId);
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
  }, [input, userId, babyId, systemPrompt, chatId, isSending]);

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoadingChat ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Sparkles className="w-12 h-12 mb-4 text-primary/50 animate-pulse" />
            <p className="text-sm">Loading chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Sparkles className="w-12 h-12 mb-4 text-primary/50" />
            <p className="text-sm">{title}</p>
            <p className="text-xs mt-1">Ask me anything about your baby</p>
          </div>
        ) : null}
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
                'max-w-[80%] rounded-2xl px-4 py-2 select-text',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted',
              )}
            >
              {message.role === 'assistant' ? (
                <Markdown prose>{message.content}</Markdown>
              ) : (
                <p className="text-sm whitespace-pre-wrap select-text">
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

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <form
          className="flex gap-2 bg-card rounded-xl p-2 border border-border"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSendMessage();
          }}
          ref={formRef}
        >
          <input
            className={cn(
              'flex-1 bg-transparent px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50',
            )}
            disabled={isSending}
            onChange={(event) => setInput(event.target.value)}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            ref={inputRef}
            type="text"
            value={input}
          />
          <Button
            className="shrink-0 rounded-lg"
            disabled={!input.trim() || isSending}
            size="icon"
            type="submit"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

interface QuickChatDialogProps {
  babyId: string;
  systemPrompt?: string;
  initialMessages?: Message[];
  placeholder?: string;
  title?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  contextType?: string; // e.g., 'learning_tip', 'milestone'
  contextId?: string; // e.g., tip ID
  prefillMessage?: string; // Pre-fill the input with this message
  autoSendPrefill?: boolean; // Auto-send the pre-filled message
}

/**
 * A quick chat dialog that can be used anywhere in the app.
 * Supports custom system prompts and initial messages.
 *
 * @example
 * // With custom trigger
 * <QuickChatDialog
 *   babyId={baby.id}
 *   systemPrompt="You are a sleep consultant specializing in infant sleep training."
 *   trigger={<Button>Ask about sleep</Button>}
 * />
 *
 * @example
 * // Controlled with initial message
 * <QuickChatDialog
 *   babyId={baby.id}
 *   initialMessages={[
 *     {
 *       id: 'initial',
 *       role: 'user',
 *       content: 'How can I help my baby sleep better?',
 *       createdAt: new Date(),
 *     },
 *   ]}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 */
export function QuickChatDialog({
  babyId,
  systemPrompt,
  initialMessages,
  placeholder,
  title = 'Quick Chat',
  trigger,
  open,
  onOpenChange,
  contextType,
  contextId,
  prefillMessage,
  autoSendPrefill,
}: QuickChatDialogProps) {
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });
  const [isOpen, setIsOpen] = useState(open ?? false);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const commonContent = (
    <QuickChatDialogContent
      autoSendPrefill={autoSendPrefill}
      babyId={babyId}
      contextId={contextId}
      contextType={contextType}
      initialMessages={initialMessages}
      placeholder={placeholder}
      prefillMessage={prefillMessage}
      systemPrompt={systemPrompt}
      title={title}
    />
  );

  const defaultTrigger = trigger || (
    <Button size="sm" variant="outline">
      <MessageSquare className="w-4 h-4 mr-2" />
      Quick Chat
    </Button>
  );

  if (isDesktop) {
    return (
      <Dialog onOpenChange={handleOpenChange} open={open ?? isOpen}>
        {!open && <DialogTrigger asChild>{defaultTrigger}</DialogTrigger>}
        <DialogContent className="sm:max-w-2xl p-0">
          <DialogHeader className="px-6 pt-6">
            <div className="flex items-center gap-2">
              <NuggetAvatar letter="N" name="Nugget" size="sm" />
              <DialogTitle>{title}</DialogTitle>
            </div>
          </DialogHeader>
          {commonContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={handleOpenChange} open={open ?? isOpen}>
      {!open && <DrawerTrigger asChild>{defaultTrigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center gap-2">
            <NuggetAvatar letter="N" name="Nugget" size="sm" />
            <DrawerTitle>{title}</DrawerTitle>
          </div>
        </DrawerHeader>
        {commonContent}
      </DrawerContent>
    </Drawer>
  );
}
