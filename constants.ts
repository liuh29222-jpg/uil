
import { TemplateEngine, WafRestriction } from './types';

export const TEMPLATE_ENGINES: TemplateEngine[] = [
  'Jinja2', 'Mako', 'Twig', 'Smarty', 'Freemarker', 'Velocity', 'Pug', 'EJS', 'ERB', 'Tornado'
];

export const COMMON_RESTRICTIONS: WafRestriction[] = [
  { id: 'dots', label: '禁止点号 (.)', description: '限制通过点号访问对象属性', blockedPattern: '.' },
  { id: 'underscores', label: '禁止下划线 (_)', description: '限制访问 __init__ 等魔术方法', blockedPattern: '_' },
  { id: 'brackets', label: '禁止中括号 ([])', description: '限制通过索引访问数组或字典', blockedPattern: '[]' },
  { id: 'quotes', label: '禁止引号 (\', \")', description: '限制字符串字面量', blockedPattern: '\'"' },
  { id: 'filters', label: '禁止过滤器 (|)', description: '限制管道符过滤操作', blockedPattern: '|' },
  { id: 'request', label: '禁止 "request"', description: '限制访问全局 request 对象', blockedPattern: 'request' },
  { id: 'attr', label: '禁止 "attr"', description: '限制使用 .attr() 过滤器', blockedPattern: 'attr' },
];
