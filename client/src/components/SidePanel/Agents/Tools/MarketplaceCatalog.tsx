import { Search } from 'lucide-react';
import type { AgentItem } from './items/types';
import ToolCard from './ToolCard';
import { useLocalize } from '~/hooks';

interface MarketplaceCatalogProps {
  items: AgentItem[];
  selectedIds: Set<string>;
  onToggle: (item: AgentItem) => void;
}

export default function MarketplaceCatalog({
  items,
  selectedIds,
  onToggle,
}: MarketplaceCatalogProps) {
  const localize = useLocalize();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="size-8 text-text-tertiary opacity-40" aria-hidden="true" />
        <p className="mt-3 text-sm text-text-secondary">
          {localize('com_ui_tools_search_no_results')}
        </p>
      </div>
    );
  }

  return (
    <ul
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3"
      aria-label={localize('com_ui_tools_marketplace')}
    >
      {items.map((item) => (
        <li key={`${item.kind}:${item.id}`}>
          <ToolCard item={item} selected={selectedIds.has(item.id)} onToggle={onToggle} />
        </li>
      ))}
    </ul>
  );
}
