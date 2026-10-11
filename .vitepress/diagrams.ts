// The site's diagrams as data: boxes on a grid, arrows between them, and the
// words in every language. <NxDiagram id="…" /> draws one. A diagram is always
// laid out left to right — it is a picture of machines, not a sentence — and
// only its words follow the page's language.

export type Words = { en: string; fa: string; ru: string; zh: string }

export interface Box {
  id: string
  x: number
  y: number
  w: number
  h: number
  kind: 'panel' | 'node' | 'client' | 'internet' | 'admin' | 'addon'
  icon: string // a PrimeIcons name, without "pi-"
  label: Words
  sub?: Words
}

export interface Arrow {
  from: string
  to: string
  // traffic: users' connections; control: the panel driving its nodes;
  // events: what the panel tells other programs; fetch: a download.
  flow: 'traffic' | 'control' | 'events' | 'fetch'
  label?: Words
  both?: boolean // packets run both ways
  // A route of its own, start and end included, for an arrow that would
  // otherwise cut through a box. Without it the arrow runs straight between
  // the two boxes' edges.
  points?: [number, number][]
}

export interface Diagram {
  width: number
  height: number
  title: Words
  boxes: Box[]
  arrows: Arrow[]
}

const w = (en: string, fa: string, ru: string, zh: string): Words => ({ en, fa, ru, zh })

export const LEGEND: Record<Arrow['flow'], Words> = {
  traffic: w('users’ traffic', 'ترافیک کاربران', 'трафик пользователей', '用户流量'),
  control: w('configuration and statistics, over mutual TLS', 'پیکربندی و آمار، روی TLS دوطرفه', 'настройки и статистика по взаимному TLS', '配置与统计,经双向 TLS'),
  events: w('events and API', 'رویدادها و API', 'события и API', '事件与 API'),
  fetch: w('subscription download', 'دریافت اشتراک', 'загрузка подписки', '下载订阅'),
}

export const DIAGRAMS: Record<string, Diagram> = {
  overview: {
    width: 940,
    height: 430,
    title: w(
      'How the pieces fit together',
      'اجزا چطور کنار هم کار می‌کنند',
      'Как части работают вместе',
      '各部分如何协同工作',
    ),
    boxes: [
      { id: 'apps', x: 20, y: 120, w: 190, h: 76, kind: 'client', icon: 'mobile', label: w('Customers’ apps', 'اپ مشتری‌ها', 'Приложения клиентов', '客户的应用'), sub: w('v2rayNG, Hiddify, Streisand…', 'v2rayNG، Hiddify، Streisand…', 'v2rayNG, Hiddify, Streisand…', 'v2rayNG、Hiddify、Streisand…') },
      { id: 'n1', x: 375, y: 20, w: 190, h: 64, kind: 'node', icon: 'server', label: w('Node', 'نود', 'Узел', '节点'), sub: w('frankfurt-01', 'frankfurt-01', 'frankfurt-01', 'frankfurt-01') },
      { id: 'n2', x: 375, y: 126, w: 190, h: 64, kind: 'node', icon: 'server', label: w('Node', 'نود', 'Узел', '节点'), sub: w('tokyo-01', 'tokyo-01', 'tokyo-01', 'tokyo-01') },
      { id: 'n3', x: 375, y: 232, w: 190, h: 64, kind: 'node', icon: 'server', label: w('Node', 'نود', 'Узел', '节点'), sub: w('toronto-01', 'toronto-01', 'toronto-01', 'toronto-01') },
      { id: 'net', x: 730, y: 120, w: 190, h: 76, kind: 'internet', icon: 'globe', label: w('The internet', 'اینترنت', 'Интернет', '互联网') },
      { id: 'panel', x: 375, y: 346, w: 190, h: 64, kind: 'panel', icon: 'th-large', label: w('Panel', 'پنل', 'Панель', '面板'), sub: w('one place for everything', 'همه‌چیز در یک جا', 'всё в одном месте', '一切集中管理') },
      { id: 'admin', x: 20, y: 346, w: 190, h: 64, kind: 'admin', icon: 'user', label: w('You, in a browser', 'شما، در مرورگر', 'Вы, в браузере', '你,在浏览器中') },
      { id: 'addons', x: 730, y: 346, w: 190, h: 64, kind: 'addon', icon: 'box', label: w('Addons', 'افزونه‌ها', 'Дополнения', '插件'), sub: w('Shop, notifier, your own', 'فروشگاه، اطلاع‌رسان، مال خودتان', 'магазин, уведомления, свои', '商店、通知器、你自己的') },
    ],
    arrows: [
      { from: 'apps', to: 'n1', flow: 'traffic', both: true },
      { from: 'apps', to: 'n2', flow: 'traffic', both: true },
      { from: 'apps', to: 'n3', flow: 'traffic', both: true },
      { from: 'n1', to: 'net', flow: 'traffic', both: true },
      { from: 'n2', to: 'net', flow: 'traffic', both: true },
      { from: 'n3', to: 'net', flow: 'traffic', both: true },
      { from: 'panel', to: 'n3', flow: 'control', both: true },
      { from: 'panel', to: 'n2', flow: 'control', both: true, points: [[565, 368], [592, 368], [592, 158], [565, 158]] },
      { from: 'panel', to: 'n1', flow: 'control', both: true, points: [[565, 388], [606, 388], [606, 52], [565, 52]] },
      { from: 'admin', to: 'panel', flow: 'control' },
      { from: 'panel', to: 'addons', flow: 'events', both: true },
      { from: 'panel', to: 'apps', flow: 'fetch', points: [[375, 360], [250, 360], [250, 236], [115, 236], [115, 196]] },
    ],
  },
}
