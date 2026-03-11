"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { logout } from "@/app/actions/auth"

export function LogoutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => logout()}>
      <LogOut className="mr-2 h-4 w-4" />
      ログアウト
    </Button>
  )
}
