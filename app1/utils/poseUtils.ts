
import { SkeletonState } from "../types";

/**
 * 将 3D 骨骼旋转弧度转换为自然语言描述
 */
export const getPoseDescription = (skeleton: SkeletonState): string => {
  const descriptions: string[] = [];
  
  const getRot = (name: string) => skeleton[name]?.rotation || [0, 0, 0];

  // 1. Arm Logic
  const lSh = getRot('leftShoulder');
  const rSh = getRot('rightShoulder');
  const lEl = getRot('leftElbow');
  const rEl = getRot('rightElbow');
  const lWr = getRot('leftWrist');
  const rWr = getRot('rightWrist');

  // Raised hands
  if (lSh[2] > 1.2 && rSh[2] < -1.2) descriptions.push("both arms raised high");
  else if (lSh[2] > 1.2) descriptions.push("left arm raised");
  else if (rSh[2] < -1.2) descriptions.push("right arm raised");

  // Bent arms (Elbows)
  if (Math.abs(lEl[2]) > 0.8 || Math.abs(rEl[2]) > 0.8) descriptions.push("arms bent at elbows");

  // Wrist positions
  if (Math.abs(lWr[2]) > 1.0) descriptions.push("left wrist twisted");
  if (Math.abs(rWr[2]) > 1.0) descriptions.push("right wrist twisted");

  // 2. Leg Logic
  const lHp = getRot('leftHip');
  const rHp = getRot('rightHip');
  const lKn = getRot('leftKnee');
  const rKn = getRot('rightKnee');
  const lAn = getRot('leftAnkle');
  const rAn = getRot('rightAnkle');

  if (lHp[0] < -0.8 && rHp[0] < -0.8) descriptions.push("sitting or deep crouching");
  else if (lHp[0] < -0.4 || rHp[0] < -0.4) descriptions.push("dynamic leg movement");

  if (Math.abs(lKn[0]) > 0.5 || Math.abs(rKn[0]) > 0.5) descriptions.push("knees bent");

  // Ankle positions
  if (Math.abs(lAn[0]) > 0.8) descriptions.push("left foot lifted");
  if (Math.abs(rAn[0]) > 0.8) descriptions.push("right foot lifted");
  if (Math.abs(lAn[2]) > 0.8 || Math.abs(rAn[2]) > 0.8) descriptions.push("foot turned");

  // 3. Torso Logic
  const spine = getRot('spine');
  const chest = getRot('chest');
  const neck = getRot('neck');
  const head = getRot('head');

  if (spine[0] < -0.25) descriptions.push("leaning forward");
  if (spine[0] > 0.25) descriptions.push("leaning back");
  if (Math.abs(spine[1]) > 0.5) descriptions.push("twisting torso");
  
  if (Math.abs(chest[0]) > 0.3) descriptions.push("chest tilted");
  if (Math.abs(neck[0]) > 0.3) descriptions.push("neck tilted");
  
  if (head[0] < -0.3) descriptions.push("looking up");
  if (head[0] > 0.3) descriptions.push("looking down");
  if (Math.abs(head[1]) > 0.5) descriptions.push("head turned left/right");

  // 4. Overall Pose Logic
  const allJoints = [lSh, rSh, lEl, rEl, lWr, rWr, lHp, rHp, lKn, rKn, lAn, rAn, spine, chest, neck, head];
  const totalMovement = allJoints.reduce((sum, joint) => sum + Math.abs(joint[0]) + Math.abs(joint[1]) + Math.abs(joint[2]), 0);
  
  if (totalMovement < 0.3) {
    descriptions.push("standing straight");
  } else if (totalMovement > 3.0) {
    descriptions.push("complex dynamic pose");
  }

  // 修改：如果没有检测到显著动作，返回空字符串，不输出默认提示词
  return descriptions.length > 0 ? descriptions.join(", ") : "neutral standing pose";
};
