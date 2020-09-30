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
    db.ref('done').once('value', ss=>{
      var tmpdone = ss.val();
      tmpdone++;
      db.ref('done').set(tmpdone);
      checkDone();
    });
    $('#waitingroom').show();
    $('#game').hide();
  }
    
  
})
/*
db.ref('leaderboard').on('value', ss=>{
  if(ss.val() == 1){
    console.log('leaderboard');
    var answers = [];
    db.ref('answers').once('value', ss=>{
      answers = ss.val();
      console.log('answers', answers);
      console.log('prompts', prompts);
      db.ref('playerlist').once('value', ss=>{
        var plist = ss.val();
        var curr;
        var codenum = Math.floor(Math.random() * 20);
        db.ref('answers').once('value', ss1=>{
          for(var i = 0; i < prompts.length; i++){
            curr = prompts[i];
            $('#leaderboard').append(
              `<h3>${curr}</h3>
              <div class='answerblock'></div>`);
            var tmp = ss1.child(curr).val();
            console.log('ss1.val', ss1.val());
            console.log('ss1.child(curr) val', tmp);
            console.log(plist.length);
            var code = '';
            for(var j = 0; j < plist.length; j++){
              console.log('j loop');
              var user = plist[j];
              codenum++;
              code = user + '' + codenum;
              console.log('code', code);
              $('.answerblock').append(
                `<h3 class='disanswer'>${tmp[user].answer}</h3>
                <button class='vote' id=${code}>vote</button>`);
              document.getElementById(code).addEventListener("click", function(par){vote(user)});
            }
          }
        });//ans db
      });//plist db
    });
    $('#game').hide();
    $('#waitingroom').hide();
    $('#leaderboard').show();
  }
  else{
    $('#leaderboard').html('');
  }
});
*/

db.ref('leaderboard').on('value', ss=>{
  if(ss.val() == 1){
    db.ref('playerlist').once('value', ss1=>{
      var plist = ss1.val();
      var plen = plist.length;
      db.ref('answers').once('value', ss2=>{
        var answers = ss2.val();
        db.ref('gamepts').once('value', ss3=>{
          var gamepts = ss3.val();
          for(pt in gamepts){
            var tmppt = gamepts[pt];
            var ans = answers[tmppt];
            $('#leaderboard').append(`<h2>${tmppt}</h2>`);
            for(usr in ans){
              $('#leaderboard').append(
                `<h3>${ans[usr].answer}</h3>
                <p>${usr}</p>
                <button class='vote'>vote</button>`
              );
            }
          }
        });
      });
    });
    $('#game').hide();
    $('#waitingroom').hide();
    $('#leaderboard').show();
  }
  else{
    $('#leaderboard').html('');
  }
});

// game screen -> welcome screen
// end game, reset db 
$('#endgame').click(()=>{
  resetGame();
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
  prompts = [];
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
          prompts.push(newpt);
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
  prompts = [];
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
      $('#prompt').html(`${pts[round]}`);
      $('#title').html(`round ${round+1}/4`)
    }
  });
}

function vote(user){
  console.log('vote')
  db.ref('players').child(user).once('value', ss=>{
    var tmp = ss.val().score;
    tmp++;
    console.log('vote afterscore', tmp);
    db.ref('players').child(user).child('score').set(tmp);
  });
}