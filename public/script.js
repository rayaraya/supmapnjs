//https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson
//модифицированный обработчик из библиотеки
ol.events.condition.ctrlShiftKeysOnly = function(mapBrowserEvent) {
    var originalEvent = mapBrowserEvent.originalEvent;
       return (!originalEvent.altKey &&
        (ol.has.MAC ? originalEvent.metaKey : originalEvent.ctrlKey) &&
        originalEvent.shiftKey);
};
function wsConnect(coord){
    var ws = new WebSocket("ws://localhost:7070");
    ws.onopen = function(){
        console.log("Opening a connection...");
        try {
            ws.send(coord);
        } catch (error) {
            if (ws.readyState !== 1) {
                var waitSend = setInterval(ws.send(coord), 1000);
            }
        }
    };
    var i = 0, lon = 30.2424, lat = 59.9431;
    ws.onmessage = function(event){
        var str = event.data;
        var arr = str.split(" ");
        lat = arr[0];
        lon = arr[1];
        i += 0.001;

        //console.log(lon + " " + lat);

        dot.setGeometry(new ol.geom.Point(ol.proj.transform([lon*1 ,lat*1], 'EPSG:4326', 'EPSG:3857')));
        /*if(i == -1)
            lat = crd;
        else
            lon = crd;

        i *= -1;*/

       /* dot_source.addFeature(new ol.Feature(
                new ol.geom.Point
                        (ol.proj.transform([lon,lat], 'EPSG:4326', 'EPSG:3857'))));
        map.render();*/
        //console.log("msg " + event.data)
          //  info2Box.innerHTML = event.data;
    };
    ws.onclose = function (event) {
        console.log("I'm sorry. Bye!");
    };
    but.onclick = function(event) {
        ws.close();
    }
}
function changePlace(){
    dot.setGeometry(new ol.geom.Point(ol.proj.transform([30.216170226499887,59.95263361646573], 'EPSG:4326', 'EPSG:3857')))
}
//
var dot = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.transform([30.214218875847227,59.944862260488776], 'EPSG:4326', 'EPSG:3857'))
            });
var dotsArr = new Array(dot);
var dot_source = new ol.source.Vector({features: dotsArr});
//dot_source.addFeatures();
var dot_layer = new ol.layer.Vector({
            title: 'VectorLayer1',
            source: dot_source,
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 3,
                    fill: new ol.style.Fill({color: 'red'})
                })
            })
});
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM(),
        }), 
        dot_layer
    ],
    view: new ol.View({
        //projection: 'EPSG:4326',
        center: ol.proj.fromLonLat([30.2425,59.9426]),
        zoom: 13
        //maxResolution: 0.95
    })
});
// 
var infoBox = document.getElementById('info');
var info2Box = document.getElementById('info2');
var but = document.getElementById('sendButton');
var dragBox = new ol.interaction.DragBox({
    condition: ol.events.condition.platformModifierKeyOnly
});
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
        //console.log(str);
        infoBox.innerHTML = str;
        var coord = {"d": str}
        wsConnect(str);
})