import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Search, 
  Settings, 
  LogOut, 
  UserCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Discover", href: "/discover", icon: Search },
  { label: "My Leads", href: "/leads", icon: LayoutDashboard },
  // { label: "Settings", href: "/settings", icon: Settings }, // Future implementation
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card border-border/50 fixed left-0 top-0 z-40">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          bezi<span className="text-primary">.ai</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">Growth Engine</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50 bg-secondary/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="Profile" className="w-8 h-8 rounded-full border border-border" />
          ) : (
            <UserCircle className="w-8 h-8 text-muted-foreground" />
          )}
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate text-foreground">{user?.firstName || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
