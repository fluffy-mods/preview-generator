import canvas, { Canvas } from "canvas";
import { writeFile } from "fs/promises";
import merge from "lodash/merge.js";
import path from "path";
import { URL } from "url";
const __module = decodeURI(new URL(import.meta.url).pathname);
const __dirname = path.dirname(process.platform === "win32" ? __module.substring(1) : __module);
const FONT_STAATLICHES = path.join(__dirname, "../fonts", "Staatliches-Regular.ttf");
canvas.registerFont(FONT_STAATLICHES, { family: "Staatliches" });
export function createBannerImage(title, settings) {
    const _settings = merge({}, defaultBannerSettings, settings);
    const canvas = new Canvas(_settings.canvas.size.width, _settings.canvas.size.height);
    drawBanner(title, canvas, _settings);
    return canvas.toBuffer("image/png");
}
function drawBanner(title, canvas, _settings) {
    drawBannerBackground(canvas, _settings);
    drawBannerForeground(canvas, _settings);
    drawBannerTitle(title, canvas, _settings);
}
function drawBannerTitle(title, canvas, _settings) {
    const ctx = canvas.getContext("2d");
    // draw title
    ctx.fillStyle = _settings.colours.text;
    ctx.font = `${_settings.banner.size.height * 1.1}px Staatliches`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(title, _settings.banner.offset.x +
        (_settings.banner.size.width + _settings.banner.slant) / 2, // center of x axis
    _settings.banner.offset.y + _settings.banner.size.height / 2, // center of y axis
    _settings.banner.size.width);
}
function drawBannerForeground(canvas, _settings) {
    const ctx = canvas.getContext("2d");
    const corners = getBannerCorners(_settings);
    // draw banner foreground
    ctx.fillStyle = _settings.colours.bannerFg;
    createPath(ctx, corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft);
    ctx.fill();
}
function getBannerCorners(_settings) {
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
            x: _settings.banner.offset.x +
                _settings.banner.size.width +
                _settings.banner.slant,
            y: _settings.banner.offset.y + _settings.banner.size.height,
        },
    };
}
function drawBannerBackground(canvas, _settings) {
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
function createPath(context, ...points) {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        context.lineTo(points[i].x, points[i].y);
    }
    context.closePath();
}
const defaultBannerSettings = {
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
const defaultBannerWithContentPanelSettings = merge({}, defaultBannerSettings, {
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
function getBackgroundCorners(settings) {
    const banner = getBannerCorners(settings);
    return {
        topLeft: {
            x: banner.bottomLeft.x + settings.content.offset.x,
            y: banner.bottomLeft.y + settings.content.offset.y,
        },
        bottomLeft: {
            x: banner.bottomLeft.x +
                settings.content.offset.x +
                settings.content.slant,
            y: banner.bottomLeft.y +
                settings.content.offset.y +
                settings.content.size.height,
        },
        topRight: {
            x: banner.bottomLeft.x +
                settings.content.offset.x +
                settings.content.size.width,
            y: banner.bottomLeft.y +
                settings.content.offset.y +
                settings.content.size.height,
        },
        bottomRight: {
            x: banner.bottomLeft.x +
                settings.content.offset.x +
                settings.content.size.width -
                settings.content.slant,
            y: banner.bottomLeft.y +
                settings.content.offset.y +
                settings.content.size.height,
        },
    };
}
export async function createBannerWithBackground(title, settings) {
    const _settings = merge({}, defaultBannerWithContentPanelSettings, settings);
    const canvas = new Canvas(_settings.canvas.size.width, _settings.canvas.size.height);
    drawBannerBackground(canvas, _settings);
    drawContentBackground(canvas, _settings);
    drawBannerForeground(canvas, _settings);
    drawBannerTitle(title, canvas, _settings);
    return canvas;
}
export function drawContentBackground(canvas, settings) {
    const bgCorners = getBackgroundCorners(settings);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = settings.colours.boxBg;
    ctx.beginPath();
    createPath(ctx, bgCorners.topLeft, bgCorners.bottomLeft, bgCorners.bottomRight, bgCorners.topRight);
    ctx.fill();
}
const DefaultPreviewImageSettings = {
    position: {
        x: 0.5,
        y: 0.5,
    },
    scale: 0.9,
    angle: 0,
    randomAngle: 12,
    randomPosition: 0.05,
};
export async function generatePreviewImage(title, targetPath, contentPath, tags = [], previewImageSettings) {
    const _previewImageSettings = merge({}, DefaultPreviewImageSettings, previewImageSettings);
    const settings = defaultBannerSettings;
    const cnvs = new Canvas(settings.canvas.size.width, settings.canvas.size.height);
    drawBackground(cnvs, settings);
    drawBannerBackground(cnvs, settings);
    if (contentPath) {
        await drawImage(cnvs, contentPath, _previewImageSettings);
    }
    drawBannerForeground(cnvs, settings);
    drawBannerTitle(title, cnvs, settings);
    const imageBuffer = cnvs.toBuffer("image/png");
    await writeFile(targetPath, imageBuffer);
}
async function drawImage(cnvs, sourcePath, settings) {
    // const imageData = await readFile(image, "binary");
    const imageCanvas = await canvas.loadImage(sourcePath);
    const availableSize = {
        width: cnvs.width * settings.scale,
        height: cnvs.height * settings.scale,
    };
    const ratio = Math.min(availableSize.width / imageCanvas.width, availableSize.height / imageCanvas.height);
    const targetSize = {
        width: imageCanvas.width * ratio,
        height: imageCanvas.height * ratio,
    };
    let targetAngle = settings.angle * (Math.PI / 180);
    if (settings.randomAngle) {
        targetAngle +=
            (Math.random() * 2 - 1) * settings.randomAngle * (Math.PI / 180);
    }
    let targetPosition = {
        x: cnvs.width * settings.position.x,
        y: cnvs.height * settings.position.y,
    };
    if (settings.randomPosition) {
        targetPosition.x +=
            (Math.random() * 2 - 1) *
                settings.randomPosition *
                targetSize.width;
        targetPosition.y +=
            (Math.random() * 2 - 1) *
                settings.randomPosition *
                targetSize.height;
    }
    const ctx = cnvs.getContext("2d");
    ctx.translate(targetPosition.x, targetPosition.y);
    ctx.rotate(targetAngle);
    ctx.drawImage(imageCanvas, -targetSize.width / 2, -targetSize.height / 2, targetSize.width, targetSize.height);
    ctx.rotate(-targetAngle);
    ctx.translate(-targetPosition.x, -targetPosition.y);
}
// fill the canvas with the background colour
function drawBackground(canvas, settings) {
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
//# sourceMappingURL=index.js.map