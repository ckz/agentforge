import { Redis } from '@upstash/redis';
import { Agent, Conversation, Deployment } from '@/types/agent';

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

let redis: Redis | null = null;
if (hasRedis) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

const memoryStore = {
  agents: new Map<string, Agent>(),
  agentsList: new Set<string>(),
  conversations: new Map<string, Conversation>(),
  deployments: new Map<string, Deployment>(),
  deploymentsByAgent: new Map<string, string>(),
};

const KEYS = {
  AGENTS_LIST: 'agentforge:agents:list',
  AGENT: (id: string) => `agentforge:agent:${id}`,
  CONVERSATION: (id: string) => `agentforge:conversation:${id}`,
  DEPLOYMENT: (id: string) => `agentforge:deployment:${id}`,
  DEPLOYMENT_BY_AGENT: (agentId: string) => `agentforge:deployment:agent:${agentId}`,
};

export const db = {
  agents: {
    getAll: async (): Promise<Agent[]> => {
      if (redis) {
        const ids = await redis.smembers(KEYS.AGENTS_LIST);
        if (!ids || ids.length === 0) return [];
        const agents = await Promise.all(
          (ids as string[]).map((id) => redis!.get<Agent>(KEYS.AGENT(id)))
        );
        return agents
          .filter((a): a is Agent => a !== null)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
      
      return Array.from(memoryStore.agents.values())
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    },

    getById: async (id: string): Promise<Agent | null> => {
      if (redis) {
        return await redis.get<Agent>(KEYS.AGENT(id));
      }
      return memoryStore.agents.get(id) || null;
    },

    create: async (agent: Agent): Promise<Agent> => {
      if (redis) {
        await redis.set(KEYS.AGENT(agent.id), agent);
        await redis.sadd(KEYS.AGENTS_LIST, agent.id);
      } else {
        memoryStore.agents.set(agent.id, agent);
        memoryStore.agentsList.add(agent.id);
      }
      return agent;
    },

    update: async (id: string, updates: Partial<Agent>): Promise<Agent | null> => {
      const existing = await db.agents.getById(id);
      if (!existing) return null;

      const updated: Agent = { 
        ...existing, 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      
      if (redis) {
        await redis.set(KEYS.AGENT(id), updated);
      } else {
        memoryStore.agents.set(id, updated);
      }
      return updated;
    },

    delete: async (id: string): Promise<boolean> => {
      if (redis) {
        const result = await redis.del(KEYS.AGENT(id));
        await redis.srem(KEYS.AGENTS_LIST, id);
        return result > 0;
      }
      memoryStore.agents.delete(id);
      memoryStore.agentsList.delete(id);
      return true;
    },
  },

  conversations: {
    getByAgentId: async (agentId: string): Promise<Conversation | null> => {
      if (redis) {
        const ids = await redis.smembers(KEYS.AGENTS_LIST);
        for (const id of ids as string[]) {
          const conv = await redis.get<Conversation>(KEYS.CONVERSATION(id));
          if (conv && conv.agentId === agentId) return conv;
        }
        return null;
      }
      
      for (const conv of memoryStore.conversations.values()) {
        if (conv.agentId === agentId) return conv;
      }
      return null;
    },

    save: async (conversation: Conversation): Promise<Conversation> => {
      if (redis) {
        await redis.set(KEYS.CONVERSATION(conversation.id), conversation);
      } else {
        memoryStore.conversations.set(conversation.id, conversation);
      }
      return conversation;
    },

    delete: async (id: string): Promise<boolean> => {
      if (redis) {
        const result = await redis.del(KEYS.CONVERSATION(id));
        return result > 0;
      }
      return memoryStore.conversations.delete(id);
    },
  },

  deployments: {
    getByAgentId: async (agentId: string): Promise<Deployment | null> => {
      if (redis) {
        const deploymentId = await redis.get<string>(KEYS.DEPLOYMENT_BY_AGENT(agentId));
        if (!deploymentId) return null;
        return await redis.get<Deployment>(KEYS.DEPLOYMENT(deploymentId));
      }
      
      const deploymentId = memoryStore.deploymentsByAgent.get(agentId);
      if (!deploymentId) return null;
      return memoryStore.deployments.get(deploymentId) || null;
    },

    create: async (deployment: Deployment): Promise<Deployment> => {
      if (redis) {
        await redis.set(KEYS.DEPLOYMENT(deployment.id), deployment);
        await redis.set(KEYS.DEPLOYMENT_BY_AGENT(deployment.agentId), deployment.id);
      } else {
        memoryStore.deployments.set(deployment.id, deployment);
        memoryStore.deploymentsByAgent.set(deployment.agentId, deployment.id);
      }
      return deployment;
    },

    incrementRequestCount: async (id: string): Promise<void> => {
      if (redis) {
        const deployment = await redis.get<Deployment>(KEYS.DEPLOYMENT(id));
        if (deployment) {
          deployment.requestCount += 1;
          await redis.set(KEYS.DEPLOYMENT(id), deployment);
        }
      } else {
        const deployment = memoryStore.deployments.get(id);
        if (deployment) {
          deployment.requestCount += 1;
        }
      }
    },

    toggleActive: async (id: string, isActive: boolean): Promise<void> => {
      if (redis) {
        const deployment = await redis.get<Deployment>(KEYS.DEPLOYMENT(id));
        if (deployment) {
          deployment.isActive = isActive;
          await redis.set(KEYS.DEPLOYMENT(id), deployment);
        }
      } else {
        const deployment = memoryStore.deployments.get(id);
        if (deployment) {
          deployment.isActive = isActive;
        }
      }
    },

    delete: async (id: string): Promise<boolean> => {
      if (redis) {
        const deployment = await redis.get<Deployment>(KEYS.DEPLOYMENT(id));
        if (deployment) {
          await redis.del(KEYS.DEPLOYMENT_BY_AGENT(deployment.agentId));
        }
        const result = await redis.del(KEYS.DEPLOYMENT(id));
        return result > 0;
      }
      
      const deployment = memoryStore.deployments.get(id);
      if (deployment) {
        memoryStore.deploymentsByAgent.delete(deployment.agentId);
      }
      return memoryStore.deployments.delete(id);
    },
  },
};

export default db;
