import { AgentCapabilities } from 'librechat-data-provider';
import { buildCatalog } from '../catalog';
import type { BuildCatalogInputs } from '../catalog';

const emptyInputs: BuildCatalogInputs = {
  agentsConfig: { capabilities: [] },
  regularTools: [],
  mcpServersMap: new Map(),
  skills: [],
  actions: [],
  permissions: { mcp: true, skills: true },
};

describe('buildCatalog', () => {
  test('returns empty when nothing is enabled', () => {
    expect(buildCatalog(emptyInputs)).toEqual([]);
  });

  test('emits built-in items only for capabilities the admin enabled', () => {
    const items = buildCatalog({
      ...emptyInputs,
      agentsConfig: {
        capabilities: [AgentCapabilities.execute_code, AgentCapabilities.web_search],
      },
    });
    expect(items.filter((i) => i.kind === 'builtin').map((i) => i.id)).toEqual([
      AgentCapabilities.execute_code,
      AgentCapabilities.web_search,
    ]);
  });

  test('hides MCP items when the user lacks MCP permission', () => {
    const map = new Map();
    map.set('srv', { serverName: 'srv', isConfigured: true, tools: [] });
    const items = buildCatalog({
      ...emptyInputs,
      mcpServersMap: map,
      permissions: { mcp: false, skills: true },
    });
    expect(items.find((i) => i.kind === 'mcp')).toBeUndefined();
  });

  test('emits MCP items with tool counts', () => {
    const map = new Map();
    map.set('everything', {
      serverName: 'everything',
      isConfigured: true,
      tools: [{}, {}, {}],
    });
    const items = buildCatalog({ ...emptyInputs, mcpServersMap: map });
    const mcp = items.find((i) => i.kind === 'mcp');
    expect(mcp).toBeDefined();
    if (mcp?.kind === 'mcp') {
      expect(mcp.toolCount).toBe(3);
      expect(mcp.id).toBe('everything');
    }
  });

  test('emits skill items when permission granted', () => {
    const items = buildCatalog({
      ...emptyInputs,
      skills: [{ _id: 's1', name: 'Reviewer', description: 'Reviews', category: 'code' }] as never,
    });
    const skill = items.find((i) => i.kind === 'skill');
    expect(skill?.name).toBe('Reviewer');
  });

  test('emits tool items', () => {
    const items = buildCatalog({
      ...emptyInputs,
      regularTools: [{ pluginKey: 'dalle', name: 'DALL-E', description: 'Images' }] as never,
    });
    const tool = items.find((i) => i.kind === 'tool');
    expect(tool?.id).toBe('dalle');
  });

  test('emits action items with endpoint counts', () => {
    const items = buildCatalog({
      ...emptyInputs,
      actions: [
        {
          action_id: 'a1',
          metadata: { domain: 'linear.app', oauth_client_id: 'x' },
          settings: { paths: { '/issues': {}, '/teams': {} } },
        },
      ] as never,
    });
    const action = items.find((i) => i.kind === 'action');
    expect(action?.id).toBe('a1');
    if (action?.kind === 'action') {
      expect(action.endpointCount).toBe(2);
    }
  });

  test('returns items in stable order: builtin -> mcp -> tool -> skill -> action', () => {
    const map = new Map();
    map.set('srv', { serverName: 'srv', isConfigured: true, tools: [] });
    const items = buildCatalog({
      ...emptyInputs,
      agentsConfig: { capabilities: [AgentCapabilities.execute_code] },
      regularTools: [{ pluginKey: 't1', name: 'T1', description: '' }] as never,
      mcpServersMap: map,
      skills: [{ _id: 's1', name: 'S1', description: '' }] as never,
      actions: [{ action_id: 'a1', metadata: { domain: 'd' }, settings: { paths: {} } }] as never,
    });
    expect(items.map((i) => i.kind)).toEqual(['builtin', 'mcp', 'tool', 'skill', 'action']);
  });
});
