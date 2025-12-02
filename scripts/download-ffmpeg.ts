import { mkdir, chmod, rm } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { $ } from 'bun';

const BINARIES_DIR = join(import.meta.dir, '..', 'binaries');

// FFmpeg static build URLs (from official sources)
const FFMPEG_SOURCES = {
    'linux-x64': {
        url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
        ffmpeg: 'ffmpeg-*-amd64-static/ffmpeg',
        ffprobe: 'ffmpeg-*-amd64-static/ffprobe',
    },
    'linux-arm64': {
        url: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz',
        ffmpeg: 'ffmpeg-*-arm64-static/ffmpeg',
        ffprobe: 'ffmpeg-*-arm64-static/ffprobe',
    },
    'darwin-x64': {
        url: 'https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip',
        ffprobeUrl: 'https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip',
    },
    'darwin-arm64': {
        url: 'https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip',
        ffprobeUrl: 'https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip',
    },
    'win32-x64': {
        url: 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',
        ffmpeg: 'ffmpeg-*-essentials_build/bin/ffmpeg.exe',
        ffprobe: 'ffmpeg-*-essentials_build/bin/ffprobe.exe',
    },
};

type Platform = keyof typeof FFMPEG_SOURCES;

function getPlatform(): Platform {
    const platform = process.platform;
    const arch = process.arch;

    if (platform === 'linux' && arch === 'x64') return 'linux-x64';
    if (platform === 'linux' && arch === 'arm64') return 'linux-arm64';
    if (platform === 'darwin' && arch === 'x64') return 'darwin-x64';
    if (platform === 'darwin' && arch === 'arm64') return 'darwin-arm64';
    if (platform === 'win32' && arch === 'x64') return 'win32-x64';

    throw new Error(`Unsupported platform: ${platform}-${arch}`);
}

async function downloadAndExtract(url: string, outputName: string): Promise<void> {
    const tempFile = join(BINARIES_DIR, `temp-${Date.now()}`);

    console.log(`  Downloading ${outputName}...`);
    await $`curl -L ${url} -o ${tempFile}`.quiet();

    console.log(`  Extracting ${outputName}...`);

    if (url.endsWith('.tar.xz')) {
        await $`tar -xf ${tempFile} -C ${BINARIES_DIR}`.quiet();
    } else if (url.endsWith('.zip')) {
        await $`unzip -q ${tempFile} -d ${BINARIES_DIR}`.quiet();
    }

    await rm(tempFile);
}

async function main() {
    console.log('Setting up FFmpeg binaries...\n');

    const platform = getPlatform();
    const source = FFMPEG_SOURCES[platform];

    console.log(`Platform: ${platform}`);

    if (existsSync(BINARIES_DIR)) {
        await rm(BINARIES_DIR, { recursive: true });
    }
    await mkdir(BINARIES_DIR, { recursive: true });

    const isWin = platform.startsWith('win32');
    const ffmpegName = isWin ? 'ffmpeg.exe' : 'ffmpeg';
    const ffprobeName = isWin ? 'ffprobe.exe' : 'ffprobe';

    if (platform.startsWith('darwin')) {
        await downloadAndExtract(source.url, 'ffmpeg');
        await downloadAndExtract(source.ffprobeUrl!, 'ffprobe');

        await $`mv ${join(BINARIES_DIR, 'ffmpeg')} ${join(BINARIES_DIR, ffmpegName)}`.quiet();
        await $`mv ${join(BINARIES_DIR, 'ffprobe')} ${join(BINARIES_DIR, ffprobeName)}`.quiet();
    } else {
        await downloadAndExtract(source.url, 'ffmpeg bundle');

        // Find the extracted directory (e.g., ffmpeg-7.0.2-amd64-static)
        const dirs = readdirSync(BINARIES_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory());

        if (dirs.length === 0) {
            throw new Error('No extracted directory found after download');
        }

        const extractedDir = join(BINARIES_DIR, dirs[0].name);
        const ffmpegPath = join(extractedDir, 'ffmpeg');
        const ffprobePath = join(extractedDir, 'ffprobe');

        if (!existsSync(ffmpegPath)) {
            throw new Error(`ffmpeg binary not found at ${ffmpegPath}`);
        }
        if (!existsSync(ffprobePath)) {
            throw new Error(`ffprobe binary not found at ${ffprobePath}`);
        }

        await $`mv ${ffmpegPath} ${join(BINARIES_DIR, ffmpegName)}`.quiet();
        await $`mv ${ffprobePath} ${join(BINARIES_DIR, ffprobeName)}`.quiet();

        // Clean up extracted directory
        await rm(extractedDir, { recursive: true });
    }

    if (!isWin) {
        await chmod(join(BINARIES_DIR, ffmpegName), 0o755);
        await chmod(join(BINARIES_DIR, ffprobeName), 0o755);
    }

    console.log('\nFFmpeg setup complete!');
    console.log(`  ffmpeg: ${join(BINARIES_DIR, ffmpegName)}`);
    console.log(`  ffprobe: ${join(BINARIES_DIR, ffprobeName)}\n`);
}

main().catch((error) => {
    console.error('Failed to download FFmpeg:', error);
    process.exit(1);
});
