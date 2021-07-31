import canvas, { Canvas } from "canvas";
import { writeFile } from "fs/promises";
import merge from "lodash/merge.js";
import path from "path";
import { URL } from "url";

const __module = decodeURI(new URL(import.meta.url).pathname);
const __dirname = path.dirname(
    process.platform === "win32" ? __module.substring(1) : __module
);
const FONT_STAATLICHES = path.join(
    __dirname,
    "../fonts",
    "Staatliches-Regular.ttf"
);

canvas.registerFont(FONT_STAATLICHES, { family: "Staatliches" });

export function createBannerImage(title: string, settings?: Partial<Settings>) {
    const _settings = merge({}, defaultBannerSettings, settings);
    const canvas = new Canvas(
        _settings.canvas.size.width,
        _settings.canvas.size.height
    );

    drawBanner(title, canvas, _settings);
    return canvas.toBuffer("image/png");
}

function drawBanner(title: string, canvas: Canvas, _settings: Settings) {
    drawBannerBackground(canvas, _settings);
    drawBannerForeground(canvas, _settings);
    drawBannerTitle(title, canvas, _settings);
}

function drawBannerTitle(title: string, canvas: Canvas, _settings: Settings) {
    const ctx = canvas.getContext("2d");

    // draw title
    ctx.fillStyle = _settings.colours.text;
    ctx.font = `${_settings.banner.size.height * 1.1}px Staatliches`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        title,
        _settings.banner.offset.x +
            (_settings.banner.size.width + _settings.banner.slant) / 2, // center of x axis
        _settings.banner.offset.y + _settings.banner.size.height / 2, // center of y axis
        _settings.banner.size.width
    );
}

function drawBannerForeground(canvas: Canvas, _settings: Settings) {
    const ctx = canvas.getContext("2d");
    const corners = getBannerCorners(_settings);

    // draw banner foreground
    ctx.fillStyle = _settings.colours.bannerFg;
    createPath(
        ctx,
        corners.topLeft,
        corners.topRight,
        corners.bottomRight,
        corners.bottomLeft
    );
    ctx.fill();
}

function getBannerCorners(_settings: Settings): corners {
    return {
        topLeft: {
            x: _settings.banner.offset.x,
            y: _settings.banner.offset.y,
        },
        topRight: {
            x: _settings.banner.offset.x + _settings.banner.size.width,
            y: _settings.banner.offset.y,
        },
        bottomLeft: {
            x: _settings.banner.offset.x + _settings.banner.slant,
            y: _settings.banner.offset.y + _settings.banner.size.height,
        },
        bottomRight: {
            x:
                _settings.banner.offset.x +
                _settings.banner.size.width +
                _settings.banner.slant,
            y: _settings.banner.offset.y + _settings.banner.size.height,
        },
    };
}

function drawBannerBackground(canvas: Canvas, _settings: Settings) {
    const ctx = canvas.getContext("2d");
    const corners = getBannerCorners(_settings);
    const points = {
        left: {
            x: corners.topLeft.x + _settings.banner.pointOffset.x,
            y: corners.topLeft.y - _settings.banner.pointOffset.y,
        },
        right: {
            x: corners.bottomRight.x - _settings.banner.pointOffset.x,
            y: corners.bottomRight.y + _settings.banner.pointOffset.y,
        },
    };

    // draw banner background pieces
    ctx.fillStyle = _settings.colours.bannerBg;
    createPath(ctx, corners.topLeft, points.left, corners.bottomLeft);
    ctx.fill();
    createPath(ctx, corners.bottomRight, points.right, corners.topRight);
    ctx.fill();
}

function createPath(
    context: CanvasRenderingContext2D,
    ...points: { x: number; y: number }[]
): void {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        context.lineTo(points[i].x, points[i].y);
    }
    context.closePath();
}

export type point = { x: number; y: number };
export type size = { width: number; height: number };
export type colour = string;
export type corners = {
    topLeft: point;
    topRight: point;
    bottomLeft: point;
    bottomRight: point;
};

export interface Settings {
    canvas: {
        size: size;
    };
    banner: {
        size: size;
        offset: point;
        pointOffset: point;
        slant: number;
    };

    colours: {
        [label: string]: colour;
    };
}

const defaultBannerSettings: Settings = {
    canvas: {
        size: {
            width: 1920,
            height: 1080,
        },
    },
    banner: {
        size: {
            width: 1680,
            height: 192,
        },
        offset: {
            x: 96,
            y: 696,
        },
        pointOffset: {
            x: 256,
            y: 128,
        },
        slant: 48,
    },

    colours: {
        bannerBg: "#145398",
        bannerFg: "#2c87e9",
        boxBg: "#1a222b",
        text: "#fff",
        bg: "#222",
    },
};

export interface BannerWithContentPanelSettings extends Settings {
    content: {
        size: size;
        offset: point;
        margin: number;
        slant: number;
    };
}

const defaultBannerWithBackgroundSettings: BannerWithContentPanelSettings =
    merge({}, defaultBannerSettings, {
        content: {
            size: {
                width: 1200,
                height: 300,
            },
            offset: {
                x: 0,
                y: 0,
            },
            margin: 24,
            slant: 48,
        },
    });

function getBackgroundCorners(
    settings: BannerWithContentPanelSettings
): corners {
    const banner = getBannerCorners(settings);
    return {
        topLeft: {
            x: banner.bottomLeft.x + settings.content.offset.x,
            y: banner.bottomLeft.y + settings.content.offset.y,
        },
        bottomLeft: {
            x:
                banner.bottomLeft.x +
                settings.content.offset.x +
                settings.content.slant,
            y:
                banner.bottomLeft.y +
                settings.content.offset.y +
                settings.content.size.height,
        },
        topRight: {
            x:
                banner.bottomLeft.x +
                settings.content.offset.x +
                settings.content.size.width,
            y:
                banner.bottomLeft.y +
                settings.content.offset.y +
                settings.content.size.height,
        },
        bottomRight: {
            x:
                banner.bottomLeft.x +
                settings.content.offset.x +
                settings.content.size.width -
                settings.content.slant,
            y:
                banner.bottomLeft.y +
                settings.content.offset.y +
                settings.content.size.height,
        },
    };
}

export async function createBannerWithBackground(
    title: string,
    settings?: Partial<BannerWithContentPanelSettings>
): Promise<canvas.Canvas> {
    const _settings = merge({}, defaultBannerWithBackgroundSettings, settings);
    const canvas = new Canvas(
        _settings.canvas.size.width,
        _settings.canvas.size.height
    );

    drawBannerBackground(canvas, _settings);
    drawContentBackground(canvas, _settings);
    drawBannerForeground(canvas, _settings);
    drawBannerTitle(title, canvas, _settings);

    return canvas;
}

export function drawContentBackground(
    canvas: Canvas,
    settings: BannerWithContentPanelSettings
) {
    const bgCorners = getBackgroundCorners(settings);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = settings.colours.boxBg;
    ctx.beginPath();
    createPath(
        ctx,
        bgCorners.topLeft,
        bgCorners.bottomLeft,
        bgCorners.bottomRight,
        bgCorners.topRight
    );
    ctx.fill();
}

export async function generatePreviewImage(
    title: string,
    targetPath: string,
    contentPath?: string,
    tags: { label: string; colour: string }[] = [],
    contentSettings?: Partial<{
        sizeFactor: number;
        angleRadians: number;
        wiggleRoom: number;
    }>
) {
    const _contentSettings = merge(
        {},
        {
            sizeFactor: SIZE_FACTOR,
            angleRadians: ANGLE_RADIANS,
            wiggleRoom: WIGGLE_ROOM,
        },
        contentSettings
    );
    const settings = defaultBannerSettings;

    const cnvs = new Canvas(
        settings.canvas.size.width,
        settings.canvas.size.height
    );

    drawBackground(cnvs, settings);
    drawBannerBackground(cnvs, settings);
    if (contentPath) {
        await drawImage(cnvs, contentPath, _contentSettings);
    }
    drawBannerForeground(cnvs, settings);
    drawBannerTitle(title, cnvs, settings);

    const imageBuffer = cnvs.toBuffer("image/png");
    await writeFile(targetPath, imageBuffer);
}

async function drawImage(
    cnvs: Canvas,
    sourcePath: string,
    settings: { sizeFactor: number; wiggleRoom: number; angleRadians: number }
) {
    // const imageData = await readFile(image, "binary");
    const imageCanvas = await canvas.loadImage(sourcePath);

    const availableSize = {
        width: cnvs.width * settings.sizeFactor,
        height: cnvs.height * settings.sizeFactor,
    };
    const ratio = Math.min(
        availableSize.width / imageCanvas.width,
        availableSize.height / imageCanvas.height
    );
    const targetSize = {
        width: imageCanvas.width * ratio,
        height: imageCanvas.height * ratio,
    };
    const randomOffset = {
        x: (Math.random() * 2 - 1) * settings.wiggleRoom * targetSize.width,
        y: (Math.random() * 2 - 1) * settings.wiggleRoom * targetSize.height,
    };
    const angle =
        (Math.random() * 2 - 1) * settings.angleRadians * (Math.PI / 180);

    const ctx = cnvs.getContext("2d");
    ctx.translate(
        cnvs.width / 2 + randomOffset.x,
        cnvs.height / 2 + randomOffset.y
    );
    ctx.rotate(angle);
    ctx.drawImage(
        imageCanvas,
        -targetSize.width / 2,
        -targetSize.height / 2,
        targetSize.width,
        targetSize.height
    );
    ctx.rotate(-angle);
    ctx.translate(
        -cnvs.width / 2 - randomOffset.x,
        -cnvs.height / 2 - randomOffset.y
    );
}

const SIZE_FACTOR = 0.9;
const ANGLE_RADIANS = 12;
const WIGGLE_ROOM = 0.05;

// fill the canvas with the background colour
function drawBackground(canvas: Canvas, settings: Settings) {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = settings.colours.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// async function test(title: string, imagePath: string) {
//     const settings: Settings = merge({}, defaultBannerSettings, {
//         canvas: {
//             size: {
//                 width: 1920,
//                 height: 1080,
//             },
//         },
//         banner: {
//             size: {
//                 width: 1760,
//                 height: 160,
//             },
//             offset: {
//                 x: 80,
//                 y: 760,
//             },
//             slant: 40,
//             pointOffset: {
//                 x: 256,
//                 y: 128,
//             },
//         },
//     });
//     const contentSettings = {
//         sizeFactor: SIZE_FACTOR,
//         angleRadians: ANGLE_RADIANS,
//         wiggleRoom: WIGGLE_ROOM,
//     };

//     const cnvs = new Canvas(
//         settings.canvas.size.width,
//         settings.canvas.size.height
//     );

//     if (imagePath) {
//         await drawImage(cnvs, imagePath, contentSettings);
//     }

//     drawBannerBackground(cnvs, settings);
//     drawBannerForeground(cnvs, settings);
//     drawBannerTitle(title, cnvs, settings);

//     const imageBuffer = cnvs.toBuffer("image/png");
//     await writeFile("Preview.png", imageBuffer);
// }

// test(process.argv[2], process.argv[3]);
