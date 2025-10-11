'use client';

import React from 'react';
import { Database, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

interface DataSchemaCardProps {
  schema: {
    primary_dimension: string
    row_count: number
    available_metrics: {
      efficiency: string[]
      cost: string[]
      volume: string[]
      comparative?: string[]
    }
  }
}

interface MetricGroupProps {
  label: string
  metrics: string[]
  color: 'emerald' | 'amber' | 'blue' | 'purple'
  icon: React.ReactNode
}

const MetricGroup: React.FC<MetricGroupProps> = ({ label, metrics, color, icon }) => {
  if (!metrics || metrics.length === 0) return null;

  const colorClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
        {icon}
        <span>{label}</span>
        <span className="text-xs text-gray-500">({metrics.length})</span>
      </div>
      <div className="flex flex-wrap gap-2 ml-6">
        {metrics.map((metric, idx) => (
          <span
            key={idx}
            className={`text-xs px-2 py-1 rounded-full border font-mono ${colorClasses[color]}`}
          >
            {metric}
          </span>
        ))}
      </div>
    </div>
  );
};

export const DataSchemaCard: React.FC<DataSchemaCardProps> = ({ schema }) => {
  if (!schema || !schema.primary_dimension) {
    return null;
  }

  const totalMetrics =
    (schema.available_metrics.efficiency?.length || 0) +
    (schema.available_metrics.cost?.length || 0) +
    (schema.available_metrics.volume?.length || 0) +
    (schema.available_metrics.comparative?.length || 0);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 space-y-4" data-testid="data-schema-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          Detected Data Structure
        </h3>
        <div className="text-xs text-gray-500 px-2 py-1 bg-gray-800 rounded">
          Auto-detected
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Analyzing by</div>
          <div className="text-white font-mono font-semibold truncate" title={schema.primary_dimension}>
            {schema.primary_dimension}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Data points</div>
          <div className="text-white font-semibold">{schema.row_count.toLocaleString()} rows</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Total metrics</div>
          <div className="text-white font-semibold">{totalMetrics} detected</div>
        </div>
      </div>

      {/* Metrics Breakdown */}
      <div className="space-y-3 pt-2 border-t border-gray-700">
        <div className="text-sm text-gray-400 mb-2">Available Metrics:</div>

        <MetricGroup
          label="Efficiency Metrics"
          metrics={schema.available_metrics.efficiency || []}
          color="emerald"
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
        />

        <MetricGroup
          label="Cost Metrics"
          metrics={schema.available_metrics.cost || []}
          color="amber"
          icon={<DollarSign className="w-4 h-4 text-amber-400" />}
        />

        <MetricGroup
          label="Volume Metrics"
          metrics={schema.available_metrics.volume || []}
          color="blue"
          icon={<BarChart3 className="w-4 h-4 text-blue-400" />}
        />

        {schema.available_metrics.comparative && schema.available_metrics.comparative.length > 0 && (
          <MetricGroup
            label="Comparative Metrics"
            metrics={schema.available_metrics.comparative}
            color="purple"
            icon={<Database className="w-4 h-4 text-purple-400" />}
          />
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
        💡 Insights will be generated based on these detected metrics and the{' '}
        <span className="text-gray-400 font-mono">{schema.primary_dimension}</span> dimension.
      </div>
    </div>
  );
};

export default DataSchemaCard;
