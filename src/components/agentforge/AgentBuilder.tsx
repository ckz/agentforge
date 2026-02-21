'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Agent, OPENROUTER_MODELS, Tool } from '@/types/agent';
import { nanoid } from 'nanoid';
import { Plus, Trash2, Wrench, Save, Rocket } from 'lucide-react';

interface AgentBuilderProps {
  agent?: Agent;
  onSave: (agent: Agent) => void;
  onDeploy?: (agent: Agent) => void;
  onCancel?: () => void;
}

export function AgentBuilder({ agent, onSave, onDeploy, onCancel }: AgentBuilderProps) {
  const [name, setName] = useState(agent?.name || '');
  const [role, setRole] = useState(agent?.role || '');
  const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt || '');
  const [model, setModel] = useState(agent?.model || 'openai/gpt-4o-mini');
  const [temperature, setTemperature] = useState(agent?.temperature || 0.7);
  const [tools, setTools] = useState<Tool[]>(agent?.tools || []);
  const [saving, setSaving] = useState(false);

  const addTool = () => {
    setTools([
      ...tools,
      {
        id: nanoid(),
        name: '',
        description: '',
        parameters: {},
      },
    ]);
  };

  const updateTool = (index: number, updates: Partial<Tool>) => {
    const updated = [...tools];
    updated[index] = { ...updated[index], ...updates };
    setTools(updated);
  };

  const removeTool = (index: number) => {
    setTools(tools.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim() || !role.trim()) return;

    setSaving(true);
    const now = new Date().toISOString();
    const agentData: Agent = {
      id: agent?.id || nanoid(),
      name: name.trim(),
      role: role.trim(),
      systemPrompt,
      model,
      tools: tools.filter(t => t.name.trim()),
      temperature,
      createdAt: agent?.createdAt || now,
      updatedAt: now,
    };

    onSave(agentData);
    setSaving(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {agent ? 'Edit Agent' : 'Create New Agent'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              placeholder="e.g., Research Agent"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              placeholder="e.g., Information Researcher"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="systemPrompt">System Prompt</Label>
          <Textarea
            id="systemPrompt"
            placeholder="Describe how the agent should behave..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPENROUTER_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <span>{m.name}</span>
                      <Badge variant="secondary" className="text-xs">{m.provider}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Temperature: {temperature.toFixed(1)}</Label>
            <Slider
              value={[temperature]}
              onValueChange={([v]) => setTemperature(v)}
              min={0}
              max={2}
              step={0.1}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Tools
            </Label>
            <Button variant="outline" size="sm" onClick={addTool}>
              <Plus className="h-4 w-4 mr-1" />
              Add Tool
            </Button>
          </div>

          {tools.length > 0 && (
            <div className="space-y-3">
              {tools.map((tool, index) => (
                <Card key={tool.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Tool name (e.g., search_web)"
                        value={tool.name}
                        onChange={(e) => updateTool(index, { name: e.target.value })}
                      />
                      <Input
                        placeholder="Description"
                        value={tool.description}
                        onChange={(e) => updateTool(index, { description: e.target.value })}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTool(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button onClick={handleSave} disabled={saving || !name.trim() || !role.trim()}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Agent'}
          </Button>
          {agent && onDeploy && (
            <Button variant="secondary" onClick={() => onDeploy(agent)}>
              <Rocket className="h-4 w-4 mr-2" />
              Deploy API
            </Button>
          )}
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
