import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useDroppable } from "@dnd-kit/core";
import {
  LayoutDashboard, Inbox, Sun, CalendarDays, Plus, Settings, HelpCircle,
  ChevronDown, CheckCircle2, Sparkles, SunMoon, Moon, Monitor,
} from "lucide-react";
import { useProjects } from "@/lib/store/project-store";
import { useThemeStore } from "@/lib/store/theme-store";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const ProjectDropLink = ({
  to,
  dropId,
  onClick,
  children,
}: {
  to: string;
  dropId: string;
  onClick?: () => void;
  children: ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: dropId });

  return (
    <NavLink
      ref={setNodeRef}
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "nav-item",
          isActive && "nav-item-active",
          isOver && "bg-primary/25 ring-2 ring-inset ring-primary",
        )
      }
    >
      {children}
    </NavLink>
  );
};

const mainNav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/inbox", label: "Inbox", icon: Inbox },
  { to: "/app/today", label: "Today", icon: Sun },
  { to: "/app/upcoming", label: "Upcoming", icon: CalendarDays },
];

export const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { data: projects = [] } = useProjects();
  const { mode, setMode } = useThemeStore();
  const { session } = useAuth();
  const userName =
    (session?.user.user_metadata.full_name as string | undefined) ||
    session?.user.email?.split("@")[0] ||
    "User";
  const userEmail = session?.user.email || "";
  const initials = userName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="flex h-full w-[250px] flex-col border-r-2 bg-sidebar">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b-2 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-clay">
          <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-[15px]">TaskFlow</span>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="ml-auto flex items-center gap-1 rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-elevated">
              Workspace <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 mt-1 min-w-[180px] rounded-clay border-2 bg-surface p-2 text-[13px] shadow-clay"
              sideOffset={4}
            >
              <DropdownMenu.Item className="cursor-pointer rounded px-2 py-1.5 hover:bg-elevated">
                Personal
              </DropdownMenu.Item>
              <DropdownMenu.Item className="cursor-pointer rounded px-2 py-1.5 hover:bg-elevated">
                Team Acme
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Main Nav */}
        <nav className="space-y-0.5">
          {mainNav.map((item) => (
            item.label === "Inbox" ? (
              <ProjectDropLink
                key={item.to}
                to={item.to}
                dropId="project:inbox"
                onClick={onClose}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </ProjectDropLink>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn("nav-item", isActive && "nav-item-active")
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          ))}
        </nav>

        {/* Projects */}
        <div>
          <div className="mb-1 flex items-center justify-between px-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Projects
            </span>
            <NavLink to="/app/projects" onClick={onClose} aria-label="Create project" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-clay transition-all hover:-translate-y-0.5 hover:shadow-clay-hover">
              <Plus className="h-3.5 w-3.5" />
            </NavLink>
          </div>
          <nav className="space-y-0.5">
            {projects.map((p) => (
              <ProjectDropLink
                key={p.id}
                to={`/app/projects/${p.id}`}
                dropId={`project:${p.id}`}
                onClick={onClose}
              >
                <span
                  className="sidebar-project-dot h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: p.color, color: p.color }}
                />
                <span className="truncate">{p.name}</span>
              </ProjectDropLink>
            ))}
            <NavLink
              to="/app/projects"
              end
              onClick={onClose}
              className={({ isActive }) =>
                cn("nav-item", isActive && "nav-item-active")
              }
            >
              <Sparkles className="h-4 w-4" />
              All projects
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t p-3 space-y-0.5">
        {profileMenuOpen && (
          <div
            id="profile-menu"
            className="mb-2 space-y-1 rounded-clay border-2 bg-surface p-2 shadow-clay"
          >
            <NavLink
              to="/app/settings"
              onClick={() => {
                setProfileMenuOpen(false);
                onClose?.();
              }}
              className="nav-item w-full"
            >
              <Settings className="h-4 w-4" /> Settings
            </NavLink>
            <button
              type="button"
              className="nav-item w-full text-left"
            >
              <HelpCircle className="h-4 w-4" /> Help
            </button>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button type="button" className="nav-item w-full text-left">
                  {mode === "dark" ? <Moon className="h-4 w-4" /> : mode === "light" ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                  Theme
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="z-50 mb-1 min-w-[160px] rounded-clay border-2 bg-surface p-2 text-[13px] shadow-clay" side="top" align="start" sideOffset={4}>
                  {(["light", "dark", "system"] as const).map((m) => (
                    <DropdownMenu.Item
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        "cursor-pointer rounded px-2 py-1.5 capitalize text-foreground",
                        mode === m
                          ? "bg-primary font-bold text-primary-foreground shadow-clay hover:bg-primary"
                          : "hover:bg-elevated",
                      )}
                    >
                      {m}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        )}

        <button
          type="button"
          aria-expanded={profileMenuOpen}
          aria-controls={profileMenuOpen ? "profile-menu" : undefined}
          aria-label="Toggle profile menu"
          onClick={() => setProfileMenuOpen((open) => !open)}
          className="mt-2 flex w-full items-center gap-2 rounded-clay border-2 bg-surface px-2 py-2 text-left shadow-clay transition-all hover:-translate-y-0.5 hover:shadow-clay-hover"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground shadow-clay">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold">{userName}</div>
            <div className="truncate text-[11px] text-muted-foreground">{userEmail}</div>
          </div>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", profileMenuOpen && "rotate-180")} />
        </button>
      </div>
    </aside>
  );
};