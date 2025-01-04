
<a id="readme-top"></a>
<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/khudiiash/webgpu-renderer">
    <img src="https://github.com/user-attachments/assets/88132eb7-e2f5-474f-abd6-5ce5abd392a0" alt="Logo" width="180" height="180">
  </a>

  <h3 align="center">Khudiiash's WebGPU Renderer</h3>

  <p align="center">
    An awesome WebGPU renderer !
    <br />
    <a href="https://mebyz.github.io/webgpu-renderer-demo">View Demo</a>
    ·
    <a href="https://github.com/khudiiash/webgpu-renderer/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/khudiiash/webgpu-renderer/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<!--
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#architecture">Proposed Architecture</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>
-->

<!-- ABOUT THE PROJECT -->
## About The Project

### A WebGPU 3D renderer for web. 

### For a few years, we were stuck developing games on WebGL, and now WebGPU seems to be a breath of fresh air ! 

https://github.com/user-attachments/assets/e652ba67-bbc2-480b-92f7-59c617efb217


https://github.com/user-attachments/assets/cd47b4c9-a43d-40f5-bc6b-f2a841afc4dc


https://github.com/user-attachments/assets/83fedd2b-f73f-430f-9275-4a937da58410


https://github.com/user-attachments/assets/0cd42e44-60ef-4440-8bd4-def7ede117dc

### Key features:

* ShaderLib for composing shaders from chunks
* Buffers management
* Directional Light
* Fog
* PCF Shadows
* Phong Material
* GLTFLoader
* Instancing
* Wind Shader
* Boids

"I am excited about how well it performs on both PC and mobile hitting 60 FPS on my iPhone 13 without a sweat" - Khudiiash


<!-- GETTING STARTED -->
## Getting Started

1. Clone the repo
   ```sh
   git clone https://github.com/khudiiash/webgpu-renderer.git
   ```
2. Install NPM packages
   ```sh
   yarn
   ```
3. Build
   ```js
   yarn build
   ```
4. Run
   ```sh
   yarn run
   ```
   
<!-- ARCHITECTURE -->
## Proposed Architecture

```mermaid

flowchart TB
linkStyle default interpolate basis
    %% Main Steps
    A1["1 Input System"] 
    A2["2 Resource Manager"]
    A3["3 Render Graph"]
    A4["4 Geometry Pass"]
    A5["5 Shadow Pass"]
    A6["6 Lighting Pass"]
    A7["7 Post-Processing Passes"]
    A8["8 Compute Passes"]
    A9["9 Debug Tools"]

    %% Connections between main steps
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> A5
    A5 --> A6
    A6 --> A7
    A7 --> A8
    A8 --> A9

    %% Input System Details
    B1["Camera Controller: Controls the camera movement and viewpoint"]
    B2["User Input Handler: Handles user interaction (keyboard, mouse, etc.)"]
    B3["Scene Data Updater: Updates scene elements based on inputs"]
    A1 --> B1
    A1 --> B2
    A1 --> B3


    %% Resource Manager Details
    C1["Pipeline Manager: Manages pipeline states for rendering"]
    C2["Texture Allocator: Allocates textures used in rendering"]
    C3["Buffer Manager: Allocates and manages GPU buffers"]
    C4["Shader Cache: Caches compiled shaders for faster access"]
    C5["Descriptor Pool: Manages GPU descriptors for resources"]
    A2 --> C1
    A2 --> C2
    A2 --> C3
    A2 --> C4
    A2 --> C5

    %% Render Graph Details
    D1["Render Passes: Defines each render pass for specific tasks"]
    D2["Dependencies: Manages pass dependencies to ensure correct order"]
    D3["Pass Scheduler: Schedules the execution of render passes"]
    D4["Resource Binding: Binds resources to the pipeline during execution"]
    D5["Command Encoder: Generates GPU commands based on passes"]
    A3 --> D1
    A3 --> D2
    A3 --> D3
    A3 --> D4
    A3 --> D5

    %% Geometry Pass Details
    E1["Scene Rendering: Renders the scene geometry into the G-buffer"]
    E2["G-Buffer Generation: Generates a G-buffer for lighting and shading"]
    A4 --> E1
    A4 --> E2

    %% Shadow Pass Details
    F1["Depth Map Generation: Generates depth maps for shadows"]
    F2["Cascade Shadow Maps: Creates multiple shadow cascades for distant shadows"]
    A5 --> F1
    A5 --> F2

    %% Lighting Pass Details
    G1["Deferred Lighting: Performs lighting calculations in deferred shading"]
    G2["Forward Lighting: Handles lighting for forward rendering"]
    G3["Clustered Shading: Optimizes lighting calculations using clusters"]
    A6 --> G1
    A6 --> G2
    A6 --> G3

    %% Post-Processing Pass Details
    H1["Tone Mapping Pass: Applies tone mapping to adjust scene brightness"]
    H2["Bloom Pass: Simulates light bloom effects"]
    H3["Ambient Occlusion Pass: Enhances depth perception with ambient occlusion"]
    H4["Anti-Aliasing Pass: Reduces jagged edges (aliasing) in rendered images"]
    A7 --> H1
    A7 --> H2
    A7 --> H3
    A7 --> H4

    %% Compute Pass Details
    I1["Particle Simulation: Simulates particle systems like smoke, fire, etc."]
    I2["Physics Calculations: Performs calculations for physics-based interactions"]
    A8 --> I1
    A8 --> I2

    %% Debug Tools Details
    J1["Render Graph Visualization: Visualizes the render graph for debugging"]
    J2["Resource Allocation Debugger: Tracks resource usage and allocation"]
    J3["Frame Timing Analysis: Analyzes performance bottlenecks per frame"]
    J4["Real-Time Shader Reloading: Allows shader reloading during runtime"]
    A9 --> J1
    A9 --> J2
    A9 --> J3
    A9 --> J4


    %% Styles
    classDef input fill:#f9f,stroke:#333,stroke-width:2px;
    classDef resource fill:#bbf,stroke:#333,stroke-width:2px;
    classDef geometry fill:#fc6,stroke:#333,stroke-width:2px;
    classDef shadow fill:#bfb,stroke:#333,stroke-width:2px;
    classDef lighting fill:#cfc,stroke:#333,stroke-width:2px;
    classDef postproc fill:#c6f,stroke:#333,stroke-width:2px;
    classDef compute fill:#6cf,stroke:#333,stroke-width:2px;
    classDef debug fill:#ccc,stroke:#333,stroke-width:2px;

    %% Apply styles to nodes
    class A1,B1,B2,B3 input;
    class A2,C1,C2,C3,C4,C5 resource;
    class A4,E1,E2 geometry;
    class A5,F1,F2 shadow;
    class A6,G1,G2,G3 lighting;
    class A7,H1,H2,H3,H4 postproc;
    class A8,I1,I2 compute;
    class A9,J1,J2,J3,J4 debug;


```

1. Input System: Handles user input and updates the scene based on the user's interactions.

2. Resource Manager: Manages GPU resources such as textures, buffers, and shaders to ensure efficient usage.

3. Render Graph: Coordinates different rendering passes and manages resource dependencies to optimize performance.

4. Geometry Pass: Renders the scene’s geometry and generates the G-buffer for deferred rendering.

5. Shadow Pass: Calculates the shadow maps to provide realistic lighting effects in the scene.

6. Lighting Pass: Applies various lighting techniques to the scene, including deferred and forward lighting.

7. Post-Processing Passes: Applies final visual effects such as tone mapping, bloom, and anti-aliasing.

8. Compute Passes: Runs compute shaders for simulations such as particle effects and physics calculations.

9. Debug Tools: Provides visualization and debugging tools for monitoring and optimizing the renderer.

<!-- ROADMAP -->
## Roadmap

- [x] Add Readme
- [x] Add License
- [ ] V2
- [ ] Global Illumination

See the [open issues](https://github.com/khudiiash/webgpu-renderer/issues) for a full list of proposed features (and known issues).


<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Top contributors:

<a href="https://github.com/khudiiash/webgpu-renderer/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=khudiiash/webgpu-renderer" alt="contrib.rocks image" />
</a>


<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.


<!-- CONTACT -->
## Contact

khudiiash - u/mitrey144 on reddit - [https://github.com/khudiiash](https://github.com/khudiiash)

mebyz - u/mebyz on reddit - [https://github.com/mebyz](https://github.com/mebyz)


<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [WebGPU](https://www.w3.org/TR/webgpu/)


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/khudiiash/webgpu-renderer.svg?style=for-the-badge
[contributors-url]: https://github.com/khudiiash/webgpu-renderer/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/khudiiash/webgpu-renderer.svg?style=for-the-badge
[forks-url]: https://github.com/khudiiash/webgpu-renderer/network/members
[stars-shield]: https://img.shields.io/github/stars/khudiiash/webgpu-renderer.svg?style=for-the-badge
[stars-url]: https://github.com/khudiiash/webgpu-renderer/stargazers
[issues-shield]: https://img.shields.io/github/issues/khudiiash/webgpu-renderer.svg?style=for-the-badge
[issues-url]: https://github.com/khudiiash/webgpu-renderer/issues
[license-shield]: https://img.shields.io/github/license/khudiiash/webgpu-renderer.svg?style=for-the-badge
[license-url]: https://github.com/khudiiash/webgpu-renderer/blob/master/LICENSE

