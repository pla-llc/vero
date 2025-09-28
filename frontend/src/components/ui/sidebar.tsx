"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Wallet,
  TrendingUp,
  Settings,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Separator } from "./separator";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Portfolio overview"
  },
  {
    title: "Swap",
    href: "/swap", 
    icon: ArrowLeftRight,
    description: "Trade tokens"
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: TrendingUp,
    description: "Performance data"
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-40">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-2 mb-2">
            <img src="/brand/transparent-dark-logo-full.svg" alt="logo" className="h-8" />
          </div>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-12 px-3 group",
                    isActive && "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-primary" />
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* Footer */}
        <div className="p-4">
          <Button variant="ghost" className="w-full justify-start gap-3" asChild>
            <Link href="/settings">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
          </Button>
        </div>

        {/* Bottom accent */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500" />
      </div>
    </div>
  );
}
