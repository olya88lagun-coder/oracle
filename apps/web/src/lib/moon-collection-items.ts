import { COLLECTION_PHASES, COLLECTION_SIGNS, type CollectionId } from "./moon-collection";
import { SIGN_NAMES } from "./lunar-calendar";
import { phaseImage, signImage } from "./moon-images";
import { PHASE_NAMES } from "./moon-today";

// Плитки «Коллекции Луны» для страницы: название и путь маленькой гравюры. Собирается на сервере, в браузер уходят готовые строки
export type CollectionItem = { id: CollectionId; name: string; image: string | null; kind: "sign" | "phase" };

export const collectionItems = (): CollectionItem[] => [
  ...COLLECTION_SIGNS.map((sign): CollectionItem => ({ id: `sign:${sign}`, name: SIGN_NAMES[sign], image: signImage(sign, 160), kind: "sign" })),
  ...COLLECTION_PHASES.map((phase): CollectionItem => ({ id: `phase:${phase}`, name: PHASE_NAMES[phase], image: phaseImage(phase, 160), kind: "phase" })),
];
