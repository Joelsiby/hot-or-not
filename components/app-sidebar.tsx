"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const navItems = [
  { title: "Leaderboard", href: "/" },
  { title: "About", href: "/about" },
  { title: "Rules", href: "/rules" },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="md:hidden">
      <SidebarHeader className="p-4">
        <Link href="/" className="font-bold text-xl">
          outbid.lol
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                className={cn(
                  pathname === item.href && "bg-muted"
                )}
                render={
                  <Link href={item.href} />
                }
              >
                {item.title}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}