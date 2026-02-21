import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const { agentId } = await req.json();

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    const agent = db.agents.getById(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const existingDeployment = db.deployments.getByAgentId(agentId);
    if (existingDeployment) {
      return NextResponse.json({
        apiKey: existingDeployment.apiKey,
        endpoint: `/api/deploy/${agentId}`,
        existing: true,
      });
    }

    const apiKey = nanoid(32);
    const newDeployment = {
      id: nanoid(),
      agentId,
      apiKey,
      isActive: true,
      requestCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.deployments.create(newDeployment);

    return NextResponse.json({
      apiKey,
      endpoint: `/api/deploy/${agentId}`,
      existing: false,
    });
  } catch (error) {
    console.error('Create deployment error:', error);
    return NextResponse.json({ error: 'Failed to create deployment' }, { status: 500 });
  }
}
