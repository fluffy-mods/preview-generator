/// <reference types="node" />
import canvas, { Canvas } from "canvas";
export declare function createBannerImage(title: string, settings?: Partial<Settings>): Buffer;
export declare type point = {
    x: number;
    y: number;
};
export declare type size = {
    width: number;
    height: number;
};
export declare type colour = string;
export declare type corners = {
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
export interface BannerWithContentPanelSettings extends Settings {
    content: {
        size: size;
        offset: point;
        margin: number;
        slant: number;
    };
}
export declare function createBannerWithBackground(title: string, settings?: Partial<BannerWithContentPanelSettings>): Promise<canvas.Canvas>;
export declare function drawContentBackground(canvas: Canvas, settings: BannerWithContentPanelSettings): void;
export declare function generatePreviewImage(title: string, targetPath: string, contentPath?: string, tags?: {
    label: string;
    colour: string;
}[], contentSettings?: Partial<{
    sizeFactor: number;
    angleRadians: number;
    wiggleRoom: number;
}>): Promise<void>;
