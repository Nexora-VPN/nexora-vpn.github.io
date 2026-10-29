<script setup lang="ts">
// Pick what to install and how; get the exact commands to paste. The commands
// are the ones the install guides give (panel/docs, node/docs) — this only
// assembles them, it knows nothing the guides do not.
import { computed, ref } from 'vue'
import { useData } from 'vitepress'

type What = 'panel' | 'node' | 'both'
type How = 'script' | 'docker'
type Db = 'sqlite' | 'postgres'

const what = ref<What>('panel')
const how = ref<How>('script')
const db = ref<Db>('sqlite')
const version = ref('')
const copied = ref(false)

const { lang } = useData()
const WORDS = {
  en: {
    what: 'Install', panel: 'Panel', node: 'Node', both: 'Panel and node on one server',
    how: 'How', script: 'Install script', docker: 'Docker',
    db: 'Database', sqlite: 'SQLite (no other service)', postgres: 'PostgreSQL',
    version: 'Version', latest: 'latest release', copy: 'Copy', copied: 'Copied',
    notePanel: 'Run as root. It ends by printing a one-time setup link: open it to create your admin account.',
    noteNode: 'The panel shows this command, with PANEL and TOKEN filled in, when you add a node. The token works once.',
    noteNodeDocker: 'Save the panel certificate from the node’s install page in the panel as certs/panel_ca.pem first.',
    noteBoth: 'Fine for a test or a small setup; the node’s address then goes into every user’s links.',
    notePg: 'Copy .env.example to .env and set a password before the first start.',
  },
  fa: {
    what: 'نصب', panel: 'پنل', node: 'نود', both: 'پنل و نود روی یک سرور',
    how: 'روش', script: 'اسکریپت نصب', docker: 'Docker',
    db: 'پایگاه داده', sqlite: 'SQLite (بدون سرویس دیگر)', postgres: 'PostgreSQL',
    version: 'نسخه', latest: 'آخرین نسخه', copy: 'کپی', copied: 'کپی شد',
    notePanel: 'با root اجرا کنید. در پایان یک لینک یک‌بارمصرف راه‌اندازی چاپ می‌کند: بازش کنید تا حساب مدیرتان ساخته شود.',
    noteNode: 'پنل وقتی نود اضافه می‌کنید همین دستور را با PANEL و TOKEN پرشده نشان می‌دهد. توکن فقط یک بار کار می‌کند.',
    noteNodeDocker: 'اول گواهی پنل را از صفحه‌ی نصب نود در پنل با نام certs/panel_ca.pem ذخیره کنید.',
    noteBoth: 'برای آزمایش یا راه‌اندازی کوچک مناسب است؛ آدرس نود در لینک همه‌ی کاربرها قرار می‌گیرد.',
    notePg: 'پیش از اولین اجرا .env.example را به .env کپی و یک رمز در آن بگذارید.',
  },
  ru: {
    what: 'Установить', panel: 'Панель', node: 'Узел', both: 'Панель и узел на одном сервере',
    how: 'Способ', script: 'Скрипт установки', docker: 'Docker',
    db: 'База данных', sqlite: 'SQLite (без других служб)', postgres: 'PostgreSQL',
    version: 'Версия', latest: 'последний выпуск', copy: 'Копировать', copied: 'Скопировано',
    notePanel: 'Запускайте от root. В конце скрипт печатает одноразовую ссылку настройки: откройте её, чтобы создать учётную запись администратора.',
    noteNode: 'Эту команду с подставленными PANEL и TOKEN панель показывает при добавлении узла. Токен работает один раз.',
    noteNodeDocker: 'Сначала сохраните сертификат панели со страницы установки узла как certs/panel_ca.pem.',
    noteBoth: 'Подходит для теста или небольшой установки; адрес узла тогда попадает в ссылки всех пользователей.',
    notePg: 'Перед первым запуском скопируйте .env.example в .env и задайте пароль.',
  },
  zh: {
    what: '安装', panel: '面板', node: '节点', both: '面板与节点在同一台服务器',
    how: '方式', script: '安装脚本', docker: 'Docker',
    db: '数据库', sqlite: 'SQLite(无需其他服务)', postgres: 'PostgreSQL',
    version: '版本', latest: '最新版本', copy: '复制', copied: '已复制',
    notePanel: '以 root 运行。结束时会打印一次性设置链接:打开它来创建管理员账户。',
    noteNode: '在面板中添加节点时,面板会显示这条已填好 PANEL 和 TOKEN 的命令。令牌只能使用一次。',
    noteNodeDocker: '先把面板中节点安装页上的面板证书保存为 certs/panel_ca.pem。',
    noteBoth: '适合测试或小规模部署;此时节点地址会出现在每个用户的链接中。',
    notePg: '首次启动前把 .env.example 复制为 .env 并设置密码。',
  },
} as const
const w = computed(() => WORDS[lang.value.slice(0, 2) as keyof typeof WORDS] ?? WORDS.en)

const INSTALL = 'bash <(curl -fsSL https://raw.githubusercontent.com/nx-panel/panel/main/install.sh)'
const NODE = 'curl -fsSL https://PANEL/install-node.sh | bash -s -- --panel PANEL --token TOKEN'
const pin = computed(() => {
  const v = version.value.trim()
  return v ? (v.startsWith('v') ? v : `v${v}`) : ''
})

const result = computed(() => {
  const v = pin.value
  const notes: string[] = []
  let lines: string[] = []
  if (what.value === 'panel' && how.value === 'script') {
    lines = [`${INSTALL}${db.value === 'postgres' ? ' --postgres' : ''}${v ? ` --version ${v}` : ''}`]
    notes.push(w.value.notePanel)
  } else if (what.value === 'panel') {
    lines = [
      'git clone https://github.com/nx-panel/panel',
      `cd panel/docker/${db.value}`,
      ...(db.value === 'postgres' ? ['cp .env.example .env    # then set a password in .env'] : []),
      'docker compose up -d',
      'docker compose logs panel | grep setup',
    ]
    if (db.value === 'postgres') notes.push(w.value.notePg)
  } else if (what.value === 'node' && how.value === 'script') {
    lines = [`${NODE}${v ? ` --version ${v}` : ''}`]
    notes.push(w.value.noteNode)
  } else if (what.value === 'node') {
    lines = [
      'git clone https://github.com/nx-panel/node',
      'cd node',
      'mkdir -p certs && cp /path/to/panel_ca.pem certs/',
      'docker compose up -d',
    ]
    notes.push(w.value.noteNodeDocker)
  } else if (how.value === 'script') {
    lines = [
      `${INSTALL}${db.value === 'postgres' ? ' --postgres' : ''}${v ? ` --version ${v}` : ''}`,
      '# finish the setup wizard, add a node with address 127.0.0.1, then:',
      `${NODE} --listen 127.0.0.1:62050`,
    ]
    notes.push(w.value.noteBoth)
  } else {
    lines = [
      'git clone https://github.com/nx-panel/panel',
      'cd panel/docker/panel-and-node',
      'docker compose up -d panel',
      'docker compose logs panel | grep setup',
      '# finish the wizard, add a node at 127.0.0.1:62050 and save its',
      '# panel certificate as ./certs/panel_ca.pem, then:',
      'docker compose up -d node',
    ]
    notes.push(w.value.noteBoth)
  }
  return { text: lines.join('\n'), notes }
})

const showDb = computed(() => what.value !== 'node')
const showVersion = computed(() => how.value === 'script')

async function copy() {
  const text = result.value.text
    .split('\n')
    .filter((l) => !l.startsWith('#'))
    .join('\n')
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    // Clipboard refused: the text is selectable.
  }
}
</script>

<template>
  <div class="nx-builder">
    <div class="row">
      <span class="name">{{ w.what }}</span>
      <div class="seg" role="radiogroup" :aria-label="w.what">
        <button v-for="o in (['panel', 'node', 'both'] as const)" :key="o" type="button" role="radio"
          :aria-checked="what === o" :class="{ on: what === o }" @click="what = o">{{ w[o] }}</button>
      </div>
    </div>
    <div class="row">
      <span class="name">{{ w.how }}</span>
      <div class="seg" role="radiogroup" :aria-label="w.how">
        <button v-for="o in (['script', 'docker'] as const)" :key="o" type="button" role="radio"
          :aria-checked="how === o" :class="{ on: how === o }" @click="how = o">{{ w[o] }}</button>
      </div>
    </div>
    <div v-if="showDb" class="row">
      <span class="name">{{ w.db }}</span>
      <div class="seg" role="radiogroup" :aria-label="w.db">
        <button v-for="o in (['sqlite', 'postgres'] as const)" :key="o" type="button" role="radio"
          :aria-checked="db === o" :class="{ on: db === o }" @click="db = o">{{ w[o] }}</button>
      </div>
    </div>
    <div v-if="showVersion" class="row">
      <label class="name" for="nx-builder-version">{{ w.version }}</label>
      <input id="nx-builder-version" v-model="version" :placeholder="w.latest" dir="ltr" spellcheck="false" />
    </div>
    <div class="out" dir="ltr">
      <pre><code>{{ result.text }}</code></pre>
      <button type="button" class="copy" @click="copy">
        <i :class="['pi', copied ? 'pi-check' : 'pi-copy']" aria-hidden="true"></i> {{ copied ? w.copied : w.copy }}
      </button>
    </div>
    <p v-for="n in result.notes" :key="n" class="note">{{ n }}</p>
  </div>
</template>
