import React from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'No items found', 
  description = 'Try adjusting your search or filters',
  action,
  className = ''
}) {
  return (
    <div className={`text-center py-16 ${className}`}>
      <Icon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
      <h3 className="text-2xl font-bold text-slate-200 mb-2">{title}</h3>
      <p className="text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {action}
    </div>
  );
}

export function EmptyCard({ icon, title, description, action }) {
  return (
    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12">
      <EmptyState icon={icon} title={title} description={description} action={action} />
    </div>
  );
}

export default EmptyState;
