let skinMatrix = 
    (joint_matrices[u32(input.joints[0])] * inverse_bind_matrices[u32(input.joints[0])]) * input.weights[0] +
    (joint_matrices[u32(input.joints[1])] * inverse_bind_matrices[u32(input.joints[1])]) * input.weights[1] +
    (joint_matrices[u32(input.joints[2])] * inverse_bind_matrices[u32(input.joints[2])]) * input.weights[2] +
    (joint_matrices[u32(input.joints[3])] * inverse_bind_matrices[u32(input.joints[3])]) * input.weights[3];

let worldPosition = model * skinMatrix * vec4f(input.position, 1.0);
let modelMatrix = model;
output.position = camera.projection * camera.view * worldPosition;