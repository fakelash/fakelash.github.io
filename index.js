/*
 * Quiplash Prompts compiled from Quiplash XL by friendly Steam users Alphaeus & Raven_of_Nevaria
 * Sources: https://steamcommunity.com/app/397460/discussions/0/451850468372557278/
 *          https://drive.google.com/file/d/0BxNI_DUQ9QZZWU1pMVZ4VzV0dW8/view 
 */

// Config & initialize Firebase
var firebaseConfig = {
    apiKey: "AIzaSyC5_C4cc7PPMJ9bhCjPYpT_Zr0SB8mrvkc",
    authDomain: "fake-lash.firebaseapp.com",
    databaseURL: "https://fake-lash.firebaseio.com",
    projectId: "fake-lash",
    storageBucket: "fake-lash.appspot.com",
    messagingSenderId: "322246135260",
    appId: "1:322246135260:web:cbe33f698bc159e5e29319",
    measurementId: "G-6WW2VSPF2E"
  }; 
firebase.initializeApp(firebaseConfig);
let db = firebase.database();

// Set up local game environment
var round = 0;
var promptlen = 844; 
var promptnum; 
var thisuser = '';
var currpt = '';
var players = 0;
$('#lobby').hide();
$('#game').hide();
$('#waitingroom').hide();
$('#leaderboard').hide();
$('#scorecontainer').hide();


db.ref("start").on("value", ss=>{
  let status = ss.val();
  if (status == 1){
    round = 0;
    $('#lobby').hide();
    $('#game').hide();
    $('#leaderboard').hide();
    $('#waitingroom').hide();
    $('#scorecontainer').hide();
    $('#welcome').show();
  }
});


if (!($("lobby").is(":hidden"))) { 
  db.ref("playercount").on("value", ss=>{
    players = ss.val();
    $('#playercount').html(`currently ${players} players`);
  });
}


// welcome page (enter username, join game) -> lobby (waiting for other users)
$('#startlobby').click(()=>{
  round = 0;
  addPlayer();
  db.ref('start').set(0);
  $('#welcome').hide(); 
  $('#lobby').show();
});


// get current prompt to display on screen
db.ref('gamepts').on("value", ss => {
  var tmp = ss.val();
  if(tmp){
    var curr = tmp[round];
    $('#prompt').html(`${curr}`);
  }
});


// lobby -> game screen 
$('#startgame').click(()=>{
  db.ref("running").set(1);
});

// update game state
db.ref('running').on('value', ss=>{
  if(ss.val() == 1){
    //get 4 prompts for game & update screen
    getGamePrompts();
    updatePrompt();
    //page navigation
    $('#lobby').hide();
    $('#game').show();
    $('#welcome').hide();
    $('#nextround').html(`next round`);
    db.ref('running').set(2);
  }
});


//new round during gameplay
//sumbit answer to db, get new prompt from list & update screen
$('#nextround').click(()=>{
  round++;
  db.ref('answers').child(currpt).child(thisuser).set({
    answer: $('#answer').val()
  });
  $('#answer').val([]);
  if(round < 4){ 
    updatePrompt();
  }
  else{
    round = 0;
    db.ref('done').once('value', ss=>{
      var tmpdone = ss.val();
      tmpdone++;
      db.ref('done').set(tmpdone);
      checkDone();
    });
    $('#waitingroom').show();
    $('#game').hide();
  }
});

//leaderboard
db.ref('leaderboard').on('value', ss=>{
  if(ss.val() == 1){
    round = 0;
    addScores();
    startLeaderboard();
    $('#game').hide();
    $('#waitingroom').hide();
    $('#leaderboard').show();
    $('#scorecontainer').show();
  }
  else{
    $('#leaderboard').html('');
  }
});

//keep scores updated
db.ref('players').on('value', ss=>{
  var players = ss.val();
  for(player in players){
    var p = players[player];
    $('#'+player+'score').html(`${p.score}`);
  }
})

// game screen -> welcome screen
// end game, reset db 
$('#endgame').click(()=>{
  resetGame();
  $('#welcome').show();
  $('#lobby').hide();
  $('#game').hide();
  $('#leaderboard').hide();
});

function addPlayer(){
  thisuser = $('#username').val();
  players++;
  
  db.ref('playerlist').once('value', ss=>{
    var tmp = [];
    tmp = ss.val();
    if(tmp){
      tmp.push(thisuser);
      db.ref('playerlist').set(tmp);
    }
    else{
      db.ref('playerlist').set([thisuser]);
    }
  });
  db.ref('playercount').set(players);
  db.ref('players').child(thisuser).set({ 
    score: 0
  });
}


function addScores(){
  db.ref('players').once('value', ss1=>{
    var plist = ss1.val();
    for(player in plist){
      var p = plist[player];
      $('#scores').append(
        `<div id=${player} class='score'>
          <h3>${player}: </h3>
          <h3 id=${player + 'score'}>${p.score}</h3>
        </div>`);
      $('#scorecontainer').show();
    }
  });
}


function checkDone(){
  db.ref('playercount').once('value', ss=>{
    if(ss.val()){
      var playernum = ss.val();
      db.ref('done').once('value', ss1=>{
        var tmpdone = ss1.val();
        if(tmpdone == playernum){
          db.ref('leaderboard').set(1);
        }
      });
    }
  });
}

//generate 4 prompts for game
function getGamePrompts(){
  var i = 0;
  var tmp = [];
  while(i < 4){
    promptnum = Math.floor(Math.random() * promptlen);
    db.ref('prompts').child(promptnum).once('value', ss=>{
      var newpt = ss.val();
      db.ref('gamepts').once('value', ss1=>{
        var tmp = [];
        tmp = ss1.val();
        if(tmp){
          tmp.push(newpt);
          db.ref('gamepts').set(tmp);
        }
        else{
          db.ref('gamepts').set([newpt]);
        }
      });
    });
    i++;
  }
  updatePrompt();
}

function resetGame(){
  round = 0;
  db.ref("running").set(0);
  db.ref("round").set(0);
  db.ref('done').set(0);
  db.ref("playercount").set(0);
  db.ref("players").set("");
  db.ref("playerlist").set([]);
  db.ref("currprompt").set("");
  db.ref("currptnum").set(0);
  db.ref("answers").set("");
  db.ref('leaderboard').set(0);
  db.ref('gamepts').set([]);
  db.ref('start').set(1);
}


function startLeaderboard(){
  $('#scores').html('');
  db.ref('answers').once('value', ss2=>{
    var answers = ss2.val();
    db.ref('gamepts').once('value', ss3=>{
      var gamepts = ss3.val();
      for(pt in gamepts){
        var tmppt = gamepts[pt];
        var ans = answers[tmppt];
        if(ans){
          var code = Math.floor(Math.random() * (999 - 100 + 1) + 100);
          $('#leaderboard').append(
            `<div class='ptanswer'>
              <h2>${tmppt}</h2>
              <div class='container' id=${code}>
              </div>
            </div>`);
          for(usr in ans){
            $('#'+code).append(
              `<div class='answer'>
                <h3 class='ans'>${ans[usr].answer}</h3>
                <button id=${usr+code} class='vote' title=${usr}>vote</button>
              </div>`
            );
            document.getElementById(usr+code).addEventListener('click', (usr)=>vote(usr));
          }
        }
      }
    });
  });
}


function updatePrompt(){
  db.ref('gamepts').on("value", ss => {
    if(ss.val()){
      pts = ss.val();
      currpt = pts[round];
      $('#prompt').html(`${pts[round]}`);
      $('#title').html(`round ${round+1}/4`)
    }
  });
}

function vote(par){
  var user = par.target.title;
  var id = par.target.id;
  console.log('id', id);
  id = id.substring(id.length - 3, id.length);
  console.log('subid', id);
  $('#'+id).addClass("disabledbutton");
  db.ref('players').child(user).once('value', ss=>{
    var tmp = ss.val().score;
    tmp++;
    db.ref('players').child(user).child('score').set(tmp);
  });
  $('#scorecontainer').show();
}
