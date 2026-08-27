#!/usr/bin/env node
import { processFolder } from './app/processFolder';
import { askPassword } from './cli/askPasswor';
import { countExtensions } from './cli/countExtensions';
import { parseArgs } from './cli/parser';
import { selectFolder } from './cli/selectFolder';
import { FfmpegProcessor } from './image/ffmpegProcessor';
import { ImageProcessor } from './image/imageProcessor';

async function main() {
  const config = parseArgs();

  if (config.list) {
    await countExtensions(config.input ?? process.cwd());
    return;
  }

  const selectedFolders =
    config.input === null ? await selectFolder() : [config.input];

  if (selectedFolders.length === 0) {
    console.warn('No folder selected.');
    return;
  }

  let userPassword = config.password;
  if (!(config.password || config.cbz)) {
    userPassword = await askPassword();
  }
  config.password = userPassword;

  const cbzAnimationSupport =
    config.cbz &&
    !config.skipAnimatedFrame &&
    (config.copyAnimated || config.compressAnimated);

  const ffmpegProcessor = new FfmpegProcessor({
    quality: config.quality,
    maxHeight: config.height,
    maxWidth: config.width,
  });

  await ffmpegProcessor.checkFfmpegAvailability();
  ffmpegProcessor.printStatusMessage(cbzAnimationSupport, config.copyAnimated);

  const imageProcessor = new ImageProcessor({
    quality: config.quality,
    maxHeight: config.height,
    maxWidth: config.width,
    skipAnimatedFrame: config.skipAnimatedFrame,
    copyAnimated: config.copyAnimated,
    cbzAnimationSupport,
    ffmpegProcessor,
  });

  for (const folderPath of selectedFolders) {
    await processFolder(
      folderPath,
      config.output,
      {
        password: userPassword,
        enableCBZ: config.cbz,
        sort: config.sort,
        concurrency: config.concurrency,
      },
      imageProcessor
    );
  }
}

main();

/* process.on('SIGINT', () => {
  console.log('Caught interrupt signal');
  if (pdfOutputPath && fs.existsSync(pdfOutputPath)) {
    fs.unlinkSync(pdfOutputPath);
  }
  process.exit();
}); */
