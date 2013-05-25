var from;
var to;
var date;
var readableDate;
var time;
var readableTime;
var timeSel;
var method;
var firstArriveTime;
var lastDepartureTime;
//button handlers
$("header a").live("click keydown", function (event) {
    event.preventDefault();
    $('.main').slideUp(function(){
        $.get('request.html', function(data) {
            $('.main').html(data);
            var myDate = new Date();
            var prettyDate = myDate.getFullYear()+ '-' + ((myDate.getMonth()+1)<10?'0':'') + (myDate.getMonth()+1) + '-' + (myDate.getDate()<10?'0':'') + myDate.getDate();
            $('#date').val(prettyDate);
            var prettyTime = (myDate.getHours()<10?'0':'') + myDate.getHours() + ':' + (myDate.getMinutes()<10?'0':'') + myDate.getMinutes();
            $("#time").val(prettyTime);
        });
        $('.main').slideDown();
        $('#from').focus();
    });
});
$(".buttonWrapper").live("click keydown", function (event) {
    event.preventDefault();
    from = $('#from').val();
    to = $('#to').val();
    readableDate = $('#date').val();
    date = readableDate.split('-');
    date = date[2]+date[1]+date[0].substr(2);
    readableTime = $('#time').val();
    time = readableTime.replace(':', '');
    
    method = $(this).attr('id');
    if( method == "departing"){ 
        timeSel = "depart";
    }else{
        timeSel = "arrive";
    }
    var data = 'from='+from+'&to='+to+'&date='+date+'&time='+time;
    data = data + "&timeSel="+timeSel+"&format=json";
    ajaxRequest(data);
});
$(".newRequest").live("click keydown", function (event) {
    event.preventDefault();
    var data = 'from='+from+'&to='+to+'&date='+date;
    if($(this).attr('id')=="earlier"){
        data += '&time='+firstArriveTime+'&timeSel=arrive';
    }else{
        data += '&time='+lastDepartureTime+'&timeSel=depart';
    }
    data += '&format=json';
    ajaxRequest(data);
});

$(window).load(function() {
    $.get('request.html', function(data) {
        $('.main').html(data).slideDown(); 
        $('#from').focus();
        //$('#date').datepicker();
        var myDate = new Date();
        var prettyDate = myDate.getFullYear()+ '-' + ((myDate.getMonth()+1)<10?'0':'') + (myDate.getMonth()+1) + '-' + (myDate.getDate()<10?'0':'') + myDate.getDate();
        $('#date').val(prettyDate);
        var prettyTime = (myDate.getHours()<10?'0':'') + myDate.getHours() + ':' + (myDate.getMinutes()<10?'0':'') + myDate.getMinutes();
        $("#time").val(prettyTime);
    });
});

$(".route").live('click', function(event){ 
    var doOnce = 0;
    event.preventDefault;
    $(this).toggleClass("route-selected");
    $(this).css({'height': 'auto'});
    realThis= $(this);
    if($(this).hasClass("route-selected")){
        $(this).siblings().slideToggle(function(){
            if(doOnce==0){
                realThis.children().not(".train, .duration").slideToggle();
                doOnce++;
            }
        });
    }else{
        $(this).children().not(".train, .duration").slideToggle(function(){
            if(doOnce==0){
                realThis.siblings().slideToggle();
                doOnce++;
            }
        });
    }  
});


function generateResponseHTML(response){
    var mainHTML = '<ul class="responseWrapper">';        
    var responses = response.connection.length;
    if( responses > 6){responses = 6;}
    for (var i = 0; i < responses; i++) {
        
        //Calculate Stuff
        thisResponse = response.connection[i];             
        arrival= new Date(thisResponse.arrival.time*1000);
        arriveTime = (arrival.getHours()<10?'0':'') + arrival.getHours()+':'+(arrival.getMinutes()<10?'0':'') + arrival.getMinutes();
        departure= new Date(thisResponse.departure.time*1000);
        departureTime = (departure.getHours()<10?'0':'') + departure.getHours()+':'+(departure.getMinutes()<10?'0':'') + departure.getMinutes();
        
        //Make a new entry 'li' and parse displayed content
        var entry = '<li class="route">'+ departureTime;  
        entry = entry + " <div class='train'></div>";   
        if(thisResponse.hasOwnProperty("vias")){
            console.log(thisResponse);
            var viacount = thisResponse.vias.number;
            for(var v = 0; v < viacount; v++){
                entry = entry + " → <div class='train'></div>";
            }
        }
        entry = entry + ' ' + arriveTime;
        var duration = getDuration(thisResponse.duration);
        entry += '<span class="duration">[ '+ duration +' ]</span>';
        
        //Parse hidden nested stuff
        entry = entry + '<div class="part-container" style="display: none;">';
        entry = entry + '<div class="part">' + departureTime + '  ' + thisResponse.departure.station + '<span style="float: right;">'+ thisResponse.departure.platform +'</span></div>';
        if(thisResponse.hasOwnProperty("vias")){
            var viacount = thisResponse.vias.number;
            for(var v = 0; v < viacount; v++){
                var vehicle = thisResponse.vias.via[v].vehicle.split(".").pop();
                var direction = thisResponse.vias.via[v].direction.name;
                entry = entry + '<div class="part"> ↓ <span class="direction"><b>'+ vehicle +'</b> '+ direction +'</span></div>';
                entryTime = new Date(thisResponse.vias.via[v].departure.time*1000);
                entryTime = (entryTime.getHours()<10?'0':'') + entryTime.getHours()+':'+(entryTime.getMinutes()<10?'0':'') + entryTime.getMinutes();
                entry = entry + '<div class="part">' + entryTime + ' ' + thisResponse.vias.via[v].station +'<span style="float: right;">'+ thisResponse.vias.via[v].departure.platform +'</span></div>';
            }
         }
         var vehicle = thisResponse.arrival.vehicle.split(".").pop();
         var direction = thisResponse.arrival.direction.name;
         entry = entry + '<div class="part"> ↓ <span class="direction"><b>'+ vehicle +'</b> '+ direction +'</span></div>';
         entry = entry + '<div class="part">' + arriveTime + '  ' + thisResponse.arrival.station + '<span style="float: right;">'+ thisResponse.arrival.platform +'</span></div>';
         entry = entry + '</div>';
         entry = entry +'</li>';
         mainHTML = mainHTML + entry;  
    }
    mainHTML = mainHTML + "</ul>";
    return mainHTML;          
}

function generateHTMLButtons(){
    //Add Buttons
    var firstArrive = new Date(response.connection[0].arrival.time*1000);
    firstArriveTime = (firstArrive.getHours()<10?'0':'') + firstArrive.getHours()+(firstArrive.getMinutes()<10?'0':'') + firstArrive.getMinutes();
    var responses = response.connection.length;
    if( responses > 6){responses = 6;}
    var lastresponse = responses - 1;
    var lastDeparture = new Date(response.connection[lastresponse].departure.time*1000);
    lastDepartureTime = (lastDeparture.getHours()<10?'0':'') + lastDeparture.getHours()+(lastDeparture.getMinutes()<10?'0':'') + lastDeparture.getMinutes();
    var mainHTML = '<div class="item-block" id="time-block">';
    mainHTML += '<a class="newRequest" id="earlier" href="#"><div class="button">« earlier</div></a>';
    mainHTML += '<a class="newRequest" id="later"  href="#"><div class="button">later »</div></a>';
    mainHTML +=  '</div>';
    return mainHTML;
}

function ajaxRequest(data){
    $(".main").slideUp(function(){
        $.ajax({
            type: 'GET', 
            url: "http://api.irail.be/connections/",
            data: data,
            success: function(data){
                var mainHTML ='<div id="overview">From <span>'+ from + '</span> to <span>'+ to +'</span><br />\n<span>'+ method +'</span> on <span>'+ readableDate +'</span> at <span>' + readableTime + '</span></div>';
                response = JSON.parse(data);
                mainHTML = mainHTML + generateResponseHTML(response) + generateHTMLButtons(response);
                $(".main").html(mainHTML).slideDown();
            },
            dataType : "html"
        });
    });
}

function getDuration(s){
    var h = Math.floor(s/3600); //Get whole hours
    s -= h*3600;
    var m = Math.floor(s/60); //Get remaining minutes
    s -= m*60;
    return h+":"+(m < 10 ? '0'+m : m); //zero padding on minutes and seconds
}
