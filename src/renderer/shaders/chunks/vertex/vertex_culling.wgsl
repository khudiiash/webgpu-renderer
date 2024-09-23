let to_vertex = output.vWorldPosition - camera.position;
let dot_product = dot(normalize(to_vertex), camera.direction);
if (dot_product < 0.0) {
    return VertexOutput();
}