// The site's sections and, inside "Use the panel", the groups its sidebar
// mirrors from the panel's own sidebar. A page names its group in front-matter
// (`group: fleet`) and its place with `order`; the sidebar is built from that.

import type { Lang } from './tags'

type Words = Record<Lang, string>

export const SECTIONS: { dir: string; label: Words }[] = [
  { dir: 'start', label: { en: 'Get started', fa: 'شروع', ru: 'Начало работы', zh: '快速开始' } },
  { dir: 'use', label: { en: 'Use the panel', fa: 'کار با پنل', ru: 'Работа с панелью', zh: '使用面板' } },
  { dir: 'protocols', label: { en: 'Protocols', fa: 'پروتکل‌ها', ru: 'Протоколы', zh: '协议' } },
  { dir: 'addons', label: { en: 'Addons', fa: 'افزونه‌ها', ru: 'Дополнения', zh: '插件' } },
  { dir: 'how', label: { en: 'How it works', fa: 'چطور کار می‌کند', ru: 'Как это устроено', zh: '工作原理' } },
  { dir: 'reference', label: { en: 'Reference', fa: 'مرجع', ru: 'Справочник', zh: '参考' } },
]

export const GROUPS: Record<string, Words> = {
  fleet: { en: 'Fleet', fa: 'ناوگان', ru: 'Флот', zh: '节点集群' },
  customers: { en: 'Customers', fa: 'مشتری‌ها', ru: 'Клиенты', zh: '客户' },
  core: { en: 'Core configs', fa: 'پیکربندی هسته', ru: 'Конфигурация ядра', zh: '核心配置' },
  settings: { en: 'Settings', fa: 'تنظیمات', ru: 'Настройки', zh: '设置' },
  access: { en: 'Access', fa: 'دسترسی', ru: 'Доступ', zh: '访问控制' },
  services: { en: 'Services', fa: 'سرویس‌ها', ru: 'Сервисы', zh: '服务' },
  shop: { en: 'Nexora Shop', fa: 'Nexora Shop', ru: 'Nexora Shop', zh: 'Nexora Shop' },
  authors: { en: 'For addon authors', fa: 'برای سازندگان افزونه', ru: 'Для авторов дополнений', zh: '插件开发者' },
}
