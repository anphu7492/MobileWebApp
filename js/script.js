
var map;
var markers = []; // array stores all the markers to show in the map
var infowindow;
var pyrmont;	// user's current location
var dist = []; // array stores distance from current location to different places
var firstFetch = true; // means the first time fetching data from google direction APIs


//------Direction--------
var directionsDisplay;
var directionsService = new google.maps.DirectionsService();

//-----------------------

function getLocation() { // this function gets user's location
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(initialize);
	}
	else
			{x.innerHTML = "Geolocation is not supported by this browser.";}
}

function initialize(position,pretext,searchtext) {
	var latitude = position.coords.latitude; 
	var longitude = position.coords.longitude;
	//------------------------
	directionsDisplay = new google.maps.DirectionsRenderer();
	//-------------------------
	pyrmont = new google.maps.LatLng(latitude, longitude); //pass user's location to pyrmont
	
	map = new google.maps.Map(document.getElementById('map-canvas'), {
		center: pyrmont,
		zoom: 12
	});



	infowindow = new google.maps.InfoWindow();

	//add marker to current Location to test
	var image = {
		url: 'images/pin.png',
		// This marker is 20 pixels wide by 32 pixels tall.
		size: new google.maps.Size(200, 320),
		// The origin for this image is 0,0.
		origin: new google.maps.Point(0,0),
		// The anchor for this image is the base of the flagpole at 0,32.
		anchor: new google.maps.Point(0, 32),
		scaledSize: new google.maps.Size(50, 50) //!!!!!!
	}

  //create marker of user's location
	var myLocation = new google.maps.Marker({
		map: map,
		position: pyrmont,
		icon: image,
		title:"My location"
	});

	myLocation.setMap(map);
	//-----------
	directionsDisplay.setMap(map); // for direction display
}

/*
	This function search the result by keyword given or typed in by users
	textSearch service is used in this function
*/
function searchByKey(key){

	var request = {
		location: pyrmont,
		radius: 5000,
		query: [key] //for textSearch
	};
	var service = new google.maps.places.PlacesService(map);
	service.textSearch(request, callback);
}

// show location by makers array
function showLocations(result){
	switch (result){
		case "all":     //show all markers
			setAllMap(null);
			setAllMap(map);
		break;
		case "clear":    // clear all markers
			setAllMap(null);
			markers = [];
		break;
		default:
			setAllMap(null);
			//markers[result].setMap(map);
			calcRoute(pyrmont, markers[result].position,result);  //calculate distance and find route from current location to a certain place
		break;
	}
}

// Sets the map on all markers in the array.
function setAllMap(map) {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(map);
	}
}

//-----------------
//This function swap value of index i and j together in array "arr"
function swap(arr, i, j) {
	var temp = arr[i];
	arr[i] = arr[j];
	arr[j] = temp;
}
/*this function sort the array dist in ascending order, meanwhile, sort the result array according to distance
Quicksort algorithm is used */
function Qsort(dis, arr, head, tail) {
	var i, j, pivot;
	i = head;
	j = tail;
	pivot = dis[Math.floor((head + tail) / 2)];

	/*partition*/
	while (i <= j) {
		while (dis[i] < pivot)
			i++;
		while (dis[j] > pivot)
			j--;
		if (i <= j) {
			swap(dis, i, j)
			swap(arr, i, j);
			i++;
			j--;
		}
	}
	/*recursion*/
	if (head < j)
		Qsort(dis, arr, head, j);
	if (i < tail)
		Qsort(dis, arr, i, tail);

}

function callback(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
  	markers = [];
  	
  	/*
  		first, loop through the results array to calculate distance to every places
  		and then store the result in a hidden input, after that retrieve the result and pass it into "dist" array
  	*/
  	for (var i = 0; i < results.length; i++) {
  		calcRoute(pyrmont, results[i].geometry.location, i);
  	}
  	
  	setTimeout(function(){
  		var string = document.getElementById("distanceID").value; // retrieve result from hidden input
  		dist = string.split(" "); // store result in "dist" array
  		
  		for (var j=0; j< dist.length-1; j++){ //parse string to int
  			dist[j] = parseInt(dist[j]);
  		}
  		//--------sort-----------------
  		Qsort(dist, results, 0, dist.length - 2);
  		
	 	for (var i = 0; i < dist.length -1; i++) {
			createMarker(results[i], i);
		  	document.getElementsByClassName("distance")[i].innerHTML = dist[i] + " meters";
		}

		// func works with results after generated
		chooseResult();
		add_fav();
		show_clear_all();
  	},200);

  	
  }

}

function createMarker(place, i) {
	var placeLoc = place.geometry.location;
	var coordinates = placeLoc.d +'-'+ placeLoc.e; // get the coordinates as string eg 24.002245-60.03020
	// create map obj for each place
	console.log(coordinates);
	var marker = new google.maps.Marker({
		map: map,
		position: placeLoc
	});
	// add event click to show info on map
	google.maps.event.addListener(marker, 'click', function() {
		infowindow.setContent(place.name + " rating: " + place.rating + " " + place.website + " " + i);
		infowindow.open(map, this);
	});

	
	
	// create result list 
    var make_result =  '<div class="place_result clearfix" data-result="'+i+'">';
  		make_result += '<div class="place_name">'+place.name+'</div>';
  		make_result += '<div class="add_fav_btn" data-name="'+place.name+'" data-add="'+coordinates+'"></div>';
  		make_result += '<div class="distance"></div>';
  		make_result += '<div class="place_add">'+place.formatted_address+'</div>';
  		make_result += '</div>';
  	// append to sidebar
  	$('.place_result_wrap').append(make_result);

  	// push all marker obj into markers array
  	markers.push(marker);
  	calcRoute(pyrmont, placeLoc);
}

//------------------Calculate route----------------
function calcRoute(source, destination) {
  var selectedMode = document.getElementById('transport').value; // get selectedMode

  var request = {
      origin: source,
      destination: destination,
      // Note that Javascript allows us to access the constant
      // using square brackets and a string value as its
      // "property."
      travelMode: google.maps.TravelMode[selectedMode]
  };
  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) { 				// if fetch successfully then display direction on the map
      	if (firstFetch != true) { 									// only display after the first fetch, first fetch is only for calculating distance and sort results
      		directionsDisplay.setDirections(response);
      	}
      	//console.log(response.routes[0].legs[0].distance.value + " meters");
       
       	var dt = response.routes[0].legs[0].distance.value; //save distance

      	document.getElementById("distanceID").value += dt + " "; // put distance in an hidden input
    }
  });
  
  
}
//-----------------------------------------------------
function toggleView(){
	$(".navi_btn").bind("click", function(){
		var this_id = $(this).prop("id");

		switch (this_id) {
			case "menu_left_btn":
				if( $("#left_side").is(':hidden') ){
					$("#left_side").show("slide",300);
					$("#main").animate({marginLeft: "90%"},300);
				} else {
					$("#left_side").hide("slide",300);
					$("#main").animate({marginLeft: 0},300);
				}

			break;
			case "menu_right_btn":
				if( $("#right_side").is(':hidden') ){
					$("#right_side").show("slide",{ direction: "right" },300);
					$("#main").animate({marginLeft: "-90%"},300);
				} else {
					$("#right_side").hide("slide",{ direction: "right" },300);
					$("#main").animate({marginLeft: 0},300);					
				}
			break;
			default:
			break;
		}
	});
}
/*
	when user click a keyword to seach, search function is called
*/
function choosePlace(){
	$(".place").click(function(){
		var key_word = $(this).data("place-key");
		firstFetch = true;
		$('.place_result_wrap').html("");
		$('.place_list').hide();
		searchByKey(key_word);
	});
}

/*
	when user click a result, the map shows up and display the route from current location to that place
*/
function chooseResult(){
	$(".place_result").click(function(){
		var result = $(this).data("result");
		firstFetch = false;
		showLocations(result);
		$('#menu_left_btn').trigger('click');
	});
}

/*
	user types in keyword in search bar, result is fetch according to that keyword
	user can type more then one word or a phrase, google map will find the most match result
*/
function searchPlace(){
	$('.search').bind("change submit",function(){
		var key_word = $(this).val();
		$('.place_result_wrap').html("");
		$('.place_list').hide();
		searchByKey(key_word);		
	});
}

/*
	show map and clear map function
*/
function show_clear_all(){

	$('.show_all_btn').click(function(){
		showLocations("all");
		$('#menu_left_btn').trigger('click');
	});

	$('.clear_all_btn').click(function(){
		showLocations("clear");
		$('#distanceID').val("");
		$('.place_result_wrap').html("");
		$('.place_list').show("slide",300);
	});
	
}


/******************* favorite function ********************/
/*
	this function allows users to add their favorite places
*/
function add_fav(){
	$('.add_fav_btn').bind("tap", function(){
		var name = $(this).data("name"); // get name data
		var add = $(this).data("add"); console.log(typeof(add));
		// Code for localStorage. 
		//delete localStorage.place_add;
		//delete localStorage.place_name;
		if(typeof(Storage)!=="undefined"){
			// create locations array
			var names = localStorage.fav_name ? JSON.parse(localStorage.fav_name) : [];
			var adds = localStorage.fav_add ? JSON.parse(localStorage.fav_add) : [];
			//localStorage.favorite = localStorage.favorite ? localStorage.favorite : ""; //set favorite
			var num = adds.length; // set the next favorite number
			names[num] = name;
			adds[num] = add; // set the new array element's value = location

			localStorage["fav_name"] = JSON.stringify(names); // save to favorite like array by json
			localStorage["fav_add"] = JSON.stringify(adds);
			//console.log(localStorage.fav_name,localStorage.fav_add);

			// make favorite list
		    var make_fav =  '<div class="fav_wrap clearfix">';
		  		make_fav += '<div class="fav_name" data-add="'+adds[num]+'">'+names[num]+'</div>';
		  		make_fav += '<div class="del_fav_btn" data-num="'+num+'"></div>';
		  		make_fav += '</div>';

		  	//prepend the list to a div
	  		$(".fav_list").prepend(make_fav);
	  		$('.del_fav_btn, .fav_name').unbind('tap');
	  		del_fav();
	  		show_fav_location();
		} else {
			alert("Sorry, Your browser doesn't support this feature.");
		}

	});
}

// delete a favorite place
function del_fav(){
	$('.del_fav_btn').bind('tap', function(){

		var num = $(this).data('num');
		var names = localStorage.fav_name ? JSON.parse(localStorage.fav_name) : [];
		var adds = localStorage.fav_add ? JSON.parse(localStorage.fav_add) : [];

		names.splice(num,1);
		adds.splice(num,1); // delete the fav_address in array adds

		localStorage["fav_name"] = JSON.stringify(names); // save to favorite like array by json
		localStorage["fav_add"] = JSON.stringify(adds);	
		//console.log(adds);
		$(".fav_list").html(""); // remove this dom	
		make_fav_list(); // recreate the fav list	
	});
}


function make_fav_list(){
	if(typeof(Storage)!=="undefined"){
		var names = localStorage.fav_name ? JSON.parse(localStorage.fav_name) : [];
		var adds = localStorage.fav_add ? JSON.parse(localStorage.fav_add) : [];

		for( var i=0; i<adds.length; i++ ){
		    var make_fav =  '<div class="fav_wrap clearfix">';
		  		make_fav += '<div class="fav_name" data-add="'+adds[i]+'">'+names[i]+'</div>';
		  		make_fav += '<div class="del_fav_btn" data-num="'+i+'"></div>';
		  		make_fav += '</div>';

	  		$(".fav_list").prepend(make_fav);

	  		if( i == adds.length -1 ){
	  			del_fav();
	  			show_fav_location();
	  		}
		}
	}
}

function show_fav_location(){
	$(".fav_name").bind('tap', function(){
		var add = $(this).data("add").split('-'); // make add data to be an array

		var latitude = Number(add[0]); // parse Number 
		var longitude = Number(add[1]);

		var position = new google.maps.LatLng(latitude,longitude); // create position obj
		setAllMap(null);
		firstFetch = false // set the firstFetch to show the route
		calcRoute(pyrmont, position); // set the position and route on map

		$("#menu_right_btn").trigger("click");
	});
}

// get data from json file using Ajax
function get_data(){
		var result = null;
		$.ajax({
			dataType: 'json',
			url: 'Keys.json',		//This file store give places supported by google
			async: false,  // alow assign variable out side
			success: function (data) {
				result = data;  
			},
			error: function(request,error) 
			{
			 console.log(arguments);
			 alert ( " Can't do because: " + error );
			}
		});
		return result;
}

// function shows a list of given keywords so that users can tap without typing in search bar
function ShowListView () {
	var data_obj = get_data();
	// get the data object from json file
	//console.log(Object.keys(data_obj)[0]);
	
	var objLength = Object.keys(data_obj).length;  // get object length of data_obj => return how many child object in data_obj
	var make_list = "";		//this variable is used to make the list
	
	// loops through the object and child objects to make a list of given keyword
	for (var i = 0; i < objLength; i++) {
		var type = Object.keys(data_obj)[i];		//returns starting letter of keyword, like A, B, C,...
		var objChild = Object.keys(data_obj[type]); //returns child object
		var typeLength = objChild.length;			//returns the length of child object 

		//console.log(data_obj[type][objChild[0]]); //notice!!! Cannot call objChild[objChild[0]]; must go from data_obj

		make_list += '<div class="anphabet">' + type + '</div>';
		for (var j = 0; j < typeLength; j++) {
			make_list +=	'<div class="place clearfix" data-place-key="' + objChild[j] + '">';
			make_list +=	'<div class="place_name">' + data_obj[type][objChild[j]] + '</div>';
			make_list +=	'<div class="place_icon icon_bank"></div>';			
			make_list +=	'</div>';
		}

	}

	//append to place list div
	$('.place_list').append(make_list);
}


google.maps.event.addDomListener(window, 'load', getLocation);

$(document).ready(function(){
	ShowListView();
	make_fav_list();
	toggleView();
	choosePlace();
	searchPlace();
});