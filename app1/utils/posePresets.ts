import { PosePreset, PoseCategory, SkeletonState } from '../types';

// 预置姿势库 - 电商模特姿势
const ecommercePoses: PosePreset[] = [
  {
    id: 'ecommerce-standing',
    name: '电商标准站姿',
    category: PoseCategory.ECOMMERCE,
    description: '标准电商模特展示站姿，双手自然下垂，面向镜头',
    keywords: 'standing, model, ecommerce, showcase',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [0, 0, 0] },
      chest: { rotation: [0, 0, 0] },
      neck: { rotation: [0, 0, 0] },
      head: { rotation: [0, 0, 0] },
      leftShoulder: { rotation: [0, 0, 1.57] },
      rightShoulder: { rotation: [0, 0, -1.57] },
      leftElbow: { rotation: [0, 0, 0] },
      rightElbow: { rotation: [0, 0, 0] },
      leftWrist: { rotation: [0, 0, 0] },
      rightWrist: { rotation: [0, 0, 0] },
      leftHip: { rotation: [0, 0, 0] },
      rightHip: { rotation: [0, 0, 0] },
      leftKnee: { rotation: [0, 0, 0] },
      rightKnee: { rotation: [0, 0, 0] },
      leftAnkle: { rotation: [0, 0, 0] },
      rightAnkle: { rotation: [0, 0, 0] }
    },
    tags: ['standard', 'showcase', 'front']
  },
  {
    id: 'ecommerce-side',
    name: '侧面展示',
    category: PoseCategory.ECOMMERCE,
    description: '侧面展示姿势，突出身材线条',
    keywords: 'side, profile, showcase, body-line',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [0, 0.5, 0] },
      chest: { rotation: [0, 0.3, 0] },
      neck: { rotation: [0, 0.3, 0] },
      head: { rotation: [0, 0.3, 0] },
      leftShoulder: { rotation: [0, 0, 1.2] },
      rightShoulder: { rotation: [0, 0, -1.8] },
      leftElbow: { rotation: [0, 0, 0.5] },
      rightElbow: { rotation: [0, 0, -0.5] },
      leftWrist: { rotation: [0, 0, 0.2] },
      rightWrist: { rotation: [0, 0, -0.2] },
      leftHip: { rotation: [0, 0.2, 0] },
      rightHip: { rotation: [0, -0.2, 0] },
      leftKnee: { rotation: [0, 0, 0] },
      rightKnee: { rotation: [0, 0, 0] },
      leftAnkle: { rotation: [0, 0, 0] },
      rightAnkle: { rotation: [0, 0, 0] }
    },
    tags: ['profile', 'body-line', 'side-view']
  },
  {
    id: 'ecommerce-product-hold',
    name: '持物展示',
    category: PoseCategory.ECOMMERCE,
    description: '手持商品展示姿势',
    keywords: 'hold, product, showcase, item',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [0, 0, 0] },
      chest: { rotation: [0, 0, 0] },
      neck: { rotation: [0, 0, 0] },
      head: { rotation: [0, 0, 0] },
      leftShoulder: { rotation: [0, 0, 1.8] },
      rightShoulder: { rotation: [0, 0, -1.8] },
      leftElbow: { rotation: [0, 0, -0.8] },
      rightElbow: { rotation: [0, 0, 0.8] },
      leftWrist: { rotation: [0, 0, -0.5] },
      rightWrist: { rotation: [0, 0, 0.5] },
      leftHip: { rotation: [0, 0, 0] },
      rightHip: { rotation: [0, 0, 0] },
      leftKnee: { rotation: [0, 0, 0] },
      rightKnee: { rotation: [0, 0, 0] },
      leftAnkle: { rotation: [0, 0, 0] },
      rightAnkle: { rotation: [0, 0, 0] }
    },
    tags: ['hold', 'product', 'item', 'display']
  },
  {
    id: 'ecommerce-relaxed-stand',
    name: '轻松站姿',
    category: PoseCategory.ECOMMERCE,
    description: '轻松自然的站姿，一条腿微曲',
    keywords: 'relaxed, casual, standing, natural',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [0, 0, 0] },
      chest: { rotation: [0, 0, 0] },
      neck: { rotation: [0, 0, 0] },
      head: { rotation: [0, 0, 0] },
      leftShoulder: { rotation: [0, 0, 1.57] },
      rightShoulder: { rotation: [0, 0, -1.57] },
      leftElbow: { rotation: [0, 0, 0] },
      rightElbow: { rotation: [0, 0, 0] },
      leftWrist: { rotation: [0, 0, 0] },
      rightWrist: { rotation: [0, 0, 0] },
      leftHip: { rotation: [0, 0, 0] },
      rightHip: { rotation: [-0.2, 0, 0] },
      leftKnee: { rotation: [0, 0, 0] },
      rightKnee: { rotation: [0.2, 0, 0] },
      leftAnkle: { rotation: [0, 0, 0] },
      rightAnkle: { rotation: [-0.2, 0, 0] }
    },
    tags: ['relaxed', 'casual', 'natural', 'easy']
  },
  {
    id: 'ecommerce-crossed-arms',
    name: '交叉手臂',
    category: PoseCategory.ECOMMERCE,
    description: '双臂交叉胸前，自信展示',
    keywords: 'crossed arms, confident, stylish, front',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [0, 0, 0] },
      chest: { rotation: [0, 0, 0] },
      neck: { rotation: [0, 0, 0] },
      head: { rotation: [0, 0, 0] },
      leftShoulder: { rotation: [0, 0, 0.8] },
      rightShoulder: { rotation: [0, 0, -0.8] },
      leftElbow: { rotation: [0, 0, 1.2] },
      rightElbow: { rotation: [0, 0, -1.2] },
      leftWrist: { rotation: [0, 0, 0.5] },
      rightWrist: { rotation: [0, 0, -0.5] },
      leftHip: { rotation: [0, 0, 0] },
      rightHip: { rotation: [0, 0, 0] },
      leftKnee: { rotation: [0, 0, 0] },
      rightKnee: { rotation: [0, 0, 0] },
      leftAnkle: { rotation: [0, 0, 0] },
      rightAnkle: { rotation: [0, 0, 0] }
    },
    tags: ['crossed', 'confident', 'stylish', 'fashion']
  }
];

// 预置姿势库 - 街拍姿势
const streetPoses: PosePreset[] = [
  {
    id: 'street-casual-walk',
    name: '休闲漫步',
    category: PoseCategory.STREET,
    description: '自然漫步姿势，轻松随性',
    keywords: 'walking, casual, street, relaxed',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [0, 0, 0] },
      chest: { rotation: [0, 0, 0] },
      neck: { rotation: [0, 0, 0] },
      head: { rotation: [0, 0, 0] },
      leftShoulder: { rotation: [0, 0, 1.57] },
      rightShoulder: { rotation: [0, 0, -1.57] },
      leftElbow: { rotation: [0, 0, 0.5] },
      rightElbow: { rotation: [0, 0, -0.5] },
      leftWrist: { rotation: [0, 0, 0.2] },
      rightWrist: { rotation: [0, 0, -0.2] },
      leftHip: { rotation: [0.2, 0, 0] },
      rightHip: { rotation: [-0.2, 0, 0] },
      leftKnee: { rotation: [-0.3, 0, 0] },
      rightKnee: { rotation: [0.3, 0, 0] },
      leftAnkle: { rotation: [0.2, 0, 0] },
      rightAnkle: { rotation: [-0.2, 0, 0] }
    },
    tags: ['walk', 'casual', 'street', 'relaxed']
  },
  {
    id: 'street-leaning-wall',
    name: '倚墙而立',
    category: PoseCategory.STREET,
    description: '依靠墙壁的酷炫姿势',
    keywords: 'leaning, wall, cool, urban',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [-0.2, 0.2, 0] },
      chest: { rotation: [-0.1, 0.1, 0] },
      neck: { rotation: [0, -0.2, 0] },
      head: { rotation: [0, -0.2, 0] },
      leftShoulder: { rotation: [0, 0, 1.2] },
      rightShoulder: { rotation: [0, 0, -1.8] },
      leftElbow: { rotation: [0, 0, 0.8] },
      rightElbow: { rotation: [0, 0, -0.5] },
      leftWrist: { rotation: [0, 0, 0.3] },
      rightWrist: { rotation: [0, 0, -0.2] },
      leftHip: { rotation: [0, 0, 0] },
      rightHip: { rotation: [0.3, 0, 0] },
      leftKnee: { rotation: [0, 0, 0] },
      rightKnee: { rotation: [-0.2, 0, 0] },
      leftAnkle: { rotation: [0, 0, 0] },
      rightAnkle: { rotation: [0.2, 0, 0] }
    },
    tags: ['leaning', 'wall', 'cool', 'urban']
  },
  {
    id: 'street-hand-in-pocket',
    name: '手插口袋',
    category: PoseCategory.STREET,
    description: '街头时尚，手插口袋姿势',
    keywords: 'pocket, hand, street, fashion',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [0, 0, 0] },
      chest: { rotation: [0, 0, 0] },
      neck: { rotation: [0, 0, 0] },
      head: { rotation: [0, 0, 0] },
      leftShoulder: { rotation: [0, 0, 1.2] },
      rightShoulder: { rotation: [0, 0, -1.57] },
      leftElbow: { rotation: [0, 0, -1.5] },
      rightElbow: { rotation: [0, 0, 0] },
      leftWrist: { rotation: [0, 0, -0.8] },
      rightWrist: { rotation: [0, 0, 0] },
      leftHip: { rotation: [0, 0, 0] },
      rightHip: { rotation: [0, 0, 0] },
      leftKnee: { rotation: [0, 0, 0] },
      rightKnee: { rotation: [0, 0, 0] },
      leftAnkle: { rotation: [0, 0, 0] },
      rightAnkle: { rotation: [0, 0, 0] }
    },
    tags: ['pocket', 'hand', 'street', 'fashion']
  },
  {
    id: 'street-posing',
    name: '街拍摆拍',
    category: PoseCategory.STREET,
    description: '经典街拍姿势，时尚动感',
    keywords: 'posing, street, fashion, dynamic',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [0, -0.3, 0] },
      chest: { rotation: [0, -0.2, 0] },
      neck: { rotation: [0, 0.2, 0] },
      head: { rotation: [0, 0.2, 0] },
      leftShoulder: { rotation: [0, 0, 2.0] },
      rightShoulder: { rotation: [0, 0, -1.2] },
      leftElbow: { rotation: [0, 0, -0.8] },
      rightElbow: { rotation: [0, 0, 0.8] },
      leftWrist: { rotation: [0, 0, -0.5] },
      rightWrist: { rotation: [0, 0, 0.5] },
      leftHip: { rotation: [0, 0, 0] },
      rightHip: { rotation: [0.1, 0, 0] },
      leftKnee: { rotation: [0, 0, 0] },
      rightKnee: { rotation: [-0.1, 0, 0] },
      leftAnkle: { rotation: [0, 0, 0] },
      rightAnkle: { rotation: [0.1, 0, 0] }
    },
    tags: ['posing', 'fashion', 'dynamic', 'street']
  }
];

// 预置姿势库 - 旅游姿势
const travelPoses: PosePreset[] = [
  {
    id: 'travel-wave-hi',
    name: '挥手致意',
    category: PoseCategory.TRAVEL,
    description: '旅游景点挥手打招呼',
    keywords: 'wave, hello, travel, greeting',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [0, 0, 0] },
      chest: { rotation: [0, 0, 0] },
      neck: { rotation: [0, 0, 0] },
      head: { rotation: [0, 0, 0] },
      leftShoulder: { rotation: [0, 0, 1.57] },
      rightShoulder: { rotation: [0, 0, -1.0] },
      leftElbow: { rotation: [0, 0, 0] },
      rightElbow: { rotation: [0, 0, 1.0] },
      leftWrist: { rotation: [0, 0, 0] },
      rightWrist: { rotation: [0, 0, 0.8] },
      leftHip: { rotation: [0, 0, 0] },
      rightHip: { rotation: [0, 0, 0] },
      leftKnee: { rotation: [0, 0, 0] },
      rightKnee: { rotation: [0, 0, 0] },
      leftAnkle: { rotation: [0, 0, 0] },
      rightAnkle: { rotation: [0, 0, 0] }
    },
    tags: ['wave', 'hello', 'greeting', 'happy']
  },
  {
    id: 'travel-pointing',
    name: '指向前方',
    category: PoseCategory.TRAVEL,
    description: '指向远处风景，充满期待',
    keywords: 'pointing, direction, travel, excited',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [0, 0, 0] },
      chest: { rotation: [0, 0, 0] },
      neck: { rotation: [0, 0, 0] },
      head: { rotation: [0, 0.2, 0] },
      leftShoulder: { rotation: [0, 0, 1.57] },
      rightShoulder: { rotation: [0, 0, -1.8] },
      leftElbow: { rotation: [0, 0, 0] },
      rightElbow: { rotation: [0, 0, 0.8] },
      leftWrist: { rotation: [0, 0, 0] },
      rightWrist: { rotation: [0, 0, 0.5] },
      leftHip: { rotation: [0, 0, 0] },
      rightHip: { rotation: [0, 0, 0] },
      leftKnee: { rotation: [0, 0, 0] },
      rightKnee: { rotation: [0, 0, 0] },
      leftAnkle: { rotation: [0, 0, 0] },
      rightAnkle: { rotation: [0, 0, 0] }
    },
    tags: ['pointing', 'direction', 'excited', 'tourist']
  },
  {
    id: 'travel-sitting-rest',
    name: '休息坐姿',
    category: PoseCategory.TRAVEL,
    description: '旅行中休息的舒适坐姿',
    keywords: 'sitting, rest, travel, comfortable',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [0.3, 0, 0] },
      chest: { rotation: [0.2, 0, 0] },
      neck: { rotation: [0, 0, 0] },
      head: { rotation: [0.2, 0, 0] },
      leftShoulder: { rotation: [0, 0, 1.57] },
      rightShoulder: { rotation: [0, 0, -1.57] },
      leftElbow: { rotation: [0, 0, 0] },
      rightElbow: { rotation: [0, 0, 0] },
      leftWrist: { rotation: [0, 0, 0] },
      rightWrist: { rotation: [0, 0, 0] },
      leftHip: { rotation: [0.8, 0, 0] },
      rightHip: { rotation: [0.8, 0, 0] },
      leftKnee: { rotation: [-0.8, 0, 0] },
      rightKnee: { rotation: [-0.8, 0, 0] },
      leftAnkle: { rotation: [0.8, 0, 0] },
      rightAnkle: { rotation: [0.8, 0, 0] }
    },
      tags: ['sitting', 'rest', 'comfortable', 'break']
  },
  {
    id: 'travel-backpack',
    name: '背包旅行',
    category: PoseCategory.TRAVEL,
    description: '背着背包的旅行者姿势',
    keywords: 'backpack, traveler, adventure, journey',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [-0.1, 0, 0] },
      chest: { rotation: [-0.1, 0, 0] },
      neck: { rotation: [0, 0, 0] },
      head: { rotation: [0, 0, 0] },
      leftShoulder: { rotation: [0, 0, 1.2] },
      rightShoulder: { rotation: [0, 0, -1.2] },
      leftElbow: { rotation: [0, 0, 0.5] },
      rightElbow: { rotation: [0, 0, -0.5] },
      leftWrist: { rotation: [0, 0, 0.2] },
      rightWrist: { rotation: [0, 0, -0.2] },
      leftHip: { rotation: [0, 0, 0] },
      rightHip: { rotation: [0, 0, 0] },
      leftKnee: { rotation: [0, 0, 0] },
      rightKnee: { rotation: [0, 0, 0] },
      leftAnkle: { rotation: [0, 0, 0] },
      rightAnkle: { rotation: [0, 0, 0] }
    },
    tags: ['backpack', 'traveler', 'adventure', 'journey']
  }
];

// 预置姿势库 - 室内姿势
const indoorPoses: PosePreset[] = [
  {
    id: 'indoor-office-work',
    name: '办公姿态',
    category: PoseCategory.INDOOR,
    description: '自然的办公工作姿态',
    keywords: 'office, work, professional, sitting',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [0.2, 0, 0] },
      chest: { rotation: [0.1, 0, 0] },
      neck: { rotation: [0.2, 0, 0] },
      head: { rotation: [0.1, 0, 0] },
      leftShoulder: { rotation: [0, 0, 1.2] },
      rightShoulder: { rotation: [0, 0, -1.2] },
      leftElbow: { rotation: [0, 0, 0.8] },
      rightElbow: { rotation: [0, 0, -0.8] },
      leftWrist: { rotation: [0, 0, 0.5] },
      rightWrist: { rotation: [0, 0, -0.5] },
      leftHip: { rotation: [0, 0, 0] },
      rightHip: { rotation: [0, 0, 0] },
      leftKnee: { rotation: [0, 0, 0] },
      rightKnee: { rotation: [0, 0, 0] },
      leftAnkle: { rotation: [0, 0, 0] },
      rightAnkle: { rotation: [0, 0, 0] }
    },
    tags: ['office', 'work', 'professional', 'sitting']
  },
  {
    id: 'indoor-cozy-sit',
    name: '舒适坐姿',
    category: PoseCategory.INDOOR,
    description: '沙发上舒适的放松坐姿',
    keywords: 'cozy, sitting, relax, sofa',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [0.4, 0, 0] },
      chest: { rotation: [0.3, 0, 0] },
      neck: { rotation: [0.2, 0, 0] },
      head: { rotation: [0.2, 0, 0] },
      leftShoulder: { rotation: [0, 0, 1.0] },
      rightShoulder: { rotation: [0, 0, -1.0] },
      leftElbow: { rotation: [0, 0, 0.5] },
      rightElbow: { rotation: [0, 0, -0.5] },
      leftWrist: { rotation: [0, 0, 0.2] },
      rightWrist: { rotation: [0, 0, -0.2] },
      leftHip: { rotation: [0.6, 0, 0] },
      rightHip: { rotation: [0.6, 0, 0] },
      leftKnee: { rotation: [-0.6, 0, 0] },
      rightKnee: { rotation: [-0.6, 0, 0] },
      leftAnkle: { rotation: [0.6, 0, 0] },
      rightAnkle: { rotation: [0.6, 0, 0] }
    },
    tags: ['cozy', 'relax', 'sofa', 'comfortable']
  },
  {
    id: 'indoor-kitchen',
    name: '厨房活动',
    category: PoseCategory.INDOOR,
    description: '厨房准备食物的姿态',
    keywords: 'kitchen, cooking, preparing, home',
    skeleton: {
      hips: { rotation: [0, 0, 0] },
      spine: { rotation: [0.1, 0, 0] },
      chest: { rotation: [0, 0, 0] },
      neck: { rotation: [0, 0, 0] },
      head: { rotation: [0, 0, 0] },
      leftShoulder: { rotation: [0, 0, 1.0] },
      rightShoulder: { rotation: [0, 0, -1.0] },
      leftElbow: { rotation: [0, 0, 0.8] },
      rightElbow: { rotation: [0, 0, -0.8] },
      leftWrist: { rotation: [0, 0, 0.5] },
      rightWrist: { rotation: [0, 0, -0.5] },
      leftHip: { rotation: [0, 0, 0] },
      rightHip: { rotation: [0, 0, 0] },
      leftKnee: { rotation: [0, 0, 0] },
      rightKnee: { rotation: [0, 0, 0] },
      leftAnkle: { rotation: [0, 0, 0] },
      rightAnkle: { rotation: [0, 0, 0] }
    },
    tags: ['kitchen', 'cooking', 'preparing', 'home']
  }
];

// 合并所有预置姿势
export const POSE_PRESETS: PosePreset[] = [
  ...ecommercePoses,
  ...streetPoses,
  ...travelPoses,
  ...indoorPoses
];

// 根据类别获取预置姿势
export const getPosesByCategory = (category: PoseCategory): PosePreset[] => {
  return POSE_PRESETS.filter(pose => pose.category === category);
};

// 根据ID获取特定预置姿势
export const getPoseById = (id: string): PosePreset | undefined => {
  return POSE_PRESETS.find(pose => pose.id === id);
};