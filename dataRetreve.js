// JavaScript Document
// Set the configuration for your app
  // TODO: Replace with your project's config object
  var config = {
    apiKey: "AIzaSyCa21G1mEhrJKmoPLRZ8hbJikyI4lGdY5Y",
    authDomain: "dif-instantgames.firebaseapp.com",
    databaseURL: "https://dif-instantgames.firebaseio.com/",
    projectId: "dif-instantgames",
	storageBucket: "dif-instantgames.appspot.com",
    appId: "1:555879374010:web:405a0d17f2b1b20e85b683"
  };
  firebase.initializeApp(config);

  //var gameDetails;
  // Get a reference to the database service
 

  var lastLoaded="";
  var isLoading=true;
  var categoryCurr="all";
  var rootLocation="http://wgames.me/";

// Loader Logic
var loadStartTime = 0;
const MIN_LOAD_TIME = 1200; // 1.2s (1 loop of 1.2s animation)

function showLoader() {
    var loader = document.getElementById('loaderContainer');
    if (loader) {
        loader.style.display = 'flex';
        loader.style.opacity = '1';
        loadStartTime = Date.now();
        // Hide scroll view till data is ready
        document.getElementById("scrollView").style.opacity = "0";
    }
}

function hideLoader() {
    var loader = document.getElementById('loaderContainer');
    if (!loader) return;
    
    var timeElapsed = Date.now() - loadStartTime;
    var remainingTime = Math.max(0, MIN_LOAD_TIME - timeElapsed);
    
    setTimeout(function() {
        loader.style.opacity = '0';
        setTimeout(function() {
            loader.style.display = 'none';
            document.getElementById("scrollView").style.opacity = "1";
            document.getElementById("scrollView").classList.add("animate-in");
        }, 500);
    }, remainingTime);
}

  function getParameterByName(name, url) {
        if (!url) {
            url = window.location.href;
        }
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

function setScrollListener(){
	window.onscroll = function(ev) {
    if ((window.innerHeight + window.pageYOffset)- document.body.offsetHeight >=-5 ) {
				if(!isLoading) request(categoryCurr,true);
	}
};
}

function retreveCategories(){
	var database = firebase.database().ref('/Game Collection/Categories Included');
	newCategory("All");
	database.once('value').then(function(snapshot) {
	snapshot.forEach(function(childSnapshot){
		var category = childSnapshot.val();
		newCategory(category);
	});
});
}

function requestCurrentCategory (){
    var currCategory=getParameterByName('c').toLowerCase();
    currCategory=currCategory.split(",",1);
    request(currCategory,false);
}

function request(category,loadMore){
	isLoading=true;
	var database, ref;
	var repeat=loadMore;
	if(category!="all"){
		requestCategory(category,loadMore);
		return;
	}
	categoryCurr="all";
	database = firebase.database().ref('/Game Collection/all');
	ref=firebase.database().ref("/Users12");
	if(loadMore){
		database = database.orderByKey().startAt(lastLoaded).limitToFirst(27);
	}else{
		database = database.limitToFirst(27);
		showLoader();
	}
	
	database.once('value').then(function(snapshot) {
	snapshot.forEach(function(childSnapshot){
		if(!repeat){
			lastLoaded=childSnapshot.key;
			var name = (childSnapshot.val().name);
			var imageUrl=(childSnapshot.val().imageUrl);
			var category=(childSnapshot.val().category);
			
			var gameId=childSnapshot.key;
			createView(name, imageUrl, gameId,category);
			
		}
		repeat=false;
		
	});
				isLoading=false;
				if(!loadMore) hideLoader();
});
}

function requestCategory(category ,loadMore){
	isLoading=true;
	var database;
	var repeat=loadMore;
	categoryCurr=category;
	database = firebase.database().ref('/Game Collection/'+category);
	
	if(loadMore){
		database = database.orderByKey().startAt(lastLoaded).limitToFirst(27);
	}else{
		database = database.limitToFirst(25);
		showLoader();
	}
	
	database.once('value').then(function(snapshot) {
	snapshot.forEach(function(childSnapshot){
		if(!repeat){
			lastLoaded=childSnapshot.key;
			loadOne(lastLoaded);
		}
		repeat=false;
	});
				isLoading=false;
				if(!loadMore) hideLoader();
});
}

function loadOne(key){
	var database;
	database = firebase.database().ref('/Game Collection/all/'+key);
	database.once('value').then(function(snapshot) {
		if(snapshot.val()==null){
			name="found";
			firebase.database().ref('/Game Collection/'+categoryCurr+"/"+key).remove();
		}else{
			var name = (snapshot.val().name);
			var imageUrl=(snapshot.val().imageUrl);
			var category=(snapshot.val().category);
			var gameId=(snapshot.key);
		}
		createView(name, imageUrl,gameId,category);
	});
}

function createView(name, imageUrl, gameId,category){
	var sample='<div class="col-6 col-md-4 col-lg-2 p-2 animate-in"> <div class="game-card" id="'+gameId+'&c='+category +'" onclick="gameCardClicked(this);"><img src="' + imageUrl + '" loading="lazy"> <h6>' + name + '</h6></div></div>';
	
	document.getElementById("scrollView").innerHTML+=sample;
}

function newCategory(c){
	var isActive = (c.toLowerCase() === categoryCurr.toLowerCase()) ? ' active' : '';
	var sample='<div class="category-chip' + isActive + '" id="'+c+'" onclick="categoryClicked(this);">' + c + '</div>';
		
	document.getElementById("categoriesTab").innerHTML+=sample;
}

function gameCardClicked(e){
	var id=e.id;
	window.open('/game/?id='+id, '_blank');
}

function categoryClicked(e){
	var c=e.id;
	document.getElementById("scrollView").innerHTML="";
	requestCategory(c.toLowerCase());	
}
