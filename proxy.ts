import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const proxy = auth((req) => {
  const isAuth = !!req.auth
  const isLoginPage = req.nextUrl.pathname === "/login"

  // 未ログインでログインページ以外にアクセスした場合、/login へ
  if (!isAuth && !isLoginPage) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = "/login"
    return NextResponse.redirect(loginUrl)
  }

  // ログイン済みでログインページにアクセスした場合、トップページへ
  if (isAuth && isLoginPage) {
    const homeUrl = req.nextUrl.clone()
    homeUrl.pathname = "/"
    return NextResponse.redirect(homeUrl)
  }
})

export const config = {
  // すべてのページを Proxy の対象にするが、matcher で除外設定を行う
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
