'use client';

import { useChat } from '@ai-sdk/react';
import { Button } from '@nugget/ui/button';
import { Send, Sparkles } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomNav } from '~/app/(app)/app/_components/bottom-nav';
import { Header } from '~/app/(app)/app/_components/header';

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      return;
    }

    await sendMessage({ text: trimmedInput });
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />

      <main className="flex-1 overflow-y-auto px-4 pt-20 pb-32">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2 text-balance">
                Ask me anything about your baby
              </h2>
              <p className="text-muted-foreground text-pretty">
                Get personalized advice on sleep, feeding, development, and more
              </p>
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
                    void sendMessage({ text: suggestion });
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
            {messages.map((message) => {
              const textContent = message.parts
                .map((part) => (part.type === 'text' ? part.text : ''))
                .join('')
                .trim();

              return (
                <div
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  key={message.id}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-foreground'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {textContent}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-secondary-foreground">
                        You
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-card rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-background via-background to-transparent pt-6">
        <form className="max-w-3xl mx-auto" onSubmit={handleSubmit}>
          <div className="flex gap-2 bg-card rounded-2xl p-2 shadow-lg border border-border">
            <input
              className="flex-1 bg-transparent px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
              disabled={isLoading}
              name="message"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about your baby..."
              ref={inputRef}
              type="text"
              value={input}
            />
            <Button
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading}
              size="icon"
              type="submit"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
