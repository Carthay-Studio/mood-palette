
import type { Palette } from '../types';

function hexToRgbFloat(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
}

export const createAseFile = (palette: Palette): Blob => {
  const buffer = new ArrayBuffer(1024 * 4); // 4KB buffer, should be enough
  const view = new DataView(buffer);
  let offset = 0;

  // Header
  view.setUint8(offset++, 'A'.charCodeAt(0));
  view.setUint8(offset++, 'S'.charCodeAt(0));
  view.setUint8(offset++, 'E'.charCodeAt(0));
  view.setUint8(offset++, 'F'.charCodeAt(0));
  view.setUint16(offset, 1, false); offset += 2; // Version major
  view.setUint16(offset, 0, false); offset += 2; // Version minor
  view.setUint32(offset, palette.colors.length + 2, false); offset += 4; // Number of blocks (group start + N colors + group end)

  // Group Start Block
  view.setUint16(offset, 0xC001, false); offset += 2;
  const groupName = palette.name;
  const groupNameLength = (groupName.length + 1) * 2;
  view.setUint32(offset, groupNameLength, false); offset += 4;
  view.setUint16(offset, groupName.length + 1, false); offset += 2;
  for (let i = 0; i < groupName.length; i++) {
    view.setUint16(offset, groupName.charCodeAt(i), false); offset += 2;
  }
  view.setUint16(offset, 0, false); offset += 2; // Null terminator

  // Color Blocks
  palette.colors.forEach(color => {
    view.setUint16(offset, 1, false); offset += 2; // Color block type

    const colorName = color.name;
    const nameLengthInBytes = (colorName.length + 1) * 2;
    const blockLength = nameLengthInBytes + 4 + (3 * 4) + 2; // name + model + values + color type
    view.setUint32(offset, blockLength, false); offset += 4;

    // Color Name
    view.setUint16(offset, colorName.length + 1, false); offset += 2;
    for (let i = 0; i < colorName.length; i++) {
      view.setUint16(offset, colorName.charCodeAt(i), false); offset += 2;
    }
    view.setUint16(offset, 0, false); offset += 2; // Null terminator

    // Color Model
    view.setUint8(offset++, 'R'.charCodeAt(0));
    view.setUint8(offset++, 'G'.charCodeAt(0));
    view.setUint8(offset++, 'B'.charCodeAt(0));
    view.setUint8(offset++, ' '.charCodeAt(0));

    // Color Values
    const [r, g, b] = hexToRgbFloat(color.hex);
    view.setFloat32(offset, r, false); offset += 4;
    view.setFloat32(offset, g, false); offset += 4;
    view.setFloat32(offset, b, false); offset += 4;

    // Color Type (0 = Global)
    view.setUint16(offset, 0, false); offset += 2;
  });

  // Group End Block
  view.setUint16(offset, 0xC002, false); offset += 2;
  view.setUint32(offset, 0, false); offset += 4; // Block length is 0

  return new Blob([buffer.slice(0, offset)], { type: 'application/octet-stream' });
};
