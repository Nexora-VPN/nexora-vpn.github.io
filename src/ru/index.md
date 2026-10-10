---
layout: home
title: "Документация Nexora"
hero:
  name: "Nexora"
  text: "Управляйте своим VPN-флотом из одной панели."
  tagline: "Собственная панель управления и узлы: все основные протоколы, пользователи и тарифы, туннели, подписки и дополнения."
  image:
    src: /nexora-mark.png
    alt: Nexora
  actions:
    - theme: brand
      text: "Релизы"
      link: https://github.com/Nexora-VPN/panel/releases
    - theme: alt
      text: "nexora-panel.org"
      link: https://nexora-panel.org
features:
  - icon: '<i class="pi pi-server"></i>'
    title: "Одна панель — весь флот"
    details: "Узлы, шаблоны, пользователи и тарифы управляются в одном месте; всё, что обслуживает узел, он получает от панели."
  - icon: '<i class="pi pi-bolt"></i>'
    title: "Изменения на лету"
    details: "Изменение сразу доходит до затронутых узлов, по одному элементу, без перезапуска."
  - icon: '<i class="pi pi-shield"></i>'
    title: "Безопасность по умолчанию"
    details: "Взаимный TLS между панелью и узлами, двухфакторный вход, роли и API-токены с правами, полный журнал изменений."
  - icon: '<i class="pi pi-sitemap"></i>'
    title: "Туннели между узлами"
    details: "Обратные туннели переносят трафик от ретранслятора к исходным узлам сразу по нескольким портам и протоколам."
  - icon: '<i class="pi pi-arrow-right-arrow-left"></i>'
    title: "Переезд с другой панели"
    details: "nexora-migrate переносит пользователей, инбаунды и настройки из восьми других панелей."
  - icon: '<i class="pi pi-th-large"></i>'
    title: "Дополнения"
    details: "Отдельные программы, подключаемые к панели: магазин для продажи тарифов, уведомления клиентам или ваше собственное."
---

<div class="nx-shot">
  <img class="nx-light" src="/img/dashboard-light.webp" alt="Панель Nexora: пользователи, узлы, трафик и состояние каждого узла" width="1440" height="750">
  <img class="nx-dark" src="/img/dashboard-dark.webp" alt="Панель Nexora: пользователи, узлы, трафик и состояние каждого узла" width="1440" height="750">
</div>

<p class="nx-section-title">Поддерживаемые протоколы</p>
<div class="nx-protocols">
  <span>VLESS</span>
  <span>VMess</span>
  <span>Trojan</span>
  <span>Shadowsocks</span>
  <span>Hysteria</span>
  <span>Hysteria2</span>
  <span>TUIC</span>
  <span>NaiveProxy</span>
  <span>ShadowTLS</span>
  <span>AnyTLS</span>
  <span>Mieru</span>
  <span>Snell</span>
  <span>MTProxy</span>
  <span>SSH</span>
  <span>TrustTunnel</span>
  <span>Sudoku</span>
  <span>SOCKS</span>
  <span>HTTP</span>
  <span>WireGuard</span>
  <span>Tailscale</span>
  <span>OpenVPN</span>
  <span>OpenConnect</span>
</div>
