import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Scene } from "@/components/Scene";
import { loginErrorMessage } from "@/lib/login-errors";
import { currentUser } from "@/server/viewer";
import { LoginPanel } from "./LoginPanel";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, user] = await Promise.all([searchParams, currentUser()]);
  if (user) redirect("/portret");
  const message = loginErrorMessage(error ?? null);
  return (
    <Scene compact>
      <div className="card login-card stack">
        <p className="eyebrow eyebrow--line">Мой портрет</p>
        <h1 className="display">Вход</h1>
        <p className="lead">Войдите, чтобы сохранить дату рождения и открывать практики без повторного ввода.</p>
        {message && (
          <p className="error" role="alert">
            {message}
          </p>
        )}
        <LoginPanel />
      </div>
    </Scene>
  );
}
