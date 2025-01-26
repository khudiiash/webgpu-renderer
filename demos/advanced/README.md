# Sponza ECS Demo

A WebGPU demonstration of the Sponza scene using an Entity Component System architecture. This demo showcases how to build complex scenes using a data-oriented approach.

## Features

- Dynamic grass animation with wind effects
- Particle systems with custom shaders
- Dynamic point lights with animation
- Animated camera movement
- All configured through YAML

## Project Structure

/src/
       ├── core/
                         ├── ecs/
                         │             ├── core/
                         │             │               ├── Component.ts
                         │             │               ├── Entity.ts
                         │             │               ├── System.ts
                         │             │               ├── World.ts
                         │             │               ├── ComponentRegistry.ts
                         │             │               └── SystemRegistry.ts
                         │             ├── components/
                         │             │                              ├── Transform.ts
                         │             │                              ├── Model.ts
                         │             │                              ├── Light.ts
                         │             │                              ├── Particle.ts
                         │             │                              ├── Camera.ts
                         │             │                              └── Scene.ts
                         │             └── systems/
                         │                                     ├── GrassSystem.ts
                         │                                     ├── ParticleSystem.ts
                         │                                     ├── LightAnimationSystem.ts
                         │                                     └── CameraAnimationSystem.ts
                         └── engine/
                                               ├── Engine.ts
                                               └── ...
/demos/
             ├── README.md
             ├── basic/..
             ├── intermediate/..
             └── advanced/
                                        └── sponza_ecs/
                                                                       ├── README.md
                                                                       ├── index.ts
                                                                       ├── Demo1Scene.ts
                                                                       └── config.yaml
                                                                       


## Scene Components

### 1. Environment
- Sponza model loaded from GLTF
- Dynamic grass field with wind animation
- Custom fog settings

### 2. Lighting
- Two animated point lights:
  - White light moving in a circular pattern
  - Red light with rotation animation
- Ambient lighting

### 3. Particles
- GPU-instanced particle system
- Custom shader for particle appearance
- Animated movement

### 4. Camera
- Perspective camera
- Circular movement animation

## ECS Implementation

The demo uses several key components:

1. **Components**:
   - Transform (position, rotation, scale)
   - Model (geometry, materials)
   - Light (color, intensity, animation)
   - Particle (count, properties)
   - Camera (perspective settings)

2. **Systems**:
   - GrassSystem (handles grass instance creation and animation)
   - ParticleSystem (manages particle movement)
   - LightAnimationSystem (controls light animations)
   - CameraAnimationSystem (handles camera movement)

## Configuration

All scene settings are defined in `config.yaml`:
- Scene parameters (background, fog, etc.)
- Entity definitions
- Component properties
- System configurations
- Material and shader settings
