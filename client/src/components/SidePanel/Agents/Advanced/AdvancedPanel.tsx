import { useMemo, useState } from 'react';
import { ChevronLeft, Check, Copy } from 'lucide-react';
import { AgentCapabilities, PermissionTypes, Permissions } from 'librechat-data-provider';
import { useFormContext, Controller } from 'react-hook-form';
import { Switch, TooltipAnchor, useToastContext } from '@librechat/client';
import type { AgentForm } from '~/common';
import { useAgentPanelContext } from '~/Providers';
import AgentSubagents from './AgentSubagents';
import MaxAgentSteps from './MaxAgentSteps';
import AgentHandoffs from './AgentHandoffs';
import { useLocalize, useHasAccess } from '~/hooks';
import AgentChain from './AgentChain';
import { Panel } from '~/common';

export default function AdvancedPanel() {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const methods = useFormContext<AgentForm>();
  const { control, watch } = methods;
  const currentAgentId = watch('id');
  const [copied, setCopied] = useState(false);

  const { agentsConfig, setActivePanel } = useAgentPanelContext();

  const handleCopyAgentId = async () => {
    if (!currentAgentId) return;
    try {
      await navigator.clipboard.writeText(currentAgentId);
      setCopied(true);
      showToast({ message: localize('com_ui_agent_id_copied'), status: 'success' });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast({ message: localize('com_ui_error'), status: 'error' });
    }
  };
  const chainEnabled = useMemo(
    () => agentsConfig?.capabilities.includes(AgentCapabilities.chain) ?? false,
    [agentsConfig],
  );
  const subagentsEnabled = useMemo(
    () => agentsConfig?.capabilities.includes(AgentCapabilities.subagents) ?? false,
    [agentsConfig],
  );
  const skillsEnabled = useMemo(
    () => agentsConfig?.capabilities.includes(AgentCapabilities.skills) ?? false,
    [agentsConfig],
  );
  const hasSkillsAccess = useHasAccess({
    permissionType: PermissionTypes.SKILLS,
    permission: Permissions.USE,
  });
  const showSkillsKillSwitch = skillsEnabled && hasSkillsAccess;

  return (
    <div className="mb-1 flex w-full flex-col gap-2 text-sm">
      <header className="grid grid-cols-[auto_1fr_auto] items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setActivePanel(Panel.builder)}
          aria-label={localize('com_ui_back_to_builder')}
          className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border-light text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-primary"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
        <h2 className="text-center text-base font-semibold text-text-primary">
          {localize('com_ui_advanced_settings')}
        </h2>
        <span aria-hidden="true" className="h-10 w-10" />
      </header>
      <div className="flex flex-col gap-4 px-2 pb-2">
        {currentAgentId && (
          <div className="flex flex-col gap-1">
            <label
              htmlFor="agent-id-display"
              className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary"
            >
              {localize('com_ui_agent_id')}
            </label>
            <div className="flex items-center gap-1 rounded-lg border border-border-light bg-surface-secondary px-2 py-1.5">
              <code
                id="agent-id-display"
                className="flex-1 truncate font-mono text-xs text-text-secondary"
                title={currentAgentId}
              >
                {currentAgentId}
              </code>
              <TooltipAnchor
                description={localize('com_ui_agent_id_copy')}
                side="top"
                role="button"
                aria-label={localize('com_ui_agent_id_copy')}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-primary"
                onClick={handleCopyAgentId}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCopyAgentId();
                  }
                }}
              >
                <span className="t-icon-swap" data-state={copied ? 'b' : 'a'} aria-hidden="true">
                  <span className="t-icon" data-icon="a">
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="t-icon" data-icon="b">
                    <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                  </span>
                </span>
              </TooltipAnchor>
            </div>
          </div>
        )}
        <MaxAgentSteps />
        {subagentsEnabled && (
          <Controller
            name="subagents"
            control={control}
            render={({ field }) => <AgentSubagents field={field} currentAgentId={currentAgentId} />}
          />
        )}
        <Controller
          name="edges"
          control={control}
          defaultValue={[]}
          render={({ field }) => <AgentHandoffs field={field} currentAgentId={currentAgentId} />}
        />
        {chainEnabled && (
          <Controller
            name="agent_ids"
            control={control}
            defaultValue={[]}
            render={({ field }) => <AgentChain field={field} currentAgentId={currentAgentId} />}
          />
        )}
        {showSkillsKillSwitch && (
          <div className="rounded-xl border border-border-light p-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="skills_enabled_killswitch"
                className="text-sm font-medium text-text-primary"
              >
                {localize('com_ui_tools_skills_enabled_kill_switch')}
              </label>
              <Controller
                name="skills_enabled"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="skills_enabled_killswitch"
                    checked={field.value === true}
                    onCheckedChange={(v: boolean) => field.onChange(Boolean(v))}
                    aria-label={localize('com_ui_tools_skills_enabled_kill_switch')}
                  />
                )}
              />
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              {localize('com_ui_tools_skills_enabled_kill_switch_hint')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
