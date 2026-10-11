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
  // What this stage does, shown under the diagram when the box is chosen.
  // A diagram whose boxes carry notes is a walk-through: click a box.
  note?: Words
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
  // The same picture for a phone: a narrower canvas where it flows top to
  // bottom. Boxes are placed by id as [x, y, w, h]; an arrow keeps a route of
  // its own only when `points` names its index, and runs straight otherwise.
  tall?: {
    width: number
    height: number
    boxes: Record<string, [number, number, number, number]>
    points?: Record<number, [number, number][]>
  }
}

const w = (en: string, fa: string, ru: string, zh: string): Words => ({ en, fa, ru, zh })

export const PICK: Words = {
  en: 'Choose a box to read what happens there.',
  fa: 'روی هر جعبه بزنید تا ببینید آنجا چه اتفاقی می‌افتد.',
  ru: 'Выберите блок, чтобы прочитать, что в нём происходит.',
  zh: '点击任意方框,查看那里发生了什么。',
}

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
    tall: {
      width: 440,
      height: 580,
      boxes: {
        apps: [130, 10, 180, 70],
        n1: [30, 130, 120, 60],
        n2: [160, 130, 120, 60],
        n3: [290, 130, 120, 60],
        net: [130, 250, 180, 64],
        panel: [130, 380, 180, 64],
        admin: [30, 500, 180, 64],
        addons: [230, 500, 180, 64],
      },
      points: {
        6: [[310, 400], [428, 400], [428, 160], [410, 160]],
        7: [[280, 380], [280, 348], [326, 348], [326, 214], [240, 214], [240, 190]],
        8: [[130, 400], [18, 400], [18, 160], [30, 160]],
        11: [[130, 430], [6, 430], [6, 45], [130, 45]],
      },
    },
  },

  // One connection through one node, stage by stage (how/packet-path).
  'packet-path': {
    width: 920,
    height: 420,
    title: w(
      'One connection through a node',
      'یک اتصال در مسیرش از میان نود',
      'Одно соединение на пути через узел',
      '一条连接穿过节点的路径',
    ),
    boxes: [
      {
        id: 'app', x: 20, y: 30, w: 190, h: 72, kind: 'client', icon: 'mobile',
        label: w('User’s app', 'اپ کاربر', 'Приложение', '用户的应用'),
        sub: w('dials a link address', 'به آدرس لینک وصل می‌شود', 'идёт на адрес из ссылки', '连接链接地址'),
        note: w(
          'The app opens a connection to one of the node’s link addresses, on the port its link names. Users only ever reach nodes and the subscription address, never the panel.',
          'اپ به یکی از آدرس‌های لینک نود، روی پورتی که لینک نام برده، وصل می‌شود. کاربران فقط به نودها و آدرس اشتراک می‌رسند و هیچ‌وقت به خود پنل نمی‌رسند.',
          'Приложение открывает соединение с одним из адресов ссылок узла, на порт из ссылки. Пользователи видят только узлы и адрес подписки, но никогда саму панель.',
          '应用连接节点的某个链接地址，端口取自链接。用户只会接触节点和订阅地址，永远不会接触面板本身。',
        ),
      },
      {
        id: 'listen', x: 250, y: 30, w: 190, h: 72, kind: 'node', icon: 'sign-in',
        label: w('Listener', 'شنونده', 'Приём', '监听'),
        sub: w('a port, an ingress or a port set', 'یک پورت، یک ingress یا چند پورت', 'порт, ingress или набор портов', '端口、ingress 或端口集'),
        note: w(
          'Usually one inbound on one port. An ingress shares one port among several inbounds and hands each connection to the right one by the name in its TLS handshake, keeping the user’s real address. For port hopping the node listens on every port of the set and answers each client from the port it used.',
          'معمولاً یک اینباند روی یک پورت. یک ingress یک پورت را میان چند اینباند تقسیم می‌کند و هر اتصال را بر اساس نامی که در دست‌دادن TLS آمده به اینباند درست می‌سپارد، بی‌آنکه آدرس واقعی کاربر از دست برود. برای پرش پورت، نود روی همهٔ پورت‌های مجموعه گوش می‌دهد و به هر کلاینت از همان پورتی جواب می‌دهد که به آن فرستاده است.',
          'Обычно один входящий на одном порту. Ingress делит один порт между несколькими входящими и по имени из TLS-рукопожатия передаёт каждое соединение нужному, сохраняя настоящий адрес пользователя. Для смены портов узел слушает каждый порт набора и отвечает клиенту с того порта, на который тот отправил пакет.',
          '通常是一个入站占一个端口。ingress 让多个入站共用一个端口，按 TLS 握手中的名称把每条连接交给对应的入站，并保留用户的真实地址。端口跳跃时，节点监听端口集中的每个端口，并从客户端所用的那个端口回复它。',
        ),
      },
      {
        id: 'tls', x: 480, y: 30, w: 190, h: 72, kind: 'node', icon: 'lock',
        label: w('TLS and transport', 'TLS و ترنسپورت', 'TLS и транспорт', 'TLS 与传输层'),
        sub: w('TLS, REALITY; ws, grpc, xhttp…', 'TLS، REALITY؛ ws، grpc، xhttp…', 'TLS, REALITY; ws, grpc, xhttp…', 'TLS、REALITY；ws、grpc、xhttp…'),
        note: w(
          'TLS or REALITY is completed here with the certificate or keys the panel sent, then the transport (WebSocket, gRPC, HTTPUpgrade, XHTTP and others) is unwrapped. What is left is the protocol’s own stream.',
          'اینجا TLS یا REALITY با گواهی یا کلیدهایی که پنل فرستاده کامل می‌شود و بعد ترنسپورت (WebSocket، gRPC، HTTPUpgrade، XHTTP و بقیه) باز می‌شود. آنچه می‌ماند جریان خود پروتکل است.',
          'Здесь завершается TLS или REALITY с сертификатом или ключами от панели, затем снимается транспорт (WebSocket, gRPC, HTTPUpgrade, XHTTP и другие). Остаётся поток самого протокола.',
          '这里用面板下发的证书或密钥完成 TLS 或 REALITY，再拆开传输层（WebSocket、gRPC、HTTPUpgrade、XHTTP 等）。剩下的就是协议本身的数据流。',
        ),
      },
      {
        id: 'proto', x: 710, y: 30, w: 190, h: 72, kind: 'node', icon: 'id-card',
        label: w('Protocol', 'پروتکل', 'Протокол', '协议'),
        sub: w('the user is identified here', 'کاربر اینجا شناخته می‌شود', 'здесь узнаётся пользователь', '在这里识别用户'),
        note: w(
          'The protocol (VLESS, Trojan, Hysteria2…) reads the credentials and finds the user. From here on the connection carries the user’s name, which the limits and the counters use. The device limit is not checked here: it acts when the subscription is fetched.',
          'پروتکل (VLESS، Trojan، Hysteria2…) اعتبارنامه را می‌خواند و کاربر را پیدا می‌کند. از اینجا به بعد اتصال نام کاربر را با خود دارد و محدودیت‌ها و شمارنده‌ها از آن استفاده می‌کنند. محدودیت دستگاه اینجا بررسی نمی‌شود: آن هنگام دریافت اشتراک عمل می‌کند.',
          'Протокол (VLESS, Trojan, Hysteria2…) читает учётные данные и находит пользователя. Дальше соединение несёт имя пользователя, по которому работают лимиты и счётчики. Лимит устройств здесь не проверяется: он работает при загрузке подписки.',
          '协议（VLESS、Trojan、Hysteria2……）读取凭据并找到用户。从这里开始，连接带着用户名，限制和计数都依据它。设备数限制不在这里检查：它在拉取订阅时起作用。',
        )
      },
      {
        id: 'tout', x: 20, y: 180, w: 190, h: 72, kind: 'node', icon: 'share-alt',
        label: w('Tunnel to an origin', 'تونل به نود خروجی', 'Туннель на выход', '隧道到出口节点'),
        sub: w('leaves from another node', 'از نود دیگری خارج می‌شود', 'выходит с другого узла', '从另一台节点出网'),
        note: w(
          'On a relay, a tunnel is an outbound like any other. The connection travels to an origin node and leaves for the internet from there. Each user stays on one origin, so their exit address stays the same.',
          'روی نود رله، تونل هم یک اوت‌باند است مثل بقیه. اتصال به یک نود خروجی می‌رود و از آنجا به اینترنت می‌رسد. هر کاربر روی یک نود خروجی می‌ماند، پس آدرس خروجی‌اش ثابت می‌ماند.',
          'На ретрансляторе туннель — такой же исходящий, как остальные. Соединение уходит на исходящий узел и оттуда выходит в интернет. Каждый пользователь закреплён за одним исходящим узлом, поэтому его внешний адрес не меняется.',
          '在中继节点上，隧道和其他出站一样。连接被送到一台出口节点，再从那里出网。每个用户固定在一台出口节点上，所以出口地址保持不变。',
        ),
      },
      {
        id: 'ep', x: 250, y: 180, w: 190, h: 72, kind: 'node', icon: 'key',
        label: w('Endpoints', 'اندپوینت‌ها', 'Эндпоинты', '端点'),
        sub: w('WireGuard, OpenVPN, OpenConnect', 'WireGuard، OpenVPN، OpenConnect', 'WireGuard, OpenVPN, OpenConnect', 'WireGuard、OpenVPN、OpenConnect'),
        note: w(
          'WireGuard, OpenVPN and OpenConnect are a way in and a way out at once. Each identifies the user by its own keys or login, then hands the traffic straight to routing.',
          'WireGuard، OpenVPN و OpenConnect هم‌زمان راه ورود و راه خروج‌اند. هر کدام کاربر را با کلیدها یا ورود خودش می‌شناسد و بعد ترافیک را مستقیم به مسیریابی می‌دهد.',
          'WireGuard, OpenVPN и OpenConnect — одновременно вход и выход. Каждый узнаёт пользователя по своим ключам или логину и передаёт трафик прямо в маршрутизацию.',
          'WireGuard、OpenVPN 和 OpenConnect 同时是入口和出口。它们各自用自己的密钥或登录识别用户，然后把流量直接交给路由。',
        ),
      },
      {
        id: 'tin', x: 480, y: 180, w: 190, h: 72, kind: 'node', icon: 'sitemap',
        label: w('Tunnel from a relay', 'تونل از رله', 'Туннель от ретранслятора', '来自中继的隧道'),
        sub: w('this node as an origin', 'این نود در نقش خروجی', 'этот узел как выход', '本节点作为出口'),
        note: w(
          'On an origin node, the tunnel’s half accepts streams from the relay and hands them straight to routing. They are not counted against users here, and their addresses do not count toward an address limit: the relay already did both.',
          'روی نود خروجی، نیمهٔ تونل استریم‌های رله را می‌پذیرد و مستقیم به مسیریابی می‌دهد. این ترافیک اینجا به حساب کاربران نوشته نمی‌شود و آدرس‌هایش در محدودیت آدرس شمرده نمی‌شوند: رله هر دو کار را انجام داده است.',
          'На исходящем узле половина туннеля принимает потоки от ретранслятора и передаёт их прямо в маршрутизацию. Здесь они не списываются с пользователей и не считаются в лимит адресов: ретранслятор уже сделал и то и другое.',
          '在出口节点上，隧道的这一半接收来自中继的流，并直接交给路由。这些流量在这里不计入用户，也不计入地址限制：中继已经做过了。',
        ),
      },
      {
        id: 'sniff', x: 710, y: 180, w: 190, h: 72, kind: 'node', icon: 'search',
        label: w('Sniffing', 'شناسایی مقصد', 'Распознавание', '嗅探'),
        sub: w('the real domain or protocol', 'دامنه یا پروتکل واقعی', 'настоящий домен или протокол', '真实域名或协议'),
        note: w(
          'When routing asks for it, the node reads the start of the connection to learn the domain it is for, or the protocol it carries (BitTorrent, for example), so rules can match on them.',
          'وقتی مسیریابی بخواهد، نود ابتدای اتصال را می‌خواند تا بفهمد اتصال برای کدام دامنه است یا چه پروتکلی را حمل می‌کند (مثلاً BitTorrent)، تا قانون‌ها بتوانند روی آن‌ها تطبیق بخورند.',
          'Если маршрутизация этого просит, узел читает начало соединения, чтобы узнать домен назначения или протокол внутри (например, BitTorrent), и правила могут сработать по ним.',
          '当路由需要时，节点读取连接开头，判断它要去的域名或承载的协议（例如 BitTorrent），让规则可以据此匹配。',
        ),
      },
      {
        id: 'net', x: 20, y: 330, w: 190, h: 72, kind: 'internet', icon: 'globe',
        label: w('The internet', 'اینترنت', 'Интернет', '互联网'),
        note: w(
          'The destination. Replies come back the same way, through the same layers, to the same app.',
          'مقصد. پاسخ‌ها از همان راه و از همان لایه‌ها به همان اپ برمی‌گردند.',
          'Пункт назначения. Ответы возвращаются тем же путём, через те же слои, в то же приложение.',
          '目的地。回包沿同一条路、经过同样的各层，回到同一个应用。',
        ),
      },
      {
        id: 'out', x: 250, y: 330, w: 190, h: 72, kind: 'node', icon: 'sign-out',
        label: w('Outbound', 'اوت‌باند', 'Исходящий', '出站'),
        sub: w('direct, another proxy, block', 'مستقیم، پراکسی دیگر، مسدود', 'напрямую, прокси, блок', '直连、上级代理、阻断'),
        note: w(
          'Once routing has chosen, the user’s address limit decides whether one more address may connect, the speed limit applies, and the connection is counted for its inbound, outbound and user. Then: straight to the internet, on through another proxy, or blocked. A block outbound counts what it refuses, per node.',
          'وقتی مسیریابی انتخاب کرد، محدودیت آدرس کاربر تصمیم می‌گیرد که یک آدرس دیگر می‌تواند وصل شود یا نه، محدودیت سرعت اعمال می‌شود و اتصال برای اینباند، اوت‌باند و کاربرش شمرده می‌شود. بعد: مستقیم به اینترنت، از طریق یک پراکسی دیگر، یا مسدود. اوت‌باند مسدودکننده آنچه را رد می‌کند برای هر نود می‌شمارد.',
          'Когда маршрут выбран, лимит адресов решает, можно ли подключиться ещё с одного адреса, действует лимит скорости, и соединение учитывается по входящему, исходящему и пользователю. Дальше — прямо в интернет, через другой прокси или блокировка. Блокирующий исходящий считает отклонённое по каждому узлу.',
          '路由选定之后，地址限制决定能否再多一个地址接入，限速生效，连接按入站、出站和用户计数。然后：直接出网、经另一个代理转发，或被阻断。阻断类出站按节点统计它拒绝的连接。',
        )
      },
      {
        id: 'route', x: 480, y: 330, w: 190, h: 72, kind: 'node', icon: 'directions',
        label: w('Routing', 'مسیریابی', 'Маршрутизация', '路由'),
        sub: w('rules, rule sets, final', 'قانون‌ها، رول‌ست‌ها، final', 'правила, наборы, final', '规则、规则集、final'),
        note: w(
          'The template’s rules are tried in order (domain, address, rule set, protocol, inbound, user) and the first match picks the outbound. When nothing matches, the final outbound takes it. Rule sets come from the panel; the node downloads nothing itself.',
          'قانون‌های تمپلیت به ترتیب امتحان می‌شوند (دامنه، آدرس، رول‌ست، پروتکل، اینباند، کاربر) و اولین تطبیق، اوت‌باند را انتخاب می‌کند. اگر هیچ‌کدام تطبیق نخورد، اوت‌باند final آن را می‌گیرد. رول‌ست‌ها از پنل می‌آیند؛ نود خودش چیزی دانلود نمی‌کند.',
          'Правила шаблона проверяются по порядку (домен, адрес, набор правил, протокол, входящий, пользователь), и первое совпадение выбирает исходящий. Если ничего не совпало, соединение берёт исходящий final. Наборы правил приходят от панели; сам узел ничего не скачивает.',
          '模板的规则按顺序匹配（域名、地址、规则集、协议、入站、用户），第一条命中的规则选定出站。都不匹配时由 final 出站接手。规则集由面板下发，节点自己不下载任何东西。',
        ),
      },
      {
        id: 'panel', x: 710, y: 330, w: 190, h: 72, kind: 'panel', icon: 'th-large',
        label: w('Panel', 'پنل', 'Панель', '面板'),
        sub: w('collects the counters', 'شمارنده‌ها را جمع می‌کند', 'забирает счётчики', '收集计数'),
        note: w(
          'Every connection is counted by inbound, outbound and user. The panel collects the counters every 30 seconds. Every 10 seconds it merges the addresses each node saw and sends back which addresses each limited user may connect from.',
          'هر اتصال به تفکیک اینباند، اوت‌باند و کاربر شمرده می‌شود. پنل هر ۳۰ ثانیه شمارنده‌ها را جمع می‌کند. هر ۱۰ ثانیه هم آدرس‌هایی را که هر نود دیده ادغام می‌کند و برمی‌گرداند که هر کاربرِ محدود از کدام آدرس‌ها می‌تواند وصل شود.',
          'Каждое соединение считается по входящему, исходящему и пользователю. Панель забирает счётчики каждые 30 секунд. Каждые 10 секунд она сводит адреса, которые видел каждый узел, и отправляет обратно, с каких адресов может подключаться каждый ограниченный пользователь.',
          '每条连接都按入站、出站和用户计数。面板每 30 秒收集一次计数。每 10 秒，它汇总各节点看到的地址，并下发每个受限用户可以从哪些地址接入。',
        ),
      },
    ],
    arrows: [
      { from: 'app', to: 'listen', flow: 'traffic', both: true },
      { from: 'listen', to: 'tls', flow: 'traffic', both: true },
      { from: 'tls', to: 'proto', flow: 'traffic', both: true },
      { from: 'proto', to: 'sniff', flow: 'traffic', both: true },
      { from: 'sniff', to: 'route', flow: 'traffic', both: true },
      { from: 'app', to: 'ep', flow: 'traffic', both: true },
      { from: 'ep', to: 'route', flow: 'traffic', both: true },
      { from: 'tin', to: 'route', flow: 'traffic', both: true },
      { from: 'route', to: 'out', flow: 'traffic', both: true },
      { from: 'out', to: 'net', flow: 'traffic', both: true },
      { from: 'out', to: 'tout', flow: 'traffic', both: true },
      { from: 'tout', to: 'net', flow: 'traffic', both: true },
      { from: 'route', to: 'panel', flow: 'control', both: true },
    ],
    tall: {
      width: 440,
      height: 716,
      boxes: {
        app: [120, 10, 190, 56],
        listen: [10, 100, 190, 56],
        ep: [220, 100, 190, 56],
        tls: [10, 190, 190, 56],
        tin: [220, 190, 190, 56],
        proto: [10, 280, 190, 56],
        panel: [220, 280, 190, 56],
        sniff: [10, 370, 190, 56],
        route: [120, 460, 190, 56],
        out: [120, 560, 190, 56],
        net: [10, 650, 190, 56],
        tout: [220, 650, 190, 56],
      },
      points: {
        6: [[410, 128], [432, 128], [432, 502], [310, 502]],
        7: [[410, 218], [422, 218], [422, 474], [310, 474]],
      },
    },
  },

  // A reverse tunnel: users on the relay, traffic out of the origins (how/tunnels).
  tunnel: {
    width: 960,
    height: 420,
    title: w(
      'Inside a tunnel',
      'درون یک تونل',
      'Внутри туннеля',
      '隧道内部',
    ),
    boxes: [
      {
        id: 'apps', x: 20, y: 150, w: 190, h: 72, kind: 'client', icon: 'mobile',
        label: w('Users’ apps', 'اپ کاربران', 'Приложения', '用户的应用'),
        sub: w('the same links as before', 'همان لینک‌های قبلی', 'те же ссылки, что и раньше', '链接不变'),
        note: w(
          'Users connect to the relay through the ordinary inbounds of its template. Nothing about their accounts or links changes when a tunnel is added.',
          'کاربران از طریق اینباندهای معمولی تمپلیت رله به آن وصل می‌شوند. با اضافه شدن تونل، چیزی در حساب‌ها یا لینک‌هایشان عوض نمی‌شود.',
          'Пользователи подключаются к ретранслятору через обычные входящие его шаблона. Когда появляется туннель, в их аккаунтах и ссылках ничего не меняется.',
          '用户通过中继节点模板里的普通入站连接它。添加隧道后，他们的账户和链接都不会变化。',
        ),
      },
      {
        id: 'relay', x: 250, y: 150, w: 190, h: 72, kind: 'node', icon: 'server',
        label: w('Relay', 'رله', 'Ретранслятор', '中继节点'),
        sub: w('users connect here', 'کاربران اینجا وصل می‌شوند', 'сюда подключаются', '用户连到这里'),
        note: w(
          'What the relay would have sent to the internet goes down the tunnel instead. The template’s rules still come first, so traffic they send direct or block never enters the tunnel. Users’ traffic is counted here, once.',
          'آنچه رله به اینترنت می‌فرستاد، به‌جای آن وارد تونل می‌شود. قانون‌های تمپلیت همچنان اول اجرا می‌شوند، پس ترافیکی که مستقیم فرستاده یا مسدود می‌کنند وارد تونل نمی‌شود. ترافیک کاربران همین‌جا و فقط یک بار شمرده می‌شود.',
          'То, что ретранслятор отправил бы в интернет, уходит в туннель. Правила шаблона по-прежнему идут первыми, поэтому трафик, который они пускают напрямую или блокируют, в туннель не попадает. Трафик пользователей считается здесь, один раз.',
          '中继原本要发往互联网的流量改走隧道。模板规则仍然优先，被规则直连或阻断的流量不会进入隧道。用户流量只在这里计一次。',
        ),
      },
      {
        id: 'o1', x: 500, y: 40, w: 190, h: 72, kind: 'node', icon: 'server',
        label: w('Origin', 'نود خروجی', 'Исходящий узел', '出口节点'),
        sub: w('exit-de', 'exit-de', 'exit-de', 'exit-de'),
        note: w(
          'Each origin keeps several links to the relay, four by default, spread over every profile of the tunnel. All of them form one pool, so a blocked protocol costs throughput, not the tunnel. In reverse mode the origin dials out and needs no open port.',
          'هر نود خروجی چند لینک به رله نگه می‌دارد (به‌طور پیش‌فرض چهار)، پخش روی همهٔ پروفایل‌های تونل. همه یک استخر واحدند، پس مسدود شدن یک پروتکل فقط از ظرفیت کم می‌کند و تونل را نمی‌خواباند. در حالت معکوس، نود خروجی خودش وصل می‌شود و به هیچ پورت بازی نیاز ندارد.',
          'Каждый исходящий узел держит несколько связей с ретранслятором, по умолчанию четыре, по всем профилям туннеля. Все они — один общий пул, поэтому блокировка одного протокола снижает пропускную способность, но не роняет туннель. В обратном режиме исходящий узел подключается сам и не требует открытого порта.',
          '每台出口节点与中继保持多条链路（默认四条），分布在隧道的所有配置档上。它们组成同一个池，所以某个协议被封只会降低吞吐，不会让隧道中断。反向模式下由出口节点主动连接，它不需要开放任何端口。',
        ),
      },
      {
        id: 'o2', x: 500, y: 260, w: 190, h: 72, kind: 'node', icon: 'server',
        label: w('Origin', 'نود خروجی', 'Исходящий узел', '出口节点'),
        sub: w('exit-nl', 'exit-nl', 'exit-nl', 'exit-nl'),
        note: w(
          'A user is pinned to one origin for as long as it is connected, so their exit address does not change from one connection to the next. When an origin is lost, only the users who were on it move to another.',
          'هر کاربر تا وقتی نود خروجی‌اش وصل است روی همان می‌ماند، پس آدرس خروجی‌اش از یک اتصال به اتصال بعد عوض نمی‌شود. اگر یک نود خروجی از دست برود، فقط کاربرانی که روی آن بودند به نود دیگری می‌روند.',
          'Пользователь закреплён за одним исходящим узлом, пока тот подключён, поэтому его внешний адрес не меняется от соединения к соединению. Если узел пропадает, на другой переходят только его пользователи.',
          '只要出口节点在线，用户就固定在这一台上，所以每次连接的出口地址都不变。某台出口节点掉线时，只有原本在它上面的用户会换到另一台。',
        ),
      },
      {
        id: 'net', x: 750, y: 150, w: 190, h: 72, kind: 'internet', icon: 'globe',
        label: w('The internet', 'اینترنت', 'Интернет', '互联网'),
        note: w(
          'Traffic leaves from the origin, through the origin’s own routing, like any traffic that arrives there. The internet sees the origin’s address.',
          'ترافیک از نود خروجی و از طریق مسیریابی خود آن خارج می‌شود، مثل هر ترافیک دیگری که به آنجا می‌رسد. اینترنت آدرس نود خروجی را می‌بیند.',
          'Трафик выходит с исходящего узла через его собственную маршрутизацию, как любой трафик, пришедший туда. Интернет видит адрес исходящего узла.',
          '流量从出口节点出网，经过出口节点自己的路由，与到达那里的其他流量一样。互联网看到的是出口节点的地址。',
        ),
      },
      {
        id: 'panel', x: 250, y: 330, w: 190, h: 72, kind: 'panel', icon: 'th-large',
        label: w('Panel', 'پنل', 'Панель', '面板'),
        sub: w('derives, never stores', 'می‌سازد، ذخیره نمی‌کند', 'вычисляет, не хранит', '推导而不存储'),
        note: w(
          'The panel derives each origin’s credential from a secret and the tunnel’s name, so there is no stored copy that could drift apart between the two ends. Membership changes reach both nodes live, and a tunnel is healthy when the relay has links.',
          'پنل اعتبارنامهٔ هر نود خروجی را از یک راز و نام تونل می‌سازد، پس هیچ نسخهٔ ذخیره‌شده‌ای نیست که میان دو سر از هم جدا شود. تغییر اعضا زنده به هر دو نود می‌رسد، و تونل وقتی سالم است که رله لینک داشته باشد.',
          'Панель вычисляет учётные данные каждого исходящего узла из секрета и имени туннеля, поэтому нет хранимой копии, которая могла бы разойтись между концами. Изменения состава доходят до обоих узлов на лету, а туннель здоров, когда у ретранслятора есть связи.',
          '面板根据一个密钥和隧道名称推导每台出口节点的凭据，所以不存在可能在两端之间不一致的存储副本。成员变化会实时送达两端节点；中继有链路时，隧道即为健康。',
        ),
      },
    ],
    arrows: [
      { from: 'apps', to: 'relay', flow: 'traffic', both: true },
      { from: 'relay', to: 'o1', flow: 'traffic', both: true },
      { from: 'relay', to: 'o2', flow: 'traffic', both: true },
      { from: 'o1', to: 'net', flow: 'traffic', both: true },
      { from: 'o2', to: 'net', flow: 'traffic', both: true },
      { from: 'panel', to: 'relay', flow: 'control', both: true },
      { from: 'panel', to: 'o2', flow: 'control', both: true },
      { from: 'panel', to: 'o1', flow: 'control', both: true, points: [[440, 388], [470, 388], [470, 92], [500, 92]] },
    ],
    tall: {
      width: 400,
      height: 460,
      boxes: {
        apps: [200, 10, 190, 64],
        relay: [200, 120, 190, 64],
        panel: [10, 120, 150, 64],
        o1: [10, 250, 180, 64],
        o2: [210, 250, 180, 64],
        net: [105, 380, 190, 64],
      },
    },
  },

  // The event bus: outbox, one delivery per subscriber, retries (how/events).
  events: {
    width: 920,
    height: 350,
    title: w(
      'How an event is delivered',
      'یک رویداد چطور تحویل داده می‌شود',
      'Как доставляется событие',
      '事件如何投递',
    ),
    boxes: [
      {
        id: 'src', x: 20, y: 150, w: 190, h: 72, kind: 'panel', icon: 'bolt',
        label: w('A change', 'یک تغییر', 'Изменение', '一次变化'),
        sub: w('a user, node, admin or the panel', 'کاربر، نود، ادمین یا خود پنل', 'пользователь, узел, админ, панель', '用户、节点、管理员或面板'),
        note: w(
          'A user reaching a limit, a node going quiet, an admin logging in, a backup finishing. Events report changes, so a state that lasts is reported once, not every minute.',
          'رسیدن کاربر به سقف، قطع شدن یک نود، ورود یک ادمین، پایان یک پشتیبان‌گیری. رویدادها تغییر را گزارش می‌کنند، پس وضعیتی که ادامه دارد یک بار گفته می‌شود، نه هر دقیقه.',
          'Пользователь достиг лимита, узел замолчал, администратор вошёл, резервная копия готова. События сообщают об изменениях, поэтому длящееся состояние сообщается один раз, а не каждую минуту.',
          '用户达到限额、节点失联、管理员登录、备份完成。事件报告的是变化，所以持续的状态只报告一次，而不是每分钟一次。',
        ),
      },
      {
        id: 'outbox', x: 250, y: 150, w: 190, h: 72, kind: 'panel', icon: 'inbox',
        label: w('Outbox', 'صندوق خروجی', 'Очередь', '发件箱'),
        sub: w('one delivery per subscriber', 'یک تحویل برای هر مشترک', 'по доставке на подписчика', '每个订阅者一次投递'),
        note: w(
          'In one database transaction the panel writes the event once, plus one delivery for each subscriber whose filter wants it. When no subscriber wants an event, nothing is written at all.',
          'پنل در یک تراکنش پایگاه داده رویداد را یک بار می‌نویسد، به‌علاوهٔ یک تحویل برای هر مشترکی که فیلترش آن را می‌خواهد. اگر هیچ مشترکی رویدادی را نخواهد، اصلاً چیزی نوشته نمی‌شود.',
          'В одной транзакции базы данных панель записывает событие один раз и по одной доставке для каждого подписчика, чей фильтр его ждёт. Если событие никому не нужно, не записывается ничего.',
          '面板在一个数据库事务中写入一次事件，并为每个筛选条件需要它的订阅者各写一条投递。没有订阅者需要时，什么都不写。',
        ),
      },
      {
        id: 'worker', x: 480, y: 150, w: 190, h: 72, kind: 'panel', icon: 'send',
        label: w('Delivery', 'تحویل', 'Доставка', '投递'),
        sub: w('in order, with retries', 'به ترتیب، با تلاش دوباره', 'по порядку, с повторами', '按顺序，可重试'),
        note: w(
          'Deliveries leave in order for each subscriber. A failed one is tried again after a growing delay, at most an hour apart, and after 10 tries it is marked dead. A subscriber is switched off only after a long failure streak that is also a day old.',
          'تحویل‌ها برای هر مشترک به ترتیب ارسال می‌شوند. تحویل ناموفق با فاصله‌ای رو به افزایش، حداکثر یک ساعت، دوباره امتحان می‌شود و بعد از ۱۰ بار مرده علامت می‌خورد. یک مشترک فقط وقتی خاموش می‌شود که رشتهٔ شکست‌هایش هم طولانی باشد و هم یک روز از آن گذشته باشد.',
          'Доставки уходят каждому подписчику по порядку. Неудачная повторяется с растущей паузой, не больше часа, а после 10 попыток помечается как мёртвая. Подписчик отключается, только если серия неудач и длинная, и длится уже сутки.',
          '每个订阅者的投递按顺序发出。失败的投递会以递增的间隔重试，间隔最长一小时，10 次后标记为失效。只有当连续失败既足够长、又已持续一天时，订阅者才会被关闭。',
        ),
      },
      {
        id: 'hook', x: 710, y: 40, w: 190, h: 72, kind: 'internet', icon: 'link',
        label: w('Webhook', 'وب‌هوک', 'Вебхук', 'Webhook'),
        sub: w('a signed POST', 'یک POST امضاشده', 'подписанный POST', '签名的 POST'),
        note: w(
          'A signed POST with a thin payload: ids and names, never a credential. The receiver checks the signature and drops repeats by the delivery id.',
          'یک POST امضاشده با محتوای کم: شناسه‌ها و نام‌ها، هرگز اعتبارنامه. گیرنده امضا را بررسی می‌کند و تکراری‌ها را با شناسهٔ تحویل کنار می‌گذارد.',
          'Подписанный POST с минимумом данных: идентификаторы и имена, никогда не учётные данные. Получатель проверяет подпись и отбрасывает повторы по идентификатору доставки.',
          '带签名的 POST，载荷很精简：只有 ID 和名称，绝不含凭据。接收方校验签名，并按投递 ID 去重。',
        ),
      },
      {
        id: 'addon', x: 710, y: 150, w: 190, h: 72, kind: 'addon', icon: 'box',
        label: w('Addon', 'افزونه', 'Дополнение', '插件'),
        sub: w('what its manifest named', 'آنچه مانیفستش خواسته', 'что указано в манифесте', '清单中声明的事件'),
        note: w(
          'An addon’s webhook belongs to its API token. It hears only the events you approved from its manifest, and nothing while it is suspended.',
          'وب‌هوک یک افزونه به توکن API آن تعلق دارد. فقط رویدادهایی را می‌شنود که از مانیفستش تأیید کرده‌اید، و تا وقتی معلق است هیچ چیز نمی‌شنود.',
          'Вебхук дополнения принадлежит его токену API. Оно получает только те события из манифеста, которые вы одобрили, и ничего, пока приостановлено.',
          '插件的 webhook 属于它的 API 令牌。它只收到你从其清单中批准的事件，被暂停期间什么也收不到。',
        ),
      },
      {
        id: 'people', x: 710, y: 260, w: 190, h: 72, kind: 'admin', icon: 'telegram',
        label: w('Telegram, email', 'تلگرام، ایمیل', 'Telegram, почта', 'Telegram、邮件'),
        sub: w('people, filtered by role', 'آدم‌ها، به تفکیک نقش', 'люди, по роли', '面向人，按角色过滤'),
        note: w(
          'A paired chat or a confirmed address is a person. It hears only what its account’s role may read, so a reseller hears about its own customers and nothing else.',
          'یک چت جفت‌شده یا یک آدرس تأییدشده یک آدم است. فقط چیزی را می‌شنود که نقش حسابش اجازهٔ خواندنش را دارد، پس یک نماینده فقط دربارهٔ مشتریان خودش می‌شنود.',
          'Привязанный чат или подтверждённый адрес — это человек. Он получает только то, что может читать роль его аккаунта, поэтому реселлер слышит только о своих клиентах.',
          '已配对的聊天或已确认的邮箱代表一个人。它只收到其账户角色可读的内容，所以代理商只会收到关于自己客户的通知。',
        ),
      },
    ],
    arrows: [
      { from: 'src', to: 'outbox', flow: 'events' },
      { from: 'outbox', to: 'worker', flow: 'events' },
      { from: 'worker', to: 'hook', flow: 'events' },
      { from: 'worker', to: 'addon', flow: 'events' },
      { from: 'worker', to: 'people', flow: 'events' },
    ],
    tall: {
      width: 400,
      height: 420,
      boxes: {
        src: [105, 10, 190, 64],
        outbox: [105, 110, 190, 64],
        worker: [105, 210, 190, 64],
        hook: [6, 320, 124, 84],
        addon: [138, 320, 124, 84],
        people: [270, 320, 124, 84],
      },
    },
  },
}
