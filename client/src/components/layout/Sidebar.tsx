import { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Search, 
  LogOut, 
  UserCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Discover", href: "/discover", icon: Search },
  { label: "My Leads", href: "/leads", icon: LayoutDashboard },
];

interface SidebarContextType {
  isCollapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({ isCollapsed: false, toggle: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });

  const toggle = () => {
    setIsCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebar-collapsed', String(newValue));
      return newValue;
    });
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { isCollapsed, toggle } = useSidebar();

  return (
    <div 
      className={cn(
        "flex h-screen flex-col border-r bg-card border-border/50 fixed left-0 top-0 z-40 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("p-4 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Steam<span className="text-primary">Lead</span>
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5 tracking-widest uppercase">Growth Engine</p>
          </div>
        )}
        <button
          onClick={toggle}
          data-testid="button-toggle-sidebar"
          className={cn(
            "p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors",
            isCollapsed && "mx-auto"
          )}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className={cn("flex-1 space-y-2 mt-4", isCollapsed ? "px-2" : "px-4")}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isCollapsed ? "justify-center px-2" : "px-4",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className={cn("p-4 border-t border-border/50 bg-secondary/20", isCollapsed && "px-2")}>
        {!isCollapsed && (
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
        )}
        <button 
          onClick={() => logout()}
          data-testid="button-logout"
          className={cn(
            "w-full flex items-center gap-2 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
            isCollapsed ? "justify-center px-2" : "px-4"
          )}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && "Sign Out"}
        </button>
      </div>
    </div>
  );
}
