import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, BarChart3, PieChart, Map, Copy, GitCompare, 
  Download, ChevronDown, Users, Settings, LogOut
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';

interface AppSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  voterCount: number;
  hasData: boolean;
}

const mainNav = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'list', label: 'Liste électorale', icon: FileText },
  { id: 'matrix', label: 'Matrice', icon: BarChart3 },
];

const analysisNav = [
  { id: 'charts', label: 'Graphiques', icon: PieChart },
  { id: 'map', label: 'Carte', icon: Map },
  { id: 'duplicates', label: 'Doublons', icon: Copy },
  { id: 'compare', label: 'Comparer', icon: GitCompare },
];

const AppSidebar = ({ activeView, onViewChange, voterCount, hasData }: AppSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('auth');
    navigate('/login');
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm shrink-0">
            GE
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">Gestion Électorale</span>
              <span className="text-xs text-sidebar-foreground/60">
                {hasData ? `${voterCount.toLocaleString()} électeurs` : 'Aucune donnée'}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Navigation principale */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:text-sidebar-foreground">
                {!collapsed && 'Navigation'}
                {!collapsed && <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-0 group-data-[state=closed]/collapsible:-rotate-90" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNav.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeView === item.id}
                        onClick={() => onViewChange(item.id)}
                        tooltip={item.label}
                        disabled={!hasData && item.id !== 'dashboard'}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.label}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Analyse */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:text-sidebar-foreground">
                {!collapsed && 'Analyse'}
                {!collapsed && <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-0 group-data-[state=closed]/collapsible:-rotate-90" />}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {analysisNav.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeView === item.id}
                        onClick={() => onViewChange(item.id)}
                        tooltip={item.label}
                        disabled={!hasData}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.label}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Déconnexion</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
