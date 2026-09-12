# Gastrozony — оригинальное задание

**Источник:** email от Daniel Kokeš <daniel.kokes@gmail.com>, 27.08.2026 17:13
**XD макет:** https://xd.adobe.com/view/3c6d2321-bb64-4f48-bbdd-dedf589c9998-693e/?hints=off
**Референс-проект:** https://burgerstreetfestival.cz/registrace (код в `D:\burger`)

## Struktura webu (дословно из письма)

### Homepage
komponenty jsou hotové, design schválen. Claude dopracuje zbytek, response, hovery,
věci co chybí. Například footer. Ale prostě to bude pár sloupců a odkazy, sociální sítě atd.

### Stránka obecná šablona
- nadpis
- perex
- CTA
- text
- galerie
- (možnost poskládat dynamický komponenty v adminu)

### Přehled akcí
- stejný výpis jako na HP, akorát jich bude více
- již ukončeno — třeba černobíle pod nadpisem

### Detail akce
- název
- datum začátku – datum ukončení
- místo
- popis (text)
- galerie

### Přihláška pro pořadatele
- stejný form a funkce jako BSF (https://burgerstreetfestival.cz/registrace)
- vybereš akci
- pak klasický formulář
- napojit na Resend — odešle se potvrzení a kopie

### Kontakt (možná by stačilo použít obecnou šablonu)
- telefon a mail
- tým: fotky, kontakty
- podobné jako BSF

### V rámci adminu bude potřeba řešit
- navigace header
- navigace footer
- databáze přihlášek

### Nice to have
- animace pizz a burgerů + žluté fleky
- žluté fleky pod nadpisem v adminu jako markdown `**` (co bude mezi hvězdičkou bude flek)
- komponenta odebírat newsletter, napojená na Ecomail (bude vždy nad patou)

## Что видно на макете (скриншоты HP)

**Header:** logo GASTROZONY (жёлтый круг + текст) на чёрном фоне.
Nav: Akce | Info | Kontakt | Pro prodejce | Pro pořadatele | [Přihláška] (жёлтая кнопка)

**Hero:** H1 "Gastrozóny pro každou příležitost" (жёлтые fleky за словами),
перекс, 2 CTA ("Přihlásit se na akci" — жёлтая, "Jak to funguje" — белая с обводкой),
вырезанные PNG бургеров/пиццы/фри на жёлтых размытых пятнах.

**Stats:** 120+ Odbavených akcí | 8 let Na festivalové scéně | 50K Nakrmených hostů ročně
(жёлтая вертикальная черта слева от числа)

**Sekce "Dodáme jídlo i nápoje pro vaše akce"** (серый фон, волнистые границы сверху/снизу):
2-колоночный интро (H2 слева + 2 абзаца справа), 3 карточки с номерами 01/02/03
в жёлтых кружках.

**"Stavíme pro:"** — ряд тегов-пилюль в рамке: Festivaly, Dětské dny, Teambuildingy,
Konference, Svatby.

**Sekce "Jsme tu pro náročné klienty"** (белый фон): текст + CTA "Kontaktujte nás" слева,
сетка логотипов клиентов справа (Pilsner Fest, Burger Arena, Burger Street Festival,
HIP HOP ŽIJE) + надпись "a další…" на жёлтом пятне.

**Sekce "Aktuální akce"** (ЧЁРНЫЙ фон, волнистые границы): H2 + описание справа,
3 карточки акций (фото + бейдж статуса "Aktuální" / "Připravujeme" в левом верхнем углу,
заголовок, перекс), кнопка "Všechny akce".

**Newsletter** (ЖЁЛТЫЙ фон, волнистая граница сверху): H2 "Nezmeškejte žádnou akci" + текст
слева, белая карточка с полем e-mail + кнопка "Odebírat" + чекбокс GDPR справа.
Декоративные PNG пиццы/бургера по углам.

**Footer** — в макете отсутствует, надо спроектировать.

## Ссылки XD

- View: https://xd.adobe.com/view/3c6d2321-bb64-4f48-bbdd-dedf589c9998-693e/?hints=off
- **Specs (цвета, шрифты, размеры): https://xd.adobe.com/view/3c6d2321-bb64-4f48-bbdd-dedf589c9998-693e/specs/?hints=off**
