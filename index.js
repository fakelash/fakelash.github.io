/*
 * Quilash Prompts compiled from Quiplash XL by friendly Steam users Alphaeus & Raven_of_Nevaria
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
var round;
var promptlen = 844; 
var promptnum; 
var prompts = [];
var thisuser = '';
var currpt = '';
var players = 0;
$('#lobby').hide();
$('#game').hide();
$('#waitingroom').hide();
$('#leaderboard').hide();


db.ref("running").on("value", ss=>{
  let status = ss.val();
  if (status == 1){
    $('#game').show();
  }
});


db.ref("start").on("value", ss=>{
  let status = ss.val();
  if (status == 1){
    $('#lobby').hide();
    $('#game').hide();
    $('#leaderboard').hide();
    $('#waitingroom').hide();
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
  thisuser = $('#username').val();
  players++;
  
  db.ref('playerlist').once('value', ss=>{
    console.log('local player:', thisuser);
    console.log('playerlist', ss.val());
    var tmp = [];
    tmp = ss.val();
    if(tmp){
      tmp.push(thisuser);
      console.log('updatedplayerlist', tmp);
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
  db.ref('start').set(0);

  $('#welcome').hide();
  $('#lobby').show();

});


// get current prompt to display on screen
  db.ref('gamepts').on("value", ss => {
    var tmp = ss.val();
    if(tmp){
      console.log('round', round)
      var curr = tmp[round];
      $('#prompt').html(`${curr}`);
      console.log(curr);
    }
  });


// lobby -> game screen 
$('#startgame').click(()=>{
  db.ref("running").set(1);
});

// add next round button
db.ref('running').on('value', ss=>{
  if(ss.val() == 1){
    //get 4 prompts for game
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


// submit answer to prompt to db
$('#submit').click(() =>{
  db.ref('answers').child(currpt).child(thisuser).set({
    answer: $('#answer').val()
  });
  
});

//new round during gameplay, get new prompt from list & update screen
$('#nextround').click(()=>{
  //advance round
  round++;
  if(round < 4){ 
    //clear input field 
    $('#answer').val([]);
    updatePrompt();
  }
  else{
    console.log('leaderboard time!');
    db.ref('done').once('value', ss=>{
      var tmpdone = ss.val();
      tmpdone++;
      console.log('nextround done', tmpdone);
      db.ref('done').set(tmpdone);
      checkDone();
    });
    $('#waitingroom').show();
    $('#game').hide();
  }
    
  
})

db.ref('leaderboard').on('value', ss=>{
  if(ss.val() == 1){
    console.log('leaderboard');
    var answers = [];
    db.ref('answers').once('value', ss=>{
      answers = ss.val();
      console.log('answers', answers);
      db.ref('playerlist').once('value', ss=>{
        var plist = ss.val();
        var curr;
        for(var i = 0; i < prompts.length; i++){
          curr = prompts[i];
          db.ref('answers').child(curr).once('value', ss1=>{
            $('#leaderboard').append(
              `<div class='answerblock'>
              <h3>${curr}</h3><br />
              </div>`);
            var tmp = ss1.val();
            console.log(plist.length);
            for(var j = 0; j < plist.length; j++){
              var user = plist[j];
              $('.answerblock').append(
                `<p class='disuser'>${user}</p>
                <h3 class='disanswer'>${tmp[user].answer}</h3>
                <button class='vote' onclick='vote(${user})'>vote</button>`);
            }
          });
        }
      })
    });
    $('#game').hide();
    $('#waitingroom').hide();
    $('#leaderboard').show();
  }
  else{
    $('#leaderboard').html('');
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


function checkDone(){
  db.ref('playercount').once('value', ss=>{
    console.log('playercount on');
    if(ss.val()){
      var playernum = ss.val();
      db.ref('done').once('value', ss1=>{
        var tmpdone = ss1.val();
        console.log('tmpdone', tmpdone);
        console.log('playernum', playernum);
        if(tmpdone == playernum){
          db.ref('leaderboard').set(1);
        }
      });
    }
  });
}


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
          prompts.push(newpt);
          db.ref('gamepts').set(tmp);
        }
        else{
          db.ref('gamepts').set([newpt]);
        }
      });
    });
    i++;
  }
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


function updatePrompt(){
  console.log('updating...');
  db.ref('gamepts').on("value", ss => {
    if(ss.val()){
      pts = ss.val();
      currpt = pts[round];
      console.log("currpt",currpt)
      $('#prompt').html(`${pts[round]}`);
      $('#title').html(`round ${round+1}/4`)
    }
  });
}

function vote(user){
  db.ref('players').child(user).once('value', ss=>{
    var tmp = ss.val().score;
    tmp++;
    db.ref('players').child(user).child('score').set(tmp);
  });
}