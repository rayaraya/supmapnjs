'use strict';

function setHeight() {
    $('#map').css({
        height: ($(window).height() - 50) + 'px'
    });
}
setHeight();
$(window).resize( setHeight ); 

//var mySlider = $("input.ex1").slider();


var ws;
var pause_flag;
//модифицированный обработчик из библиотеки
var coordinates = [];


ol.events.condition.ctrlShiftKeysOnly = function(mapBrowserEvent) {
    var originalEvent = mapBrowserEvent.originalEvent;
    return (!originalEvent.altKey &&
    (ol.has.MAC ? originalEvent.metaKey : originalEvent.ctrlKey) &&
    originalEvent.shiftKey);
};

var infoBox = document.getElementById('info');
var info2Box = document.getElementById('info2');
var but = document.getElementById('sendButton');
var dragBox = new ol.interaction.DragBox({
    condition: ol.events.condition.platformModifierKeyOnly
});

var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: new ol.View({
        //projection: 'EPSG:4326',
        center: ol.proj.fromLonLat([30.2425,59.9426]),
        zoom: 13
        //  maxResolution: 0.703125
    })
});

var source = new ol.source.Vector();

var vector = new ol.layer.Vector({
      source: source
    });

map.addLayer(vector);


map.addInteraction(dragBox);
dragBox.on('boxend', function(){     
    infoBox.innerHTML = '&nbsp;';
    info2Box.innerHTML = '&nbsp;';
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
    infoBox.innerHTML = str;

    var strmin = + lowerLeft[0] + ','
        + lowerLeft[1] + ','
        + upperRight[0] + ','
        + upperRight[1] ;

    wsConnect(strmin, ws);
})

var imageStyle = new ol.style.Style({
    image: new ol.style.Circle({
      radius: 3,
      snapToPixel: false,
      fill: new ol.style.Fill({color: 'blue'}),
      stroke: new ol.style.Stroke({color: 'white', width: 1})
    })
  });

function addData(cars){
    prepareCrd(cars);
    source.refresh();
    //source.addFeatures(cars);           //обработчик change, можно использовать refresh()
}

function prepareCrd(cars){
    //console.log(cars);
    coordinates = [];
    for(var i = 0; i < cars.length; i++){
        coordinates.push(ol.proj.transform(cars[i], 'EPSG:4326', 'EPSG:3857'));
    }
    //console.log(coordinates);
}

function draw(event){

    var listenerKey;

    function animate(event){
        var vectorContext = event.vectorContext;
        imageStyle.
        vectorContext.setStyle(imageStyle);
        vectorContext.drawGeometry(new ol.geom.MultiPoint(coordinates));
        map.render();
    }
    listenerKey = map.on('postcompose', animate);
}

source.on('change', function(event){
    draw(event);
})


function wsConnect(coord, ws){
    //ws = new WebSocket("ws://serene-plains-38004.herokuapp.com/");
    ws = new WebSocket("ws://localhost:7070/");
    ws.onopen = function(){
        console.log("Opening a connection...");
        try {
                //ws.send(coord);
                ws.send({"SelectedRect" :" "})
        } catch (error) {
                if (ws.readyState !== 1) {
                    var waitSend = setInterval(ws.send(coord), 1000);
                }
        }
            };
    ws.onmessage = function(event){
        //console.log("msg " + event.data)
        //info2Box.innerHTML = event.data;
            //console.log(event.data);
            //console.log(JSON.parse(event.data));
            addData(JSON.parse(event.data));
        };
    ws.onclose = function (event) {
            console.log("I'm sorry. Bye!");
        };
}

$('#play').on('click', function(){
    console.log("play");
    if(ws != null && ws.readyState !== 1 && pause_flag == 1){
        ws.send(JSON.stringify({"button_msg":"play"}));
        pause_flag = 0;
    }
})

$('#pause').on('click', function(){
    console.log("pause");
    if(ws != null && ws.readyState !== 1 && pause_flag == 0){
        ws.send(JSON.stringify({"button_msg":"pause"}));
        pause_flag = 1;
    }
})

$('#close').on('click', function(){
    console.log("close");
    if(ws != null && ws.readyState !== 1 ){
        ws.send(JSON.stringify({"button_msg":"close"}));
        ws.close();
    }
})

