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
	storageBucket: "dif-instantgames.appspot.com"
  };
  firebase.initializeApp(config);
	var database;
	database = firebase.database().ref('/Game Collection/all/'+key);
	database.once('value').then(function(snapshot) {
		var name = (snapshot.val().name);
		var imageUrl=(snapshot.val().imageUrl);
		var url=(snapshot.val().url);
		gameView(url,name);
	});
}

function gameView(url, name){
    document.title = name;

	var content='<iframe id="gameFrame" allowfullscreen src="'+url+'" height="100%" width="100%" frameborder="0px" scrolling="no" style="border:none;overflow:hidden"></iframe>';
    document.getElementById("gameView").innerHTML=content;
    hideLoader();
}



let wakeLock = null;

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock is active');
            
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock was released');
            });
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }
}

function handleVisibilityChange() {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
    }
}

document.addEventListener('visibilitychange', handleVisibilityChange);

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        if (wakeLock !== null) {
            wakeLock.release();
            wakeLock = null;
        }
    }
});

function goFullScreen(){
    const elem = document.getElementById("gameFrame");
    elem.requestFullscreen();

    // Request wake lock when entering full screen
    requestWakeLock();
    
    var isPortrait = getUrlParam("isPortrait","true");
    if(isPortrait != true){
        screen.orientation.lock('landscape');
        console.log("Locking to landscape mode");
    }
    elem.webkitEnterFullscreen();
}

loadGame(getUrlParam("id","empty"));

