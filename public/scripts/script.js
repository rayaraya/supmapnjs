'use strict';

setHeight();

var ws;
var coordinates = [];
var cars_color = 'rgb(0, 85, 110)';

var dragBox = new ol.interaction.DragBox({
    condition: ol.events.condition.platformModifierKeyOnly
});


var mousePositionControl = new ol.control.MousePosition({
    coordinateFormat: ol.coordinate.createStringXY(4),
    projection: 'EPSG:4326',
    // comment the following two lines to have the mouse position
    // be placed within the map.
    //className: 'custom-mouse-position',
    //target: document.getElementById('mouse-position'),
    undefinedHTML: '&nbsp;'
});



var map = new ol.Map({
    controls: ol.control.defaults().extend([mousePositionControl]),
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        //projection: 'EPSG:4326',
        center: ol.proj.fromLonLat([43.994,56.321]),
        zoom: 14
        //  maxResolution: 0.703125
    })
});

var source = new ol.source.Vector();
var rect_source = new ol.source.Vector();
var vector = new ol.layer.Vector({
    source: source
});

var rect_vector = new ol.layer.Vector({
    source: rect_source,
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 255, 0.5)',
            width: 2
        }),
        fill: new ol.style.Fill({
            color: 'rgba(0, 0, 255, 0.07)'
        })
    })
});

var imageStyle = new ol.style.Style({
    image: new ol.style.Circle({
        radius: 3,
        snapToPixel: false,
        fill: new ol.style.Fill({color: 'blue'}),
        stroke: new ol.style.Stroke({color: 'white', width: 1})
    })
});

map.addLayer(vector);
map.addLayer(rect_vector);
map.addInteraction(dragBox);

ol.events.condition.ctrlShiftKeysOnly = function(mapBrowserEvent) {
    var originalEvent = mapBrowserEvent.originalEvent;
    return (!originalEvent.altKey &&
        (ol.has.MAC ? originalEvent.metaKey : originalEvent.ctrlKey) &&
        originalEvent.shiftKey);
};

dragBox.on('boxend', function(){
    console.log(map.getView().getZoom());

    if(map.getView().getZoom() >= 14){
        var rectangle = dragBox.getGeometry().getCoordinates(false)[0];
        var vertexA = rectangle[0];
        var vertexB = rectangle[1];
        var vertexC = rectangle[2];
        var vertexD = rectangle[3];
        var lowerLeft, upperRight;
        if(vertexA[0] != vertexB[0]) {
            if (vertexA[0] < vertexB[0]) {
                upperRight = vertexB;
                lowerLeft = vertexD;
            }
            else {
                lowerLeft = vertexB;
                upperRight = vertexD;
            }
        }
        else {
            if (vertexA[1] < vertexB[1]) {
                lowerLeft = vertexA;
                upperRight = vertexC;
            }
            else {
                upperRight = vertexA;
                lowerLeft = vertexC;
            }
        }
        lowerLeft = ol.proj.toLonLat(lowerLeft);
        upperRight =  ol.proj.toLonLat(upperRight);
        var str = 'http://www.overpass-api.de/api/xapi?way[bbox='
            + lowerLeft[0] + ','
            + lowerLeft[1] + ','
            + upperRight[0] + ','
            + upperRight[1] + ']';

        var strmin = + lowerLeft[0] + ','
            + lowerLeft[1] + ','
            + upperRight[0] + ','
            + upperRight[1] ;

        drawRect(lowerLeft, upperRight);

        wsStartWithSelection(strmin);
    }else{

    }
})

function drawRect(lowerLeft, upperRight) {
    lowerLeft = ol.proj.transform(lowerLeft, 'EPSG:4326', 'EPSG:3857');
    upperRight = ol.proj.transform(upperRight, 'EPSG:4326', 'EPSG:3857');

    var polyCoords = [];
    polyCoords.push(lowerLeft);
    polyCoords.push([lowerLeft[0],upperRight[1]]);
    polyCoords.push(upperRight);
    polyCoords.push([upperRight[0],lowerLeft[1]]);
    polyCoords.push(lowerLeft);

    var feature = new ol.Feature({
        geometry: new ol.geom.Polygon([polyCoords])
    });
    rect_source.addFeature(feature);
    //source.refresh();
}

function addData(cars){
    prepareCrd(cars);
    source.refresh();
}

function prepareCrd(cars){
    var cor = []
    for(var i = 0; i < cars.length; i++){
        cor.push(ol.proj.transform(cars[i], 'EPSG:4326', 'EPSG:3857'));
    }
    coordinates = cor;
}

function draw(){

    var listenerKey;
    listenerKey = map.on('postcompose', animate);
}

function animate(event){
    var vectorContext = event.vectorContext;
    var me = new ol.geom.MultiPoint(coordinates);
    vectorContext.setStyle(imageStyle);
    vectorContext.drawGeometry(me);
    map.render();
}


function wsStartWithSelection(coord){
    map.removeInteraction(dragBox);
    wsConnect(JSON.stringify({"messageType" : "selectedRect", "coordinates" : coord}));
}

function wsStartWithConfigUpload(config){
    wsConnect(config);
}

function wsConnect(message){
    ws = new WebSocket("wss://serene-plains-38004.herokuapp.com/");
    //ws = new WebSocket("ws://localhost:7070/");
    ws.onopen = function(){
        console.log("Opening a connection...");
        try {
            ws.send(message);
        } catch (error) {
            if (ws.readyState !== 1) {
                var waitSend = setInterval(ws.send(message), 1000);
            }
        }
        //map.removeInteraction(dragBox);
    };
    ws.onmessage = function(event){
        var data = JSON.parse(event.data);
        if (data["log"] != null)
            console.log(data)
        else
            addData(data);
    };
    ws.onclose = function (event) {
        ws.send(JSON.stringify({"messageType" : "buttonMsg", "value" :"close"}));
        console.log("I'm sorry. Bye!");
    };
}

rect_source.on('clear', function(){
    coordinates = [];
    source.refresh();
})

source.on('change', function(){
    draw();
})


function setHeight() {
    $('#map').css({
        height: ($(window).height() - 50) + 'px'
    });
}

var speed = $('#speed').slider();

speed.on('change', function(event){
    if(ws != undefined && !(ws.readyState === ws.CLOSED)){
        ws.send(JSON.stringify({"messageType" : "speedChange", "value" : event.value}));
        console.log("speed_change");
    }
});

var capacity = $('#capacity').slider();

capacity.on('change', function(event){
    if(ws != undefined && !(ws.readyState === ws.CLOSED)){
        ws.send(JSON.stringify({"messageType" : "capacityChange", "value" : event.value}));
        console.log("capacity_change");
    }
});

$(window).resize(setHeight);

$('#close').on('click', function(){
    if(ws != undefined && !(ws.readyState === ws.CLOSED)){
        ws.send(JSON.stringify({"messageType" : "buttonMsg", "value" : "close"}));
        rect_source.clear()
        map.render();
        ws.close();
        console.log("close");
    }
})

$('#start_m').on('click', function(){
    if((ws === undefined || ws.readyState === ws.CLOSED)){
        map.addInteraction(dragBox);
    }
    else{
        if(confirm("Do you want to start a new session?")){
            clearSession();
            map.addInteraction(dragBox);
        }
        else{

        }
    }
})

function clearSession() {
    if (!(ws.readyState === ws.CLOSING)){
        ws.send(JSON.stringify({"messageType" : "button_msg", "value" : "close"}));
        ws.close();
    }
    rect_source.clear()
    map.render();
}

var conf_file = document.getElementById("conf_file");
var res = ""
var content

conf_file.onchange = function () {
    var file = conf_file.files[0]//.value.split('\\')[fileupload.value.split('\\').length - 1];
    if (file) {
        if(!(ws === undefined || ws.readyState === ws.CLOSED)){
            if(confirm("Do you want to start a new session?")) {
                clearSession();
            }
            else {
                return;
            }

        }
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            var fileContentString = evt.target.result;
            var fileContentJson = JSON.parse(fileContentString);
            console.log(fileContentJson)
            var coords = fileContentJson["rectangle"];

            var lowerLeft = [coords[1], coords[0]];
            var upperRight = [coords[3], coords[2]];

            //lowerLeft = ol.proj.toLonLat(lowerLeft);
            //upperRight =  ol.proj.toLonLat(upperRight);

            var center_lat = (coords[0] + coords[2]) / 2;
            var center_lon = (coords[1] + coords[3]) / 2;
            map.getView().animate({
                center: ol.proj.fromLonLat([center_lon, center_lat]),
                duration: 2000,
                zoom : 15
            });

            drawRect(lowerLeft, upperRight);

            wsStartWithConfigUpload(fileContentString);
            console.log("sent conf file");
        }
        reader.onerror = function (evt) {
            console.log("error reading file");
        }

    }

};
