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



var loadStartTime = Date.now();
const MIN_LOAD_TIME = 1200;

function hideLoader() {
    var loader = document.getElementById('loaderContainer');
    var controls = document.getElementById('floatingControls');
    if (!loader) return;
    
    var timeElapsed = Date.now() - loadStartTime;
    var remainingTime = Math.max(0, MIN_LOAD_TIME - timeElapsed);
    
    setTimeout(function() {
        loader.style.opacity = '0';
        setTimeout(function() {
            loader.style.display = 'none';
            if (controls) {
                controls.style.display = 'block';
                controls.classList.add('animate-in');
            }
        }, 500);
    }, remainingTime);
}

function loadGame(key){
	 var config = {
    apiKey: "AIzaSyCa21G1mEhrJKmoPLRZ8hbJikyI4lGdY5Y",
    authDomain: "dif-instantgames.firebaseapp.com",
    databaseURL: "https://dif-instantgames.firebaseio.com/",
    projectId: "dif-instantgames",
	storageBucket: "dif-instantgames.appspot.com",
    appId: "1:555879374010:web:405a0d17f2b1b20e85b683"
  };
  firebase.initializeApp(config);
  
  const appCheck = firebase.appCheck();
  appCheck.activate(
      new firebase.appCheck.ReCaptchaEnterpriseProvider('6LerGoMsAAAAAHNLdx75KLqssqSTGG4RJRIB0BUs'),
      true
  );
  
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
    hideLoader();
}



function goFullScreen(){
    const elem = document.getElementById("gameFrame");
    elem.requestFullscreen();
    
    
    var isPortrait = getUrlParam("isPortrait","true");
    if(isPortrait == "0" || isPortrait == "false" || isPortrait == 0 || isPortrait == "null"){
        screen.orientation.lock('landscape');
    }
    elem.webkitEnterFullscreen();
}

loadGame(getUrlParam("id","empty"));

