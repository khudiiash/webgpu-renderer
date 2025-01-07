export type EngineSettings = {
    canvas: HTMLCanvasElement | undefined;
    width: number;
    height: number;
    fullscreen: boolean;
};

export type EngineSettingsConfig = {
    canvas?: HTMLCanvasElement;
    width?: number;
    height?: number;
    fullscreen?: boolean;
}

export const EngineDefaultSettings: EngineSettings = {
    width: 800,
    height: 600,
    fullscreen: false,
    canvas: undefined
};