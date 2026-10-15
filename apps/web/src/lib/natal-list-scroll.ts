// Список городов может быть ниже своей высоты: выбранный стрелками пункт нужно прокрутить в видимую часть списка.
// Двигается только сам список, страница не прокручивается.
type Box = { top: number; bottom: number };
export type ScrollableList = { scrollTop: number; getBoundingClientRect(): Box };
export type ListOption = { getBoundingClientRect(): Box };

export function keepOptionVisible(list: ScrollableList, option: ListOption): void {
  const listBox = list.getBoundingClientRect();
  const optionBox = option.getBoundingClientRect();
  if (optionBox.top < listBox.top) list.scrollTop -= listBox.top - optionBox.top;
  else if (optionBox.bottom > listBox.bottom) list.scrollTop += optionBox.bottom - listBox.bottom;
}
