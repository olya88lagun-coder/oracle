// Run from the repository root: node scripts/brand-icons.mjs
// All favicon formats share the transparent header emblem as their source.
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const source = await readFile(new URL("../apps/web/public/oracle-mark.svg", import.meta.url));
const app = new URL("../apps/web/src/app/", import.meta.url);
await writeFile(new URL("icon.svg", app), source);
await writeFile(new URL("icon.png", app), await sharp(source).resize(512, 512).png().toBuffer());
await writeFile(new URL("apple-icon.png", app), await sharp(source).resize(180, 180).flatten({ background: "#100E13" }).png().toBuffer());

const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(size => sharp(source).resize(size, size).png().toBuffer()));
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  directory[entry] = sizes[index];
  directory[entry + 1] = sizes[index];
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(image.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
await writeFile(new URL("favicon.ico", app), Buffer.concat([directory, ...images]));
console.log("Updated SVG, 512px PNG, 180px Apple icon and 16/32/48px ICO.");
