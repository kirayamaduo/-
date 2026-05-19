// Lookup is case-insensitive — every lookup goes through normalizeRoleLabel
// which lowercases the input before checking this map. Add new entries with
// the canonical English label; the helper handles trimming/casing.
const ROLE_LABELS: Record<string, string> = {
  Entrepreneur: '创业/创新方向',
  'Software Engineer': '软件工程师',
  'Software Developer': '软件开发工程师',
  'Senior Software Engineer': '高级软件工程师',
  'Frontend Engineer': '前端工程师',
  'Frontend Developer': '前端开发工程师',
  'Front-end Developer': '前端开发工程师',
  'Backend Engineer': '后端工程师',
  'Backend Developer': '后端开发工程师',
  'Back-end Developer': '后端开发工程师',
  'Java Backend Engineer': 'Java 后端工程师',
  'Full Stack Engineer': '全栈工程师',
  'Full Stack Developer': '全栈开发工程师',
  'Web Developer': 'Web 开发工程师',
  'Mobile Developer': '移动端开发工程师',
  'iOS Developer': 'iOS 开发工程师',
  'Android Developer': 'Android 开发工程师',
  'Data Analyst': '数据分析师',
  'Data Scientist': '数据科学家',
  'Data Engineer': '数据工程师',
  'Machine Learning Engineer': '机器学习工程师',
  'AI Engineer': 'AI 工程师',
  'Algorithm Engineer': '算法工程师',
  'Research Scientist': '研究科学家',
  'DevOps Engineer': 'DevOps 工程师',
  'Site Reliability Engineer': 'SRE 工程师',
  'Cloud Engineer': '云计算工程师',
  'Security Engineer': '安全工程师',
  'QA Engineer': '测试工程师',
  'Test Engineer': '测试工程师',
  'Quality Assurance': '测试工程师',
  'Technical Writer': '技术文档工程师',
  'Product Manager': '产品经理',
  'Project Manager': '项目经理',
  'Program Manager': '项目管理',
  'Business Analyst': '商业分析师',
  'Marketing Manager': '市场经理',
  'Marketing Specialist': '市场营销专员',
  'Sales Manager': '销售经理',
  'Sales Representative': '销售代表',
  'Operations Manager': '运营经理',
  'Operations Specialist': '运营专员',
  'HR Specialist': '人力资源专员',
  'HR Manager': '人力资源经理',
  Recruiter: '招聘专员',
  'UI Designer': 'UI 设计师',
  'UI/UX Designer': 'UI/UX 设计师',
  'UX Designer': '用户体验设计师',
  'Product Designer': '产品设计师',
  'Visual Designer': '视觉设计师',
  'Graphic Designer': '平面设计师',
  Consultant: '咨询顾问',
  'Management Consultant': '管理咨询顾问',
  Engineer: '工程师',
  Developer: '开发工程师',
  Designer: '设计师',
  Manager: '经理',
  Analyst: '分析师',
};

// Pre-lower-cased index built once so each lookup is O(1) — the keys above
// stay readable while still letting us match free-text AI output like
// "frontend developer".
const ROLE_LABELS_LOWER: Record<string, string> = Object.fromEntries(
  Object.entries(ROLE_LABELS).map(([k, v]) => [k.toLowerCase(), v])
);

const ASSESSMENT_LABELS: Record<string, string> = {
  EMOTIONPROBLEM: '情绪与压力应对',
  EMOTION_PROBLEM: '情绪与压力应对',
  PROBLEM_SOLVING: '问题解决倾向',
};

export const normalizeProductCopy = (text?: string | null) => (text || '')
  .replace(/_tailored(?:_tailored)+/gi, '_tailored')
  .replace(/_tailored\b/gi, '')
  .replace(/\bEMOTIONPROBLEM\b/g, ASSESSMENT_LABELS.EMOTIONPROBLEM)
  .replace(/\bEMOTION_PROBLEM\b/g, ASSESSMENT_LABELS.EMOTION_PROBLEM)
  .replace(/\bJava Backend Engineer\b/g, 'Java 后端工程师')
  .replace(/\bFrontend Engineer\b/g, '前端工程师')
  .replace(/\bFull Stack Engineer\b/g, '全栈工程师')
  .replace(/\bData Analyst\b/g, '数据分析师')
  .replace(/\bProduct Manager\b/g, '产品经理')
  .replace(/\bJava Basics\b/g, 'Java 基础')
  .replace(/\bSpring Boot Intro\b/g, 'Spring Boot 入门')
  .replace(/\bDatabase Design\b/g, '数据库设计')
  .replace(/\bSpring Cloud Microservices\b/g, 'Spring Cloud 微服务')
  .replace(/\bHTML\/CSS Basics\b/g, 'HTML/CSS 基础')
  .replace(/\bJavaScript Core\b/g, 'JavaScript 核心')
  .replace(/\bVue\.js Framework\b/g, 'Vue.js 框架')
  .replace(/Become an excellent Java backend developer, mastering core skills such as Spring Boot, microservices, and databases\./g, '掌握 Spring Boot、微服务和数据库等后端核心能力。')
  .replace(/Become a modern frontend developer, mastering tech stacks like Vue, React, and TypeScript\./g, '掌握 Vue、React、TypeScript 等现代前端技术栈。')
  .replace(/Master variables, control flow, OOP, collections, generics, and exception handling\. The bedrock for everything that follows\./g, '掌握变量、流程控制、面向对象、集合、泛型和异常处理。')
  .replace(/Build REST APIs with Spring Boot\. Cover dependency injection, MVC, JPA, transactions, and basic error handling\./g, '使用 Spring Boot 构建 REST API，覆盖依赖注入、MVC、JPA、事务和错误处理。')
  .replace(/Design normalized schemas, write efficient SQL, understand indexes, transactions, and isolation levels\./g, '设计规范化表结构，编写高效 SQL，理解索引、事务和隔离级别。')
  .replace(/Service discovery, gateway, circuit breakers, distributed config, and how microservices communicate at scale\./g, '学习服务发现、网关、熔断、分布式配置和微服务通信。')
  .replace(/Semantic markup, modern CSS layouts \(flexbox \+ grid\), responsive design, and accessibility fundamentals\./g, '学习语义化标签、现代 CSS 布局、响应式设计和基础可访问性。')
  .replace(/ES2015\+, async\/await, the event loop, modules, and the DOM API\. Skip nothing here\./g, '掌握 ES2015+、async/await、事件循环、模块系统和 DOM API。')
  .replace(/Composition API, reactivity, single-file components, Pinia state, Vue Router, and build tooling with Vite\./g, '学习 Composition API、响应式系统、单文件组件、Pinia、Vue Router 和 Vite。')
  .replace(/h5\s*\(html5\)\s*\+\s*css3\s*\+\s*移动端前端/gi, 'HTML/CSS 与移动端前端')
  .replace(/让严格\s*Agent\s*评审简历/g, '检查简历薄弱项')
  .replace(/让小严严格评审简历/g, '检查简历薄弱项')
  .replace(/严格\s*Agent/g, '严格反馈')
  .replace(/Agent\s*为你生成/g, 'AI 为你生成')
  .replace(/AI\s*面试官/g, '面试练习')
  .replace(/AI\s*助手/g, '求职教练')
  .replace(/Agent/g, 'AI')
  .replace(/职业规划/g, '求职计划')
  .replace(/职业计划/g, '求职计划')
  .replace(/技能图谱/g, '求职路线')
  .replace(/\.{3}/g, '…');

/**
 * Translate an English (or mixed) job title to a clean Chinese label.
 *
 * Order of attempts:
 *   1. The string already contains Chinese characters → return as-is (the
 *      caller already gave us a Chinese label).
 *   2. Exact match against the ROLE_LABELS table (case-insensitive).
 *   3. Suffix / substring match for compound titles like "Senior Frontend
 *      Engineer" → "前端工程师".
 *   4. Fall back to the trimmed raw string so we never erase user input.
 */
export const normalizeRoleLabel = (text?: string | null) => {
  const raw = normalizeProductCopy(text).trim();
  if (!raw) return '';
  if (/[\u4e00-\u9fff]/.test(raw)) return raw;
  const lower = raw.toLowerCase();
  if (ROLE_LABELS_LOWER[lower]) return ROLE_LABELS_LOWER[lower];
  for (const [enLower, zh] of Object.entries(ROLE_LABELS_LOWER)) {
    if (lower.endsWith(enLower) || lower.includes(enLower)) return zh;
  }
  return raw;
};
