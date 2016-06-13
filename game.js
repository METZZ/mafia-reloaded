var gs = new GameState();
var players = [];
var usrname = window.location.toString().split("?username=")[1]
var ws = new WebSocket("ws://localhost:7000", usrname);
ws.onopen = function(e) {
  ws.addEventListener("message", dealMessage);
};
ws.onerror = function(e) {
  alert("Error".toString());
};

var stillAlive = true;
function dealMessage(e) {
  var message = e.data.toString();
  if(message.indexOf("#TYPE:")==0) {
    type = message.substring(6);
    gs.username = usrname;
    gs.type = type;
    if(type=="Mafia") loadScript("player_mafia.js");
    if(type=="Detective") loadScript("player_detective.js");
    if(type=="Victim") gs.initiate();
    return;
  }
  if(message.indexOf("#NAMES:") == 0) {
    players = message.substring(7).split(",");
    for(var i=0; i!=players.length; i++) {
      gs.names[players[i]] = true;
    }
  }
  if(message.indexOf("#KILLED:")==0) {
    var ms = message.split(":")[1];
    gs.names[ms] = false;
    gs.decorate(ms + " has died :(");
  }
  if(message.indexOf("#VOTE:")==0) {
    var ms = message.split(":");
    voter = ms[1];
    votee = ms[2];
    gs.voteState[voter] = votee;
    gs.decorate("");
  }
  if(message.indexOf("#VOTE_ANON")==0) {
    gs.round = "#VOTE_ANON";
    document.getElementById("round-name").innerHTML = "Anonymous voting round is on <br>";
    setupVoting(12);
  }
  if(message.indexOf("#DISCUSSION:") == 0) {
    gs.round = "#DISCUSSION";
    document.getElementById("round-name").innerHTML = "Discussion round is on <br>";
    var maxVotes = message.split(":")[1].split(",");
    document.getElementById("discussion-round").style.display="";
    document.getElementById("discussion-round-announcement").innerHTML = maxVotes[0] + " and " + maxVotes[1] + " are under the highest suspicion. They get to speak first, then everyone speaks. Press the button after you're done!";
    var discussionRoundHandler = function(e) {
      document.getElementById("discussion-round-announcement").innerHTML = "";
      document.getElementById("discussion-round").style.display="none";
      ws.send("#DONE_DISCUSSION");
      document.getElementById("discussion-round-done").removeEventListener("click",discussionRoundHandler);
    }
    document.getElementById("discussion-round-done").addEventListener("click",discussionRoundHandler);
  }

  if(message.indexOf("#VOTE_OPEN")==0) {
    gs.round = "#VOTE_OPEN";
    document.getElementById("round-name").innerHTML = "Open voting round is on <br>";
    setupVoting(15);
  }

  if(message.indexOf("#ELIMINATED:")==0) {
    var ms = message.split(":");
    if(ms[2]=="True"){
      document.body.innerHTML+=(ms[1]+ " has been eliminated. He/she was actually in the mafia");
    } else {
      document.body.innerHTML+=(ms[1]+ " has been eliminated. He/she was not actually in the mafia");
    }
    document.getElementById("radio-for-"+ms[1]).style.visibility = 'hidden';
    gs.names[ms[1]] = false;
    if(ms[1]==usrname || stillAlive==false){
      ws.close();
      document.body.innerHTML = "You've been killed/eliminated. Better luck next time :(";
    }
  }
}
