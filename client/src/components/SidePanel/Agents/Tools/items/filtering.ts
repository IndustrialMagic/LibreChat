import type { AgentItem, ItemFilter } from './types';

function getCategory(item: AgentItem): string | undefined {
  if (item.kind === 'skill') {
    return (item.skill as { category?: string }).category;
  }
  return undefined;
}

function matchesSearch(item: AgentItem, search: string): boolean {
  if (!search) return true;
  const term = search.toLowerCase();
  return item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term);
}

function matchesKind(item: AgentItem, kind: ItemFilter['kind']): boolean {
  if (!kind || kind === 'all') return true;
  return item.kind === kind;
}

function matchesCategory(item: AgentItem, category: ItemFilter['category']): boolean {
  if (!category || category === 'all') return true;
  return getCategory(item) === category;
}

export function applyFilter(items: AgentItem[], filter: ItemFilter): AgentItem[] {
  return items.filter(
    (item) =>
      matchesSearch(item, filter.search ?? '') &&
      matchesKind(item, filter.kind) &&
      matchesCategory(item, filter.category),
  );
}
