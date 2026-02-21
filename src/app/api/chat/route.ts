import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { getModel, buildSystemPrompt, toolsToSdkTools } from '@/lib/openrouter';
import db from '@/lib/db';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const { agentId, messages: inputMessages } = await req.json();

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    const agent = await db.agents.getById(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const model = getModel(agent.model);
    const systemPrompt = buildSystemPrompt(agent);
    const tools = toolsToSdkTools(agent.tools);

    const result = streamText({
      model,
      system: systemPrompt,
      messages: inputMessages,
      tools: Object.keys(tools).length > 0 ? tools : undefined,
      temperature: agent.temperature,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    );
  }
}
