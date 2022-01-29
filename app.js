const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//Get Players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
      player_id as playerId,
      player_name as playerName
    FROM
      player_details;`;
  const playersArray = await database.all(getPlayersQuery);
  response.send(playersArray);
});

//Get Player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
    SELECT
      player_id as playerId,
      player_name as playerName
    FROM
      player_details
      where player_id = ${playerId};`;
  const playersArray = await database.get(getPlayersQuery);
  response.send(playersArray);
});

//Update Player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    update player_details set 
    player_name = '${playerName}'
    where player_id = ${playerId};`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get Match Details API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `select match_id as matchId,
    match, year from match_details 
    where match_id =${matchId}; `;
  const matchDetail = await database.get(getMatchQuery);
  response.send(matchDetail);
});

//Get Player Matches API
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT
      match_details.match_id as matchId,
      match, year 
      from player_match_score  join match_details
      where player_id = ${playerId};`;
  const playerMatchesArray = await database.all(getPlayerMatchesQuery);
  response.send(playerMatchesArray);
});

//Get Match Players Details API
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `select player_details.player_id as playerId,
      player_details.player_name as playerName
    FROM
      player_details join player_match_score 
    where player_match_score.player_match_id =${matchId}; `;
  const matchPlayersDetails = await database.all(getMatchPlayersQuery);
  response.send(matchPlayersDetails);
});

//Get Player Score API
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreQuery = `
    SELECT
      player_details.player_id as playerId,
      player_name as playerName,
      sum(player_match_score.score) as totalScore,
      sum(player_match_score.fours) as totalFours,
      sum(player_match_score.sixes) as totalSixes
    FROM
      player_details join player_match_score
      where  player_details.player_id = ${playerId}
      group by player_details.player_id;`;
  const playerScore = await database.get(getPlayerScoreQuery);
  response.send(playerScore);
});

module.exports = app;
