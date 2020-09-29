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


/*
db.ref("running").set(0);
db.ref("playercount").set(0);
db.ref("players").set("");
*/
// Set up local & db game environment
db.ref("start").set(1);
var round;
var promptlen = 844; 
var promptnum = Math.floor(Math.random() * promptlen);
db.ref('currptnum').set(promptnum);
var prompts = [];
var time = 20;
var thisuser = '';
var currpt = '';
var players = 0;
var playerlist = [];
$('#lobby').hide();
$('#game').hide();
$('#leaderboard').hide();


db.ref("running").on("value", ss=>{
  let status = ss.val();
  if (status == 1){
    $('#lobby').hide();
    $('#welcome').hide();
    $('#leaderboard').hide();
    $('#game').show();
  }
});


db.ref("start").on("value", ss=>{
  let status = ss.val();
  if (status == 1){
    $('#lobby').hide();
    $('#game').hide();
    $('#leaderboard').hide();
    $('#welcome').show();
    db.ref('round').set(0);
  }
});

/*db.ref("players").child('user').on("value", ss=>{
  $('#players').append(`<li>${ss.val()}</li>`)
})*/
if (!($("lobby").is(":hidden"))) { 
  db.ref("playercount").on("value", ss=>{
    players = ss.val();
    $('#playercount').html(`Currently ${players} players`);
  });
}


// welcome page (enter username, join game) -> lobby (waiting for other users)
$('#startlobby').click(()=>{
  thisuser = $('#username').val();
  players++;
  playerlist.push(thisuser);
  db.ref('playerlist').set(playerlist);
  db.ref('playercount').set(players);
  db.ref('players').child(thisuser).set({ 
    score: 0
  });
  db.ref('start').set(0);
  db.ref('round').set(0);

  $('#welcome').hide();
  $('#lobby').show();

});


// get current prompt to display on screen
  db.ref('currprompt').on("value", ss => {
    currpt = ss.val();
    $('#prompt').html(`Prompt: ${currpt}`);
    console.log(currpt);
  });


// lobby -> game screen 
$('#startgame').click(()=>{

  db.ref("running").set(1);

  //get prompt basedon rand num
  db.ref('prompts').child(promptnum).once('value', ss=>{
    var tmp = ss.val();
    db.ref('currprompt').set(tmp);
    prompts.push(tmp);
  });

  //update prompt on screen
  db.ref('currprompt').once("value", ss => {
    currpt = ss.val();
    $('#prompt').html(`Prompt: ${currpt}`);
    console.log(currpt);
  });

  //set to first round
  db.ref('round').set(1);
  db.ref('round').once('value', ss=>{
    round = ss.val();
  });

  //page navigation
  $('#lobby').hide();
  $('#game').show();
});

// ensure prompt is displayed while game is running
db.ref('running').on('value', ss=>{
  if(ss.val() == 1){
    $('#title').html(`Welcome to round ${round}, ${thisuser}!`);
    $('#nextround').html(`Round ${round+1}`);
  }
});


// submit answer to prompt to db
$('#submit').click(() =>{
  db.ref('answers').child(currpt).child(thisuser).set({
    answer: $('#answer').val()
  });
});

//new round during gameplay, reset db & get new prompt
$('#nextround').click(()=>{
  if(round < 2){  ///////CHANGE THIS AFTER TESTING LEADERBOARD
    //advance round
    round++;
    db.ref('round').set(round);
    db.ref('round').once('value', ss=>{
      round = ss.val();
    });

    //choose new prompt num
    promptnum = Math.floor(Math.random() * promptlen);
    db.ref('currptnum').set(promptnum);
    db.ref('prompts').child(promptnum).once('value', ss=>{
      var tmp = ss.val();
      db.ref('currprompt').set(tmp);
      prompts.push(tmp);
    });
    
    //update prompt on screen
    db.ref('currprompt').once("value", ss => {
      currpt = ss.val();
      $('#prompt').html(`Prompt: ${currpt}`);
      console.log(currpt);
    });
    $('#answer').val([]);
  }
  else{
    console.log('leaderboard time!');
    /* db.ref('answers').once('value', ss=>{
      var len = ss.val().len;
      for(var i = 0; i < len; i++){
        
        $('#leaderboard').html(
          `<h3>Voting</h3>
          <h3>Prompt: ${ss.val()[i]}</h3>
          <div id ='responses'></div>`
        );
      }
    }); */

    

    /*$(document).on("click", "a.remove" , function() {
            $(this).parent().remove();
        });*/
    db.ref('leaderboard').set(1);
    
  }
})

db.ref('leaderboard').on('value', ss=>{
  if(ss.val() == 1){
    var answers = [];
    db.ref('answers').once('value', ss=>{
      answers = ss.val();
      //for testing only
      console.log('answers: ', answers);
      $('#leaderboard').append(`<p>${JSON.stringify(answers)}</p>`);
      //
      db.ref('players').once('value', ss=>{
        var plist = ss.val();
//////FIGURE THIS OUT!!! HOW TO PRINT PROMPTS AND THEN THE USERS" ANSWERS BELOW
        for(var i = 0; i < prompts.length; i++){
          $('#leaderboard').append(`<h3>${prompts[i]}</h3>`);
          db.ref('answers').child(prompts[i]).once('value', ss1=>{
            var tmp = ss1.val();
            $('#leaderboard').append(`<p>${JSON.stringify(tmp)}</p>`);
            for(var j = 0; j < plist.length; j++){
              $('#leaderboard').append(`<p>${JSON.stringify(plist[j])}</p><br />`);
              $('#leaderboard').append(`<p>${JSON.stringify(tmp[j])}</p><br />`);
            }
            $('#leaderboard').append(`<br />`);
          });
        }
      })
    });
    $('#leaderboard').show();
  }
  else{
    $('#leaderboard').html('');
  }
})

// game screen -> welcome screen
// end game, reset db 
$('#endgame').click(()=>{
  console.log('click')
  currprompt = '';
  round = 0;
  db.ref("running").set(0);
  db.ref("round").set(0);
  db.ref("playercount").set(0);
  db.ref("players").set("");
  db.ref("playerlist").set([]);
  db.ref("currprompt").set("");
  db.ref("currptnum").set(0);
  db.ref("answers").set("");
  db.ref('leaderboard').set(0);
  db.ref('start').set(1);
  $('#welcome').show();
  $('#lobby').hide();
  $('#game').hide();
  $('#leaderboard').hide();
});
