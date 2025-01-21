# WebGPU Engine Demos

This folder contains various demos showcasing different features and architectural approaches of the engine.

## Available Demos

### 1. Sponza Demo (Classic Implementation)
**Location**: `demos/intermediate/Demo1`

A classic implementation of the Sponza scene using direct engine integration. Features a dynamic environment with animated grass, particles, and dynamic lighting.

Key features:
- Direct engine usage without additional abstractions
- Simple, straightforward code organization
- Good for learning basic engine concepts

[Learn more about the Classic Sponza Demo](./intermediate/Demo1/README.md)

### 2. Sponza "ECS" Demo (Entity Component System Implementation)
**Location**: `demos/advanced/Demo1`

The same Sponza scene rebuilt using an Entity Component System (ECS) architecture. Shows how to structure more complex applications using a data-oriented approach.

Key features:
- Full ECS implementation
- Declarative scene setup using YAML
- Component-based architecture
- Reusable systems for behavior
- Easy to extend and modify

[Learn more about the ECS Sponza Demo](./advanced/Demo1/README.md)

## Understanding the ECS Architecture

The ECS (Entity Component System) architecture used in demo1 is based on three main concepts:

1. **Entities**: Simple containers that give identity to objects in the scene
2. **Components**: Pure data containers that define object properties
3. **Systems**: Logic that operates on entities with specific components

Benefits of the ECS approach:
- Clear separation of data and logic
- Easy to add new features through components and systems
- Better performance through data-oriented design
- More maintainable and testable code
- Declarative scene setup using YAML

## Getting Started

Each demo folder contains:
- README.md with specific setup and usage instructions
- Complete source code
- Configuration files where applicable
- Assets needed for the demo