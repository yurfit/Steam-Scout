import { Sidebar, useSidebar } from "@/components/layout/Sidebar";
import { useSteamTopGames } from "@/hooks/use-steam";
import { useCreateLead } from "@/hooks/use-leads";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Users, Trophy, Building2, TrendingUp, RefreshCw } from "lucide-react";
import { formatNumber, cn } from "@/lib/utils";
import { z } from "zod";
import { api } from "@shared/routes";

type TopGamesResponse = z.infer<typeof api.steam.topGames.responses[200]>;
type TopGame = TopGamesResponse["games"][number];

export default function Dashboard() {
  const { isCollapsed } = useSidebar();
  const { data, isLoading, isFetching, refetch } = useSteamTopGames();
  const { mutate: addLead, isPending } = useCreateLead();

  const handleAddLead = (game: TopGame) => {
    addLead({
      name: game.developers[0] || game.name,
      steamAppId: game.appid.toString(),
      status: "new",
      engine: "Unknown",
      notes: `Added from Dashboard - ${game.name} (${formatNumber(game.playerCount)} players)`,
      metrics: {
        playerCount: game.playerCount,
        reviewScore: game.reviewScore,
        totalReviews: game.totalReviews,
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className={`flex-1 p-8 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2" data-testid="text-dashboard-title">Live Dashboard</h1>
            <p className="text-muted-foreground">Real-time player counts and top-performing studios.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh-dashboard"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Top Games by Player Count</h2>
              </div>
              
              <div className="space-y-4">
                {data?.games.map((game, index) => (
                  <Card 
                    key={game.appid} 
                    className="p-4 hover-elevate"
                    data-testid={`card-game-${game.appid}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      
                      {game.headerImage && (
                        <img 
                          src={game.headerImage} 
                          alt={game.name}
                          className="w-24 h-14 object-cover rounded-lg"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate" data-testid={`text-game-name-${game.appid}`}>
                          {game.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {game.developers.join(", ")}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          {game.genres?.slice(0, 2).map((genre) => (
                            <Badge key={genre} variant="secondary" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-green-500">
                            <Users className="w-4 h-4" />
                            <span className="font-bold" data-testid={`text-player-count-${game.appid}`}>
                              {formatNumber(game.playerCount)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">playing now</p>
                        </div>
                        
                        {game.reviewScore && (
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Trophy className="w-4 h-4" />
                              <span className="font-bold">{game.reviewScore}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">metacritic</p>
                          </div>
                        )}
                        
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleAddLead(game)}
                          disabled={isPending}
                          data-testid={`button-add-lead-${game.appid}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Top Studios</h2>
              </div>
              
              <div className="space-y-3">
                {data?.studios.slice(0, 15).map((studio, index) => (
                  <Card 
                    key={studio.name} 
                    className="p-4 hover-elevate"
                    data-testid={`card-studio-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-6 h-6 rounded bg-secondary text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium truncate" data-testid={`text-studio-name-${index}`}>
                            {studio.name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {studio.topGame}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-green-500">
                          <Users className="w-3 h-3" />
                          <span className="text-sm font-bold">{formatNumber(studio.totalPlayers)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {studio.gamesCount} game{studio.gamesCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
