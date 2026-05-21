import { useMemo, useState } from 'react';
import { Switch } from '@librechat/client';
import { Code, Globe, Sparkles, FileText, FileSearch as FileSearchIcon } from 'lucide-react';
import { useFormContext, useWatch, Controller } from 'react-hook-form';
import { Tools, AuthType, ArtifactModes, AgentCapabilities } from 'librechat-data-provider';
import type { ReactNode, RefObject } from 'react';
import type { ExtendedFile, AgentForm } from '~/common';
import useAgentCapabilities from '~/hooks/Agents/useAgentCapabilities';
import { useVerifyAgentToolAuth } from '~/data-provider';
import { useAgentPanelContext } from '~/Providers';
import { useLocalize, useSearchApiKeyForm } from '~/hooks';
import ApiKeyDialog from './Search/ApiKeyDialog';
import CodeFiles from './Code/Files';
import FileContext from './FileContext';
import FileSearch from './FileSearch';
import Artifacts from './Artifacts';
import Section from './Section';
import { cn } from '~/utils';

interface ToggleRowProps {
  id: string;
  icon: ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (value: boolean) => void;
}

function ToggleRow({
  id,
  icon,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: ToggleRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-secondary',
        disabled && 'opacity-60',
      )}
    >
      <span
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-surface-secondary text-text-secondary"
        aria-hidden="true"
      >
        {icon}
      </span>
      <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer flex-col">
        <span className="truncate text-sm font-medium text-text-primary">{label}</span>
        {description && (
          <span className="line-clamp-1 text-xs text-text-tertiary">{description}</span>
        )}
      </label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={label}
        data-testid={id}
      />
    </div>
  );
}

interface ExpandableRowProps {
  id: string;
  icon: ReactNode;
  label: string;
  count: number;
  defaultOpen?: boolean;
  rightSlot?: ReactNode;
  children: ReactNode;
}

function ExpandableRow({
  id,
  icon,
  label,
  count,
  defaultOpen,
  rightSlot,
  children,
}: ExpandableRowProps) {
  const [open, setOpen] = useState(defaultOpen ?? count > 0);
  return (
    <div className="rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-secondary"
        aria-expanded={open}
        aria-controls={`${id}-content`}
      >
        <span
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-surface-secondary text-text-secondary"
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="flex-1 truncate text-sm font-medium text-text-primary">{label}</span>
        {count > 0 && (
          <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-xs text-text-secondary">
            {count}
          </span>
        )}
        {rightSlot}
        <span
          aria-hidden="true"
          className={cn(
            'flex h-4 w-4 items-center justify-center text-base leading-none text-text-tertiary transition-transform motion-reduce:transition-none',
            open && 'rotate-45',
          )}
          style={{
            transitionDuration: 'var(--resize-dur)',
            transitionTimingFunction: 'var(--resize-ease)',
          }}
        >
          +
        </span>
      </button>
      <div
        id={`${id}-content`}
        aria-hidden={!open}
        className="grid transition-[grid-template-rows,opacity] motion-reduce:transition-none"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
          opacity: open ? 1 : 0,
          transitionDuration: 'var(--resize-dur)',
          transitionTimingFunction: 'var(--resize-ease)',
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-1 px-2 pb-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

interface CapabilitiesProps {
  agentId: string;
  contextFiles: [string, ExtendedFile][];
  knowledgeFiles: [string, ExtendedFile][];
  codeFiles: [string, ExtendedFile][];
}

export default function Capabilities({
  agentId,
  contextFiles,
  knowledgeFiles,
  codeFiles,
}: CapabilitiesProps) {
  const localize = useLocalize();
  const { agentsConfig } = useAgentPanelContext();
  const { control, setValue } = useFormContext<AgentForm>();
  const { codeEnabled, contextEnabled, artifactsEnabled, webSearchEnabled, fileSearchEnabled } =
    useAgentCapabilities(agentsConfig?.capabilities);

  const executeCode = useWatch({ control, name: AgentCapabilities.execute_code });
  const artifactsMode = useWatch({ control, name: AgentCapabilities.artifacts });
  const webSearch = useWatch({ control, name: AgentCapabilities.web_search });

  const hasAnyCapability =
    codeEnabled === true ||
    webSearchEnabled === true ||
    artifactsEnabled === true ||
    contextEnabled === true ||
    fileSearchEnabled === true;

  const { data: webSearchAuth } = useVerifyAgentToolAuth(
    { toolId: Tools.web_search },
    { retry: 1, enabled: webSearchEnabled === true },
  );

  const isWebSearchAuthenticated = webSearchAuth?.authenticated ?? false;
  const isUserProvided = useMemo(
    () => (webSearchAuth?.authTypes ?? []).some(([, t]) => t === AuthType.USER_PROVIDED),
    [webSearchAuth?.authTypes],
  );

  const {
    onSubmit: onSubmitKey,
    isDialogOpen,
    setIsDialogOpen,
    handleRevokeApiKey,
    methods: keyFormMethods,
  } = useSearchApiKeyForm({
    onSubmit: () => setValue(AgentCapabilities.web_search, true, { shouldDirty: true }),
    onRevoke: () => setValue(AgentCapabilities.web_search, false, { shouldDirty: true }),
  });

  const handleWebSearchToggle = (next: boolean) => {
    if (isWebSearchAuthenticated) {
      setValue(AgentCapabilities.web_search, next, { shouldDirty: true });
      return;
    }
    if (next) {
      setIsDialogOpen(true);
      return;
    }
    setValue(AgentCapabilities.web_search, false, { shouldDirty: true });
  };

  const artifactsEnabledNow = artifactsMode !== undefined && artifactsMode !== '';

  if (!hasAnyCapability) {
    return null;
  }

  const triggerRef: RefObject<HTMLButtonElement> = { current: null };

  return (
    <Section title={localize('com_assistants_capabilities')} defaultOpen={true}>
      <div className="flex flex-col gap-0.5">
        {codeEnabled === true && (
          <Controller
            name={AgentCapabilities.execute_code}
            control={control}
            render={({ field }) => (
              <ToggleRow
                id="cap-execute-code"
                icon={<Code className="h-4 w-4" aria-hidden="true" />}
                label={localize('com_ui_run_code')}
                description={localize('com_agents_run_code_info')}
                checked={!!field.value}
                onCheckedChange={(v) =>
                  setValue(AgentCapabilities.execute_code, v, { shouldDirty: true })
                }
              />
            )}
          />
        )}

        {webSearchEnabled === true && (
          <ToggleRow
            id="cap-web-search"
            icon={<Globe className="h-4 w-4" aria-hidden="true" />}
            label={localize('com_ui_web_search')}
            description={
              isUserProvided && !isWebSearchAuthenticated
                ? localize('com_ui_add_web_search_api_keys')
                : localize('com_agents_search_info')
            }
            checked={Boolean(webSearch)}
            onCheckedChange={handleWebSearchToggle}
          />
        )}

        {artifactsEnabled === true && (
          <ExpandableRow
            id="cap-artifacts"
            icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
            label={localize('com_ui_artifacts')}
            count={artifactsEnabledNow ? 1 : 0}
            defaultOpen={false}
            rightSlot={
              <Switch
                id="cap-artifacts-toggle"
                checked={artifactsEnabledNow}
                onCheckedChange={(v: boolean) =>
                  setValue(AgentCapabilities.artifacts, v ? ArtifactModes.DEFAULT : '', {
                    shouldDirty: true,
                  })
                }
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                aria-label={localize('com_ui_artifacts_toggle_agent')}
              />
            }
          >
            {artifactsEnabledNow && <Artifacts />}
          </ExpandableRow>
        )}

        {contextEnabled === true && (
          <ExpandableRow
            id="cap-file-context"
            icon={<FileText className="h-4 w-4" aria-hidden="true" />}
            label={localize('com_agents_file_context_label')}
            count={contextFiles.length}
          >
            <FileContext agent_id={agentId} files={contextFiles} />
          </ExpandableRow>
        )}

        {fileSearchEnabled === true && (
          <ExpandableRow
            id="cap-file-search"
            icon={<FileSearchIcon className="h-4 w-4" aria-hidden="true" />}
            label={localize('com_assistants_file_search')}
            count={knowledgeFiles.length}
          >
            <FileSearch agent_id={agentId} files={knowledgeFiles} />
          </ExpandableRow>
        )}

        {codeEnabled === true && (executeCode === true || codeFiles.length > 0) && (
          <ExpandableRow
            id="cap-code-files"
            icon={<FileText className="h-4 w-4" aria-hidden="true" />}
            label={localize('com_ui_code_files')}
            count={codeFiles.length}
          >
            <CodeFiles agent_id={agentId} files={codeFiles} />
          </ExpandableRow>
        )}
      </div>

      <ApiKeyDialog
        onSubmit={onSubmitKey}
        authTypes={webSearchAuth?.authTypes ?? []}
        isOpen={isDialogOpen}
        onRevoke={handleRevokeApiKey}
        onOpenChange={setIsDialogOpen}
        register={keyFormMethods.register}
        isToolAuthenticated={isWebSearchAuthenticated}
        handleSubmit={keyFormMethods.handleSubmit}
        triggerRef={triggerRef}
      />
    </Section>
  );
}
