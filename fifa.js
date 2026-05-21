const nextMatchBtn = document.querySelector("#nextMatchBtn");
const autoGroupBtn = document.querySelector("#autoGroupBtn");
const runKnockoutBtn = document.querySelector("#runKnockoutBtn");
const resetBtn = document.querySelector("#resetBtn");

const progressText = document.querySelector("#progressText");
const matchInfo = document.querySelector("#matchInfo");
const currentMatchBox = document.querySelector("#currentMatch");
const qualifiedBox = document.querySelector("#qualifiedBox");
const groupsGrid = document.querySelector("#groupsGrid");
const knockoutBox = document.querySelector("#knockoutBox");

const groupLetters = "ABCDEFGHIJKL".split("");

const initialTeams = [
  // Group A
  { name: "Mexico", code: "MX", group: "A" },
  { name: "South Africa", code: "ZA", group: "A" },
  { name: "South Korea", code: "KR", group: "A" },
  { name: "Czechia", code: "CZ", group: "A" },

  // Group B
  { name: "Canada", code: "CA", group: "B" },
  { name: "Bosnia and Herzegovina", code: "BA", group: "B" },
  { name: "Qatar", code: "QA", group: "B" },
  { name: "Switzerland", code: "CH", group: "B" },

  // Group C
  { name: "Brazil", code: "BR", group: "C" },
  { name: "Morocco", code: "MA", group: "C" },
  { name: "Haiti", code: "HT", group: "C" },
  { name: "Scotland", code: "GB", group: "C" },

  // Group D
  { name: "USA", code: "US", group: "D" },
  { name: "Paraguay", code: "PY", group: "D" },
  { name: "Australia", code: "AU", group: "D" },
  { name: "Türkiye", code: "TR", group: "D" },

  // Group E
  { name: "Germany", code: "DE", group: "E" },
  { name: "Curaçao", code: "CW", group: "E" },
  { name: "Ivory Coast", code: "CI", group: "E" },
  { name: "Ecuador", code: "EC", group: "E" },

  // Group F
  { name: "Netherlands", code: "NL", group: "F" },
  { name: "Japan", code: "JP", group: "F" },
  { name: "Sweden", code: "SE", group: "F" },
  { name: "Tunisia", code: "TN", group: "F" },

  // Group G
  { name: "Belgium", code: "BE", group: "G" },
  { name: "Egypt", code: "EG", group: "G" },
  { name: "Iran", code: "IR", group: "G" },
  { name: "New Zealand", code: "NZ", group: "G" },

  // Group H
  { name: "Spain", code: "ES", group: "H" },
  { name: "Cape Verde", code: "CV", group: "H" },
  { name: "Saudi Arabia", code: "SA", group: "H" },
  { name: "Uruguay", code: "UY", group: "H" },

  // Group I
  { name: "France", code: "FR", group: "I" },
  { name: "Senegal", code: "SN", group: "I" },
  { name: "Iraq", code: "IQ", group: "I" },
  { name: "Norway", code: "NO", group: "I" },

  // Group J
  { name: "Argentina", code: "AR", group: "J" },
  { name: "Algeria", code: "DZ", group: "J" },
  { name: "Austria", code: "AT", group: "J" },
  { name: "Jordan", code: "JO", group: "J" },

  // Group K
  { name: "Portugal", code: "PT", group: "K" },
  { name: "DR Congo", code: "CD", group: "K" },
  { name: "Uzbekistan", code: "UZ", group: "K" },
  { name: "Colombia", code: "CO", group: "K" },

  // Group L
  { name: "England", code: "GB", group: "L" },
  { name: "Croatia", code: "HR", group: "L" },
  { name: "Ghana", code: "GH", group: "L" },
  { name: "Panama", code: "PA", group: "L" },
];

let teams = [];
let schedule = [];

let stage = "group"; // group | knockout | done

let currentMatch = null;
let currentIndex = 0;
let playedMatches = 0;

let qualifiedTeams = [];

let knockoutRounds = [];
let currentKnockoutRoundIndex = 0;
let currentKnockoutMatchIndex = 0;
let champion = null;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function flagUrl(code) {
  return `https://flagsapi.com/${code}/flat/64.png`;
}

function buildTeams() {
  return initialTeams.map((team) => ({
    ...team,
    strength: randInt(70, 95),
    points: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    played: 0,
  }));
}

function compareTeams(a, b) {
  return (
    b.points - a.points ||
    b.gd - a.gd ||
    b.gf - a.gf ||
    b.strength - a.strength ||
    a.name.localeCompare(b.name)
  );
}

function getGroupTeams(groupLetter) {
  return teams.filter((team) => team.group === groupLetter);
}

function getGroupStandings(groupLetter) {
  return [...getGroupTeams(groupLetter)].sort(compareTeams);
}

function buildGroupSchedule() {
  const matches = [];

  groupLetters.forEach((groupLetter) => {
    const groupTeams = getGroupTeams(groupLetter);

    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        matches.push({
          group: groupLetter,
          a: groupTeams[i],
          b: groupTeams[j],
          played: false,
        });
      }
    }
  });

  return shuffleArray(matches);
}

function getRoundName(teamCount) {
  if (teamCount === 32) return "Round of 32";
  if (teamCount === 16) return "Round of 16";
  if (teamCount === 8) return "Quarter Final";
  if (teamCount === 4) return "Semi Final";
  if (teamCount === 2) return "Final";
  return "Knockout";
}

function buildKnockoutPairs(teamList) {
  const orderedTeams = [...teamList].sort(compareTeams);
  const pairs = [];

  let left = 0;
  let right = orderedTeams.length - 1;

  while (left < right) {
    pairs.push({
      a: orderedTeams[left],
      b: orderedTeams[right],
      played: false,
      result: null,
    });
    left++;
    right--;
  }

  return pairs;
}

function updateProgress() {
  if (stage === "group") {
    progressText.textContent = `${playedMatches} / ${schedule.length} matches played`;
  } else if (stage === "knockout") {
    const done = knockoutRounds.reduce((sum, round) => sum + round.matches.filter(m => m.played).length, 0);
    const total = knockoutRounds.reduce((sum, round) => sum + round.matches.length, 0);
    progressText.textContent = `${done} / ${total} knockout matches played`;
  } else {
    progressText.textContent = "Tournament finished";
  }
}

function renderGroups() {
  groupsGrid.innerHTML = "";

  groupLetters.forEach((groupLetter) => {
    const standings = getGroupStandings(groupLetter);

    const rows = standings
      .map((team, index) => {
        const rowClass =
          index === 0 || index === 1
            ? "top-two"
            : index === 2
            ? "third-place"
            : "";

        return `
          <tr class="${rowClass}">
            <td>${index + 1}</td>
            <td style="text-align:left">${team.name}</td>
            <td>${team.played}</td>
            <td>${team.wins}</td>
            <td>${team.draws}</td>
            <td>${team.losses}</td>
            <td>${team.gf}</td>
            <td>${team.ga}</td>
            <td>${team.gd >= 0 ? "+" + team.gd : team.gd}</td>
            <td><b>${team.points}</b></td>
          </tr>
        `;
      })
      .join("");

    groupsGrid.innerHTML += `
      <article class="group-card">
        <h3>Group ${groupLetter}</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th style="text-align:left">Team</th>
                <th>MP</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GF</th>
                <th>GA</th>
                <th>GD</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </article>
    `;
  });
}

function renderCurrentMatch() {
  if (!currentMatch) {
    currentMatchBox.classList.add("hidden");
    currentMatchBox.innerHTML = "";
    return;
  }

  currentMatchBox.classList.remove("hidden");

  currentMatchBox.innerHTML = `
    <div class="team-card" data-side="a" title="Click this team">
      <img src="${flagUrl(currentMatch.a.code)}" alt="${currentMatch.a.name} flag" />
      <h3>${currentMatch.a.name}</h3>
      <p>Group ${currentMatch.a.group}</p>
      ${stage === "group" ? `<p>Strength: ${currentMatch.a.strength}</p>` : ""}
    </div>

    <div class="vs">VS</div>

    <div class="team-card" data-side="b" title="Click this team">
      <img src="${flagUrl(currentMatch.b.code)}" alt="${currentMatch.b.name} flag" />
      <h3>${currentMatch.b.name}</h3>
      <p>Group ${currentMatch.b.group}</p>
      ${stage === "group" ? `<p>Strength: ${currentMatch.b.strength}</p>` : ""}
    </div>
  `;

  document.querySelectorAll("[data-side]").forEach((card) => {
    card.addEventListener("click", () => resolveCurrentMatch(card.dataset.side));
  });
}

function applyGroupResult(teamA, teamB, scoreA, scoreB) {
  teamA.played++;
  teamB.played++;

  teamA.gf += scoreA;
  teamA.ga += scoreB;
  teamB.gf += scoreB;
  teamB.ga += scoreA;

  teamA.gd = teamA.gf - teamA.ga;
  teamB.gd = teamB.gf - teamB.ga;

  if (scoreA > scoreB) {
    teamA.points += 3;
    teamA.wins++;
    teamB.losses++;
    return teamA;
  }

  if (scoreB > scoreA) {
    teamB.points += 3;
    teamB.wins++;
    teamA.losses++;
    return teamB;
  }

  teamA.points += 1;
  teamB.points += 1;
  teamA.draws++;
  teamB.draws++;
  return null;
}

function simulateGroupMatch(teamA, teamB, chosenSide) {
  let chanceA = 0.5 + (teamA.strength - teamB.strength) / 140;
  chanceA = clamp(chanceA, 0.25, 0.75);

  if (chosenSide === "a") chanceA += 0.05;
  if (chosenSide === "b") chanceA -= 0.05;

  chanceA = clamp(chanceA, 0.2, 0.8);

  const drawChance = 0.22;
  const roll = Math.random();

  let scoreA;
  let scoreB;

  if (roll < chanceA) {
    scoreA = randInt(1, 4);
    scoreB = randInt(0, scoreA - 1);
  } else if (roll < chanceA + drawChance) {
    scoreA = randInt(0, 3);
    scoreB = scoreA;
  } else {
    scoreB = randInt(1, 4);
    scoreA = randInt(0, scoreB - 1);
  }

  return { scoreA, scoreB };
}

function simulateKnockoutMatch(teamA, teamB, chosenSide) {
  let chanceA = 0.5 + (teamA.strength - teamB.strength) / 150;
  chanceA = clamp(chanceA, 0.25, 0.75);

  if (chosenSide === "a") chanceA += 0.05;
  if (chosenSide === "b") chanceA -= 0.05;

  chanceA = clamp(chanceA, 0.2, 0.8);

  const roll = Math.random();

  let scoreA;
  let scoreB;
  let winner;
  let method = "in 90 minutes";

  if (roll < 0.8) {
    if (Math.random() < chanceA) {
      scoreA = randInt(1, 4);
      scoreB = randInt(0, scoreA - 1);
      winner = teamA;
    } else {
      scoreB = randInt(1, 4);
      scoreA = randInt(0, scoreB - 1);
      winner = teamB;
    }
  } else {
    scoreA = randInt(0, 2);
    scoreB = scoreA;

    const penA = randInt(3, 5);
    const penB = penA === 5 ? 4 : penA - 1;

    if (Math.random() < 0.5) {
      winner = teamA;
      method = `on penalties ${penA}-${penB}`;
    } else {
      winner = teamB;
      method = `on penalties ${penB}-${penA}`;
    }
  }

  return { scoreA, scoreB, winner, method };
}

function renderKnockoutBox() {
  if (!knockoutRounds.length && stage !== "done") {
    knockoutBox.innerHTML = `<p class="muted">Run the knockout stage after group stage ends.</p>`;
    return;
  }

  let html = "";

  knockoutRounds.forEach((round, roundIndex) => {
    html += `
      <article class="round-card">
        <h3>${round.roundName}</h3>
    `;

    round.matches.forEach((match, matchIndex) => {
      const isCurrentRound = stage === "knockout" && roundIndex === currentKnockoutRoundIndex;
      const isCurrentMatch = isCurrentRound && matchIndex === currentKnockoutMatchIndex && !match.played;

      const status = match.played
        ? `<span class="badge win">${match.result.winner.name}</span>`
        : isCurrentMatch
          ? `<span class="badge draw">Current</span>`
          : `<span class="badge loss">Pending</span>`;

      const scoreLine = match.played
        ? `${match.result.scoreA} - ${match.result.scoreB}`
        : "vs";

      html += `
        <div class="match-result">
          <div class="match-line">
            <span>${match.a.name}</span>
            <strong>${scoreLine}</strong>
            <span>${match.b.name}</span>
          </div>
          <div class="match-line">
            <small>${match.played ? match.result.method : "Waiting to be played"}</small>
            ${status}
          </div>
        </div>
      `;
    });

    html += `</article>`;
  });

  if (champion) {
    html += `
      <div class="final-champion">
        🏆 Champion: ${champion.name} 🏆
      </div>
    `;
  }

  knockoutBox.innerHTML = html;
}

function renderQualifiedTeams(topTwos, bestThirds) {
  const topTwoHTML = topTwos
    .map(
      (team, index) => `
      <div class="team-pill">
        <img src="${flagUrl(team.code)}" alt="${team.name} flag" />
        <div>
          <b>${index + 1}. ${team.name}</b><br/>
          <small>Group ${team.group} | ${team.points} pts</small>
        </div>
      </div>
    `
    )
    .join("");

  const thirdHTML = bestThirds
    .map(
      (team, index) => `
      <div class="team-pill">
        <img src="${flagUrl(team.code)}" alt="${team.name} flag" />
        <div>
          <b>${index + 1}. ${team.name}</b><br/>
          <small>3rd place | Group ${team.group} | ${team.points} pts</small>
        </div>
      </div>
    `
    )
    .join("");

  qualifiedBox.innerHTML = `
    <div class="qualified-grid">
      <div class="sub-box">
        <h3>Top 2 from each group (24 teams)</h3>
        <div class="team-list">${topTwoHTML}</div>
      </div>

      <div class="sub-box">
        <h3>Best 8 third-place teams</h3>
        <div class="team-list">${thirdHTML}</div>
      </div>
    </div>
  `;
}

function buildAndStartFirstKnockoutRound() {
  const topTwos = [];
  const thirdPlaceTeams = [];

  groupLetters.forEach((groupLetter) => {
    const standings = getGroupStandings(groupLetter);
    topTwos.push(standings[0], standings[1]);
    thirdPlaceTeams.push(standings[2]);
  });

  const bestThirds = [...thirdPlaceTeams].sort(compareTeams).slice(0, 8);
  qualifiedTeams = [...topTwos, ...bestThirds].sort(compareTeams);

  renderQualifiedTeams(topTwos, bestThirds);

  knockoutRounds = [
    {
      roundName: getRoundName(qualifiedTeams.length),
      matches: buildKnockoutPairs(qualifiedTeams),
    },
  ];

  currentKnockoutRoundIndex = 0;
  currentKnockoutMatchIndex = 0;

  stage = "knockout";
  runKnockoutBtn.disabled = true;

  currentMatch = null;
  matchInfo.innerHTML = `<b>${knockoutRounds[0].roundName}</b> ready. Click Next Match to begin.`;
  renderKnockoutBox();
  updateProgress();
}

function loadNextMatch() {
  if (stage === "group") {
    if (currentMatch) return;

    if (currentIndex >= schedule.length) {
      finalizeGroupStage();
      return;
    }

    currentMatch = schedule[currentIndex];
    matchInfo.innerHTML = `<b>Group ${currentMatch.group}</b> — click one flag to play the match.`;
    renderCurrentMatch();
    return;
  }

  if (stage === "knockout") {
    if (!knockoutRounds.length) return;

    const round = knockoutRounds[currentKnockoutRoundIndex];

    if (!round) return;

    if (currentKnockoutMatchIndex >= round.matches.length) {
      finalizeCurrentKnockoutRound();
      return;
    }

    const match = round.matches[currentKnockoutMatchIndex];

    if (match.played) {
      currentKnockoutMatchIndex++;
      loadNextMatch();
      return;
    }

    currentMatch = match;
    matchInfo.innerHTML = `<b>${round.roundName}</b> — Match ${currentKnockoutMatchIndex + 1} of ${round.matches.length}`;
    renderCurrentMatch();
    renderKnockoutBox();
  }
}

function resolveCurrentMatch(chosenSide) {
  if (!currentMatch) return;

  const { a, b } = currentMatch;

  if (stage === "group") {
    const result = simulateGroupMatch(a, b, chosenSide);
    const winner = applyGroupResult(a, b, result.scoreA, result.scoreB);

    currentMatch.played = true;
    playedMatches++;

    if (winner) {
      matchInfo.innerHTML = `
        <b>${winner.name}</b> won!
        <br>
        ${a.name} ${result.scoreA} - ${result.scoreB} ${b.name}
      `;
    } else {
      matchInfo.innerHTML = `
        Draw match!
        <br>
        ${a.name} ${result.scoreA} - ${result.scoreB} ${b.name}
      `;
    }

    currentIndex++;
    currentMatch = null;

    updateProgress();
    renderGroups();
    renderCurrentMatch();

    if (playedMatches === schedule.length) {
      finalizeGroupStage();
    }

    return;
  }

  if (stage === "knockout") {
    const round = knockoutRounds[currentKnockoutRoundIndex];
    const match = round.matches[currentKnockoutMatchIndex];

    const result = simulateKnockoutMatch(a, b, chosenSide);

    match.played = true;
    match.result = result;

    matchInfo.innerHTML = `
      <b>${result.winner.name}</b> advanced!
      <br>
      ${a.name} ${result.scoreA} - ${result.scoreB} ${b.name}
      <br>
      ${result.method}
    `;

    currentMatch = null;
    currentKnockoutMatchIndex++;

    renderKnockoutBox();
    renderCurrentMatch();
    updateProgress();
  }
}

function finalizeGroupStage() {
  if (stage !== "group") return;

  const topTwos = [];
  const thirdPlaceTeams = [];

  groupLetters.forEach((groupLetter) => {
    const standings = getGroupStandings(groupLetter);
    topTwos.push(standings[0], standings[1]);
    thirdPlaceTeams.push(standings[2]);
  });

  const bestThirds = [...thirdPlaceTeams].sort(compareTeams).slice(0, 8);
  qualifiedTeams = [...topTwos, ...bestThirds].sort(compareTeams);

  renderQualifiedTeams(topTwos, bestThirds);

  stage = "knockout";
  runKnockoutBtn.disabled = false;
  runKnockoutBtn.textContent = "Start Knockout Stage";

  matchInfo.innerHTML = `
    <b>Group stage finished.</b>
    Click <b>Start Knockout Stage</b> to begin Round of 32.
  `;

  currentMatch = null;
  renderCurrentMatch();
  updateProgress();
}

function finalizeCurrentKnockoutRound() {
  const round = knockoutRounds[currentKnockoutRoundIndex];
  const winners = round.matches.map((m) => m.result.winner);

  if (winners.length === 1) {
    champion = winners[0];
    stage = "done";
    currentMatch = null;
    matchInfo.innerHTML = `🏆 Champion: <b>${champion.name}</b>`;
    renderCurrentMatch();
    renderKnockoutBox();
    updateProgress();
    return;
  }

  currentKnockoutRoundIndex++;
  knockoutRounds.push({
    roundName: getRoundName(winners.length),
    matches: buildKnockoutPairs(winners),
  });

  currentKnockoutMatchIndex = 0;
  currentMatch = null;

  matchInfo.innerHTML = `<b>${knockoutRounds[currentKnockoutRoundIndex].roundName}</b> is ready. Click Next Match to continue.`;
  renderKnockoutBox();
  updateProgress();
}

function autoSimulateGroupStage() {
  if (stage !== "group") return;

  while (playedMatches < schedule.length) {
    if (!currentMatch) {
      currentMatch = schedule[currentIndex];
      renderCurrentMatch();
    }

    const randomSide = Math.random() < 0.5 ? "a" : "b";
    resolveCurrentMatch(randomSide);
  }
}

function resetTournament() {
  teams = buildTeams();
  schedule = buildGroupSchedule();

  stage = "group";

  currentMatch = null;
  currentIndex = 0;
  playedMatches = 0;

  qualifiedTeams = [];
  knockoutRounds = [];
  currentKnockoutRoundIndex = 0;
  currentKnockoutMatchIndex = 0;
  champion = null;

  runKnockoutBtn.disabled = true;
  runKnockoutBtn.textContent = "Start Knockout Stage";

  qualifiedBox.innerHTML = `<p class="muted">Complete group stage to see top 2 and best 8 third-place teams.</p>`;
  knockoutBox.innerHTML = `<p class="muted">Run the knockout stage after group stage ends.</p>`;

  renderGroups();
  updateProgress();
  loadNextMatch();
}

nextMatchBtn.addEventListener("click", () => {
  loadNextMatch();
});

autoGroupBtn.addEventListener("click", () => {
  autoSimulateGroupStage();
});

runKnockoutBtn.addEventListener("click", () => {
  if (stage === "knockout" && knockoutRounds.length === 0) {
    buildAndStartFirstKnockoutRound();
    loadNextMatch();
  }
});

resetBtn.addEventListener("click", () => {
  resetTournament();
});

function startKnockoutAfterGroup() {
  buildAndStartFirstKnockoutRound();
}

function finalizeGroupStageAndEnableKnockout() {
  if (stage !== "group") return;

  const topTwos = [];
  const thirdPlaceTeams = [];

  groupLetters.forEach((groupLetter) => {
    const standings = getGroupStandings(groupLetter);
    topTwos.push(standings[0], standings[1]);
    thirdPlaceTeams.push(standings[2]);
  });

  const bestThirds = [...thirdPlaceTeams].sort(compareTeams).slice(0, 8);
  qualifiedTeams = [...topTwos, ...bestThirds].sort(compareTeams);

  renderQualifiedTeams(topTwos, bestThirds);

  stage = "knockout";
  runKnockoutBtn.disabled = false;
  runKnockoutBtn.textContent = "Start Knockout Stage";

  matchInfo.innerHTML = `
    <b>Group stage finished.</b>
    Click <b>Start Knockout Stage</b> to begin Round of 32.
  `;

  currentMatch = null;
  renderCurrentMatch();
  updateProgress();
}

function renderFinalStateIfNeeded() {
  if (champion) {
    knockoutBox.innerHTML += `
      <div class="final-champion">
        🏆 Champion: ${champion.name} 🏆
      </div>
    `;
  }
}

resetTournament();