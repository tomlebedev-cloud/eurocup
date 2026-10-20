# EuroCup Hub

A simple EuroCup basketball website with real data: teams, players, statistics, schedule and predictions.
English or Lithuanian (EN / LT switch in the header, remembered by the browser).
Plain HTML, CSS and JavaScript, plus Python scripts that download the data.
It is the Euroleague Hub's code pointed at the EuroCup (same official API, competition code `U`), with the
regular season in groups and every model setting measured again on EuroCup seasons.

## Pages

| Page | What it shows |
|------|---------------|
| **Home** | Latest results, next games (with predicted scores), standings, stat leaders |
| **Standings** | One table per group (2026-27: four groups of eight, the top four go to the playoffs): games, wins, losses, points for/against, +/-, last 5 games, and the season forecast |
| **Stats** | Players: per-game averages, shooting percentages (2P%, 3P%, FT%), turnovers and +/−. Teams: points per 100 possessions scored and allowed, pace, eFG%, rebounds and more. Click a column to sort |
| **Teams** | All 32 teams. Click one to see coach, its place in its group, team statistics with league rank, roster with season averages, and all its games |
| **Player** | Click any player's name: season averages with league rank, shooting, and his game log |
| **Schedule** | Go round by round through the 14 regular-season rounds, filter by team |
| **Game** | Played: quarter scores and full box score for both teams. Upcoming: prediction, earlier meetings, both rosters |
| **Predictions** | Win probability and predicted score for the next two rounds, plus a "pick any two teams" tool |
| **Betting** | Next round simulated 40,000 times per game; compare with bookmaker odds, find value bets, keep a bet log |
| **Ticket** | Suggested ticket for the next round with the reasons for each pick: value singles, a combo only when every leg has value, and the minimum odds each pick needs |
| **Plan** | Staking plan: type in a bankroll, pick a staking style, get the round's slip (bet, odds, stake, "skip below" odds) to enter at the bookmaker; a chart compares the styles over 100 bets |

## Run it

Open `index.html` in your browser (double-click it). If your browser blocks it, serve the folder:

```
python -m http.server 8000
```

and open http://localhost:8000.

## Updating the data

```
python update_data.py
```

This downloads everything from the official EuroLeague API (`api-live.euroleague.net`, EuroCup = competition `U`) and writes
`js/data.js`: clubs, rosters, coaches, all games, and box scores of every played game. Player season
averages are calculated from those box scores. Run it after each round to get new results.

- Finished box scores are cached in `.cache/` so later runs only download new games.
- If the API rate-limits you, the script waits automatically and continues.
- Another season: `python update_data.py U2025` (2025-26).

Requires Python 3 (standard library only, nothing to install).

### Automatic daily update

On GitHub, the workflow in `.github/workflows/update-data.yml` keeps `js/data.js` current and the website
(GitHub Pages) redeploys by itself after every change:

- **After games:** every half hour in the evening and hourly through the night (UTC) it runs
  `update_data.py --if-new`, which asks the API once whether a game has finished since the last update and
  only then does the full update.
- **Every morning** (05:23 UTC) it runs a full update, which also picks up roster and schedule changes.

GitHub starts scheduled jobs late when it is busy (sometimes by hours), so results can take a while to
appear. To update right away: **Actions → Update EuroCup data → Run workflow**.

Live site: https://tomlebedev-cloud.github.io/eurocup/

Note: GitHub pauses scheduled workflows in repositories with no activity for 60 days (e.g. in the
summer off-season). If that happens, re-enable it from the Actions tab.

## How predictions work

The model lives in `model.py` and runs inside `update_data.py`; the website only reads its output.
It is the Euroleague Hub model; the settings below were measured on EuroCup seasons with `backtest.py`.

- **Attack and defence ratings.** Each team gets an attack rating (points scored vs. an average team) and a
  defence rating (points allowed), estimated from all games with a ridge regression, so they are
  **adjusted for opponent strength**. Every game of the season counts the same (counting recent games more
  did not help in the EuroCup).
- **Preseason starting point.** Ratings begin at 80% of last season's level, adjusted for **summer
  transfers**: the last-season EuroCup PIR of players who arrived minus players who left, compared with the
  league's average change (1 point per 1000 PIR). Teams new to the EuroCup start slightly below average
  (that is how new teams did on average, but they differ a lot: ±6 points). The starting point is worth only
  about 7 games of evidence, because EuroCup squads change a lot every summer.
- **Game prediction.** Predicted score = league average + attack + opponent's defence, with +2.4 points for
  the home team. The margin becomes a win chance with a logistic curve.

### Accuracy (backtested)

`backtest.py` replays past seasons game by game, predicting each game using only earlier games
(playoffs included):

| 2023-24 → 2025-26 (586 games) | Winner right | Log loss | Brier | Margin error |
|---|---|---|---|---|
| Always pick the home team | 57.3% | | | |
| Simple model (season points per game) | 65.0% | 0.615 | 0.213 | 10.8 pts |
| Euroleague Hub settings | 65.0% | 0.635 | 0.223 | 11.0 pts |
| **Current model (EuroCup settings)** | **66.7%** | **0.604** | **0.208** | **10.5 pts** |

Lower log loss / Brier means better win probabilities. With the EuroLeague settings the model was worse than
the simple one: the EuroCup is less predictable, so the win chances have to be less confident (probability
scale 7.7 instead of 5.7). Settings were tuned on 2023-24 and 2024-25 and checked on 2025-26 (log loss 0.609
on that unseen season). Run `python backtest.py` to reproduce, `python backtest.py --tune` to search settings,
`python backtest.py --promoted` to see how new teams did.

**Read this before using it for bets.** The EuroCup model is the weakest of the hubs. In 2026-27, 15 of the 32
teams are new to the EuroCup, so early in the season their ratings are mostly a guess, and the model's
chances stay close to 50/50 where the bookmaker has a clear favourite. That shows up as big "value" on big
underdogs (e.g. 9.00 or 11.00 shots): treat it as the model not knowing the team, not as an edge. That is why
the Betting, Ticket and Plan pages give the model only 25% weight by default (the Euroleague Hub uses 50%);
check the track record on the Predictions page after round 7 or 8 before giving it more.

The site also shows the model's live track record for the current season round by round (next to
"home team won" and the bookmaker's favourite, with the most confident miss of each round), and on every
finished game what it predicted before tip-off.

### Betting page

For each game of the next round the page simulates 40,000 final scores: margin and total are drawn
around the model's prediction with the spread measured on past seasons (`python backtest.py --spread`,
stored in `model.SIM`: margin ±13.3, total ±18 points). Ties go to overtime. From the simulations it
shows fair odds, a fair handicap and total, and model chances at nearby lines.

Type in a bookmaker's decimal odds (winner, handicap, total). The page removes the bookmaker margin,
blends the model's chance with the bookmaker's ("model weight", default 25% here, because the bookmaker knows
about injuries and news), and shows the expected value and a stake (¼ Kelly, at most 2% of the bankroll).
Odds, settings and the bet log are saved in your browser only; bet results settle automatically after the
data update.

**Published odds.** `js/odds.js` holds bookmaker odds for the next round, typed in by hand from the
bookmaker's site; they fill in every game you haven't entered your own odds for, and count in the odds history.
Update it before each round.

**Several bookmakers.** Add bookmakers by name on the Betting page and enter each one's odds (fields or
template; a button per bookmaker switches which one you are entering). Every bet is then priced at the best
odds among them, the bookmakers' chance is the average of their margin-free chances, and the bet table,
ticket and staking plan say where to place it. Handicaps and totals are compared only at the same line.

**Odds template.** "Copy template" gives a plain-text form with every game of the round
(`Win: home away`, `Hcp: line home away`, `Tot: line over under`); fill in the bookmaker's odds and paste it
back with "Apply" (or paste it into a chat).

**Odds history.** Every set of odds you type is saved with the model's chances at that moment (edits within
30 minutes replace the last save, later ones are added, so line moves are kept). Odds lock at tip-off. For
finished games the page compares the model's and the bookmaker's log loss per market, and the result of
1 € on every value bet. Everything stays in the browser; **Export / Import** moves it to another device
or keeps a backup.

**Line-ups.** Each team's three most productive regulars (PIR per game, early in the season leaning on
last season) are its key players. Every key player who doesn't play costs his team 1.5 points of margin.
Players who left the club are counted out; everyone else you tick yourself from the injury news.

**Pace.** Predicted totals add 1.3 points per possession that the two teams play above the league average
this season (possessions from team box scores, shrunk toward the league with 5 games' weight).

The line-up and pace numbers are the Euroleague Hub's: measuring them again needs every past EuroCup box
score (about 600), and the API only allows a few downloads a minute, so that test has not been run for the
EuroCup yet (`python backtest.py --absences` and `--pace` do it, given a few hours).

The model has a real edge over a coin flip on winners and margins, but totals are weak (mean error 14.4
points), and no test against real bookmaker odds has been done. Treat "value" as a signal to look closer,
not a sure thing.

### Season forecast

The Standings page also shows each team's chance of finishing in the top four of its group (playoffs) or
first, and its expected final wins. `update_data.py` plays out the rest of the regular season 10,000 times
(`model.simulate_season`): every game's margin is drawn around the model's prediction, and in each run every
team's strength is also shifted by a random 3.5 points, because the ratings are uncertain themselves.

`python backtest.py --season` forecasts the last three seasons before round 1 and after rounds 4 and 10 and
compares with how they ended. Those seasons had groups of ten, so the test asks "finishes in the top half of
its group": teams given 50–70% made it 56% of the time, those given 70–90% made it 79%. Final wins were off by
2.5 on average before the season and 1.1 after round 10. Group winners are harder: the few teams given
over 50% won their group less often than that.

Standings: the API has no official EuroCup group tables, so each group is ordered by wins, then point
difference (the official head-to-head tie-breakers are not applied). Only regular-season games count.

## Project structure

```
index.html       page layout and navigation
css/style.css    styles (light + dark mode)
js/app.js        pages, standings and stats
js/betting.js    betting page: simulation, odds comparison, bet log
js/ticket.js     ticket page: suggested bets and the reasons for them
js/plan.js       staking plan page: the round's slip and the staking-style chart
js/odds.js       bookmaker odds for the next round (edit by hand)
js/data.js       generated data — don't edit by hand
update_data.py   downloads EuroCup data from the EuroLeague API
model.py         prediction model
backtest.py      measures prediction accuracy on past seasons
```

Not affiliated with EuroLeague Basketball. Data and team logos belong to their owners.
