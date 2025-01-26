import { World } from './World';

export interface System {
    update(delta: number, world: World): void;
    init?(world: World): Promise<void> | void;
    destroy?(world: World): Promise<void> | void;
    priority?: number;
    enabled?: boolean;
}