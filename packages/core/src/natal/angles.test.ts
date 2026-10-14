import * as Astronomy from "astronomy-engine";
import { describe, expect, test } from "vitest";
import { ascendantAndMidheaven } from "./angles";
import { eclipticLongitude } from "./bodies";
import { angularDistance } from "./zodiac";

const PLACES = [
  { name: "Москва", latitude: 55.7558, longitude: 37.6173 },
  { name: "Новосибирск", latitude: 55.0084, longitude: 82.9357 },
  { name: "Сочи", latitude: 43.5855, longitude: 39.7231 },
  { name: "Мурманск", latitude: 68.9585, longitude: 33.0827 },
  { name: "Уэлен (западная долгота)", latitude: 66.15, longitude: -169.8 },
  { name: "Буэнос-Айрес (юг)", latitude: -34.6, longitude: -58.38 },
];

describe("ascendantAndMidheaven", () => {
  test.each(PLACES)("the midheaven equals the Sun's longitude at the Sun's culmination: $name", ({ latitude, longitude }) => {
    for (const day of ["1990-03-07T00:00:00Z", "2005-09-23T00:00:00Z", "1978-12-21T00:00:00Z"]) {
      const observer = new Astronomy.Observer(latitude, longitude, 0);
      const culmination = Astronomy.SearchHourAngle(Astronomy.Body.Sun, observer, 0, new Date(day)).time.date;
      const { midheaven } = ascendantAndMidheaven(culmination, latitude, longitude);
      expect(angularDistance(midheaven, eclipticLongitude("sun", culmination))).toBeLessThan(0.01);
    }
  });

  test.each(PLACES.filter((place) => place.latitude > 0))(
    "the ascendant is just ahead of the Sun at sunrise on the September equinox: $name",
    ({ latitude, longitude }) => {
      const observer = new Astronomy.Observer(latitude, longitude, 0);
      const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, new Date("2005-09-23T00:00:00Z"), 2)!.date;
      const { ascendant } = ascendantAndMidheaven(sunrise, latitude, longitude);
      const ahead = angularDistance(ascendant, eclipticLongitude("sun", sunrise));
      expect(ahead).toBeGreaterThan(0.5);
      expect(ahead).toBeLessThan(1.6);
    },
  );

  test("the midheaven is always 0…180° behind the ascendant, and nothing is NaN at the polar circle", () => {
    for (let hour = 0; hour < 24; hour += 0.5) {
      const { ascendant, midheaven } = ascendantAndMidheaven(new Date(Date.UTC(1990, 2, 7, hour)), 55.75, 37.62);
      const behind = (((ascendant - midheaven) % 360) + 360) % 360;
      expect(behind).toBeGreaterThan(0);
      expect(behind).toBeLessThan(180);
      expect(Number.isFinite(ascendantAndMidheaven(new Date(Date.UTC(1990, 2, 7, hour)), 68.97, 33.08).ascendant)).toBe(true);
    }
  });
});
