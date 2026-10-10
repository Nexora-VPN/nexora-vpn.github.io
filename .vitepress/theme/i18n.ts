// Words the wiki components draw, by page language.
const WORDS = {
  en: { tags: 'Tags', backlinks: 'Links to this page', related: 'Related pages', pages: 'pages', allTags: 'All tags', glossary: 'Glossary' },
  fa: { tags: 'تگ‌ها', backlinks: 'صفحه‌هایی که به اینجا لینک داده‌اند', related: 'صفحه‌های مرتبط', pages: 'صفحه', allTags: 'همه‌ی تگ‌ها', glossary: 'واژه‌نامه' },
  ru: { tags: 'Теги', backlinks: 'Ссылаются на эту страницу', related: 'Похожие страницы', pages: 'стр.', allTags: 'Все теги', glossary: 'Глоссарий' },
  zh: { tags: '标签', backlinks: '链接到本页的页面', related: '相关页面', pages: '页', allTags: '全部标签', glossary: '术语表' },
} as const

export type Words = (typeof WORDS)['en']

export function words(lang: string): Words {
  const key = lang.slice(0, 2) as keyof typeof WORDS
  return WORDS[key] ?? WORDS.en
}
