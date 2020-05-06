// JavaScript Document
// Set the configuration for your app
  // TODO: Replace with your project's config object
  var config = {
    apiKey: "AIzaSyCa21G1mEhrJKmoPLRZ8hbJikyI4lGdY5Y",
    authDomain: "dif-instantgames.firebaseapp.com",
    databaseURL: "https://dif-instantgames.firebaseio.com/",
	storageBucket: "dif-instantgames.appspot.com"
  };
  firebase.initializeApp(config);

  //var gameDetails;
  // Get a reference to the database service
 

  var lastLoaded="";
  var isLoading=true;
  var categoryCurr="all";
  var rootLocation="http://wgames.me/";

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
	var sample='<div class="col-4 col-md-2" style="padding:2px;"> <div class="card" style="cursor: pointer;" id="'+gameId+'&c='+category +'" onclick="gameCardClicked(this);"><img src="' + imageUrl + '" class="card-img"> <h6 style="color:white; font-size:12px; text-align: center;">' + name + '</h6></div></div>';
	
	document.getElementById("scrollView").innerHTML+=sample;
}

function newCategory(c){
	var sample='<button type="button" class="mdl-chip" id="'+c+'" onclick="categoryClicked(this);" style="margin-left:4px; cursor: pointer;"> <span class="mdl-chip__text">' + c + '</span> </button> <B>  <B>';
		
	document.getElementById("categoriesTab").innerHTML+=sample;
}

function gameCardClicked(e){
	var id=e.id;
	window.open('http://webgamesportal.ga/game/?id='+id, '_blank');
}

function categoryClicked(e){
	var c=e.id;
	document.getElementById("scrollView").innerHTML="";
	requestCategory(c.toLowerCase());	
}
