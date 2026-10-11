// The words of the animated tunnel scenes (<NxTunnel scene="…" />), in every
// language. The pictures themselves are drawn by NxTunnel.vue; this file says
// what each step of each scene means. A step's text can differ by the scene's
// switch (reverse/direct, spread/priority), keyed by the switch's value.

import type { Words } from './diagrams'

const w = (en: string, fa: string, ru: string, zh: string): Words => ({ en, fa, ru, zh })

export interface Step {
  // Seconds the step lasts while playing.
  dur: number
  title: Words | Record<string, Words>
  text: Words | Record<string, Words>
}

export interface Scene {
  title: Words
  // The scene's switch: its values, in order; the first is the default.
  modes?: string[]
  steps: Step[]
}

export const UI = {
  play: w('Play', 'پخش', 'Воспроизвести', '播放'),
  pause: w('Pause', 'توقف', 'Пауза', '暂停'),
  restart: w('Start again', 'از اول', 'Сначала', '从头开始'),
  step: w('Step', 'گام', 'Шаг', '步骤'),
  reverse: w('Reverse', 'معکوس', 'Обратный', '反向'),
  direct: w('Direct', 'مستقیم', 'Прямой', '正向'),
  spread: w('Spread', 'پخش', 'Распределение', '分摊'),
  priority: w('Priority', 'اولویت', 'Приоритет', '优先级'),
  // Labels inside the pictures.
  panel: w('Panel', 'پنل', 'Панель', '面板'),
  apps: w('Users’ apps', 'اپ کاربران', 'Приложения', '用户的应用'),
  relay: w('Relay', 'رله', 'Ретранслятор', '中继节点'),
  origin: w('Origin', 'نود خروجی', 'Исходящий узел', '出口节点'),
  internet: w('The internet', 'اینترنت', 'Интернет', '互联网'),
  inbound: w('users’ inbound', 'اینباند کاربران', 'вход пользователей', '用户入站'),
  tunnelPort: w('tunnel port', 'پورت تونل', 'порт туннеля', '隧道端口'),
  noPort: w('no open port', 'بدون پورت باز', 'без открытых портов', '无开放端口'),
  relayHalf: w('half: an outbound', 'نیمه: یک اوت‌باند', 'половина: исходящее', '一半:出站'),
  originHalf: w('half: a way in', 'نیمه: یک ورودی', 'половина: вход', '一半:入口'),
  dial: w('dials, with a credential', 'وصل می‌شود، با اعتبارنامه', 'подключается с учётными данными', '主动连接,附带凭据'),
  stream: w('a stream per connection', 'یک استریم برای هر اتصال', 'поток на каждое соединение', '每个连接一条流'),
  sees: w('sees the origin', 'نود خروجی را می‌بیند', 'видит исходящий узел', '看到的是出口节点'),
  pool: w('one pool', 'یک استخر', 'один пул', '同一个池'),
  carrying: w('links carrying traffic', 'لینک‌های حامل ترافیک', 'связей несут трафик', '承载流量的链路'),
  blocked: w('blocked', 'مسدود', 'заблокирован', '被封锁'),
  standby: w('standby', 'آماده‌به‌کار', 'в резерве', '待命'),
  retry: w('retry after 1 s, 2 s, 4 s … 60 s', 'تلاش دوباره پس از ۱، ۲، ۴ … ۶۰ ثانیه', 'повтор через 1, 2, 4 … 60 с', '1、2、4 … 60 秒后重试'),
  exit: w('exit', 'خروجی', 'выход', '出口'),
  unchanged: w('exit unchanged', 'خروجی تغییر نکرد', 'выход не изменился', '出口不变'),
  lost: w('lost', 'قطع', 'потерян', '掉线'),
  sameExit: w('same exit', 'همان خروجی', 'тот же выход', '同一出口'),
}

export const SCENES: Record<string, Scene> = {
  // Who dials whom, and which way the traffic flows anyway (use/tunnels,
  // how/tunnels).
  modes: {
    title: w('A tunnel, step by step', 'تونل، گام‌به‌گام', 'Туннель шаг за шагом', '隧道,逐步演示'),
    modes: ['reverse', 'direct'],
    steps: [
      {
        dur: 3.5,
        title: w('The panel sends the halves', 'پنل دو نیمه را می‌فرستد', 'Панель отправляет половины', '面板下发两端'),
        text: w(
          'The panel sends one half to each node: an outbound on the relay, a way in on the origin. Neither touches the users, inbounds or rules already on the node.',
          'پنل به هر نود یک نیمه می‌فرستد: یک اوت‌باند روی رله و یک ورودی روی نود خروجی. هیچ‌کدام به کاربران، اینباندها یا قانون‌هایی که روی نود هست دست نمی‌زند.',
          'Панель отправляет каждому узлу по половине: исходящее на ретранслятор и вход на исходящий узел. Ни одна не трогает пользователей, входящие и правила, которые уже есть на узле.',
          '面板给每个节点各发一半:中继上是一个出站,出口节点上是一个入口。两者都不会改动节点上已有的用户、入站和规则。',
        ),
      },
      {
        dur: 4.5,
        title: {
          reverse: w('The origin dials in', 'نود خروجی به رله وصل می‌شود', 'Исходящий узел подключается сам', '出口节点主动连入'),
          direct: w('The relay dials out', 'رله به نود خروجی وصل می‌شود', 'Ретранслятор подключается сам', '中继主动连出'),
        },
        text: {
          reverse: w(
            'In reverse mode the origin dials the relay’s tunnel port and keeps four links open, each one proving itself with a credential the panel derived. The origin opens no port, so it can sit behind NAT.',
            'در حالت معکوس، نود خروجی به پورت تونل رله وصل می‌شود و چهار لینک را باز نگه می‌دارد؛ هر لینک خودش را با اعتبارنامه‌ای که پنل ساخته معرفی می‌کند. نود خروجی هیچ پورتی باز نمی‌کند، پس می‌تواند پشت NAT باشد.',
            'В обратном режиме исходящий узел подключается к порту туннеля на ретрансляторе и держит четыре связи, каждая подтверждает себя учётными данными, которые вычислила панель. Исходящий узел не открывает портов и может стоять за NAT.',
            '反向模式下,出口节点连接中继的隧道端口,并保持四条链路,每条都用面板推导出的凭据证明自己。出口节点不开放任何端口,因此可以位于 NAT 之后。',
          ),
          direct: w(
            'In direct mode the relay dials the tunnel port on each origin and keeps four links open. Every origin needs that port open, so this mode does not work behind NAT.',
            'در حالت مستقیم، رله به پورت تونل هر نود خروجی وصل می‌شود و چهار لینک را باز نگه می‌دارد. همهٔ نودهای خروجی باید این پورت را باز داشته باشند، پس این حالت پشت NAT کار نمی‌کند.',
            'В прямом режиме ретранслятор подключается к порту туннеля на каждом исходящем узле и держит четыре связи. Этот порт должен быть открыт на каждом исходящем узле, поэтому за NAT режим не работает.',
            '正向模式下,中继连接每台出口节点的隧道端口,并保持四条链路。每台出口节点都必须开放该端口,所以此模式在 NAT 之后无法工作。',
          ),
        },
      },
      {
        dur: 3,
        title: w('A user connects', 'یک کاربر وصل می‌شود', 'Подключается пользователь', '用户连接'),
        text: w(
          'A user connects to the relay’s ordinary inbound, with the same link as before. The tunnel’s port is a listener of its own; users never see it.',
          'کاربر با همان لینک قبلی به اینباند معمولی رله وصل می‌شود. پورت تونل شنوندهٔ جداگانه‌ای است و کاربران هرگز آن را نمی‌بینند.',
          'Пользователь подключается к обычному входящему ретранслятора по той же ссылке, что и раньше. Порт туннеля — отдельный слушатель, пользователи его не видят.',
          '用户用原来的链接连接中继的普通入站。隧道端口是独立的监听,用户永远看不到它。',
        ),
      },
      {
        dur: 5,
        title: w('A stream per connection', 'یک استریم برای هر اتصال', 'Поток на каждое соединение', '每个连接一条流'),
        text: w(
          'The relay opens a stream for that connection inside one of the links, and the origin hands it to its own routing. Streams always run from the relay to the origin, whichever side dialed the link.',
          'رله برای آن اتصال یک استریم درون یکی از لینک‌ها باز می‌کند و نود خروجی آن را به مسیریابی خودش می‌سپارد. استریم‌ها همیشه از رله به نود خروجی می‌روند، مهم نیست کدام طرف لینک را ساخته است.',
          'Ретранслятор открывает для этого соединения поток внутри одной из связей, а исходящий узел передаёт его своей маршрутизации. Потоки всегда идут от ретранслятора к исходящему узлу, независимо от того, кто установил связь.',
          '中继在其中一条链路里为该连接打开一条流,出口节点把它交给自己的路由。无论链路是哪一端建立的,流总是从中继流向出口节点。',
        ),
      },
      {
        dur: 3.5,
        title: w('The exit is the origin', 'خروجی، نود خروجی است', 'Выход — исходящий узел', '出口是出口节点'),
        text: w(
          'The connection leaves for the internet from the origin, so sites see the origin’s address. The user’s traffic was counted once, on the relay.',
          'اتصال از نود خروجی به اینترنت می‌رود، پس سایت‌ها آدرس نود خروجی را می‌بینند. ترافیک کاربر یک بار و روی رله شمرده شده است.',
          'Соединение выходит в интернет с исходящего узла, поэтому сайты видят его адрес. Трафик пользователя посчитан один раз, на ретрансляторе.',
          '连接从出口节点进入互联网,所以网站看到的是出口节点的地址。用户流量只在中继上计了一次。',
        ),
      },
    ],
  },

  // Several profiles, one pool: what a block costs (use/tunnels, how/tunnels).
  pool: {
    title: w('Profiles share one pool', 'پروفایل‌ها یک استخر مشترک دارند', 'Профили делят один пул', '配置档共用一个池'),
    modes: ['spread', 'priority'],
    steps: [
      {
        dur: 4,
        title: w('Links over every profile', 'لینک روی همهٔ پروفایل‌ها', 'Связи по всем профилям', '每个配置档都有链路'),
        text: w(
          'The origin dials both profiles of the tunnel, REALITY on one port and WebSocket on another. Every link joins one pool, under the same origin.',
          'نود خروجی به هر دو پروفایل تونل وصل می‌شود: REALITY روی یک پورت و WebSocket روی پورتی دیگر. همهٔ لینک‌ها، زیر همان نود خروجی، در یک استخر جمع می‌شوند.',
          'Исходящий узел подключается к обоим профилям туннеля: REALITY на одном порту и WebSocket на другом. Все связи попадают в один пул одного и того же исходящего узла.',
          '出口节点连接隧道的两个配置档:一个端口上是 REALITY,另一个端口上是 WebSocket。所有链路都归入同一出口节点下的同一个池。',
        ),
      },
      {
        dur: 4.5,
        title: { spread: w('Spread', 'پخش', 'Распределение', '分摊'), priority: w('Priority', 'اولویت', 'Приоритет', '优先级') },
        text: {
          spread: w(
            'With Spread, each new connection takes the least busy link of any connected profile, so both profiles carry traffic.',
            'در حالت پخش، هر اتصال تازه کم‌مشغله‌ترین لینکِ هر پروفایل وصلی را می‌گیرد، پس هر دو پروفایل ترافیک می‌برند.',
            'В режиме «Распределение» каждое новое соединение берёт наименее загруженную связь любого подключённого профиля, поэтому трафик несут оба профиля.',
            '分摊模式下,每个新连接都选用任一已连接配置档中最空闲的链路,因此两个配置档都承载流量。',
          ),
          priority: w(
            'With Priority, everything goes over the first profile in the list. The second stays connected and idle, as a fallback.',
            'در حالت اولویت، همه چیز از اولین پروفایل فهرست می‌رود. دومی وصل و بیکار می‌ماند تا جایگزین باشد.',
            'В режиме «Приоритет» всё идёт через первый профиль в списке. Второй остаётся подключённым и простаивает как запасной.',
            '优先级模式下,所有流量都走列表中的第一个配置档。第二个保持连接但空闲,作为备用。',
          ),
        },
      },
      {
        dur: 3,
        title: w('A protocol is blocked', 'یک پروتکل مسدود می‌شود', 'Протокол заблокирован', '某个协议被封锁'),
        text: {
          spread: w(
            'WebSocket is blocked somewhere on the path, and its two links drop.',
            'WebSocket جایی در مسیر مسدود می‌شود و دو لینکش قطع می‌شوند.',
            'Где-то на пути блокируют WebSocket, и две его связи обрываются.',
            '路径上某处封锁了 WebSocket,它的两条链路断开。',
          ),
          priority: w(
            'REALITY is blocked somewhere on the path, and its two links drop.',
            'REALITY جایی در مسیر مسدود می‌شود و دو لینکش قطع می‌شوند.',
            'Где-то на пути блокируют REALITY, и две его связи обрываются.',
            '路径上某处封锁了 REALITY,它的两条链路断开。',
          ),
        },
      },
      {
        dur: 4.5,
        title: {
          spread: w('Throughput, not the tunnel', 'ظرفیت کم شد، نه تونل', 'Теряется скорость, а не туннель', '损失的是吞吐,不是隧道'),
          priority: w('The fallback takes over', 'جایگزین وارد کار می‌شود', 'Включается запасной', '备用接管'),
        },
        text: {
          spread: w(
            'The REALITY links carry everything. The tunnel has lost the blocked profile’s share and keeps working, and no user’s exit address changes.',
            'لینک‌های REALITY همه چیز را می‌برند. تونل سهم پروفایل مسدودشده را از دست داده ولی کار می‌کند، و آدرس خروجی هیچ کاربری عوض نمی‌شود.',
            'Связи REALITY несут весь трафик. Туннель потерял долю заблокированного профиля, но работает, и внешний адрес ни одного пользователя не меняется.',
            'REALITY 链路承载全部流量。隧道失去了被封配置档的那部分容量,但仍在工作,任何用户的出口地址都没有变化。',
          ),
          priority: w(
            'With the first profile gone, the next one in the list carries everything. No user’s exit address changes.',
            'با رفتن پروفایل اول، پروفایل بعدی فهرست همه چیز را می‌برد. آدرس خروجی هیچ کاربری عوض نمی‌شود.',
            'Когда первого профиля нет, весь трафик несёт следующий в списке. Внешний адрес ни одного пользователя не меняется.',
            '第一个配置档失效后,列表中的下一个承载全部流量。任何用户的出口地址都没有变化。',
          ),
        },
      },
      {
        dur: 5,
        title: w('Retrying with backoff', 'تلاش دوباره با فاصلهٔ فزاینده', 'Повторы с нарастающей паузой', '退避重试'),
        text: w(
          'The dialing side keeps trying the blocked profile, waiting longer each time, up to a minute. When the block lifts, its links return to the pool; Reset retries at once.',
          'طرفی که وصل می‌شود پروفایل مسدود را مدام دوباره امتحان می‌کند و هر بار بیشتر صبر می‌کند، تا یک دقیقه. وقتی مسدودی برداشته شود، لینک‌هایش به استخر برمی‌گردند؛ Reset همان لحظه دوباره امتحان می‌کند.',
          'Подключающаяся сторона продолжает пробовать заблокированный профиль, каждый раз ждёт дольше, до минуты. Когда блокировку снимут, его связи вернутся в пул; Reset пробует сразу.',
          '发起连接的一端会不断重试被封的配置档,每次等待更久,最长一分钟。封锁解除后,它的链路回到池中;Reset 会立即重试。',
        ),
      },
    ],
  },

  // How a user keeps the same exit (how/tunnels).
  sticky: {
    title: w('A user sticks to one origin', 'هر کاربر روی یک نود خروجی می‌ماند', 'Пользователь закреплён за одним узлом', '用户固定在一台出口节点'),
    steps: [
      {
        dur: 5.5,
        title: w('Each user has an origin', 'هر کاربر یک نود خروجی دارد', 'У каждого пользователя свой узел', '每个用户都有自己的出口节点'),
        text: w(
          'The relay picks the origin from the user’s name. Six users spread over three origins, and each one always lands on the same origin.',
          'رله نود خروجی را از روی نام کاربر انتخاب می‌کند. شش کاربر روی سه نود خروجی پخش می‌شوند و هر کدام همیشه به همان نود می‌رسد.',
          'Ретранслятор выбирает исходящий узел по имени пользователя. Шесть пользователей распределяются по трём узлам, и каждый всегда попадает на один и тот же.',
          '中继根据用户名选择出口节点。六个用户分布在三台出口节点上,每个用户总是落在同一台。',
        ),
      },
      {
        dur: 3.5,
        title: w('Same user, same exit', 'همان کاربر، همان خروجی', 'Тот же пользователь — тот же выход', '同一用户,同一出口'),
        text: w(
          'When A and B connect again, they reach the same origins as before. Their exit addresses do not change between connections, so sites do not log them out or ask for a CAPTCHA.',
          'وقتی A و B دوباره وصل می‌شوند، به همان نودهای خروجی قبلی می‌رسند. آدرس خروجی‌شان بین اتصال‌ها عوض نمی‌شود، پس سایت‌ها آن‌ها را بیرون نمی‌اندازند و CAPTCHA نمی‌خواهند.',
          'Когда A и B подключаются снова, они попадают на те же узлы. Их внешние адреса не меняются между соединениями, поэтому сайты не разлогинивают их и не просят CAPTCHA.',
          'A 和 B 再次连接时,仍到达之前的出口节点。他们的出口地址在多次连接之间不变,网站不会让他们掉线,也不会要求验证码。',
        ),
      },
      {
        dur: 2.5,
        title: w('An origin is lost', 'یک نود خروجی قطع می‌شود', 'Узел пропадает', '一台出口节点掉线'),
        text: w(
          'exit-nl stops answering, and its links drop.',
          'exit-nl دیگر جواب نمی‌دهد و لینک‌هایش قطع می‌شوند.',
          'exit-nl перестаёт отвечать, и его связи обрываются.',
          'exit-nl 不再响应,它的链路断开。',
        ),
      },
      {
        dur: 4,
        title: w('Only its users move', 'فقط کاربران همان نود جابه‌جا می‌شوند', 'Переходят только его пользователи', '只有它的用户迁移'),
        text: w(
          'B and E, who were on exit-nl, move to the origins that are left. Everyone else stays where they were.',
          'B و E که روی exit-nl بودند به نودهای خروجی باقی‌مانده می‌روند. بقیه همان‌جا که بودند می‌مانند.',
          'B и E, которые были на exit-nl, переходят на оставшиеся узлы. Все остальные остаются на месте.',
          '原本在 exit-nl 上的 B 和 E 迁移到剩下的出口节点,其他人都留在原处。',
        ),
      },
      {
        dur: 4,
        title: w('It comes back', 'برمی‌گردد', 'Узел возвращается', '它恢复了'),
        text: w(
          'When exit-nl is connected again, B and E return to it and every user is on their own origin again. Losing a profile never moves anyone; only losing a whole origin does.',
          'وقتی exit-nl دوباره وصل شود، B و E به آن برمی‌گردند و هر کاربر دوباره روی نود خروجی خودش است. از دست رفتن یک پروفایل هیچ‌کس را جابه‌جا نمی‌کند؛ فقط از دست رفتن کل یک نود خروجی.',
          'Когда exit-nl снова подключён, B и E возвращаются на него, и каждый пользователь снова на своём узле. Потеря профиля никого не перемещает — только потеря всего узла.',
          'exit-nl 重新连上后,B 和 E 回到它上面,每个用户又回到了自己的出口节点。失去一个配置档不会让任何人迁移,只有整台出口节点掉线才会。',
        ),
      },
    ],
  },
}
