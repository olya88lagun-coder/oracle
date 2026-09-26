import type { ReactNode } from "react";

type Props = { title: string; className?: string; defaultOpen?: boolean; children: ReactNode };

// Секция страницы аркана. На телефоне — раскрывающийся блок, на компьютере её раскрывает ArcanumSectionsExpander
export function ArcanumSection({ title, className = "", defaultOpen = false, children }: Props) {
  return (
    <details className={`arcanum-section stack ${className}`.trim()} open={defaultOpen}>
      <summary>
        <h2>{title}</h2>
        <span className="arcanum-section__icon" aria-hidden="true" />
      </summary>
      <div className="arcanum-section__body stack">{children}</div>
    </details>
  );
}
