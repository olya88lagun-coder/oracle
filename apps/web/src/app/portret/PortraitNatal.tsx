import Link from "next/link";
import { PORTRAIT_NATAL_OPEN, PORTRAIT_NATAL_TITLE, portraitNatalLine } from "@/lib/natal-copy";
import { NATAL_PATH } from "@/lib/natal-paths";

type Props = { date: string; time: string | null; placeName: string };

// Сохранённые время и место рождения. Показывается только когда место сохранено; оформление добавит дизайн (хуки .portrait-natal, .portrait-natal__data)
export function PortraitNatal({ date, time, placeName }: Props) {
  return (
    <section className="portrait-natal" aria-labelledby="natal">
      <h2 id="natal">{PORTRAIT_NATAL_TITLE}</h2>
      <p className="portrait-natal__data">{portraitNatalLine({ date, time, placeName })}</p>
      <Link href={NATAL_PATH}>{PORTRAIT_NATAL_OPEN}</Link>
    </section>
  );
}
