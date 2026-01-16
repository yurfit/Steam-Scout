import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreateLeadRequest, type UpdateLeadRequest, type Lead } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useLeads() {
  return useQuery({
    queryKey: [api.leads.list.path],
    queryFn: async () => {
      const res = await fetch(api.leads.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leads");
      return api.leads.list.responses[200].parse(await res.json());
    },
  });
}

export function useLead(id: number) {
  return useQuery({
    queryKey: [api.leads.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.leads.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch lead details");
      return api.leads.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateLeadRequest) => {
      const res = await fetch(api.leads.create.path, {
        method: api.leads.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to create lead");
      }
      return api.leads.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leads.list.path] });
      toast({ title: "Lead Added", description: "Successfully added to your pipeline" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateLeadRequest) => {
      const url = buildUrl(api.leads.update.path, { id });
      const res = await fetch(url, {
        method: api.leads.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update lead");
      return api.leads.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leads.list.path] });
      toast({ title: "Lead Updated", description: "Changes saved successfully" });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.leads.delete.path, { id });
      const res = await fetch(url, {
        method: api.leads.delete.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete lead");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leads.list.path] });
      toast({ title: "Lead Removed", description: "Lead has been deleted from your pipeline" });
    },
  });
}
