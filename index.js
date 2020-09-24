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
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();
let db = firebase.database();
db.ref("running").set(0);
db.ref("playercount").set(0);
db.ref("players").set("");

var players = 0;

db.ref("running").on("value", ss=>{
  let status = ss.val();
  if (status == 1){
    $('#lobby').hide();
    $('#welcome').hide();
    $('#game').show();
  }
});

db.ref("players").child('user').on("value", ss=>{
  $('#players').append(`<li>${ss.val()}</li>`)
})

db.ref("playercount").on("value", ss=>{
  players = ss.val();
  $('#playercount').html(`Currently ${players} players`)
});



$('#lobby').hide();
$('#game').hide();

$('#startlobby').click(()=>{
  $('#welcome').hide();
  $('#lobby').show();
  players++;
  db.ref('playercount').set(players);
  db.ref('players').push().set({
    user: $('#username').val(),
    id: 1
  });
})

$('#startgame').click(()=>{
  db.ref("running").set(1);
  $('#lobby').hide();
  $('#game').show();
})
