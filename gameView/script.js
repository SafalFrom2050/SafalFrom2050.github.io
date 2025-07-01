function getUrlParam(parameter, defaultvalue){
    var urlparameter = defaultvalue;
    if(window.location.href.indexOf(parameter) > -1){
        urlparameter = getUrlVars()[parameter];
		return urlparameter;
     }
    return "null";
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}


function loadGame(key){
	 var config = {
    apiKey: "AIzaSyCa21G1mEhrJKmoPLRZ8hbJikyI4lGdY5Y",
    authDomain: "dif-instantgames.firebaseapp.com",
    databaseURL: "https://dif-instantgames.firebaseio.com/",
    projectId: "dif-instantgames",
	storageBucket: "dif-instantgames.appspot.com"
  };
  firebase.initializeApp(config);
	var database;
    var firestoreDb = firebase.firestore();

    firestoreDb.collection("games").doc(key).get().then(function(doc) {
        if (doc.exists) {
            gameView(doc.data().url, doc.data().name);
        } else {
            console.error("No such game!");
        }
    });

	// database = firebase.database().ref('/Game Collection/all/'+key);
	// database.once('value').then(function(snapshot) {
	// 	var name = (snapshot.val().name);
	// 	var imageUrl=(snapshot.val().imageUrl);
	// 	var url=(snapshot.val().url);
	// 	gameView(url,name);
	// });
}

function gameView(url, name){
    document.title = name;

	var content='<iframe id="gameFrame" allowfullscreen src="'+url+'" height="100%" width="100%" frameborder="0px" scrolling="no" style="border:none;overflow:hidden"></iframe>';
    document.getElementById("gameView").innerHTML=content;
}



function goFullScreen(){
    const elem = document.getElementById("gameFrame");
    elem.requestFullscreen();
    elem.webkitEnterFullscreen();
    
    var isPortrait = getUrlParam("isPortrait","true");
    if(isPortrait != true || isPortrait == 0){
        screen.orientation.lock('landscape');
    }
}

loadGame(getUrlParam("id","empty"));

