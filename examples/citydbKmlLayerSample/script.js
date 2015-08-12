    
	document.getElementById('loadingIndicator').style.display = 'none';
	
	// initiate 3Dcitydb-web-map instance
	var cesiumViewer = new Cesium.Viewer('cesiumContainer', {
		selectedImageryProviderViewModel  : Cesium.createDefaultImageryProviderViewModels()[1]
	});
	
	//	cesiumViewer.extend(Cesium.viewerCesiumInspectorMixin);
	
	var cesiumCamera = cesiumViewer.scene.camera;
	var webMap = new WebMap3DCityDB(cesiumViewer);	
	
	// active mouseClick Event		
	webMap.activateMouseClickEvents(true);
	webMap.activateMouseMoveEvents(true);
	webMap.activateViewChangedEvent(true);

    // creating some layers which were exported from 3DCityDB using KML/Collada/Gltf Exporter
	var layers = new Array();

  	layers.push(new CitydbKmlLayer({
		url : 'http://www.3dcitydb.net/3dcitydb/fileadmin/mydata/Berlin_Center_Texture_Md/Berlin_Center_Texture_Md_MasterJSON.json',
		name : 'Berlin_CityCenter_Building_Texture',
		activeHighlighting: true,
		id : "Berlin_CityCenter_Building_Texture"
	}));

	layers.push(new CitydbKmlLayer({
		url : 'http://www.3dcitydb.net/3dcitydb/fileadmin/mydata/NYK_All_Geometry/NYK_All_Geometry/NYK_All_Geometry_MasterJSON.json',
		name : 'NewYork_Building_LOD1_ExtrudedGeometry',
		activeHighlighting: true,
		id : 'NewYork_Building_LOD1_ExtrudedGeometry'
	}));

	layers.push( new CitydbKmlLayer({
		url : 'http://www.3dcitydb.net/3dcitydb/fileadmin/mydata/London_LOD2_NO_HIGHLIGHTING/London_Geometry_LOD2.kml',
		name : 'London_Building_LOD2_Geometry',
		activeHighlighting: true,
		id : 'London_Building_LOD2_Geometry'
	}));

/*	layers.push(new CitydbKmlLayer({
		url : 'http://www.3dcitydb.net/3dcitydb/fileadmin/mydata/Berlin_All_Geometry/Berlin_All_Geometry_MasterJSON.json',
		name : 'Berlin_Building_LOD2_ThematicSurfaceGeometry',
		activeHighlighting: true,
		pickSurface: true,
		id : 'Berlin_Building_LOD2_ThematicSurfaceGeometry'
	}));*/

	// sync object list...
	observeObjectList();
	
	// start loading layers one by one...
	loadLayerGroup(layers);
	
	// Zoom to desired camera position...
	zoomToDefaultCameraPosition();
	
	function observeObjectList() {
		var observable = Cesium.knockout.getObservable(webMap, '_activeLayer');
		var highlightedObjectsSubscription = undefined;
		var hiddenObjectsSubscription = undefined;
		
		var highlightingListElement = document.getElementById("highlightinglist");
		highlightingListElement.onchange = function() {
            zoomToObject(this.value);
        };
        
		var hiddenListElement = document.getElementById("hiddenlist");
		hiddenListElement.onchange = function() {
            zoomToObject(this.value);
        };
		
		observable.subscribe(function(deSelectedLayer) {
			if (Cesium.defined(highlightedObjectsSubscription)) {
				highlightedObjectsSubscription.dispose();
			}	
			if (Cesium.defined(hiddenObjectsSubscription)) {
				hiddenObjectsSubscription.dispose();
			}	
		}, observable, "beforeChange");
		
		observable.subscribe(function(selectedLayer) {
	        if (Cesium.defined(selectedLayer)) {
	      		document.getElementById(selectedLayer.id).childNodes[0].checked = true;  
	      		
	      		highlightedObjectsSubscription = Cesium.knockout.getObservable(selectedLayer, '_highlightedObjects').subscribe(function(highlightedObjects) {					
			  		while (highlightingListElement.length > 1) {
			  			highlightingListElement.remove(1);
			  		}
			  		for (var id in highlightedObjects){
			  			var option = document.createElement("option");
				  		option.text = id;
				  		highlightingListElement.add(option);						
				  	}				  		
			    });	      		
	      		selectedLayer.highlightedObjects = selectedLayer.highlightedObjects;
	      		
	      		hiddenObjectsSubscription = Cesium.knockout.getObservable(selectedLayer, '_hiddenObjects').subscribe(function(hiddenObjects) {					
			  		while (hiddenListElement.length > 1) {
			  			hiddenListElement.remove(1);
			  		}			  					  		
			  		for (var k = 0; k < hiddenObjects.length; k++){	
						var id = hiddenObjects[k];			
						var option = document.createElement("option");
				  		option.text = id;
				  		hiddenListElement.add(option);	
					}				  		
			    });	      		
	      		selectedLayer.hiddenObjects = selectedLayer.hiddenObjects;      		
	        } 
	    });
	}

	function loadLayerGroup(layers) {
		var k = 0;
		loadLayer(layers[k]);
		function loadLayer(_layer) {
			var tempMenuOption;
			_layer.registerEventHandler("STARTLOADING", function(thisLayer) {
				document.getElementById('loadingIndicator').style.display = 'block';				
			});
			_layer.registerEventHandler("FINISHLOADING", function(thisLayer) {
				console.log(thisLayer);
				addEventListeners(thisLayer);			
				document.getElementById('loadingIndicator').style.display = 'none';
				addLayerToList(_layer);
				k++;
				if (k < layers.length) {
					var currentLayer = layers[k];
					loadLayer(currentLayer);
					webMap.addLayer(currentLayer);
				}
				else {
					webMap.activeLayer = layers[0];
				}
			});
		}
	}
	
  	function addLayerToList(layer) {
  		var radio = document.createElement('input');
  		radio.type = "radio";
  		radio.name = "dummyradio";
  		radio.onchange = function(event) {	    	
	        var targetRadio = event.target;
	        var layerId = targetRadio.parentNode.id;
	        webMap.activeLayer = webMap.getLayerbyId(layerId);
	        console.log(webMap.activeLayer);
	    };
  		
  		var checkbox = document.createElement('input');
	    checkbox.type = "checkbox";
	    checkbox.id = "id";
	    checkbox.checked = true;
	    checkbox.onchange = function(event) {	    	
	        var checkbox = event.target;
	        var layerId = checkbox.parentNode.id;
	        var citydbLayer = webMap.getLayerbyId(layerId);
	        if (checkbox.checked) {
	            console.log("Layer " + citydbLayer.name + " is visible now!");
	            citydbLayer.activate(true);
	        } else {
	        	console.log("Layer " + citydbLayer.name + " is not visible now!");
	        	citydbLayer.activate(false);
	        }
	    };
	    
	    var label = document.createElement('label')
	    label.appendChild(document.createTextNode(layer.name));
	    
	    var layerOption = document.createElement('div');
	    layerOption.id = layer.id;
	    layerOption.appendChild(radio);
	    layerOption.appendChild(checkbox);
	    layerOption.appendChild(label);
	    
	    label.ondblclick = function(event) {
	    	event.preventDefault();
	    	var layerId = event.target.parentNode.id;
	    	var citydbLayer = webMap.getLayerbyId(layerId);
	    	citydbLayer.zoomToLayer();
	    }

	    var layerListBox = document.getElementById("layerlistbox")
	    layerListBox.appendChild(layerOption);
  	}
	
	function addEventListeners(citydbKmlLayer) {
		// clickEvent Handler for Highlighting...	
		var highlightColor = new Cesium.Color(0.4, 0.4, 0.0, 1.0);
		var mouseOverhighlightColor = new Cesium.Color(0.0, 0.3, 0.0, 1.0);
		var mainMouseOverhighlightColor = new Cesium.Color(0.0, 0.4, 0.0, 1.0);
		var subMouseOverhighlightColor = new Cesium.Color(0.0, 0.5, 0.0, 1.0);
		
		citydbKmlLayer.registerEventHandler("CLICK", function(object) {
			var targetEntity = object.id;
	 		var primitive = object.primitive;
	 		
	 		var globeId; 
	 		if (citydbKmlLayer.pickSurface != true) {
	 			globeId = targetEntity.name.replace('_RoofSurface', '').replace('_WallSurface', '');
	 		}
	 		else {
	 			globeId = targetEntity.name;
	 		}
	 		
	 		if (citydbKmlLayer.isInHighlightedList(globeId))
				return; 
	 	    // clear all other Highlighting status and just highlight the clicked object...
			citydbKmlLayer.unHighlightAllObjects();  									
			var highlightThis = {};
			
			highlightThis[globeId] = highlightColor;
			citydbKmlLayer.highlight(highlightThis); 								
		});
		
		// CtrlclickEvent Handler for Multi-Selection and Highlighting...
		citydbKmlLayer.registerEventHandler("CTRLCLICK", function(object) {
			var targetEntity = object.id;
	 		var primitive = object.primitive;

	 		var globeId; 
	 		if (citydbKmlLayer.pickSurface != true) {
	 			globeId = targetEntity.name.replace('_RoofSurface', '').replace('_WallSurface', '');
	 		}
	 		else {
	 			globeId = targetEntity.name;
	 		}
	 		
			if (citydbKmlLayer.isInHighlightedList(globeId)) {
				citydbKmlLayer.unHighlight([globeId]);
			}else {
				var highlightThis = {};				
				highlightThis[globeId] = highlightColor;
				citydbKmlLayer.highlight(highlightThis); 
			}								
		});
		
		// MouseIn- and MouseOut-Event Handler for MouseOver-Highlighting
		citydbKmlLayer.registerEventHandler("MOUSEIN", function(object) {
			var targetEntity = object.id;
	 		var primitive = object.primitive;
	 		if (citydbKmlLayer.isInHighlightedList(targetEntity.name))
				return;
			if (primitive instanceof Cesium.Model) {				
				var materials = object.mesh._materials;
				for (var i = 0; i < materials.length; i++) {
					// do mouseOver highlighting
					materials[i].setValue('emission', Cesium.Cartesian4.fromColor(mouseOverhighlightColor));
				} 
			}
			else if (primitive instanceof Cesium.Primitive) {	
				if ((targetEntity.name.indexOf('_RoofSurface') > -1 || targetEntity.name.indexOf('_WallSurface') > -1) && citydbKmlLayer.pickSurface != true) {
					var globeId = targetEntity.name.replace('_RoofSurface', '').replace('_WallSurface', '');
					var roofEntities = citydbKmlLayer.getEntitiesById(globeId + '_RoofSurface');
					var wallEntities = citydbKmlLayer.getEntitiesById(globeId + '_WallSurface');
					
					if (roofEntities != null && wallEntities != null) {
						if (targetEntity.name.indexOf('_RoofSurface') > -1) {
							_doMouseoverHighlighting(roofEntities, primitive, mainMouseOverhighlightColor);
							_doMouseoverHighlighting(wallEntities, primitive, subMouseOverhighlightColor);
						}
						else {
							_doMouseoverHighlighting(roofEntities, primitive, subMouseOverhighlightColor);
							_doMouseoverHighlighting(wallEntities, primitive, mainMouseOverhighlightColor);
						}
					}
				}
				else {
					try{
						var parentEntity = targetEntity._parent;	
						var childrenEntities = parentEntity._children;						
					}
					catch(e){return;} // not valid entities
					_doMouseoverHighlighting(childrenEntities, primitive, mouseOverhighlightColor);
				}

				function _doMouseoverHighlighting(_childrenEntities, _primitive, _mouseOverhighlightColor) {
					for (var i = 0; i < _childrenEntities.length; i++){	
						var childEntity = _childrenEntities[i];							
						var attributes = _primitive.getGeometryInstanceAttributes(childEntity);
						if (!Cesium.defined(childEntity.originalSurfaceColor)) {
							childEntity.addProperty("originalSurfaceColor");
						}						
						childEntity.originalSurfaceColor = attributes.color;
						attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(_mouseOverhighlightColor); 
					}
				}
			}
		});
		
	 	citydbKmlLayer.registerEventHandler("MOUSEOUT", function(object) {
	 		var primitive = object.primitive;
	 		var targetEntity = object.id;
	 		if (citydbKmlLayer.isInHighlightedList(targetEntity.name))
				return; 
			if (primitive instanceof Cesium.Model) {				
				var materials = object.mesh._materials;
				for (var i = 0; i < materials.length; i++) {
					// dismiss highlighting
					materials[i].setValue('emission', new Cesium.Cartesian4(0.0, 0.0, 0.0, 1));
				} 
			}
			else if (primitive instanceof Cesium.Primitive) {				
				if ((targetEntity.name.indexOf('_RoofSurface') > -1 || targetEntity.name.indexOf('_WallSurface') > -1)  && citydbKmlLayer.pickSurface != true) {
					var globeId = targetEntity.name.replace('_RoofSurface', '').replace('_WallSurface', '');
					var roofEntities = citydbKmlLayer.getEntitiesById(globeId + '_RoofSurface');
					var wallEntities = citydbKmlLayer.getEntitiesById(globeId + '_WallSurface');
					
					if (roofEntities != null && wallEntities != null) {
						_dismissMouseoverHighlighting(roofEntities, primitive);
						_dismissMouseoverHighlighting(wallEntities, primitive);
					}
				}
				else {
					try{
						var parentEntity = targetEntity._parent;	
						var childrenEntities = parentEntity._children;		
						
					}
					catch(e){return;} // not valid entities
					_dismissMouseoverHighlighting(childrenEntities, primitive);	
				}
							
				function _dismissMouseoverHighlighting(_childrenEntities, _primitive) {
					for (var i = 0; i < _childrenEntities.length; i++){	
						var childEntity = _childrenEntities[i];	
						var originalSurfaceColor = childEntity.originalSurfaceColor;
						try{
							var attributes = _primitive.getGeometryInstanceAttributes(childEntity);
							attributes.color = originalSurfaceColor; 
						}
						catch(e){
							console.log(e);
							/* escape the DeveloperError exception: "This object was destroyed..." */
						}
					}
				}
			}
		});	 
	}
 	
	function zoomToDefaultCameraPosition() {	
		var latstr = CitydbUtil.parse_query_string('lat', window.location.href);
	    var lonstr = CitydbUtil.parse_query_string('lon', window.location.href);
	    
	    if (latstr && lonstr) {	    	
	        var lat = parseFloat(latstr);
	        var lon = parseFloat(lonstr);
	        var range = 800;
	        var heading = 6;
	        var tilt = 49;
	        var altitude = 40;

	        var rangestr = CitydbUtil.parse_query_string('range', window.location.href);
	        if (rangestr) 
	        	range = parseFloat(rangestr);

	        var headingstr = CitydbUtil.parse_query_string('heading', window.location.href);
	        if (headingstr) 
	        	heading = parseFloat(headingstr);

	        var tiltstr = CitydbUtil.parse_query_string('tilt', window.location.href);
	        if (tiltstr) 
	        	tilt = parseFloat(tiltstr);

	        var altitudestr = CitydbUtil.parse_query_string('altitude', window.location.href);
	        if (altitudestr) 
	        	altitude = parseFloat(altitudestr);

	        var _center = Cesium.Cartesian3.fromDegrees(lon, lat);
	        var _heading = Cesium.Math.toRadians(heading);
	        var _pitch = Cesium.Math.toRadians(tilt - 90);
	        var _range = range;
	        cesiumCamera.flyTo({
	            destination : Cesium.Cartesian3.fromDegrees(lon, lat, _range),
	            complete: function() {
	            	cesiumCamera.lookAt(_center, new Cesium.HeadingPitchRange(_heading, _pitch, _range));
	            	cesiumCamera.lookAtTransform(Cesium.Matrix4.IDENTITY);
	  				// adding layer to Cesium Map          	          	
	            	webMap.addLayer(layers[0]);    
	            }
	        })
	    } 
	    else {
	    	// default camera postion
	    	var extent = new Cesium.Rectangle.fromDegrees(13.34572857, 52.5045771, 13.427975, 52.658449);
	    	cesiumCamera.viewRectangle(extent);
	    	// adding layer to Cesium Map          	          	
	    	webMap.addLayer(layers[0]);     
	    }
	}

    
    /**---------------------------------  Button ClickEvent Handler  ----------------------------------------**/ 
    
    // Creation of a weblink for sharing with other people..
 	function generateLink(){
  		var cameraPostion = null;	    		    	   	
    	var ray = cesiumCamera.getPickRay(new Cesium.Cartesian2(
            Math.round(cesiumViewer.scene.canvas.clientWidth / 2),
            Math.round(cesiumViewer.scene.canvas.clientHeight / 2)
        ));
        var position = cesiumViewer.scene.globe.pick(ray, cesiumViewer.scene);
        if (Cesium.defined(position)) {
            var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
            var range = Cesium.Cartesian3.distance(position, cesiumCamera.position);
            cameraPostion = {
	    		lat: Cesium.Math.toDegrees(cartographic.latitude),	
	    		lon: Cesium.Math.toDegrees(cartographic.longitude),
				range: range,
				tilt: Cesium.Math.toDegrees(cesiumCamera.pitch)+ 90,
				heading:  Cesium.Math.toDegrees(cesiumCamera.heading),
				altitude: 0
	    	};  
			var	projectLink = location.protocol + '//' + location.host + location.pathname + '?' +
			'lat=' + cameraPostion.lat +
			'&lon=' + cameraPostion.lon +
			'&range=' + cameraPostion.range +
			'&tilt=' + cameraPostion.tilt +
			'&heading=' + cameraPostion.heading +
			'&altitude=' + cameraPostion.altitude;
			window.history.pushState("string", "Title", projectLink);
        }
  	};
  	
  	// Clear Highlighting effect of all highlighted objects
  	function clearhighlight(){		
  		var layers = webMap._layers;
  		for (var i = 0; i < layers.length; i++) {
  			layers[i].unHighlightAllObjects();
  		} 		
  	};
  	
    // hide the selected objects
  	function hideSelectedObjects(){ 	 		
  		var layers = webMap._layers;
  		var objectIds;
  		for (var i = 0; i < layers.length; i++) {
  			objectIds = Object.keys(layers[i].highlightedObjects);
  			layers[i].hideObjects(objectIds); 
  		}
  	};
  	
    // show the hidden objects
  	function showHiddenObjects(){
  		var layers = webMap._layers;
  		for (var i = 0; i < layers.length; i++) {
  			layers[i].showAllObjects();
  		}
  	};
  	
  	function zoomToObject(gmlId) {
  		var jsonpUrl = CitydbUtil.get_host_and_file_wo_suffix_from_URL(webMap.activeLayer.url).replace('_MasterJSON', '') + 'json';  
		var promise = jsonp(jsonpUrl);
		var _deferred = Cesium.when.defer();
		Cesium.when(promise, function(result) {
			var obj = result[gmlId];
	        if (obj) {	        	
	            // the entered string is a known GMLID; let's fly
	            // to the center point of the corresponding feature
	            var lon = (obj.envelope[0] + obj.envelope[2]) / 2.0;
	            var lat = (obj.envelope[1] + obj.envelope[3]) / 2.0;
	    		var center = Cesium.Cartesian3.fromDegrees(lon, lat);
    	        var heading = Cesium.Math.toRadians(0);
    	        var pitch = Cesium.Math.toRadians(-50);
    	        var range = 150;

	            cesiumCamera.flyTo({
	                destination : Cesium.Cartesian3.fromDegrees(lon, lat, range),
	                complete: function() {
	                	cesiumCamera.lookAt(center, new Cesium.HeadingPitchRange(heading, pitch, range));
	                	cesiumCamera.lookAtTransform(Cesium.Matrix4.IDENTITY); 
	                	_deferred.resolve(gmlId);
	                }
	            })
	        }
	        else {
	        	_deferred.reject(gmlId);
	        }
		}, function() {
			throw new Cesium.DeveloperError(arguments);
		});		        
  		
  		function jsonp(jsonpUrl) {
  			var deferred = Cesium.when.defer();
  			jQuery.noConflict().ajax({		    	
		        url: jsonpUrl + '?jsoncallback=?',   
		        dataType: "jsonp",
		        jsonpCallback: "handle_3DCityDB_data", 
		        timeout: 30000, 
		        success: function(json){		        	
		        	 deferred.resolve(json);
		        },
		        error: function(){
		        	deferred.reject(arguments);
		        }
		    }); 
  			return deferred.promise;
  		}
  		
  		return _deferred;
  	}
  	
  	cesiumViewer.geocoder.viewModel._searchCommand.beforeExecute.addEventListener(function(info){ 	
		var gmlId = cesiumViewer.geocoder.viewModel._searchText;	
		var promise = zoomToObject(gmlId);
		Cesium.when(promise, function(result) {
			info.cancel = true;
        	cesiumViewer.geocoder.viewModel.searchText = "Object " + gmlId + " has been found!";
		},function() {
			throw new Cesium.DeveloperError(arguments);
		});	
  	});

	