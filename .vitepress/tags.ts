// The tags a page may carry (front-matter `tags: [node, tls]`), with their
// label in each locale. A tag not listed here fails the build: tags are a
// vocabulary, and one spelled two ways is two half-empty lists.

export type Lang = 'en' | 'fa' | 'ru' | 'zh'

export const TAGS: Record<string, Record<Lang, string>> = {
  install: { en: 'Install', fa: 'نصب', ru: 'Установка', zh: '安装' },
  panel: { en: 'Panel', fa: 'پنل', ru: 'Панель', zh: '面板' },
  node: { en: 'Node', fa: 'نود', ru: 'Узел', zh: '节点' },
  users: { en: 'Users', fa: 'کاربران', ru: 'Пользователи', zh: '用户' },
  plans: { en: 'Plans', fa: 'پلن‌ها', ru: 'Тарифы', zh: '套餐' },
  subscriptions: { en: 'Subscriptions', fa: 'اشتراک', ru: 'Подписки', zh: '订阅' },
  protocols: { en: 'Protocols', fa: 'پروتکل‌ها', ru: 'Протоколы', zh: '协议' },
  routing: { en: 'Routing', fa: 'مسیریابی', ru: 'Маршрутизация', zh: '路由' },
  tls: { en: 'TLS', fa: 'TLS', ru: 'TLS', zh: 'TLS' },
  certificates: { en: 'Certificates', fa: 'گواهی‌ها', ru: 'Сертификаты', zh: '证书' },
  tunnels: { en: 'Tunnels', fa: 'تونل‌ها', ru: 'Туннели', zh: '隧道' },
  fronting: { en: 'Domain fronting', fa: 'فرانتینگ', ru: 'Фронтинг', zh: '域前置' },
  access: { en: 'Access', fa: 'دسترسی', ru: 'Доступ', zh: '访问控制' },
  security: { en: 'Security', fa: 'امنیت', ru: 'Безопасность', zh: '安全' },
  resellers: { en: 'Resellers', fa: 'نمایندگی', ru: 'Реселлеры', zh: '代理商' },
  events: { en: 'Events', fa: 'رویدادها', ru: 'События', zh: '事件' },
  addons: { en: 'Addons', fa: 'افزونه‌ها', ru: 'Дополнения', zh: '插件' },
  migration: { en: 'Migration', fa: 'مهاجرت', ru: 'Миграция', zh: '迁移' },
  monitoring: { en: 'Monitoring', fa: 'پایش', ru: 'Мониторинг', zh: '监控' },
  backup: { en: 'Backup', fa: 'پشتیبان', ru: 'Резервные копии', zh: '备份' },
  licence: { en: 'Licence', fa: 'لایسنس', ru: 'Лицензия', zh: '许可证' },
  api: { en: 'API', fa: 'API', ru: 'API', zh: 'API' },
  reference: { en: 'Reference', fa: 'مرجع', ru: 'Справочник', zh: '参考' },
}
