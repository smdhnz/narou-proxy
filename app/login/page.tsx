import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams
  const error = searchParams.error

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4 p-4">
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground">
          許可されたユーザーしか使えません
        </p>
        {error && (
          <p className="text-sm font-medium text-destructive">
            アクセス権限がありません。許可されたDiscordアカウントでログインしてください。
          </p>
        )}
      </div>
      <form
        action={async () => {
          "use server"
          await signIn("discord", { redirectTo: "/" })
        }}
      >
        <Button size="lg" className="w-full px-8 sm:w-auto">
          Discordでログイン
        </Button>
      </form>
    </div>
  )
}
