import { createContext, useContext, useState, ReactNode, HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within Tabs.Root');
  }
  return context;
}

interface TabsRootProps {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export const TabsRoot = ({ defaultValue, value, onChange, children, className }: TabsRootProps) => {
  const [activeTab, setActiveTab] = useState(value || defaultValue);

  const handleSetActiveTab = (tab: string) => {
    if (value === undefined) {
      setActiveTab(tab);
    }
    onChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleSetActiveTab }}>
      <div className={cn('', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

interface TabsListProps extends HTMLAttributes<HTMLDivElement> {}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      aria-orientation="horizontal"
      className={cn('inline-flex h-10 items-center justify-center rounded-lg bg-ops-card2 p-1 gap-1', className)}
      {...props}
    >
      {children}
    </div>
  )
);

TabsList.displayName = 'TabsList';

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, disabled, children, ...props }, ref) => {
    const { activeTab, setActiveTab } = useTabsContext();
    const isActive = activeTab === value;

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabs-${value}-panel`}
        id={`tabs-${value}-trigger`}
        data-state={isActive ? 'active' : 'inactive'}
        data-disabled={disabled}
        onClick={() => !disabled && setActiveTab(value)}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          isActive
            ? 'bg-white text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-ops-card2',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TabsTrigger.displayName = 'TabsTrigger';

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { activeTab } = useTabsContext();
    const isActive = activeTab === value;

    if (!isActive) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`tabs-${value}-panel`}
        aria-labelledby={`tabs-${value}-trigger`}
        className={cn('mt-4 animate-in fade-in-0 zoom-in-95 duration-200', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = 'TabsContent';

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});