# Pdfy

Pdfy is a CLI tool for converting and compressing a image folder into a single PDF file.

## Features

- Converts images from a selected folder into one PDF.
- Supports JPG, PNG, WebP, JFIF, TIFF, SVG, AVIF, BMP formats.
- Resizes images larger than 1920×1080.
- Reports original size vs final PDF size.
- Reduce image size using progressive encoding.
- Reduces the image size by decreasing a bit of the quality.

## Requirements

- Node.js 22+ or Bun 1.3+

## Usage

Using npm:

```bash
npx @lucas8x/pdfy
```

Using Bun:

```bash
bunx @lucas8x/pdfy
```

## Built with

- sharp - Image manipulation/processing
- bmp-js - Bmp format suport
- pdfkit - PDF manipulation

## Development 

Source code are located in `src/`. <br>
Build the CLI with:

```bash
bun run build
```

Make it available on terminal:

```bash
bun link
```

## License

This project is licensed under the [MIT License](./LICENSE).

