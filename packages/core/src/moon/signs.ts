import { eclipticLongitude } from "../natal/bodies";
import { signOf, type SignId } from "../natal/zodiac";

export type SignChange = { sign: SignId; at: Date };

const HOUR_MS = 3_600_000;
const PRECISION_MS = 1000;

const signAt = (time: number): SignId => signOf(eclipticLongitude("moon", new Date(time))).sign;

// Все входы Луны в новый знак строго после `from` и не позже `to`, по возрастанию.
// Луна проходит знак за двое с лишним суток, поэтому шага в час хватает: за час сменится не больше одного знака; границу уточняем делением пополам до секунды
export function moonSignChanges(from: Date, to: Date): SignChange[] {
  const changes: SignChange[] = [];
  const end = to.getTime();
  let before = from.getTime();
  let beforeSign = signAt(before);
  while (before < end) {
    const after = Math.min(before + HOUR_MS, end);
    const afterSign = signAt(after);
    if (afterSign !== beforeSign) {
      let low = before;
      let high = after;
      while (high - low > PRECISION_MS) {
        const middle = Math.floor((low + high) / 2);
        if (signAt(middle) === beforeSign) low = middle;
        else high = middle;
      }
      changes.push({ sign: afterSign, at: new Date(high) });
    }
    before = after;
    beforeSign = afterSign;
  }
  return changes;
}
