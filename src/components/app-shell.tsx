import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center gap-3 border-b border-border bg-background px-4 sm:px-6 sticky top-0 z-30">
            <SidebarTrigger className="text-foreground" />
            <div className="hidden md:flex items-center relative w-full max-w-sm">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search students, payments..." className="pl-9 bg-muted/40 border-transparent" />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button className="relative h-9 w-9 rounded-full grid place-items-center hover:bg-muted transition-colors">
                <Bell className="h-4 w-4 text-foreground" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent" />
              </button>
              <div className="flex items-center gap-2 pl-3 border-l border-border">
                <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-semibold">
                  AO
                </div>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-sm font-medium text-foreground">Adaeze Okafor</span>
                  <span className="text-xs text-muted-foreground">Bursar</span>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
