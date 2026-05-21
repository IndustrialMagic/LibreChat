import { useState, useMemo, useId, useCallback, useRef } from 'react';
import { X, Plus, Wrench, Workflow, Server, Sparkles } from 'lucide-react';
import { Switch, DropdownPopup, useToastContext } from '@librechat/client';
import * as Ariakit from '@ariakit/react/menu';
import { useFormContext, useWatch, Controller } from 'react-hook-form';
import { PermissionTypes, Permissions, EModelEndpoint } from 'librechat-data-provider';
import type { AgentForm } from '~/common';
import type { TranslationKeys } from '~/hooks/useLocalize';
import { Panel, isEphemeralAgent } from '~/common';
import { ToolSelectDialog, MCPToolSelectDialog } from '~/components/Tools';
import { SkillSelectDialog } from '~/components/Skills/dialogs';
import useAgentCapabilities from '~/hooks/Agents/useAgentCapabilities';
import { useListSkillsQuery } from '~/data-provider';
import { useAgentPanelContext } from '~/Providers';
import { useLocalize, useVisibleTools, useHasAccess } from '~/hooks';
import Action from '~/components/SidePanel/Builder/Action';
import UninitializedMCPTool from './UninitializedMCPTool';
import UnconfiguredMCPTool from './UnconfiguredMCPTool';
import AgentTool from './AgentTool';
import MCPTool from './MCPTool';
import Section from './Section';
import { cn } from '~/utils';

type ExtensionKind = 'all' | 'tools' | 'actions' | 'mcp' | 'skills';

interface ExtensionsProps {
  agentId: string;
}

export default function Extensions({ agentId }: ExtensionsProps) {
  const localize = useLocalize();
  const menuId = useId();
  const addMenuId = useId();
  const { showToast } = useToastContext();
  const { control, getValues, setValue } = useFormContext<AgentForm>();
  const {
    actions,
    setAction,
    regularTools,
    agentsConfig,
    availableMCPServers,
    mcpServersMap,
    setActivePanel,
  } = useAgentPanelContext();

  const tools = useWatch({ control, name: 'tools' });
  const skills = useWatch({ control, name: 'skills' });
  const skillsActive = useWatch({ control, name: 'skills_enabled' });

  const [filter, setFilter] = useState<ExtensionKind>('all');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [showToolDialog, setShowToolDialog] = useState(false);
  const [showMCPDialog, setShowMCPDialog] = useState(false);
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const chipGroupRef = useRef<HTMLDivElement>(null);

  const setChipShifts = useCallback((activeIdx: number | null, phase: 'in' | 'out') => {
    const root = chipGroupRef.current;
    if (!root) return;
    const cs = getComputedStyle(document.documentElement);
    const num = (name: string, fallback: number) => {
      const v = parseFloat(cs.getPropertyValue(name));
      return Number.isFinite(v) ? v : fallback;
    };
    const ease = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;

    const lift = num('--avatar-lift', -3);
    const falloff = num('--avatar-falloff', 0.45);
    const scale = num('--avatar-scale', 1.04);
    const tf =
      phase === 'out'
        ? ease('--avatar-ease-out', 'cubic-bezier(0.34, 3.85, 0.64, 1)')
        : ease('--avatar-ease-in', 'cubic-bezier(0.22, 1, 0.36, 1)');

    const chips = root.querySelectorAll<HTMLElement>('.t-avatar');
    chips.forEach((el, i) => {
      el.style.transitionTimingFunction = tf;
      if (activeIdx == null) {
        el.style.setProperty('--shift', '0px');
        el.style.setProperty('--scale-active', '1');
        return;
      }
      const d = Math.abs(i - activeIdx);
      el.style.setProperty('--shift', (lift * Math.pow(falloff, d)).toFixed(3) + 'px');
      el.style.setProperty('--scale-active', i === activeIdx ? String(scale) : '1');
    });
  }, []);

  const { toolsEnabled, actionsEnabled, skillsEnabled } = useAgentCapabilities(
    agentsConfig?.capabilities,
  );

  const hasSkillsAccess = useHasAccess({
    permissionType: PermissionTypes.SKILLS,
    permission: Permissions.USE,
  });
  const hasMcpAccess = useHasAccess({
    permissionType: PermissionTypes.MCP_SERVERS,
    permission: Permissions.USE,
  });

  const showSkills = hasSkillsAccess && skillsEnabled === true;
  const hasMCP = hasMcpAccess && availableMCPServers != null && availableMCPServers.length > 0;

  const { data: skillsData } = useListSkillsQuery({ limit: 100 }, { enabled: showSkills });
  const skillsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const skill of skillsData?.skills ?? []) {
      map.set(skill._id, skill.name);
    }
    return map;
  }, [skillsData?.skills]);

  const { toolIds, mcpServerNames } = useVisibleTools(tools, regularTools, mcpServersMap);
  const agentActions = useMemo(
    () => (actions ?? []).filter((a) => a.agent_id === agentId),
    [actions, agentId],
  );

  const counts = useMemo(
    () => ({
      tools: toolIds.length,
      actions: agentActions.length,
      mcp: mcpServerNames.length,
      skills: skills?.length ?? 0,
    }),
    [toolIds.length, agentActions.length, mcpServerNames.length, skills?.length],
  );
  const total = counts.tools + counts.actions + counts.mcp + counts.skills;

  const handleAddActions = useCallback(() => {
    if (isEphemeralAgent(agentId)) {
      showToast({
        message: localize('com_assistants_actions_disabled'),
        status: 'warning',
      });
      return;
    }
    setActivePanel(Panel.actions);
  }, [agentId, setActivePanel, showToast, localize]);

  const addMenuItems = useMemo(() => {
    const items: Array<{
      label: string;
      onClick: () => void;
      icon: React.ReactNode;
      disabled?: boolean;
    }> = [];
    if (toolsEnabled === true) {
      items.push({
        label: localize('com_assistants_add_tools'),
        onClick: () => setShowToolDialog(true),
        icon: <Wrench className="h-4 w-4" aria-hidden="true" />,
      });
    }
    if (actionsEnabled === true) {
      items.push({
        label: localize('com_assistants_add_actions'),
        onClick: handleAddActions,
        icon: <Workflow className="h-4 w-4" aria-hidden="true" />,
        disabled: isEphemeralAgent(agentId),
      });
    }
    if (hasMCP) {
      items.push({
        label: localize('com_assistants_add_mcp_server_tools'),
        onClick: () => setShowMCPDialog(true),
        icon: <Server className="h-4 w-4" aria-hidden="true" />,
      });
    }
    if (showSkills) {
      items.push({
        label: localize('com_ui_add_skills'),
        onClick: () => setShowSkillDialog(true),
        icon: <Sparkles className="h-4 w-4" aria-hidden="true" />,
        disabled: skillsActive !== true,
      });
    }
    return items;
  }, [
    toolsEnabled,
    actionsEnabled,
    hasMCP,
    showSkills,
    skillsActive,
    agentId,
    localize,
    handleAddActions,
  ]);

  if (toolsEnabled !== true && actionsEnabled !== true && !hasMCP && !showSkills) {
    return null;
  }

  const filterChips: Array<{
    key: ExtensionKind;
    label: TranslationKeys;
    count: number;
    show: boolean;
  }> = [
    { key: 'all', label: 'com_ui_extensions_filter_all', count: total, show: true },
    {
      key: 'tools',
      label: 'com_ui_extensions_filter_tools',
      count: counts.tools,
      show: toolsEnabled === true,
    },
    {
      key: 'actions',
      label: 'com_ui_extensions_filter_actions',
      count: counts.actions,
      show: actionsEnabled === true,
    },
    {
      key: 'mcp',
      label: 'com_ui_extensions_filter_mcp',
      count: counts.mcp,
      show: hasMCP,
    },
    {
      key: 'skills',
      label: 'com_ui_extensions_filter_skills',
      count: counts.skills,
      show: showSkills,
    },
  ];

  const visibleChips = filterChips.filter((c) => c.show);
  const populatedKinds = (['tools', 'actions', 'mcp', 'skills'] as const).filter(
    (k) => counts[k] > 0,
  );
  const showChips = populatedKinds.length >= 2;
  const showSection: Record<ExtensionKind, boolean> = {
    all: true,
    tools: filter === 'all' || filter === 'tools',
    actions: filter === 'all' || filter === 'actions',
    mcp: filter === 'all' || filter === 'mcp',
    skills: filter === 'all' || filter === 'skills',
  };

  const handleRemoveSkill = (skillId: string) => {
    const current: string[] = getValues('skills') ?? [];
    setValue(
      'skills',
      current.filter((id) => id !== skillId),
      { shouldDirty: true },
    );
  };

  return (
    <Section
      title={localize('com_ui_extensions')}
      defaultOpen={true}
      badge={
        total > 0 ? (
          <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-surface-tertiary px-1.5 text-xs font-medium text-text-secondary">
            {total}
          </span>
        ) : null
      }
      rightSlot={
        <DropdownPopup
          portal={true}
          mountByState={true}
          unmountOnHide={true}
          preserveTabOrder={true}
          isOpen={isAddMenuOpen}
          setIsOpen={setIsAddMenuOpen}
          menuId={addMenuId}
          className="z-30"
          trigger={
            <Ariakit.MenuButton
              id={menuId}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-primary"
              aria-label={localize('com_ui_extensions_add')}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              {localize('com_ui_add')}
            </Ariakit.MenuButton>
          }
          items={addMenuItems.map((item) => ({
            label: item.label,
            onClick: item.disabled ? () => {} : item.onClick,
            icon: item.icon,
            disabled: item.disabled,
          }))}
        />
      }
    >
      {showChips && (
        <div
          ref={chipGroupRef}
          role="tablist"
          aria-label={localize('com_ui_extensions')}
          className="mb-2 flex flex-wrap gap-x-0.5 gap-y-1"
          onMouseLeave={() => setChipShifts(null, 'out')}
        >
          {visibleChips
            .filter((c) => c.key === 'all' || c.count > 0)
            .map((chip, idx) => {
              const isActive = filter === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilter(chip.key)}
                  onMouseEnter={() => setChipShifts(idx, 'in')}
                  className={cn(
                    't-avatar inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-surface-tertiary text-text-primary'
                      : 'text-text-secondary hover:bg-surface-secondary',
                  )}
                >
                  <span>{localize(chip.label)}</span>
                  {chip.count > 0 && (
                    <span
                      className={cn(
                        'text-[10px] tabular-nums',
                        isActive ? 'text-text-secondary' : 'text-text-tertiary',
                      )}
                    >
                      {chip.count}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      )}

      {showSkills && (filter === 'all' || filter === 'skills') && (
        <div className="mb-2 flex items-center justify-between rounded-md bg-surface-secondary px-2 py-1.5">
          <label
            htmlFor="skills_enabled_inline"
            className="text-xs font-medium text-text-secondary"
          >
            {localize('com_ui_skills_enable_toggle')}
          </label>
          <Controller
            name="skills_enabled"
            control={control}
            render={({ field }) => (
              <Switch
                id="skills_enabled_inline"
                checked={field.value === true}
                onCheckedChange={(value: boolean) => field.onChange(Boolean(value))}
                data-testid="skills_enabled"
                aria-label={localize('com_ui_skills_enable_toggle')}
              />
            )}
          />
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        {showSection.tools &&
          toolIds.map((toolId, i) => {
            const tool = regularTools?.find((t) => t.pluginKey === toolId);
            if (!tool) return null;
            return (
              <AgentTool
                key={`${toolId}-${i}-${agentId}`}
                tool={toolId}
                regularTools={regularTools}
                agent_id={agentId}
              />
            );
          })}

        {showSection.mcp &&
          mcpServerNames?.map((mcpServerName) => {
            const serverInfo = mcpServersMap.get(mcpServerName);
            if (!serverInfo?.isConfigured) {
              return (
                <UnconfiguredMCPTool
                  key={`${mcpServerName}-${agentId}`}
                  serverName={mcpServerName}
                />
              );
            }
            if (!serverInfo) {
              return null;
            }
            if (serverInfo.tools && serverInfo.tools.length > 0) {
              return (
                <MCPTool key={`${serverInfo.serverName}-${agentId}`} serverInfo={serverInfo} />
              );
            }
            return (
              <UninitializedMCPTool
                key={`${serverInfo.serverName}-${agentId}`}
                serverInfo={serverInfo}
              />
            );
          })}

        {showSection.actions &&
          agentActions.map((action, i) => (
            <Action
              key={`action-${i}`}
              action={action}
              onClick={() => {
                setAction(action);
                setActivePanel(Panel.actions);
              }}
            />
          ))}

        {showSection.skills &&
          (skills ?? []).map((skillId) => {
            const skillName = skillsMap.get(skillId);
            if (!skillName) return null;
            return (
              <SkillItem
                key={skillId}
                skillId={skillId}
                skillName={skillName}
                onRemove={handleRemoveSkill}
                disabled={skillsActive !== true}
              />
            );
          })}

        {total === 0 && (
          <button
            type="button"
            onClick={() => setIsAddMenuOpen(true)}
            className="group flex w-full flex-col items-center gap-1 rounded-lg border border-dashed border-border-light px-2 py-4 text-text-tertiary transition-colors hover:border-border-medium hover:bg-surface-secondary hover:text-text-secondary"
            aria-label={localize('com_ui_extensions_add')}
          >
            <Plus
              className="h-4 w-4 transition-transform group-hover:scale-110"
              aria-hidden="true"
            />
            <span className="text-xs">{localize('com_ui_extensions_empty')}</span>
          </button>
        )}
      </div>

      <ToolSelectDialog
        isOpen={showToolDialog}
        setIsOpen={setShowToolDialog}
        endpoint={EModelEndpoint.agents}
      />
      {hasMCP && (
        <MCPToolSelectDialog
          agentId={agentId}
          isOpen={showMCPDialog}
          mcpServerNames={mcpServerNames}
          setIsOpen={setShowMCPDialog}
          endpoint={EModelEndpoint.agents}
        />
      )}
      {showSkills && <SkillSelectDialog isOpen={showSkillDialog} setIsOpen={setShowSkillDialog} />}
    </Section>
  );
}

interface SkillItemProps {
  skillId: string;
  skillName: string;
  onRemove: (skillId: string) => void;
  disabled?: boolean;
}

function SkillItem({ skillId, skillName, onRemove, disabled }: SkillItemProps) {
  const localize = useLocalize();
  return (
    <div
      className={cn(
        'group flex w-full items-center gap-1 rounded-lg p-1 text-sm hover:bg-surface-secondary',
        disabled && 'opacity-60',
      )}
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-surface-secondary text-text-secondary">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="grow truncate px-2 py-1.5 text-text-primary" title={skillName}>
        {skillName}
      </div>
      <button
        type="button"
        onClick={() => onRemove(skillId)}
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-text-secondary opacity-0 transition hover:bg-surface-tertiary hover:text-text-primary focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring group-hover:opacity-100"
        aria-label={localize('com_ui_remove_skill_var', { 0: skillName })}
        disabled={disabled}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
