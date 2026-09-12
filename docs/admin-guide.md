# Gastrozóny — návod pro správu webu

Tento návod popisuje, jak spravovat obsah webu **gastrozony.cz**: akce, články, texty stránek, formulář přihlášky
a přihlášky prodejců. Obsah se upravuje v administraci **Strapi**, přihlášky se prohlížejí a exportují na stránce
**/sprava/prihlasky**.

> Rozhraní Strapi je v češtině. Několik systémových názvů zůstává anglicky, protože je Strapi nepřekládá:
> *Content Manager*, *Collection Types*, *Single Types*, záložky *Draft* / *Published* a obsah knihovny médií.
> Jazyk si můžete přepnout vpravo nahoře přes svůj profil (**Profil → Jazyk rozhraní**).

---

## 1. Než začnete

### Přihlášení
- **Administrace obsahu:** `https://gastrozony.cz/admin` — e-mail a heslo vašeho účtu ve Strapi.
- **Přehled přihlášek:** `https://gastrozony.cz/sprava/prihlasky` — samostatné jméno a heslo (dostanete od vývojáře, nejsou totožné s účtem ve Strapi).

### Kde co najdete
V levém menu Strapi otevřete **Content Manager** (správce obsahu). Obsah je rozdělený do dvou skupin:

| Skupina | Co to je | Příklady |
|---|---|---|
| **Collection types** (seznamy) | Položek může být libovolně mnoho | Akce, Články, Stránka, Formulář, Přihláška, Člen týmu, Logo klienta |
| **Single types** (jednotlivé stránky) | Existuje jen jedna | Domovská stránka, Globální nastavení, Navigace, Newsletter, Stránka přihlášky, Výpis akcí, Blog, Kontakt, Cookies lišta |

### Uložit × Publikovat
Většina obsahu má dva kroky:
1. **Uložit** — uloží rozpracovanou verzi (koncept). Na webu se **neobjeví**.
2. **Publikovat** — zveřejní ji na webu.

Po každé úpravě tedy klikněte na **Publikovat** (u již zveřejněné položky se tlačítko po změně znovu aktivuje).

Bez publikování — změna platí hned po **Uložit**: *Globální nastavení, Navigace, Newsletter, Cookies lišta* a *Přihlášky*.

### Kdy se změna projeví
Web si obsah na chvíli pamatuje, aby byl rychlý:
- stránky, akce, články, formulář — **do 1 minuty**,
- patička, hlavička, kontakty z Globálního nastavení, cookies lišta — **do 5 minut**,
- mapa webu pro vyhledávače (sitemap) — do 1 hodiny.

Když změnu nevidíte, počkejte a obnovte stránku (F5).

---

## 2. Akce

**Content Manager → Akce → Vytvořit nový záznam** nebo klik na existující akci.

| Pole | K čemu slouží |
|---|---|
| **Název akce** | Název akce (karta, detail, přihláška). |
| **URL adresa (slug)** | Adresa stránky: `gastrozony.cz/akce/<slug>`. Vyplní se sama z názvu. **Po zveřejnění ji neměňte** — rozbily by se odkazy. |
| **Perex** | Krátký popis na kartě (max. ~5 řádků) a v úvodu detailu. |
| **Obsah** | Hlavní text detailu (formátování viz [Markdown](#13-tahák-formátování-markdown)). |
| **Místo** | Místo, např. „Wannieck Gallery, Brno“. |
| **Datum od / Datum do** | Termín. U jednodenní akce stačí **Datum od**. |
| **Hlavní obrázek** | Obálka (karta i detail). Poměr **4 : 3**, šířka alespoň 1300 px. |
| **Galerie** | Fotky pod detailem akce (otevírají se po kliknutí). |
| **Přihlášky otevřené** | Zapnuto = u akce je tlačítko **Přihlásit se na tuto akci** a akce je v nabídce formuláře přihlášky. |
| **Stav kapacity** | Volitelně: *Volná místa / Poslední volná místa / Obsazeno / Přijímáme náhradníky*. |
| **Odkaz na Google Maps** | Odkaz na Google Mapy (zobrazí se jako „Zobrazit na mapě“). |
| **Stav akce (ruční nastavení)** | Ruční přepnutí stavu — obvykle nechte prázdné (viz níže). |
| **Zvýraznit na úvodní stránce** | Akce se přednostně nabídne v bloku akcí na úvodní stránce. |
| **Pořadí** | Pořadí akcí se stejným datem začátku (menší číslo = dřív). |
| **SEO** | Viz [SEO](#12-seo--jak-se-stránka-zobrazí-ve-vyhledávači-a-na-sociálních-sítích). |

### Stav akce se počítá sám
Podle data (pražský čas):
- **Připravujeme** — akce ještě nezačala (šedý štítek),
- **Aktuální** — akce právě probíhá (žlutý štítek),
- **Proběhlé** — po skončení (karta černobílá, akce je v záložce „Proběhlé“ na /akce, přihlásit se na ni nelze).

Pole **Stav akce (ruční nastavení)** stav přebije — použijte ho jen výjimečně (např. akce zrušená před termínem → „ukonceno“).

Na úvodní stránce se zobrazují nejbližší akce: nejdřív aktuální, pak připravované.

### Uzavření přihlášek
Vypněte **Přihlášky otevřené** a publikujte. Tlačítko přihlášky zmizí a akce se přestane nabízet ve formuláři.
Pokud nemá žádná akce otevřené přihlášky, formulář se skryje a místo něj se zobrazí text z
*Stránka přihlášky → Text, když nejsou žádné akce*.

---

## 3. Články (Novinky)

**Content Manager → Články → Vytvořit nový záznam.**

- **Titulek**, **URL adresa (slug)** — jako u akcí (`gastrozony.cz/novinky/<slug>`, slug po zveřejnění neměňte).
- **Datum** — datum na kartě; články se řadí od nejnovějšího. **Když ho necháte prázdné, doplní se dnešní datum.**
- **Perex** — krátký text na kartě a pod nadpisem.
- **Hlavní obrázek** — obálka, poměr **4 : 3** (na detailu se zobrazí širší výřez — hlavní motiv dejte doprostřed).
- **Obsah** — text článku ([Markdown](#13-tahák-formátování-markdown)).

Výpis na **/novinky** má 9 článků na stránku; pod každým článkem se nabízejí 3 další.
Úvodní texty výpisu (nadpis, perex, popisky tlačítek) jsou v **Single types → Blog**.

---

## 4. Formulář přihlášky

Pole formuláře na **/prihlaska** se nastavují v adminu — web je nemusí znát předem.

**Content Manager → Formulář → Přihláška prodejce** (klíč `prodejce`).

### Typy polí (sekce *Pole formuláře*, tlačítko **Přidat komponent do Pole formuláře**)

| Komponenta | Na webu | Důležitá nastavení |
|---|---|---|
| **Textové pole** | Jednořádkové pole nebo velké pole na zprávu | **Typ pole**: text, e-mail, telefon, číslo, web, `textarea` (víceřádkové). **Šířka pole**: `half` = půl řádku, `full` = celý řádek |
| **Výběr (select)** | Rozbalovací seznam; se zapnutým **Více možností** = zaškrtávací štítky | **Možnosti** — položky výběru (**Nedostupné** = zobrazí se, ale nejde vybrat) |
| **Přepínače (radio)** | Štítky, lze vybrat jeden | **Možnosti** |
| **Zaškrtávátko** | Jedno políčko (např. další souhlas) | **Popisek** může obsahovat odkaz (Markdown) |
| **Nahrání souboru** | Tlačítko + přetažení souborů | **Více souborů** = až 3 soubory. Povolené jsou **jen obrázky (JPG, PNG, WebP, HEIC) a PDF, max. 10 MB** — jiné typy web odmítne, i když je uvedete v **Povolené typy souborů**. |

Společná nastavení:
- **Popisek** — popisek pole, **Nápověda pod polem** — nápověda, **Placeholder** — šedý vzor v prázdném poli,
- **Povinné** — povinné pole (na webu s hvězdičkou),
- **Chybová zpráva** — vlastní chybová hláška (když je prázdná, použije se obecná česká).

### ⚠ Pole **Klíč pole (name)** — pozor
Je to interní klíč pole. Pod ním se ukládají odpovědi a podle něj vznikají sloupce v tabulce přihlášek a v CSV.
- Jen **písmena bez diakritiky, číslice, `_` a `-`**, začínat písmenem (např. `standSize`, `prikon`).
- Každé pole musí mít **jiný** klíč. Nezačínejte `gz_` (vyhrazeno pro systém).
- Pole s neplatným nebo zdvojeným klíčem web **přeskočí** (ve formuláři se nezobrazí).
- **U existujícího pole klíč neměňte.** Staré přihlášky zůstanou pod starým klíčem a v tabulce se objeví jako samostatný sloupec na konci.

Pořadí polí na webu = pořadí v adminu (přetažením za úchyt vlevo).
**Vyžaduje výběr akce** = výběr akce je povinný. Souhlas se zpracováním údajů je v sekci **Souhlas (GDPR)**
(text může obsahovat odkaz).

Po úpravě formuláře klikněte na **Publikovat**.

Texty kolem formuláře (nadpis, úvod, text po odeslání, chybové hlášky…) jsou v **Single types → Stránka přihlášky**.
Odkaz s předvybranou akcí: `gastrozony.cz/prihlaska?akce=<slug-akce>` (tlačítko na detailu akce ho používá samo).

---

## 5. Přihlášky prodejců

### Přehled a export — /sprava/prihlasky
1. Otevřete `https://gastrozony.cz/sprava/prihlasky` a přihlaste se (jméno a heslo pro správu).
2. Nahoře můžete filtrovat podle **akce** a **stavu** → **Filtrovat**.
3. **Exportovat CSV** stáhne všechny přihlášky odpovídající filtru. Soubor se otevře přímo v Excelu (české znaky, sloupce podle polí formuláře, odkazy na přílohy).

> Telefonní čísla začínající „+“ mají v CSV na začátku apostrof (`'+420…`) — ochrana proti tomu, aby je Excel spustil jako vzorec. Je to v pořádku.

Po 10 chybných pokusech o přihlášení se správa z dané sítě na 15 minut zablokuje.

### Změna stavu přihlášky
U přihlášky klikněte na **Otevřít ve Strapi** (nebo *Content Manager → Přihláška*):
- **Stav**: `nova` (nová) → `kontaktovana` → `schvalena` / `zamitnuta`,
- **Interní poznámka** (zobrazí se i v CSV),
- **Uložit** (přihlášky se nepublikují).

Přílohy se ukládají do knihovny médií a v tabulce jsou jako odkazy „Příloha 1, 2…“.

### E-maily
Po odeslání přihlášky dostane žadatel potvrzení a tým kopii. Příjemce kopií nastavíte v
**Single types → Globální nastavení → Příjemci přihlášek (e-maily)** (adresy oddělené čárkou).
Pole **Potvrzovací e-mail odeslán** u přihlášky ukazuje, zda e-mail odešel.

Texty potvrzovacího e-mailu upravíte v **Single types → Stránka přihlášky**:

| Pole | Co je to |
|---|---|
| **Potvrzovací e-mail — předmět** | Předmět e-mailu (název akce se k němu připojí sám) |
| **Potvrzovací e-mail — úvod** | Úvodní odstavec pod oslovením „Dobrý den,“ |
| **Potvrzovací e-mail — poznámka** | Drobný text pod výpisem odpovědí (např. „na tuto zprávu neodpovídejte“) |

Pod textem je vždy přehled všech vyplněných polí — sestaví se sám podle formuláře, nic nenastavujete.
Kopie pro tým má v poli *Odpovědět* adresu přihlašujícího, takže se dá odpovědět přímo z e-mailu.

Když e-mail neodejde (výpadek odesílatele), přihláška se **přesto uloží** a **Potvrzovací e-mail odeslán**
zůstane vypnuté — kontakt najdete v tabulce přihlášek.

---

## 6. Úvodní stránka

**Single types → Domovská stránka** — všechny texty úvodní stránky:

| Sekce | Co obsahuje |
|---|---|
| **Hero (úvodní sekce)** | Hlavní nadpis, perex, tlačítka. |
| **Statistiky** | Čísla pod úvodem (např. „120+ / Odbavených akcí“). |
| **Intro (dva sloupce)** | Nadpis šedé sekce a text vpravo. **Odstavce oddělte prázdným řádkem.** |
| **Číslované karty** | Karty 01 / 02 / 03. |
| **Titulek sekce se štítky**, **Štítky** | „Stavíme pro:“ a štítky. |
| **Blok klientů** | Nadpis, text, tlačítko, text „a další…“ a výběr log (**Loga klientů**). |
| **Blok akcí** | Nadpis, text, **Počet akcí**, tlačítko. |

### Žlutý flek pod slovem
Slovo nebo slova uzavřete mezi **dvě hvězdičky**: `**Gastrozóny** pro každou příležitost` → „Gastrozóny“ bude na žlutém fleku.
Funguje v nadpisech (úvodní stránka, nadpisy stránek, nadpisy bloků).

### Loga klientů
Loga se spravují v **Content Manager → Logo klienta** (**Název klienta**, **Logo**, **Odkaz na web**, **Pořadí**).
Na úvodní stránce se zobrazí ta, která vyberete v *Domovská stránka → Blok klientů → Loga klientů*.
První čtyři mají pevné rozmístění podle návrhu, další se zobrazí pod nimi.
Nejlépe PNG s průhledným pozadím (bílé pozadí také funguje).

---

## 7. Obecné stránky a bloky

Stránky jako *Jak to funguje*, *Pro prodejce*, *Pro pořadatele*, *Ochrana osobních údajů* nebo *Cookies* jsou v
**Content Manager → Stránka**. Adresa je `gastrozony.cz/<slug>`.

Stránka má úvod (**Titulek**, **Perex**, volitelně **Tlačítko (CTA)** a **Hlavní obrázek** — poměr 1440 × 560)
a pod ním **Bloky obsahu**, které libovolně skládáte a řadíte:

| Blok | Na webu |
|---|---|
| **Text** | Nadpis + formátovaný text. |
| **Karty 01/02/03** | Nadpis, text a číslované karty (jako na úvodní stránce). |
| **Štítky** | „Stavíme pro:“ se štítky. |
| **Logotypy klientů** | Nadpis, text, tlačítko a loga. |
| **Statistiky** | Čísla s popiskem. |
| **Obrázek + text** | Fotka vlevo nebo vpravo (**Pozice obrázku**) a text. |
| **Výpis akcí** | Karty akcí: **Filtr akcí** `upcoming` (nadcházející), `past` (proběhlé), `all`; **Počet akcí**. |
| **Galerie** | Fotky ve mřížce (**Počet sloupců**). |
| **Akordeon / FAQ** | Otázky a odpovědi, rozbalují se kliknutím. |
| **CTA blok** | Výrazná karta s nadpisem, textem a tlačítkem. |

**Pozadí:** u bloků Text, Karty a Obrázek + text zvolíte **Pozadí** (bílá / šedá / černá). Bloky za sebou se stejným
pozadím web spojí do jedné sekce s vlnkami. Loga a FAQ jsou vždy na bílém, výpis akcí na černém; štítky, statistiky,
galerie a CTA převezmou pozadí bloku nad sebou. U **CTA bloku** určuje **Pozadí** barvu karty (výchozí žlutá).

Nová stránka se v menu neobjeví sama — přidejte ji do [Navigace](#9-hlavička-a-patička-navigace).

---

## 8. Kontakt a tým

**Single types → Kontakt:** **Titulek**, **Perex**, **Obsah**, **E-mail**, **Telefon**, **Adresa**.
Prázdné kontakty se doplní z *Globálního nastavení*.

**Mapa:** v Google Mapách najděte místo → **Sdílet → Vložit mapu** → zkopírujte jen adresu z `src="…"` (začíná
`https://www.google.com/maps/embed?…`) do **Odkaz na Google Maps**. Mapa se pak zobrazí přímo na stránce.
Běžný odkaz na Google Mapy se zobrazí jen jako tlačítko; je-li vyplněná **Adresa**, mapa se vykreslí podle ní.

**Tým:** členové v **Content Manager → Člen týmu** (**Jméno a příjmení**, **Pozice**, **Fotografie**, **E-mail**,
**Telefon**, **Pořadí**). Na stránce Kontakt je vyberte v poli **Členové týmu**. Bez fotky se zobrazí iniciály
ve žlutém kruhu.

Pod kontakty můžete přidat stejné **bloky** jako u obecných stránek.

---

## 9. Hlavička a patička (Navigace)

**Single types → Navigace:**
- **Hlavní menu** — položky menu v hlavičce (**Popisek** + **Odkaz (URL)**). *Podpoložky se zatím nezobrazují.*
- **Tlačítko v hlavičce** — žluté tlačítko vpravo v hlavičce (Přihláška).
- **Sloupce v patičce** — sloupce odkazů v patičce, **Text v patičce** — text pod logem v patičce,
- **Právní odkazy v patičce** — odkazy dole (Ochrana osobních údajů, Cookies). Odkaz „Nastavení cookies“ se přidává automaticky.

Odkazy na vlastní stránky pište s lomítkem na začátku (`/akce`, `/kontakt`), externí celou adresou (`https://…`).

---

## 10. Newsletter, cookies a globální nastavení

- **Newsletter** (žlutý blok nad patičkou na všech stránkách): texty, popisek pole, tlačítko, souhlas, hlášky.
  **Zapnuto** vypnuté = blok zmizí z webu. Odběratelé jsou v *Content Manager → Odběratel newsletteru*.
  Napojení na **Ecomail**: **Ecomail — ID seznamu** (číslo seznamu v Ecomailu), **Ecomail — štítky** (oddělené
  čárkou, přidají se každému odběrateli) a **Dvojí potvrzení (double opt-in)** — zapnuto znamená, že Ecomail pošle
  potvrzovací e-mail a odběratel se přidá až po kliknutí (doporučeno kvůli GDPR). U odběratele ukazuje
  **Přeneseno do Ecomailu**, jestli se do Ecomailu opravdu dostal; když ne, zůstává uložený tady a dá se doplnit ručně.
- **Cookies lišta:** všechny texty lišty a nastavení cookies. Analytika (Google Analytics) se spustí jen se souhlasem návštěvníka.
- **Globální nastavení:** kontakty (patička, Kontakt), **Sociální sítě**, **Příjemci přihlášek (e-maily)**,
  **Výchozí SEO** celého webu a texty stránky **404** („stránka nenalezena“).

---

## 11. Obrázky a soubory

Obrázky nahrajte v **Knihovně médií** (nebo přímo v poli obrázku). Ukládají se do služby ImageKit, která je pro
návštěvníky automaticky zmenšuje a převádí do moderních formátů — nahrajte klidně fotku ve vyšším rozlišení.

| Kde | Doporučení |
|---|---|
| Obálka akce a článku | 4 : 3, šířka 1300–2000 px |
| Obálka stránky | 1440 × 560 (panoramatická) |
| Galerie | libovolný poměr, delší strana ~2000 px |
| Loga klientů | PNG s průhledným pozadím |
| Obrázek pro sdílení (SEO) | 1200 × 630 |

- Vyplňte **Alternative text** (popis obrázku) — pomáhá nevidomým i vyhledávačům. Formulář obrázku Strapi
  nepřekládá, takže je tady angličtina.
- Soubory SVG Strapi z bezpečnostních důvodů nepřijímá.
- Logo webu a ikona v prohlížeči se v adminu nemění (upravuje je vývojář).

---

## 12. SEO — jak se stránka zobrazí ve vyhledávači a na sociálních sítích

Akce, články, stránky i jednotlivé single types mají sekci **SEO**:
- **Meta titulek** (max. 70 znaků) — titulek ve výsledcích Googlu. Prázdné = název stránky.
- **Meta popis** (max. 180 znaků) — popis ve výsledcích. Prázdné = perex.
- **Obrázek pro sdílení** — obrázek při sdílení na sociálních sítích (1200 × 630). Prázdné = obálka, jinak výchozí
  obrázek z *Globální nastavení → Výchozí SEO*.
- **Nezařazovat do vyhledávačů (noindex)** — stránka se nebude zobrazovat ve vyhledávačích (a zmizí z mapy webu).

Výchozí hodnoty pro celý web jsou v **Globální nastavení → Výchozí SEO**.

---

## 13. Tahák formátování (Markdown)

Pole **Obsah**, **Text**, **Odpověď** a popisky souhlasů používají jednoduché formátování:

| Napíšete | Na webu |
|---|---|
| `**tučně**` | **tučně** |
| `## Nadpis` / `### Menší nadpis` | nadpis v textu |
| `- položka` (každá na nový řádek) | odrážka se žlutou tečkou |
| `1. položka` | číslovaný seznam |
| `[text odkazu](/prihlaska)` | odkaz na stránku webu |
| `[text odkazu](https://…)` | externí odkaz (otevře se v nové záložce) |
| `[napište nám](mailto:info@gastrozony.cz)` | odkaz na e-mail |
| prázdný řádek | nový odstavec |

HTML kód se z bezpečnostních důvodů nevykresluje.

---

## 14. Rychlé odpovědi

- **Změnu nevidím na webu.** Klikli jste na *Publikovat*? Pak počkejte minutu (patička 5 minut) a obnovte stránku.
- **Akce se nenabízí ve formuláři.** Zkontrolujte, že je publikovaná, má zapnuté *Přihlášky otevřené* a ještě neskončila.
- **Pole formuláře se nezobrazuje.** Zkontrolujte jeho **Klíč pole (name)** (jen písmena bez diakritiky, číslice, `_`, `-`; unikátní) a publikujte formulář.
- **Chci akci/článek skrýt.** Otevřete ho a zvolte **Zrušit publikaci** — zmizí z webu, v adminu zůstane.
- **Stránka hlásí 404.** Zkontrolujte slug a to, že je položka publikovaná.
- **Admin je v angličtině.** Vpravo nahoře **Profil → Jazyk rozhraní → Čeština**.
