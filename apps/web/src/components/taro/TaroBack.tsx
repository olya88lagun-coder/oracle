import Image from "next/image";

// Рубашка колоды: рисунок без текста, декоративный
export function TaroBack() {
  return <Image className="taro-back" src="/taro/rubashka.webp" alt="" width={277} height={415} priority unoptimized />;
}
