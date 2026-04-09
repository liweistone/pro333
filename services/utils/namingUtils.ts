
/**
 * 万象智造·aideaer.top 统一命名引擎
 */

const APP_BRAND_MAP: Record<string, string> = {
  'app1': '智拍大师',
  'app2': '裂变大师',
  'app3': '海报实验室',
  'app4': '市场策划',
  'app5': '电商视觉',
  'app6': '流光智造',
  'app8': '万象批改',
  'app9': '光影车站',
  'app10': '视觉导演',
  'app11': '全能分析',
  'pro_studio': '智拍大师',
  'batch_master': '批量大师',
};

const BRAND_PREFIX = '万象智造·aideaer.top';

/**
 * 清洗提示词，保留中英文数字，替换空格和特殊字符为短横线
 */
export const sanitizePrompt = (prompt: string, maxLength: number = 15): string => {
  if (!prompt) return '未命名';
  return prompt
    .trim()
    .slice(0, maxLength)
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * 获取子模块品牌名
 */
export const getSubModuleName = (appId: string): string => {
  return APP_BRAND_MAP[appId] || '智能智造';
};

/**
 * 生成单张图像下载文件名
 * 格式：万象智造·aideaer.top-[子模块名]-[内容描述]-[ID后4位].[ext]
 */
export const formatDownloadName = (appId: string, prompt: string, id: string, ext: string = 'png'): string => {
  const subName = getSubModuleName(appId);
  const safePrompt = sanitizePrompt(prompt);
  const shortId = id.slice(-4);
  return `${BRAND_PREFIX}-${subName}-${safePrompt}-${shortId}.${ext}`;
};

/**
 * 生成压缩包内文件名称
 * 格式：[子模块名]-[ID后4位].[ext]
 */
export const formatInternalFileName = (appId: string, id: string, ext: string = 'png'): string => {
  const subName = getSubModuleName(appId);
  const shortId = id.slice(-4);
  return `${subName}-${shortId}.${ext}`;
};

/**
 * 生成批量导出压缩包名称
 * 格式：万象智造·aideaer.top-[子模块名]-批量导出-[日期].zip
 */
export const formatZipName = (appId: string): string => {
  const subName = getSubModuleName(appId);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${BRAND_PREFIX}-${subName}-批量导出-${date}.zip`;
};

/**
 * 生成报告文件名
 */
export const formatReportName = (appId: string, type: string): string => {
  const subName = getSubModuleName(appId);
  const date = new Date().toISOString().slice(0, 10);
  return `${BRAND_PREFIX}-${subName}-${type}_${date}.txt`;
};
