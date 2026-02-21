import { createOpenAI } from '@ai-sdk/openai';
import { Agent, Tool } from '@/types/agent';

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    'X-Title': process.env.SITE_NAME || 'AgentForge',
  },
});

export function getModel(modelId: string) {
  return openrouter.chat(modelId);
}

export function buildSystemPrompt(agent: Agent): string {
  let prompt = `You are ${agent.name}, a ${agent.role}.\n\n`;
  
  if (agent.systemPrompt) {
    prompt += `${agent.systemPrompt}\n\n`;
  }

  if (agent.tools.length > 0) {
    prompt += `You have access to the following tools:\n`;
    agent.tools.forEach(tool => {
      prompt += `- ${tool.name}: ${tool.description}\n`;
    });
    prompt += `\nUse these tools when appropriate to help the user.\n`;
  }

  return prompt.trim();
}

export function toolsToSdkTools(tools: Tool[]): Record<string, any> {
  const sdkTools: Record<string, any> = {};
  
  tools.forEach(tool => {
    sdkTools[tool.name] = {
      description: tool.description,
      parameters: tool.parameters || {},
      execute: async (args: any) => {
        return JSON.stringify({ 
          tool: tool.name, 
          args, 
          result: 'Tool executed (mock - implement real execution logic)',
          timestamp: new Date().toISOString()
        });
      },
    };
  });

  return sdkTools;
}

export { openrouter };
