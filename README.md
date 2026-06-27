# Pdfy

Pdfy is a CLI tool for converting and compressing a image folder into a single PDF file.

## Features

- Converts images from a selected folder into one PDF.
- Supports JPG, PNG, WebP, JFIF, TIFF, SVG, AVIF, BMP, GIF formats.
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
NOTE: On windows you can press shift + right click to open terminal in selected folder.

## Options

```bash
pdfy [OPTIONS]

-i, --input <path>          Input directory that will be converted (default: current working directory)
-o, --output <path>         Output directory of pdf (default: current working directory)
-c, --concurrency <number>  Number of concurrent processes to use. (default: half of your CPU cores)
-q, --quality <number>      Quality of the compressed images [1-100, "max","all" ]. (default: 80)
-w, --width <number>        Maximum width of the images in pixels. (default: 1920)
-h, --height <number>       Maximum height of the images in pixels. (default: 1080)
-s, --sort <newest|oldest>  Determines the order in which the images will be inserted into the PDF. (default: "newest")
--pw, --password <string>   Protect file with password.
--cbz                       Create CBZ file instead of PDF.
--skip-animated-frame       Do not insert first frame of animated images on PDF/CBZ (default: false)
--include-animated          Also process animated images, this will drastically increase processing time. 
                            Only CBZ support animated images. (default: false)
-V, --version               output the cli version number
--help                      display this help message
```

### Examples
Sets the quality to half of the original:
```bash
pdfy -q 50
```

Defines the maximum image resolution:
```bash
pdfy -w 1280 -h 720
```

The PDF starts with the oldest images:
```bash
pdfy -s oldest
```

Protect file with a password:
```bash
pdfy --password 'a1b2c3'
```
*NOTE: quotation marks will not be part of the password.

Create CBZ file instead of PDF:
```bash
pdfy --cbz
```
*NOTE: --password doesn't work in CBZ format.

A complete example:
```bash
pdfy -i C:\images -c 8 -q 50 -w 1280 -h 720 -s oldest -o F:\images\pdfs --password '1234'
```
*NOTE: The input and output disks can be different; no problem.

## Built with

- sharp - Image manipulation/processing
- bmp-js - Bmp format suport
- pdfkit - PDF manipulation
- archiver - CBZ manipulation

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

