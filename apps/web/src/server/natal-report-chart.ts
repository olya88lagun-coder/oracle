import type { NatalSnapshot } from "@oracle/core";
import { computeNatalChart } from "@oracle/core/natal";
import type { NatalReportChart } from "@/components/report/NatalReportView";

// Карта для обложки разбора: считается из снимка данных рождения в покупке. Снимка нет (данные стёрты) — null, разбор показывается без колеса
export function natalReportChart(snapshot: NatalSnapshot | null | undefined): NatalReportChart | null {
  if (!snapshot) return null;
  try {
    const chart = computeNatalChart({ instant: new Date(snapshot.instant), latitude: snapshot.latitude, longitude: snapshot.longitude, timeKnown: true });
    return { chart, birth: { city: snapshot.placeName, date: snapshot.date, time: snapshot.time } };
  } catch {
    return null;
  }
}
