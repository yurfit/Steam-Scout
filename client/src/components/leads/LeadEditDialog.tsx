import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateLead } from "@/hooks/use-leads";
import { type Lead } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface LeadEditDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadEditDialog({ lead, open, onOpenChange }: LeadEditDialogProps) {
  const { mutate: updateLead, isPending } = useUpdateLead();
  const [formData, setFormData] = useState({
    name: lead.name,
    website: lead.website || "",
    engine: lead.engine || "Unknown",
    notes: lead.notes || "",
    status: lead.status
  });

  useEffect(() => {
    setFormData({
      name: lead.name,
      website: lead.website || "",
      engine: lead.engine || "Unknown",
      notes: lead.notes || "",
      status: lead.status
    });
  }, [lead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateLead(
      { id: lead.id, ...formData },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Edit Lead Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Studio Name</label>
            <Input 
              value={formData.name} 
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Website</label>
            <Input 
              value={formData.website} 
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Game Engine</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.engine}
              onChange={(e) => setFormData(prev => ({ ...prev, engine: e.target.value }))}
            >
              <option value="Unknown">Unknown</option>
              <option value="Unity">Unity</option>
              <option value="Unreal">Unreal Engine</option>
              <option value="Godot">Godot</option>
              <option value="Custom">Custom / Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="new">New Lead</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="closed">Closed / Won</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea 
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add internal notes..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
