import { useState } from "react";
import { Sidebar, useSidebar } from "@/components/layout/Sidebar";
import { useLeads, useDeleteLead } from "@/hooks/use-leads";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeadEditDialog } from "@/components/leads/LeadEditDialog";
import { Loader2, MoreHorizontal, Trash2, Globe, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { getEngineColor, STATUS_COLUMNS, cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Lead } from "@shared/schema";
import { motion } from "framer-motion";

export default function MyLeads() {
  const { data: leads, isLoading } = useLeads();
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const { isCollapsed } = useSidebar();

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className={`flex-1 p-8 overflow-x-auto transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">My Pipeline</h1>
            <p className="text-muted-foreground">Manage your relationships with game studios.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-mono bg-secondary px-3 py-1 rounded-full">
              {leads?.length || 0} Total Leads
            </span>
          </div>
        </header>

        <div className="flex gap-6 pb-8 min-w-[1200px]">
          {STATUS_COLUMNS.map((column) => (
            <div key={column.id} className="flex-1 min-w-[300px]">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-medium flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", column.color.split(" ")[1].replace("text-", "bg-"))} />
                  {column.label}
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {leads?.filter(l => l.status === column.id).length || 0}
                </span>
              </div>
              
              <div className="space-y-4">
                {leads
                  ?.filter((lead) => lead.status === column.id)
                  .map((lead) => (
                    <LeadCard 
                      key={lead.id} 
                      lead={lead} 
                      onEdit={() => setEditingLead(lead)} 
                    />
                  ))}
                  
                {leads?.filter((lead) => lead.status === column.id).length === 0 && (
                  <div className="h-32 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-muted-foreground/30 text-sm">
                    No leads
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {editingLead && (
        <LeadEditDialog 
          lead={editingLead} 
          open={!!editingLead} 
          onOpenChange={(open) => !open && setEditingLead(null)} 
        />
      )}
    </div>
  );
}

function LeadCard({ lead, onEdit }: { lead: Lead, onEdit: () => void }) {
  const { mutate: deleteLead } = useDeleteLead();
  const metrics = lead.metrics as { ccu?: number, reviews?: number } | null;

  return (
    <motion.div
      layoutId={`lead-${lead.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="p-4 bg-card/60 backdrop-blur-sm border-white/5 hover:border-primary/40 group relative overflow-hidden">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider py-0.5 px-2 font-mono border", getEngineColor(lead.engine || 'Unknown'))}>
            {lead.engine || 'Unknown'}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={onEdit}>Edit Details</DropdownMenuItem>
              {lead.steamAppId && (
                <DropdownMenuItem asChild>
                  <a href={`https://store.steampowered.com/app/${lead.steamAppId}`} target="_blank" rel="noreferrer">
                    View on Steam
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => deleteLead(lead.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h4 className="font-bold font-display text-lg leading-tight mb-1 cursor-pointer hover:text-primary transition-colors" onClick={onEdit}>
          {lead.name}
        </h4>
        
        {lead.website && (
          <a href={lead.website} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-4 truncate">
            <Globe className="w-3 h-3" />
            {new URL(lead.website).hostname}
          </a>
        )}

        {metrics && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white/5 rounded p-2 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">CCU</div>
              <div className="font-mono font-bold text-sm">{metrics.ccu ? metrics.ccu.toLocaleString() : '-'}</div>
            </div>
            <div className="bg-white/5 rounded p-2 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Reviews</div>
              <div className="font-mono font-bold text-sm">{metrics.reviews ? metrics.reviews.toLocaleString() : '-'}</div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {format(new Date(lead.createdAt || new Date()), 'MMM d')}
          </div>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={onEdit}>
            Details <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
