import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setAudioCodec('aac');
Config.setAudioBitrate('320k');
Config.setOverwriteOutput(true);
Config.setConcurrency(null); // default Remotion; naikkan (mis. 4–8) di mesin dengan banyak core

// Opsional: pakai Chromium lokal bila Remotion tidak bisa mengunduh browser sendiri.
// Contoh: BROWSER_EXECUTABLE=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
if (process.env.BROWSER_EXECUTABLE) {
	Config.setBrowserExecutable(process.env.BROWSER_EXECUTABLE);
}
