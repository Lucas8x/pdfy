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

## Install
Using npm:

```bash
npm install -g @lucas8x/pdfy
```

After install, you can run this command on parent or inside your image directory...

```bash
pdfy
```

## Options

```bash
pdfy [OPTIONS]

-o, --output <path>         Output directory of pdf (default: current working directory)
-c, --concurrency <number>  Number of concurrent processes to use. (default: half of your CPU cores)
-q, --quality <number>      Quality of the compressed images [1-100, "max","all" ]. (default: 80)
-w, --width <number>        Maximum width of the images in pixels. (default: 1920)
-h, --height <number>       Maximum height of the images in pixels. (default: 1080)
-V, --version               output the cli version number
--help                      display this help message
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

