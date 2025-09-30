import { clsx } from 'clsx'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({ title, description, icon: Icon, actions, children }: PageHeaderProps) {
  return (
    <div className="border-b border-border bg-surface">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <Icon className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              <h1 className="font-semibold text-xl text-white">
                {title}
              </h1>
              {description && (
                <p className="text-gray-400 mt-1 text-sm">
                  {description}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>

        {children && (
          <div className="mt-6">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}