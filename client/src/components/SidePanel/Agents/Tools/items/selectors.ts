import type { Action } from 'librechat-data-provider';
import type { AgentItem, AgentItemKind } from './types';

export interface FormSelection {
  execute_code: boolean;
  web_search: boolean;
  file_search: boolean;
  artifacts: string | undefined;
  tools: string[];
  skills: string[];
  context_files: Array<[string, unknown]>;
  knowledge_files: Array<[string, unknown]>;
  code_files: Array<[string, unknown]>;
}

const KIND_ORDER: AgentItemKind[] = ['builtin', 'mcp', 'tool', 'skill', 'action'];
const MCP_PREFIX = 'mcp_';

function isBuiltinSelected(item: AgentItem, form: FormSelection): boolean {
  if (item.kind !== 'builtin') return false;
  switch (item.id) {
    case 'execute_code':
      return form.execute_code || form.code_files.length > 0;
    case 'web_search':
      return form.web_search;
    case 'file_search':
      return form.file_search || form.knowledge_files.length > 0;
    case 'artifacts':
      return Boolean(form.artifacts);
    case 'context':
      return form.context_files.length > 0;
    default:
      return false;
  }
}

function isToolSelected(item: AgentItem, form: FormSelection): boolean {
  if (item.kind !== 'tool') return false;
  return form.tools.includes(item.id);
}

function isMcpSelected(item: AgentItem, form: FormSelection): boolean {
  if (item.kind !== 'mcp') return false;
  const prefixed = `${MCP_PREFIX}${item.id}`;
  return form.tools.some(
    (t) =>
      t === item.id || t === prefixed || t.startsWith(`${prefixed}_`) || t.endsWith(`_${prefixed}`),
  );
}

function isSkillSelected(item: AgentItem, form: FormSelection): boolean {
  if (item.kind !== 'skill') return false;
  return form.skills.includes(item.id);
}

function isActionSelected(item: AgentItem, agentActions: Action[]): boolean {
  if (item.kind !== 'action') return false;
  return agentActions.some((a) => a.action_id === item.id);
}

export function deriveSelectedItems(
  form: FormSelection,
  catalog: AgentItem[],
  agentActions: Action[],
): AgentItem[] {
  const selected = catalog.filter((item) => {
    if (item.kind === 'builtin') return isBuiltinSelected(item, form);
    if (item.kind === 'tool') return isToolSelected(item, form);
    if (item.kind === 'mcp') return isMcpSelected(item, form);
    if (item.kind === 'skill') return isSkillSelected(item, form);
    if (item.kind === 'action') return isActionSelected(item, agentActions);
    return false;
  });

  return selected.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
}
