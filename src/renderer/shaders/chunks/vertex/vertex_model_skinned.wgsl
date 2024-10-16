let skinMatrix = 
    (joint_matrices[u32(input.joints[0])] * inverse_bind_matrices[u32(input.joints[0])]) * input.weights[0] +
    (joint_matrices[u32(input.joints[1])] * inverse_bind_matrices[u32(input.joints[1])]) * input.weights[1] +
    (joint_matrices[u32(input.joints[2])] * inverse_bind_matrices[u32(input.joints[2])]) * input.weights[2] +
    (joint_matrices[u32(input.joints[3])] * inverse_bind_matrices[u32(input.joints[3])]) * input.weights[3];

var worldPosition = model * skinMatrix * vec4f(input.position, 1.0);
var modelMatrix = model;

let skinNormalMatrix = mat3x3<f32>(skinMatrix[0].xyz, skinMatrix[1].xyz, skinMatrix[2].xyz);
let modelNormalMatrix = transpose(inverse3x3(mat3x3<f32>(model[0].xyz, model[1].xyz, model[2].xyz)));
var worldNormal = normalize(modelNormalMatrix * skinNormalMatrix * input.normal);