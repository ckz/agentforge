import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Agent } from '@/types/agent';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const agents = db.agents.getAll();
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Get agents error:', error);
    return NextResponse.json({ error: 'Failed to get agents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, role, systemPrompt, model, tools, temperature } = body;

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const agent: Agent = {
      id: id || nanoid(),
      name,
      role,
      systemPrompt: systemPrompt || '',
      model: model || 'openai/gpt-4o-mini',
      tools: tools || [],
      temperature: temperature ?? 0.7,
      createdAt: now,
      updatedAt: now,
    };

    const saved = db.agents.create(agent);
    return NextResponse.json(saved);
  } catch (error) {
    console.error('Create agent error:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    const updated = db.agents.update(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update agent error:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    const deleted = db.agents.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete agent error:', error);
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }
}
