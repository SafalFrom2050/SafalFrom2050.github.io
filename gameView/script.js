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
            document.getElementById("gameView").innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: white; text-align: center; padding: 20px;">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ff4757" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 20px; filter: drop-shadow(0 0 10px rgba(255, 71, 87, 0.4));">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h2 style="font-family: 'Press Start 2P', cursive; font-size: 16px; margin-bottom: 15px; color: white;">Game Unavailable</h2>
                    <p style="color: #94a3b8; max-width: 400px; font-family: 'Outfit', sans-serif; font-size: 14px;">Oops! We couldn't find the game you're looking for. It might have been moved or removed.</p>
                    <a href="/" style="margin-top: 30px; color: #22d3ee; text-decoration: none; font-weight: 600; font-family: 'Outfit', sans-serif;">← Back to Portal</a>
                </div>
            `;
            hideLoader();
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
    if(isPortrait == "0" || isPortrait == "false" || isPortrait == 0 || isPortrait == "null"){
        screen.orientation.lock('landscape');
    }
    elem.webkitEnterFullscreen();
}

loadGame(getUrlParam("id","empty"));

