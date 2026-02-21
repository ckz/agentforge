import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { getModel, buildSystemPrompt } from '@/lib/openrouter';
import db from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    const deployment = await db.deployments.getByAgentId(id);
    if (!deployment) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    if (!deployment.isActive) {
      return NextResponse.json({ error: 'Deployment is inactive' }, { status: 403 });
    }

    if (apiKey !== deployment.apiKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const agent = await db.agents.getById(id);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    await db.deployments.incrementRequestCount(deployment.id);

    const model = getModel(agent.model);
    const systemPrompt = buildSystemPrompt(agent);

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      temperature: agent.temperature,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Deploy chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deployment = await db.deployments.getByAgentId(id);
    
    if (!deployment) {
      return NextResponse.json({ deployed: false });
    }

    return NextResponse.json({
      deployed: true,
      isActive: deployment.isActive,
      requestCount: deployment.requestCount,
      createdAt: deployment.createdAt,
    });
  } catch (error) {
    console.error('Get deployment error:', error);
    return NextResponse.json({ error: 'Failed to get deployment' }, { status: 500 });
  }
}
