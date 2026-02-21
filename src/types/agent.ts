import { z } from 'zod';

export const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.string(), z.any()).optional(),
});

export type Tool = z.infer<typeof ToolSchema>;

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  systemPrompt: z.string().default(''),
  model: z.string().default('openai/gpt-4o-mini'),
  tools: z.array(ToolSchema).default([]),
  temperature: z.number().min(0).max(2).default(0.7),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Agent = z.infer<typeof AgentSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string(),
  toolCalls: z.array(z.any()).optional(),
  toolCallId: z.string().optional(),
  createdAt: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  messages: z.array(MessageSchema),
  createdAt: z.string(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export const DeploymentSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  apiKey: z.string(),
  isActive: z.boolean().default(true),
  requestCount: z.number().default(0),
  createdAt: z.string(),
});

export type Deployment = z.infer<typeof DeploymentSchema>;

export const OPENROUTER_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'Mistral' },
] as const;

export const AGENT_TEMPLATES: Pick<Agent, 'name' | 'role' | 'systemPrompt' | 'model' | 'tools'>[] = [
  {
    name: 'Research Agent',
    role: 'Information Researcher',
    systemPrompt: 'You are a thorough research assistant. Your job is to find accurate, well-sourced information on any topic. Always cite your sources and be comprehensive in your analysis.',
    model: 'anthropic/claude-3.5-sonnet',
    tools: [],
  },
  {
    name: 'Code Reviewer',
    role: 'Senior Software Engineer',
    systemPrompt: 'You are an expert code reviewer. Analyze code for bugs, security vulnerabilities, performance issues, and best practices. Provide constructive feedback with specific suggestions.',
    model: 'openai/gpt-4o',
    tools: [],
  },
  {
    name: 'Data Analyst',
    role: 'Data Scientist',
    systemPrompt: 'You are a skilled data analyst. Help users understand their data, identify patterns, and provide actionable insights. Explain statistical concepts clearly.',
    model: 'openai/gpt-4o-mini',
    tools: [],
  },
  {
    name: 'Creative Writer',
    role: 'Content Creator',
    systemPrompt: 'You are a creative writing assistant. Help craft engaging content, stories, marketing copy, and more. Adapt your tone and style to match the user needs.',
    model: 'anthropic/claude-3.5-sonnet',
    tools: [],
  },
  {
    name: 'Technical Support',
    role: 'Support Specialist',
    systemPrompt: 'You are a helpful technical support agent. Diagnose problems step by step, provide clear instructions, and escalate complex issues appropriately.',
    model: 'openai/gpt-4o-mini',
    tools: [],
  },
];
