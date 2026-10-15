export type City = {
  id: number;
  name: string; // русское название, если нет — латиницей
  region: string; // область или край; для городов-государств может быть пустым
  country: string; // название страны по-русски
  latitude: number;
  longitude: number; // на восток положительна
  zone: string; // IANA, например Europe/Moscow
  population: number;
};
