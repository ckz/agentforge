'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Agent } from '@/types/agent';
import { AgentBuilder } from '@/components/agentforge/AgentBuilder';
import { Button } from '@/components/ui/button';
import { Bot, ArrowLeft } from 'lucide-react';

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('id');
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(!!agentId);

  useEffect(() => {
    if (agentId) {
      fetchAgent(agentId);
    }
  }, [agentId]);

  const fetchAgent = async (id: string) => {
    try {
      const res = await fetch(`/api/agents`);
      if (res.ok) {
        const agents = await res.json();
        const found = agents.find((a: Agent) => a.id === id);
        if (found) {
          setAgent(found);
        } else {
          toast.error('Agent not found');
          router.push('/');
        }
      }
    } catch (error) {
      toast.error('Failed to load agent');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (agentData: Agent) => {
    try {
      const isUpdate = !!agent;
      const res = await fetch('/api/agents', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData),
      });

      if (res.ok) {
        toast.success(isUpdate ? 'Agent updated!' : 'Agent created!');
        router.push('/');
      } else {
        toast.error('Failed to save agent');
      }
    } catch (error) {
      toast.error('Failed to save agent');
    }
  };

  const handleDeploy = async (agentData: Agent) => {
    try {
      const res = await fetch('/api/deploy/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agentData.id }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(
          data.existing 
            ? 'Deployment already exists!' 
            : 'Agent deployed successfully!'
        );
        
        const endpoint = `${window.location.origin}${data.endpoint}`;
        navigator.clipboard.writeText(`curl -X POST ${endpoint} \\
  -H "Authorization: Bearer ${data.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'`);
        
        toast.success('API example copied to clipboard!');
      }
    } catch (error) {
      toast.error('Failed to deploy agent');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <AgentBuilder
        agent={agent || undefined}
        onSave={handleSave}
        onDeploy={agent ? handleDeploy : undefined}
        onCancel={() => router.push('/')}
      />
    </div>
  );
}

export default function BuilderPage() {
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
          <BuilderContent />
        </Suspense>
      </main>
    </div>
  );
}
