
import { PoseCategory, PosePreset, ShootingAngle } from "../types";

export const POSE_LIBRARY: PosePreset[] = [
  // Full Body
  /* Added missing skeleton and tags properties to satisfy PosePreset type */
  { id: 'side_glance', name: '优雅侧身', category: PoseCategory.FULL_BODY, description: '身体45度，头转90度看镜头', keywords: '全身照,相机捕捉到脚和头,looking back over shoulder, elegant side pose, hand touching hair, 45 degree body turn', skeleton: {}, tags: [] },
  { id: 'dynamic_walk', name: '动态行走', category: PoseCategory.FULL_BODY, description: '捕捉走路瞬间，衣摆飘动', keywords: 'walking dynamically, mid-stride, motion blur effect, clothes flowing', skeleton: {}, tags: [] },
  { id: 'crossed_legs', name: '交叉腿站立', category: PoseCategory.FULL_BODY, description: '重心在后腿，前腿交叉', keywords: 'standing with legs crossed, weight on back leg, elegant posture, long legs effect', skeleton: {}, tags: [] },
  { id: 'leaning', name: '倚靠沉思', category: PoseCategory.FULL_BODY, description: '背部轻靠墙壁，低头思考状', keywords: 'leaning against wall, looking down, contemplative, relaxed posture', skeleton: {}, tags: [] },
  { id: 'sitting_stretch', name: '坐姿延伸', category: PoseCategory.FULL_BODY, description: '坐在地上，腿自然延伸', keywords: 'sitting on ground, legs extended, hand supporting weight, relaxed pose', skeleton: {}, tags: [] },
  { id: 'jump_shot', name: '跳跃抓拍', category: PoseCategory.FULL_BODY, description: '跳跃瞬间，头发飞扬', keywords: 'jumping mid-air, hair flying, dynamic energy, action shot', skeleton: {}, tags: [] },

  // Waist Up
  { 
    id: 'triangle_comp', 
    name: '三角形构图', 
    category: PoseCategory.WAIST_UP, 
    description: '一手叉腰，一手放头后，手肘向外', 
    keywords: 'fashion portrait, one hand resting on hip, other hand touching back of head, elbows pointing out, creating geometric angles, triangular negative space, confident pose, high fashion style',
    skeleton: {},
    tags: []
  },
  { id: 'thinking', name: '托腮思考', category: PoseCategory.WAIST_UP, description: '手肘撑桌，手掌托腮', keywords: 'resting chin on hand, elbow on table, thoughtful expression, artistic vibe', skeleton: {}, tags: [] },
  { id: 'hair_touch', name: '撩发瞬间', category: PoseCategory.WAIST_UP, description: '手撩长发，眼神微眯', keywords: 'touching hair, squinting slightly, sensual vibe, alluring expression', skeleton: {}, tags: [] },
  { id: 'arm_cross', name: '怀抱姿势', category: PoseCategory.WAIST_UP, description: '双手交叉抱在胸前', keywords: 'arms crossed over chest, confident attitude, professional look', skeleton: {}, tags: [] },
  { id: 'hat_touch', name: '手扶帽檐', category: PoseCategory.WAIST_UP, description: '帽子微微压低，神秘感', keywords: 'touching hat brim, mysterious vibe, face partially shaded', skeleton: {}, tags: [] },
  { id: 'coffee_hold', name: '手持咖啡', category: PoseCategory.WAIST_UP, description: '拿咖啡杯，自然生活感', keywords: 'holding coffee cup, lifestyle photography, casual vibe', skeleton: {}, tags: [] },
  { id: 'back_smile', name: '回头微笑', category: PoseCategory.WAIST_UP, description: '身体前倾，回头微笑', keywords: 'leaning forward, looking back smiling, friendly expression', skeleton: {}, tags: [] },

  // Headshot
  { id: 'look_down_smile', name: '低头浅笑', category: PoseCategory.HEADSHOT, description: '低头15度，嘴角微扬', keywords: 'looking down 15 degrees, slight smile, gentle expression, soft lighting', skeleton: {}, tags: [] },
  { id: 'look_up_close', name: '仰头闭眼', category: PoseCategory.HEADSHOT, description: '仰头30度，闭眼享受光线', keywords: 'head tilted up 30 degrees, eyes closed, enjoying the light, serene expression', skeleton: {}, tags: [] },
  { id: 'side_profile', name: '侧脸轮廓', category: PoseCategory.HEADSHOT, description: '完全侧脸，突出轮廓', keywords: 'full side profile, sharp jawline, nose silhouette, artistic lighting', skeleton: {}, tags: [] },
  { id: 'gazing_far', name: '凝视远方', category: PoseCategory.HEADSHOT, description: '眼神看向画面外，故事感', keywords: 'looking away from camera, gazing into distance, cinematic, storytelling eyes', skeleton: {}, tags: [] },
  { id: 'eye_contact', name: '微笑看镜头', category: PoseCategory.HEADSHOT, description: '直接对视，亲切自然', keywords: 'direct eye contact, friendly smile, close up portrait, engaging', skeleton: {}, tags: [] },
  { id: 'wind_hair', name: '风吹发丝', category: PoseCategory.HEADSHOT, description: '发丝被风吹动，自然光', keywords: 'hair blowing in wind, natural lighting, ethereal, messy hair', skeleton: {}, tags: [] },
  { id: 'hand_block', name: '手遮阳光', category: PoseCategory.HEADSHOT, description: '手在额前遮挡阳光', keywords: 'hand shielding eyes from sun, sunlight shadows on face, outdoor summer vibe', skeleton: {}, tags: [] },
];

export const ANGLE_KEYWORDS: Record<ShootingAngle, string> = {
  [ShootingAngle.EYE_LEVEL]: "eye level shot, direct gaze",
  [ShootingAngle.HIGH_ANGLE]: "high angle shot, looking down, from above",
  [ShootingAngle.LOW_ANGLE]: "low angle shot, looking up, from below"
};

export const POSE_CATEGORIES = [
  { id: PoseCategory.FULL_BODY, label: '全身姿势 (Full Body)' },
  { id: PoseCategory.WAIST_UP, label: '半身姿势 (Waist Up)' },
  { id: PoseCategory.HEADSHOT, label: '特写姿势 (Headshot)' },
  // { id: PoseCategory.CUSTOM, label: '自定义 (Custom)' } // Reserved for future
];
