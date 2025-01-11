export interface IRendererSystem {
    name: string;
    priority: number; 
    enabled: boolean;
    
    init(renderer: Renderer): Promise<void>;
    update(deltaTime: number): void;
    cleanup(): Promise<void>;
}

  