import type { Metadata } from "next";
import Link from "next/link";
import { Scene } from "@/components/Scene";
import { SECTIONS } from "@/lib/sections";

export const metadata: Metadata = { title: "Страница не найдена", robots: { index: false } };

// Вместо стандартной белой страницы Next на английском: та же сцена, что у входа, и ссылки на разделы
export default function NotFound() {
  return (
    <Scene compact>
      <div className="card login-card stack">
        <p className="eyebrow eyebrow--line">Ошибка 404</p>
        <h1 className="display">Такой страницы нет</h1>
        <p className="lead">Возможно, адрес набран с ошибкой или страница переехала. Начните с главной или выберите практику.</p>
        <p>
          <Link className="button" href="/">
            На главную
          </Link>
        </p>
        <nav aria-label="Разделы сайта" className="not-found__nav">
          {SECTIONS.map((section) => (
            <Link key={section.href} className="touch-link" href={section.href}>
              {section.title}
            </Link>
          ))}
        </nav>
      </div>
    </Scene>
  );
}
