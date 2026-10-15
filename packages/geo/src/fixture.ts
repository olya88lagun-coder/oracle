import type { City } from "./types";

// Небольшая выборка для тестов поиска; население — настоящее, от него зависит порядок выдачи
const RU = "Россия";

export const FIXTURE_CITIES: readonly City[] = [
  { id: 524901, name: "Москва", region: "Москва", country: RU, latitude: 55.7522, longitude: 37.6156, zone: "Europe/Moscow", population: 10381222 },
  { id: 1496747, name: "Новосибирск", region: "Новосибирская область", country: RU, latitude: 55.0415, longitude: 82.9346, zone: "Asia/Novosibirsk", population: 1419007 },
  { id: 498817, name: "Санкт-Петербург", region: "Санкт-Петербург", country: RU, latitude: 59.9386, longitude: 30.3141, zone: "Europe/Moscow", population: 5351935 },
  { id: 520555, name: "Нижний Новгород", region: "Нижегородская область", country: RU, latitude: 56.3287, longitude: 44.002, zone: "Europe/Moscow", population: 1284164 },
  { id: 501175, name: "Ростов-на-Дону", region: "Ростовская область", country: RU, latitude: 47.2313, longitude: 39.7233, zone: "Europe/Moscow", population: 1074482 },
  { id: 491422, name: "Сочи", region: "Краснодарский край", country: RU, latitude: 43.5855, longitude: 39.7231, zone: "Europe/Moscow", population: 343334 },
  { id: 468902, name: "Великий Новгород", region: "Новгородская область", country: RU, latitude: 58.5213, longitude: 31.2755, zone: "Europe/Moscow", population: 224209 },
  { id: 524305, name: "Мурманск", region: "Мурманская область", country: RU, latitude: 68.9707, longitude: 33.0749, zone: "Europe/Moscow", population: 287847 },
  { id: 582740, name: "Александров", region: "Владимирская область", country: RU, latitude: 56.4033, longitude: 38.7061, zone: "Europe/Moscow", population: 61000 },
  { id: 2125693, name: "Александровск-Сахалинский", region: "Сахалинская область", country: RU, latitude: 50.8979, longitude: 142.1578, zone: "Asia/Sakhalin", population: 10000 },
  { id: 2127202, name: "Анадырь", region: "Чукотский автономный округ", country: RU, latitude: 64.731, longitude: 177.5159, zone: "Asia/Anadyr", population: 13045 },
  { id: 4000001, name: "Ёлкино", region: "Тестовая область", country: RU, latitude: 56.0, longitude: 40.0, zone: "Europe/Moscow", population: 5200 },
  { id: 3435910, name: "Буэнос-Айрес", region: "Буэнос-Айрес", country: "Аргентина", latitude: -34.6132, longitude: -58.3772, zone: "America/Argentina/Buenos_Aires", population: 13076300 },
  { id: 4031637, name: "Уэлен", region: "Чукотский автономный округ", country: RU, latitude: 66.1535, longitude: -169.8271, zone: "Asia/Anadyr", population: 700 },
];
