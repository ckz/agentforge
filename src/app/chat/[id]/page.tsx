'use client';

import { useState, useEffect, use, Suspense, useRef } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Agent, Message } from '@/types/agent';
import { ChatInterface } from '@/components/agentforge/ChatInterface';
import { Button } from '@/components/ui/button';
import { Bot, ArrowLeft, Edit } from 'lucide-react';
import { nanoid } from 'nanoid';

function ChatContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchAgent(id);
  }, [id]);

  const fetchAgent = async (agentId: string) => {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const agents = await res.json();
        const found = agents.find((a: Agent) => a.id === agentId);
        if (found) {
          setAgent(found);
        } else {
          toast.error('Agent not found');
        }
      }
    } catch (error) {
      toast.error('Failed to load agent');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!agent) return;

    const userMessage: Message = {
      id: nanoid(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const apiMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      abortControllerRef.current = new AbortController();
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, messages: apiMessages }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = nanoid();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('0:')) {
            const text = line.slice(2).replace(/^"(.*)"$/, '$1');
            assistantContent += text;
            
            setMessages((prev) => {
              const existing = prev.find((m) => m.id === assistantId);
              if (existing) {
                return prev.map((m) =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m
                );
              }
              return [
                ...prev,
                {
                  id: assistantId,
                  role: 'assistant' as const,
                  content: assistantContent,
                  createdAt: new Date().toISOString(),
                },
              ];
            });
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error('Failed to send message');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Agent not found</p>
        <Link href="/">
          <Button className="mt-4">Go Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chat with {agent.name}</h1>
        <Link href={`/builder?id=${agent.id}`}>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Agent
          </Button>
        </Link>
      </div>
      <ChatInterface
        agent={agent}
        messages={messages}
        onSendMessage={sendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">AgentForge</span>
          </Link>
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
          <ChatContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}
