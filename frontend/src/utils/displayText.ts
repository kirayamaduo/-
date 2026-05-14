const ROLE_LABELS: Record<string, string> = {
  Entrepreneur: '创业/创新方向',
  'Software Engineer': '软件工程师',
  'Frontend Developer': '前端开发工程师',
  'Front-end Developer': '前端开发工程师',
  'Backend Developer': '后端开发工程师',
  'Back-end Developer': '后端开发工程师',
  'Full Stack Developer': '全栈开发工程师',
  'Data Analyst': '数据分析师',
  'Data Scientist': '数据科学家',
  'Product Manager': '产品经理',
  'Business Analyst': '商业分析师',
  'UI/UX Designer': 'UI/UX 设计师',
  'UX Designer': '用户体验设计师',
  'Marketing Specialist': '市场营销专员',
};

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
  .replace(/Become an excellent Java backend developer, mastering core skills such as Spring Boot, microservices, and databases\./g, '掌握 Spring Boot、微服务和数据库等后端核心能力。')
  .replace(/Become a modern frontend developer, mastering tech stacks like Vue, React, and TypeScript\./g, '掌握 Vue、React、TypeScript 等现代前端技术栈。')
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

export const normalizeRoleLabel = (text?: string | null) => {
  const raw = normalizeProductCopy(text).trim();
  if (!raw) return '';
  return ROLE_LABELS[raw] || raw;
};
