export type EngineSettings = {
    canvas: HTMLCanvasElement | undefined;
    width: number;
    height: number;
    fullscreen: boolean;
    MAX_DIRECTIONAL_LIGHTS?: number;
    MAX_POINT_LIGHTS?: number;
    MAX_SPOT_LIGHTS?: number;
    MAX_TEXTURES?: number;
    MAX_MATERIALS?: number;
};

export type EngineSettingsConfig = {
    canvas?: HTMLCanvasElement;
    width?: number;
    height?: number;
    fullscreen?: boolean;
    MAX_DIRECTIONAL_LIGHTS?: number;
    MAX_POINT_LIGHTS?: number;
    MAX_SPOT_LIGHTS?: number;
    MAX_TEXTURES?: number;
    MAX_MATERIALS?: number;
}

export const EngineDefaultSettings: EngineSettings = {
    width: 800,
    height: 600,
    fullscreen: false,
    canvas: undefined,
    MAX_DIRECTIONAL_LIGHTS: 4,
    MAX_POINT_LIGHTS: 64,
    MAX_SPOT_LIGHTS: 16,
    MAX_TEXTURES: 64,
    MAX_MATERIALS: 64,
};