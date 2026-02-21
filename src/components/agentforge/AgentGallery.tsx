'use client';

import { Agent, AGENT_TEMPLATES } from '@/types/agent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Edit, Trash2, Rocket, Plus, Copy } from 'lucide-react';

interface AgentGalleryProps {
  agents: Agent[];
  onSelect: (agent: Agent) => void;
  onEdit: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
  onDeploy: (agent: Agent) => void;
  onCreateFromTemplate: (template: typeof AGENT_TEMPLATES[0]) => void;
}

export function AgentGallery({
  agents,
  onSelect,
  onEdit,
  onDelete,
  onDeploy,
  onCreateFromTemplate,
}: AgentGalleryProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENT_TEMPLATES.map((template, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="mb-2">{template.role}</Badge>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {template.systemPrompt}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onCreateFromTemplate(template)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Agents</h2>
        {agents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No agents created yet</p>
              <p className="text-sm text-muted-foreground">
                Use a template above or create a new agent to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <Badge variant="outline">{agent.model.split('/')[1]}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-1">{agent.role}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                    {agent.systemPrompt}
                  </p>
                  {agent.tools.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-4">
                      {agent.tools.map((tool) => (
                        <Badge key={tool.id} variant="secondary" className="text-xs">
                          {tool.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onSelect(agent)}>
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onEdit(agent)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDeploy(agent)}>
                      <Rocket className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(agent.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
