'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Agent, AGENT_TEMPLATES } from '@/types/agent';
import { AgentGallery } from '@/components/agentforge/AgentGallery';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Plus, Github, LogOut, User } from 'lucide-react';

interface UserInfo {
  username: string;
  role: string;
}

export default function Home() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetchAgents();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        }
      }
    } catch (error) {
      // Ignore
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (error) {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgent = (agent: Agent) => {
    router.push(`/chat/${agent.id}`);
  };

  const handleEditAgent = (agent: Agent) => {
    router.push(`/builder?id=${agent.id}`);
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      const res = await fetch(`/api/agents?id=${agentId}`, { method: 'DELETE' });
      if (res.ok) {
        setAgents(agents.filter((a) => a.id !== agentId));
        toast.success('Agent deleted');
      }
    } catch (error) {
      toast.error('Failed to delete agent');
    }
  };

  const handleDeploy = async (agent: Agent) => {
    try {
      const res = await fetch('/api/deploy/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id }),
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

  const handleCreateFromTemplate = async (template: typeof AGENT_TEMPLATES[0]) => {
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          name: `${template.name} (Copy)`,
        }),
      });
      
      if (res.ok) {
        const newAgent = await res.json();
        setAgents([newAgent, ...agents]);
        toast.success('Agent created from template!');
      }
    } catch (error) {
      toast.error('Failed to create agent');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">AgentForge</span>
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.username}</span>
                <Badge variant="secondary">{user.role}</Badge>
              </div>
            )}
            <Link href="/builder">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Agent
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
            <a
              href="https://github.com/ckz/agentforge"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <AgentGallery
            agents={agents}
            onSelect={handleSelectAgent}
            onEdit={handleEditAgent}
            onDelete={handleDeleteAgent}
            onDeploy={handleDeploy}
            onCreateFromTemplate={handleCreateFromTemplate}
          />
        )}
      </main>

      <footer className="border-t py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>AgentForge - Build and deploy AI agents with OpenRouter</p>
        </div>
      </footer>
    </div>
  );
}
