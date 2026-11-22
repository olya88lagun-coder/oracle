import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Scene } from "@/components/Scene";
import { loginErrorMessage } from "@/lib/login-errors";
import { safeNextPath } from "@/lib/next-path";
import { currentUser } from "@/server/viewer";
import { LoginPanel } from "./LoginPanel";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const [{ error, next }, user] = await Promise.all([searchParams, currentUser()]);
  const returnTo = safeNextPath(next);
  if (user) redirect(returnTo);
  const message = loginErrorMessage(error ?? null);
  return (
    <Scene compact>
      <div className="card login-card stack">
        <p className="eyebrow eyebrow--line">Мой портрет</p>
        <h1 className="display">Вход</h1>
        <p className="lead">Войдите, чтобы сохранить дату рождения, партии Лилы и купленные разборы и возвращаться к ним. Вход нужен и для покупки: разбор привязывается к вашему профилю. Какие данные получает сайт, написано в <Link href="/privacy">политике</Link>.</p>
        {message && (
          <p className="error" role="alert">
            {message}
          </p>
        )}
        <LoginPanel next={returnTo} />
      </div>
    </Scene>
  );
}
