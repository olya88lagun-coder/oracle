import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/viewer";
import { DeleteForm } from "./DeleteForm";

export const metadata: Metadata = { title: "Удалить мои данные" };

export default async function DeleteDataPage() {
  await requireUser();
  return (
    <main className="page stack">
      <h1 className="display">Удалить мои данные</h1>
      <section className="card stack">
        <h2>Что удалится</h2>
        <ul>
          <li>дата рождения из портрета;</li>
          <li>вход через VK ID и имя из VK.</li>
        </ul>
        <p className="muted">Если войти снова через тот же VK ID, это будет новый портрет с новым согласием.</p>
      </section>
      <DeleteForm />
      <p>
        <Link href="/portret">Передумали — вернуться в портрет</Link>
      </p>
    </main>
  );
}
