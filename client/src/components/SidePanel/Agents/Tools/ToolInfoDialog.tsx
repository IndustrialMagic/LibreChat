import { useState } from 'react';
import { X } from 'lucide-react';
import {
  Button,
  OGDialog,
  OGDialogClose,
  OGDialogContent,
  OGDialogDescription,
  OGDialogHeader,
  OGDialogTitle,
} from '@librechat/client';
import type { AgentItem } from './items/types';
import type { TranslationKeys } from '~/hooks/useLocalize';
import { getIconForItem } from './items/icons';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

interface Props {
  item: AgentItem | null;
  onClose: () => void;
}

const KIND_LABEL_KEYS: Record<AgentItem['kind'], TranslationKeys> = {
  builtin: 'com_ui_tools_kind_official',
  tool: 'com_ui_tools_kind_tools',
  skill: 'com_ui_tools_kind_skills',
  mcp: 'com_ui_tools_kind_mcp',
  action: 'com_ui_tools_kind_actions',
};

function IdentityIcon({ item }: { item: AgentItem }) {
  const { Icon, colorClass, iconUrl } = getIconForItem(item);
  const [imgError, setImgError] = useState(false);

  if (iconUrl && !imgError) {
    return (
      <span
        className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white"
        aria-hidden="true"
      >
        <img
          src={iconUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={cn('flex size-14 shrink-0 items-center justify-center rounded-2xl', colorClass)}
      aria-hidden="true"
    >
      <Icon className="size-6" strokeWidth={1.75} />
    </span>
  );
}

function useDisplayStrings(item: AgentItem): { name: string; description: string } {
  const localize = useLocalize();
  if (item.kind === 'builtin') {
    return {
      name: localize(item.name as TranslationKeys),
      description: item.description ? localize(item.description as TranslationKeys) : '',
    };
  }
  return { name: item.name, description: item.description ?? '' };
}

interface FactRowProps {
  label: string;
  value: string;
}

function FactRow({ label, value }: FactRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="text-xs uppercase tracking-wide text-text-secondary">{label}</span>
      <span className="truncate text-right text-sm text-text-primary">{value}</span>
    </div>
  );
}

export default function ToolInfoDialog({ item, onClose }: Props) {
  const localize = useLocalize();
  const open = item !== null;

  return (
    <OGDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <OGDialogContent
        className="w-11/12 max-w-md gap-0 overflow-hidden rounded-2xl border-none bg-background p-0 text-foreground shadow-xl"
        showCloseButton={false}
      >
        {item && <InfoBody item={item} localize={localize} />}
      </OGDialogContent>
    </OGDialog>
  );
}

interface BodyProps {
  item: AgentItem;
  localize: ReturnType<typeof useLocalize>;
}

function InfoBody({ item, localize }: BodyProps) {
  const { name, description } = useDisplayStrings(item);
  const kindLabel = localize(KIND_LABEL_KEYS[item.kind]);
  const isNative = item.kind === 'builtin';
  const sourceLabel = isNative
    ? localize('com_ui_tools_source_native')
    : item.kind === 'mcp'
      ? localize('com_ui_tools_source_mcp')
      : item.kind === 'action'
        ? localize('com_ui_tools_source_action')
        : item.kind === 'skill'
          ? localize('com_ui_tools_source_skill')
          : localize('com_ui_tools_source_tool');

  return (
    <div className="flex flex-col">
      <OGDialogHeader className="flex flex-row items-start justify-between gap-3 space-y-0 px-6 pb-3 pt-5">
        <span className="sr-only">
          <OGDialogTitle>{name}</OGDialogTitle>
          <OGDialogDescription>{kindLabel}</OGDialogDescription>
        </span>
        <OGDialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-lg text-text-secondary hover:text-text-primary"
            aria-label={localize('com_ui_tools_close')}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </OGDialogClose>
      </OGDialogHeader>
      <div className="flex flex-col items-center gap-3 px-6 pb-4 text-center">
        <IdentityIcon item={item} />
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-lg font-semibold text-text-primary">{name}</h2>
          <span className="text-[11px] uppercase tracking-wide text-text-secondary">
            {kindLabel}
          </span>
        </div>
        {description && <p className="text-sm leading-relaxed text-text-primary">{description}</p>}
      </div>
      <div className="px-6 py-3">
        <FactRow label={localize('com_ui_tools_info_source')} value={sourceLabel} />
        <FactRow label={localize('com_ui_tools_info_identifier')} value={item.id} />
        {item.kind === 'mcp' && (
          <FactRow
            label={localize('com_ui_tools_info_tools')}
            value={localize(
              item.toolCount === 1 ? 'com_ui_tools_count_one' : 'com_ui_tools_count',
              { count: item.toolCount },
            )}
          />
        )}
        {item.kind === 'action' && (
          <FactRow
            label={localize('com_ui_tools_info_endpoints')}
            value={localize(
              item.endpointCount === 1
                ? 'com_ui_tools_endpoint_count_one'
                : 'com_ui_tools_endpoint_count',
              { count: item.endpointCount },
            )}
          />
        )}
        {item.kind === 'mcp' && (
          <FactRow
            label={localize('com_ui_tools_info_status')}
            value={
              item.server.isConfigured
                ? localize('com_ui_tools_info_configured')
                : localize('com_ui_tools_info_unconfigured')
            }
          />
        )}
      </div>
    </div>
  );
}
