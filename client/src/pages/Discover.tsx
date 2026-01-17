import { useState } from "react";
import { Sidebar, useSidebar } from "@/components/layout/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSteamSearch, useSteamAppDetails } from "@/hooks/use-steam";
import { useCreateLead } from "@/hooks/use-leads";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader2, Plus, Search, Trophy, Users, Globe, ExternalLink } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Discover() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const { data: results, isLoading } = useSteamSearch(debouncedSearch);
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className={`flex-1 p-8 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Discover Studios</h1>
          <p className="text-muted-foreground">Search the Steam database to find high-potential game studios.</p>
        </header>

        <div className="relative max-w-2xl mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            className="pl-12 h-14 text-lg bg-card/50 border-white/10 rounded-2xl focus:ring-primary/20"
            placeholder="Search games (e.g. 'Hollow Knight', 'Among Us')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {results?.map((game) => (
              <GameResultCard key={game.appid} game={game} />
            ))}
          </AnimatePresence>
          
          {!isLoading && results?.length === 0 && debouncedSearch.length > 2 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No games found matching "{debouncedSearch}"
            </div>
          )}

          {!isLoading && !results && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-3xl bg-card/20">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p>Start typing to search over 100,000 games on Steam</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function GameResultCard({ game }: { game: { appid: number, name: string, logo: string } }) {
  // We fetch details for each card individually to get developer info
  const { data: details, isLoading } = useSteamAppDetails(game.appid);
  const { mutate: addLead, isPending } = useCreateLead();

  const handleAddLead = () => {
    if (!details) return;
    
    // Attempt to guess engine or default to Unknown
    const leadData = {
      name: details.developers?.[0] || game.name, // Use developer name if avail, else game name
      steamAppId: game.appid.toString(),
      website: details.website,
      status: "new",
      engine: "Unknown", 
      notes: `Discovered via Steam search for "${game.name}"`,
      metrics: {
        followers: details.metrics?.total_reviews || 0, // Using reviews as proxy for popularity
        reviews: details.metrics?.total_reviews || 0,
        ccu: details.metrics?.player_count || 0
      }
    };
    
    addLead(leadData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
    >
      <Card className="h-full flex flex-col overflow-hidden group hover:border-primary/50 bg-card/40 backdrop-blur-sm">
        <div className="h-32 w-full relative overflow-hidden bg-black/50">
          <img 
            src={game.logo} 
            alt={game.name} 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        </div>
        
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-display font-bold text-lg mb-1 leading-tight line-clamp-1">{game.name}</h3>
          
          <div className="flex-1 space-y-4 mt-2">
            {isLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 w-3/4 bg-white/5 rounded" />
                <div className="h-4 w-1/2 bg-white/5 rounded" />
              </div>
            ) : details ? (
              <>
                <div className="text-sm text-muted-foreground">
                  <span className="block text-xs uppercase tracking-wider opacity-60 mb-0.5">Developer</span>
                  {details.developers?.join(", ") || "Unknown"}
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                    <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
                    <div className="text-xs text-muted-foreground">Players</div>
                    <div className="font-mono font-bold text-sm">
                      {details.metrics?.player_count ? formatNumber(details.metrics.player_count) : '-'}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                    <Trophy className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                    <div className="text-xs text-muted-foreground">Reviews</div>
                    <div className="font-mono font-bold text-sm">
                      {details.metrics?.total_reviews ? formatNumber(details.metrics.total_reviews) : '-'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic">Failed to load details</p>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2">
            <Button 
              className="flex-1" 
              onClick={handleAddLead}
              disabled={isPending || isLoading}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add to Pipeline
            </Button>
            {details?.website && (
              <Button size="icon" variant="outline" asChild>
                <a href={details.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4" />
                </a>
              </Button>
            )}
            <Button size="icon" variant="ghost" asChild>
              <a href={`https://store.steampowered.com/app/${game.appid}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
