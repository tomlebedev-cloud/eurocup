// Bookmaker odds published with the site (winner, overtime included), used when you
// haven't typed your own for a game on the Betting page. Update by hand before each round:
// game code -> { ml: [home, away], hcp: [home line, home, away], tot: [line, over, under] }
// The game code is the number at the end of the game's address on the site (#game/57).
const BOOK_ODDS = {
  source: "TopSport",
  taken: "2026-10-20",
  games: {
    // round 4 (taken 2026-10-20; the three games of 20 Oct 19:00–19:30 had already left the list)
    50: { ml: [4.20, 1.23] },  // Rostock – Aris
    62: { ml: [1.58, 2.40] },  // Manresa – Roma
    54: { ml: [1.47, 2.70] },  // Cluj – London
    51: { ml: [1.72, 2.13] },  // Cedevita Olimpija – Le Mans
    64: { ml: [1.04, 9.00] },  // PAOK – Ulm
    57: { ml: [1.28, 3.50] },  // Chemnitz – Slask
    49: { ml: [1.49, 2.50] },  // Derthona – Burgos
    63: { ml: [5.00, 1.15] },  // Bosna – Bahcesehir
    58: { ml: [1.41, 2.80] },  // Bourg – Trento
    53: { ml: [3.85, 1.23] },  // Skyliners – Tenerife
    60: { ml: [1.48, 2.55] },  // Napoli – Tofas
    52: { ml: [1.02, 11.00] }, // Hapoel Jerusalem – Riga
    56: { ml: [1.93, 1.81] },  // Maxima Roma – Venezia
  },
};
