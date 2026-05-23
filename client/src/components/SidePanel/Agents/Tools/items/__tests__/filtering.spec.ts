import { applyFilter } from '../filtering';
import type { AgentItem } from '../types';

const items: AgentItem[] = [
  {
    kind: 'builtin',
    id: 'execute_code',
    name: 'Code Interpreter',
    description: 'Run Python',
    iconKey: 'execute_code',
  },
  {
    kind: 'tool',
    id: 'dalle',
    name: 'DALL-E',
    description: 'Generate images',
    iconKey: 'tool',
    plugin: { pluginKey: 'dalle' } as never,
  },
  {
    kind: 'skill',
    id: 's1',
    name: 'Code Reviewer',
    description: 'Review PRs',
    iconKey: 'skill',
    skill: { _id: 's1', name: 'Code Reviewer', category: 'code' } as never,
  },
  {
    kind: 'skill',
    id: 's2',
    name: 'Marketing Email',
    description: 'Write emails',
    iconKey: 'skill',
    skill: { _id: 's2', name: 'Marketing Email', category: 'marketing' } as never,
  },
];

describe('applyFilter', () => {
  test('no filter returns all items', () => {
    expect(applyFilter(items, {}).length).toBe(4);
  });

  test('search filters by name', () => {
    const result = applyFilter(items, { search: 'code' });
    expect(result.map((i) => i.id)).toEqual(['execute_code', 's1']);
  });

  test('search is case-insensitive across name and description', () => {
    const result = applyFilter(items, { search: 'IMAGES' });
    expect(result.map((i) => i.id)).toEqual(['dalle']);
  });

  test('kind filter restricts to one type', () => {
    const result = applyFilter(items, { kind: 'skill' });
    expect(result.map((i) => i.id)).toEqual(['s1', 's2']);
  });

  test('"all" kind is equivalent to no filter', () => {
    expect(applyFilter(items, { kind: 'all' }).length).toBe(4);
  });

  test('category filters skills by their category', () => {
    const result = applyFilter(items, { category: 'marketing' });
    expect(result.map((i) => i.id)).toEqual(['s2']);
  });

  test('combined filters apply intersection', () => {
    const result = applyFilter(items, { kind: 'skill', search: 'code' });
    expect(result.map((i) => i.id)).toEqual(['s1']);
  });
});
