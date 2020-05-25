var map;
var mercator = new OpenLayers.Projection("EPSG:900913");
var geographic = new OpenLayers.Projection("EPSG:4326");
var markers;
var fromPoint;
var toPoint;
var numClicks=0;
//var routinoURL="http://www.routino.org/uk-openlayers"
//var routinoURL="http://localhost/routino/www/routino/router.html"
var routinoURL="http://localhost/router.html"
var vectorLayer=null;

var line_style = {
    strokeColor: "#0000EE",
    strokeOpacity: 0.7,
    strokeWidth: 4,
    pointRadius: 6,
    pointerEvents: "visiblePainted"
};


function addMarker(lonlat, popupContentHTML)
{
    var feature = new OpenLayers.Feature(markers, lonlat);
    feature.closeBox = true;
    feature.popupClass = OpenLayers.Popup.FramedCloud;
    feature.data.popupContentHTML = popupContentHTML;
    feature.data.overflow = "auto";

    var marker = feature.createMarker();

    var markerClick = function (evt) {
        if (this.popup == null) {
            this.popup = this.createPopup(this.closeBox);
            map.addPopup(this.popup);
            this.popup.show();
        } else {
            this.popup.toggle();
        }
        currentPopup = this.popup;
        OpenLayers.Event.stop(evt);
    };
    marker.events.register("mousedown", feature, markerClick);

    markers.addMarker(marker);

}
OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
    defaultHandlerOptions: {
        'single': true,
        'double': false,
        'pixelTolerance': 0,
        'stopSingle': false,
        'stopDouble': false
    },
    initialize: function(options) {
        this.handlerOptions = OpenLayers.Util.extend(
            {}, this.defaultHandlerOptions
        );
        OpenLayers.Control.prototype.initialize.apply(
            this, arguments
        );
        this.handler = new OpenLayers.Handler.Click(
            this, {
                'click': this.trigger
            }, this.handlerOptions
        );
    },
    trigger: function(e) {
        var lonlat = map.getLonLatFromViewPortPx(e.xy);
        numClicks++;
        //alert("Kliknąłeś "+numClicks+" razy");
        //getLocationData(lonlat.lon, lonlat.lat);
        if (numClicks==1) {
            /* Marker startowy */
            markers.clearMarkers();
            fromPoint = new OpenLayers.LonLat(lonlat.lon, lonlat.lat);
            getLocationData(lonlat.lon, lonlat.lat);
        }
        else if (numClicks==2) {
            /* Marker końcowy */
            toPoint = new OpenLayers.LonLat(lonlat.lon, lonlat.lat);
            getLocationData(lonlat.lon, lonlat.lat);
            getRoute(fromPoint, toPoint);
            numClicks=0;
        } else {
            numClicks=0;
        }
    }
});

function getLocationData(lon, lat)
{
    var xhttp = new XMLHttpRequest();
    var url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat="+lat+"&lon="+lon;
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var result = JSON.parse(xhttp.responseText);
            var locationData = result.display_name;
            addMarker(new OpenLayers.LonLat(lon, lat), locationData);
        }
    }
    xhttp.open("GET", url, true);
    xhttp.send();
};

function getRoute(fromPoint,toPoint)
{
    fromPoint = new OpenLayers.LonLat(10.2, 48.9)
    toPoint = new OpenLayers.LonLat(10.4, 48.9)
    var request = new XMLHttpRequest();
    var url = routinoURL+"router.cgitransport=motorcar;lon1="+fromPoint.lon+";lat1="+fromPoint.lat+";lon2="+toPoint.lon+";lat2="+toPoint.lat+";language=en;type=shortest";
    request.onreadystatechange = function() {
        //alert(this.readyState);
        alert(this.status);	//show request status
        if (this.readyState == 4 && this.status == 200) {
            var result = request.responseText;
            var uuid = result.substring(0,result.length - 4);
            alert(uuid);
            alert(result);
            getRoutePolyline(result);

        }
    };
    request.open("GET", url, true);
    request.send();

}

function getRoutePolyline(result)
{
    var url = routinoURL+"results.cgi?uuid="+result+";type=shortest;format=gpxtrack";
    vectorLayer = new OpenLayers.Layer.Vector("Routes",
        {
            protocol: new OpenLayers.Protocol.HTTP({url: url, format: new
                OpenLayers.Format.GPX()}),
            strategies: [new OpenLayers.Strategy.Fixed()],
            projection: map.displayProjection
        }
    );
    map.addLayer(vectorLayer);
}


function init()
{
    var options = {
        projection: mercator,
        displayProjection: geographic,
        units: "m",
        maxResolution: 156543.0339,
        maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34,
            20037508.34, 20037508.34)
    };
    map = new OpenLayers.Map('map', options);

    var osm = new OpenLayers.Layer.OSM();

    markers = new OpenLayers.Layer.Markers("points");

    map.addLayer(osm);

    map.addLayer(markers);

    map.addControl(new OpenLayers.Control.LayerSwitcher());
    map.addControl(new OpenLayers.Control.MousePosition());

    map.setCenter(new OpenLayers.LonLat(10.2, 48.9).transform(
        geographic, mercator), 5);



    addMarker(new OpenLayers.LonLat(20, 50).transform(geographic, mercator), "Jestem Markerem.");

    var click = new OpenLayers.Control.Click();
    map.addControl(click);
    click.activate();
}
