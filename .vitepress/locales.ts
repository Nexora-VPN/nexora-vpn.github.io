// Per-locale strings for the theme chrome: navigation, the search box and every
// label the default theme draws. Page text lives in src/<locale>/; this file is
// only what surrounds it. English is the root locale (no prefix).

import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

type Locale = LocaleSpecificConfig<DefaultTheme.Config> & { label: string; link?: string }

// The repository is the org's own Pages site, so that nexora-vpn.github.io
// itself (not only a /docs path under it) redirects to the custom domain.
const REPO = 'https://github.com/Nexora-VPN/nexora-vpn.github.io'

function edit(text: string): DefaultTheme.EditLink {
  return { pattern: `${REPO}/edit/main/src/:path`, text }
}

export const locales: Record<string, Locale> = {
  root: {
    label: 'English',
    lang: 'en',
    description: 'Documentation for Nexora: a self-hosted panel and nodes for running a VPN fleet.',
    themeConfig: {
      nav: [{ text: 'Home', link: '/' }],
      editLink: edit('Edit this page on GitHub'),
      outline: { label: 'On this page', level: [2, 3] },
      docFooter: { prev: 'Previous', next: 'Next' },
      lastUpdated: { text: 'Updated' },
      darkModeSwitchLabel: 'Appearance',
      lightModeSwitchTitle: 'Switch to light theme',
      darkModeSwitchTitle: 'Switch to dark theme',
      sidebarMenuLabel: 'Menu',
      returnToTopLabel: 'Back to top',
      langMenuLabel: 'Language',
      notFound: {
        title: 'PAGE NOT FOUND',
        quote: 'This address does not lead to a page of the documentation.',
        linkLabel: 'Go to the home page',
        linkText: 'Home',
      },
      footer: { message: 'Text and images under CC BY 4.0.', copyright: '© Nexora' },
    },
  },
  fa: {
    label: 'فارسی',
    lang: 'fa',
    dir: 'rtl',
    link: '/fa/',
    description: 'مستندات نکسورا: پنل و نودهای خودمیزبان برای اداره‌ی ناوگان VPN.',
    themeConfig: {
      nav: [{ text: 'خانه', link: '/fa/' }],
      editLink: edit('ویرایش این صفحه در GitHub'),
      outline: { label: 'در این صفحه', level: [2, 3] },
      docFooter: { prev: 'قبلی', next: 'بعدی' },
      lastUpdated: { text: 'به‌روزرسانی' },
      darkModeSwitchLabel: 'ظاهر',
      lightModeSwitchTitle: 'تم روشن',
      darkModeSwitchTitle: 'تم تیره',
      sidebarMenuLabel: 'منو',
      returnToTopLabel: 'بازگشت به بالا',
      langMenuLabel: 'زبان',
      notFound: {
        title: 'صفحه پیدا نشد',
        quote: 'این آدرس به هیچ صفحه‌ای از مستندات نمی‌رسد.',
        linkLabel: 'رفتن به صفحه‌ی اصلی',
        linkText: 'خانه',
      },
      footer: { message: 'متن و تصویرها با مجوز CC BY 4.0.', copyright: '© Nexora' },
    },
  },
  ru: {
    label: 'Русский',
    lang: 'ru',
    link: '/ru/',
    description: 'Документация Nexora: собственная панель и узлы для управления VPN-флотом.',
    themeConfig: {
      nav: [{ text: 'Главная', link: '/ru/' }],
      editLink: edit('Изменить страницу на GitHub'),
      outline: { label: 'На этой странице', level: [2, 3] },
      docFooter: { prev: 'Назад', next: 'Далее' },
      lastUpdated: { text: 'Обновлено' },
      darkModeSwitchLabel: 'Оформление',
      lightModeSwitchTitle: 'Светлая тема',
      darkModeSwitchTitle: 'Тёмная тема',
      sidebarMenuLabel: 'Меню',
      returnToTopLabel: 'Наверх',
      langMenuLabel: 'Язык',
      notFound: {
        title: 'СТРАНИЦА НЕ НАЙДЕНА',
        quote: 'По этому адресу нет страницы документации.',
        linkLabel: 'На главную',
        linkText: 'Главная',
      },
      footer: { message: 'Текст и изображения — CC BY 4.0.', copyright: '© Nexora' },
    },
  },
  zh: {
    label: '简体中文',
    lang: 'zh-CN',
    link: '/zh/',
    description: 'Nexora 文档:自托管的面板与节点,用于运营 VPN 节点集群。',
    themeConfig: {
      nav: [{ text: '首页', link: '/zh/' }],
      editLink: edit('在 GitHub 上编辑此页'),
      outline: { label: '本页内容', level: [2, 3] },
      docFooter: { prev: '上一页', next: '下一页' },
      lastUpdated: { text: '更新于' },
      darkModeSwitchLabel: '外观',
      lightModeSwitchTitle: '浅色主题',
      darkModeSwitchTitle: '深色主题',
      sidebarMenuLabel: '菜单',
      returnToTopLabel: '返回顶部',
      langMenuLabel: '语言',
      notFound: {
        title: '页面不存在',
        quote: '这个地址没有对应的文档页面。',
        linkLabel: '返回首页',
        linkText: '首页',
      },
      footer: { message: '文字与图片采用 CC BY 4.0 许可。', copyright: '© Nexora' },
    },
  },
}

// The search box's own words, keyed like `locales`.
export const searchLocales = {
  root: {
    translations: {
      button: { buttonText: 'Search', buttonAriaLabel: 'Search' },
      modal: {
        displayDetails: 'Show details',
        resetButtonTitle: 'Clear',
        backButtonTitle: 'Close',
        noResultsText: 'Nothing found for',
        footer: { selectText: 'open', navigateText: 'move', closeText: 'close' },
      },
    },
  },
  fa: {
    translations: {
      button: { buttonText: 'جستجو', buttonAriaLabel: 'جستجو' },
      modal: {
        displayDetails: 'نمایش جزئیات',
        resetButtonTitle: 'پاک کردن',
        backButtonTitle: 'بستن',
        noResultsText: 'چیزی پیدا نشد برای',
        footer: { selectText: 'باز کردن', navigateText: 'جابه‌جایی', closeText: 'بستن' },
      },
    },
  },
  ru: {
    translations: {
      button: { buttonText: 'Поиск', buttonAriaLabel: 'Поиск' },
      modal: {
        displayDetails: 'Подробнее',
        resetButtonTitle: 'Очистить',
        backButtonTitle: 'Закрыть',
        noResultsText: 'Ничего не найдено по запросу',
        footer: { selectText: 'открыть', navigateText: 'перейти', closeText: 'закрыть' },
      },
    },
  },
  zh: {
    translations: {
      button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
      modal: {
        displayDetails: '显示详情',
        resetButtonTitle: '清除',
        backButtonTitle: '关闭',
        noResultsText: '没有找到',
        footer: { selectText: '打开', navigateText: '切换', closeText: '关闭' },
      },
    },
  },
}
