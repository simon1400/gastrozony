/**
 * Článek bez data dostane dnešní datum (Praha). Web řadí podle `date` sestupně a v PostgreSQL
 * by prázdná data skončila na začátku výpisu.
 */

type ArticleEvent = { params: { data?: { date?: string | null } } };

const todayPrague = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Prague' }).format(new Date());

export default {
  beforeCreate(event: ArticleEvent) {
    const { data } = event.params;
    if (data && !data.date) data.date = todayPrague();
  },
  beforeUpdate(event: ArticleEvent) {
    const { data } = event.params;
    // jen když redaktor datum výslovně smazal; update bez pole `date` nechá datum být
    if (data && 'date' in data && !data.date) data.date = todayPrague();
  },
};
