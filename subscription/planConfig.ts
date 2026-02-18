
export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: string;
  title: string;
  price: string;
  duration: string;
  features: PlanFeature[];
  recommend: boolean;
  qrCode: string; // Path to QR image or URL
  theme: 'blue' | 'gold' | 'purple';
}

export const CONTACT_INFO = {
  wechatId: "BatchMaster_VIP",
  qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=WeChat_Add_BatchMaster_VIP" // Placeholder for customer service QR
};

// 预设的收款码占位图，实际部署时请替换为真实的收款码图片路径
const PAY_QR_PLACEHOLDER = "https://aideator.top/api/images/public/1771340540695-6up98w6viiv.jpg";
const PAY_QR_PLACEHOLDER2 = "https://aideator.top/api/images/public/1771339900647-mhk2d20mzom.jpg";
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'weekly',
    title: '入门体能版',
    price: '39.9',
    duration: '永久有效用完为止',
    features: [
      { text: '大约生成 45 张标准生图或者视频', included: true },
      { text: '基础排队优先级', included: true },
      { text: '解锁 1K 分辨率', included: true },
      { text: '商用授权许可', included: false },
      { text: '专属客服支持', included: false },
    ],
    recommend: false,
    qrCode: PAY_QR_PLACEHOLDER,
    theme: 'blue'
  },
  {
    id: 'monthly',
    title: '基础进阶版',
    price: '499.9',
    duration: '永久有效用完为止',
    features: [
      { text: '每日无限极速生图', included: true },
      { text: '大约生成620张图像或者视频', included: true },
      { text: '10并发，即同是生成10张图像', included: true },
      { text: '公司\企业\团队共享，无人数限制', included: true },
      { text: 'GPU 加速通道 (High)', included: true },
      { text: '解锁 2K/4K 超清画质', included: true },
      { text: '个人商用授权', included: true },
      { text: '图生视频功能', included: true },
    ],
    recommend: true,
    qrCode: PAY_QR_PLACEHOLDER2,
    theme: 'gold'
  },
  {
    id: 'quarterly',
    title: '企业基础版',
    price: '1999.90',
    duration: '付款之日起 永久有效',
    features: [
      { text: '团队多人共享 (3人共享)', included: true },
      { text: '20并发，即同是生成20张图像', included: true },
      { text: '独占 GPU 算力节点', included: true },
      { text: 'API 接口调用权限', included: true },
      { text: '企业级商用授权', included: true },
      { text: '1v1 技术顾问', included: true },
    ],
    recommend: false,
    qrCode: PAY_QR_PLACEHOLDER,
    theme: 'purple'
  },
  {
    id: 'quarterly',
    title: '企业专业版',
    price: '2999.90',
    duration: '付款之日起 永久有效',
    features: [
      { text: '团队多人共享 (10人企业)', included: true },
      { text: '独占 GPU 算力节点', included: true },
      { text: 'API 接口调用权限', included: true },
      { text: '企业级商用授权', included: true },
      { text: '1v1 技术顾问', included: true },
    ],
    recommend: false,
    qrCode: PAY_QR_PLACEHOLDER,
    theme: 'purple'
  },
  {
    id: 'quarterly',
    title: '企业懒人包月版',
    price: '2999.90',
    duration: '付款之日起 30内有效',
    features: [
      { text: '团队多人共享 (10人企业)', included: true },
      { text: '无并发限制，支持同时生成多张图像或者视频', included: true },
      { text: '独占 GPU 算力节点', included: true },
      { text: 'API 接口调用权限', included: true },
      { text: '企业级商用授权', included: true },
      { text: '由我们为企业代生成图像', included: true },
    ],
    recommend: false,
    qrCode: PAY_QR_PLACEHOLDER,
    theme: 'purple'
  },
  {
    id: 'quarterly',
    title: '企业懒人包月版',
    price: '2999.90',
    duration: '付款之日起 30内有效',
    features: [
      { text: '团队多人共享 (10人企业)', included: true },
      { text: '独占 GPU 算力节点', included: true },
      { text: 'API 接口调用权限', included: true },
      { text: '企业级商用授权', included: true },
      { text: '由我们为企业代生成图像', included: true },
    ],
    recommend: false,
    qrCode: PAY_QR_PLACEHOLDER,
    theme: 'purple'
  }
];
