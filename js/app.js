var APP = {

	Player: function () {

		var renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setPixelRatio( window.devicePixelRatio ); // TODO: Use player.setPixelRatio()

		var loader = new THREE.ObjectLoader();

		var camera, scene;

		var vrButton = VRButton.createButton( renderer ); // eslint-disable-line no-undef

		var events = {};

		let move = false
		let from,to,rotateFrom,rotateTo
		let speed = 0.1
		let rotateSpeed = 0.01
		let pos = 0

		function moveTo(t,rt){
			move = true
			// Move
			var x = Math.round(camera.position.x)
			var y = Math.round(camera.position.y)
			var z = Math.round(camera.position.z)
			from = new THREE.Vector3(x,y,z)
			to = t
			// Rotate
			var rx = camera.rotation.x
			var ry = camera.rotation.y
			var rz = camera.rotation.z
			rotateFrom = new THREE.Vector3(rx,ry,rz)
			rotateTo = new THREE.Vector3(rt.x*Math.PI/180,rt.y*Math.PI/180,rt.z*Math.PI/180)
		}

		function moveAnimate(){
	
			if((Math.round(camera.position.x) == to.x) && 
			(Math.round(camera.position.y) == to.y) &&
			(Math.round(camera.position.z) == to.z)){
				move = false
			}

			// Move x
			if((from.x - to.x) > 0){
				if(camera.position.x > to.x){
					camera.position.x -= speed
				}
			}else if((from.x - to.x) < 0){
				if(camera.position.x < to.x){
					camera.position.x += speed
				}
			} 

			// Move y
			if((from.y - to.y) > 0){
				if(camera.position.y > to.y){
					camera.position.y -= speed
				}
			}else if((from.y - to.y) < 0){
				if(camera.position.y < to.y){
					camera.position.y += speed
				}
			} 

			// Move z
			if((from.z - to.z) > 0){
				if(camera.position.z > to.z){
					camera.position.z -= speed
				}
			}else if((from.z - to.z) < 0){
				if(camera.position.z < to.z){
					camera.position.z += speed
				}
			} 

		}

		function rotateAnimate(){
			// Move x
			if((rotateFrom.x - rotateTo.x) > 0){
				if(camera.rotation.x > rotateTo.x){
					camera.rotation.x -= rotateSpeed
				}
			}else if((rotateFrom.x - rotateTo.x) < 0){
				if(camera.rotation.x < rotateTo.x){
					camera.rotation.x += rotateSpeed
				}
			} 

			// Move y
			if((rotateFrom.y - rotateTo.y) > 0){
				if(camera.rotation.y > rotateTo.y){
					camera.rotation.y -= rotateSpeed
				}
			}else if((rotateFrom.y - rotateTo.y) < 0){
				if(camera.rotation.y < rotateTo.y){
					camera.rotation.y += rotateSpeed
				}
			} 

			// Move z
			if((rotateFrom.z - rotateTo.z) > 0){
				if(camera.rotation.z > rotateTo.z){
					camera.rotation.z -= rotateSpeed
				}
			}else if((rotateFrom.z - rotateTo.z) < 0){
				if(camera.rotation.z < rotateTo.z){
					camera.rotation.z += rotateSpeed
				}
			} 

		}

		var dom = document.createElement( 'div' );
		dom.appendChild( renderer.domElement );

		this.dom = dom;

		this.width = 500;
		this.height = 500;

		this.load = function ( json ) {
			var project = json.project;

			if ( project.vr !== undefined ) renderer.xr.enabled = project.vr;
			if ( project.shadows !== undefined ) renderer.shadowMap.enabled = project.shadows;
			if ( project.shadowType !== undefined ) renderer.shadowMap.type = project.shadowType;
			if ( project.toneMapping !== undefined ) renderer.toneMapping = project.toneMapping;
			if ( project.toneMappingExposure !== undefined ) renderer.toneMappingExposure = project.toneMappingExposure;
			if ( project.useLegacyLights !== undefined ) renderer.useLegacyLights = project.useLegacyLights;

			this.setScene( loader.parse( json.scene ) );
			this.setCamera( loader.parse( json.camera ) );

			events = {
				init: [],
				start: [],
				stop: [],
				keydown: [],
				keyup: [],
				pointerdown: [],
				pointerup: [],
				pointermove: [],
				update: []
			};

			var scriptWrapParams = 'player,renderer,scene,camera';
			var scriptWrapResultObj = {};

			for ( var eventKey in events ) {

				scriptWrapParams += ',' + eventKey;
				scriptWrapResultObj[ eventKey ] = eventKey;

			}

			var scriptWrapResult = JSON.stringify( scriptWrapResultObj ).replace( /\"/g, '' );

			for ( var uuid in json.scripts ) {

				var object = scene.getObjectByProperty( 'uuid', uuid, true );

				if ( object === undefined ) {

					console.warn( 'APP.Player: Script without object.', uuid );
					continue;

				}

				var scripts = json.scripts[ uuid ];

				for ( var i = 0; i < scripts.length; i ++ ) {

					var script = scripts[ i ];

					var functions = ( new Function( scriptWrapParams, script.source + '\nreturn ' + scriptWrapResult + ';' ).bind( object ) )( this, renderer, scene, camera );

					for ( var name in functions ) {

						if ( functions[ name ] === undefined ) continue;

						if ( events[ name ] === undefined ) {

							console.warn( 'APP.Player: Event type not supported (', name, ')' );
							continue;

						}

						events[ name ].push( functions[ name ].bind( object ) );

					}

				}

			}

			dispatch( events.init, arguments );

		};

		this.setCamera = function ( value ) {
			camera = value;
			camera.aspect = this.width / this.height;
			camera.updateProjectionMatrix();
		};

		this.setScene = function ( value ) {

			scene = value;

		};

		this.setPixelRatio = function ( pixelRatio ) {

			renderer.setPixelRatio( pixelRatio );

		};

		this.setSize = function ( width, height ) {

			this.width = width;
			this.height = height;

			if ( camera ) {

				camera.aspect = this.width / this.height;
				camera.updateProjectionMatrix();

			}

			renderer.setSize( width, height );

		};

		function dispatch( array, event ) {

			for ( var i = 0, l = array.length; i < l; i ++ ) {

				array[ i ]( event );

			}

		}
		var time, startTime, prevTime;

		function animate() {
			time = performance.now();
			try {

				if(move){
					moveAnimate()
					rotateAnimate()
				}
				dispatch( events.update, { time: time - startTime, delta: time - prevTime } );
				
			} catch ( e ) {
				
				console.error( ( e.message || e ), ( e.stack || '' ) );
				
			}
			
			renderer.render( scene, camera );

			prevTime = time;

		}

		this.play = function () {

			if ( renderer.xr.enabled ) dom.append( vrButton );

			startTime = prevTime = performance.now();

			document.addEventListener( 'keydown', onKeyDown );
			document.addEventListener( 'keyup', onKeyUp );
			document.addEventListener( 'pointerdown', onPointerDown );
			document.addEventListener( 'pointerup', onPointerUp );
			document.addEventListener( 'pointermove', onPointerMove );

			dispatch( events.start, arguments );

			renderer.setAnimationLoop( animate );

		};

		this.stop = function () {

			if ( renderer.xr.enabled ) vrButton.remove();

			document.removeEventListener( 'keydown', onKeyDown );
			document.removeEventListener( 'keyup', onKeyUp );
			document.removeEventListener( 'pointerdown', onPointerDown );
			document.removeEventListener( 'pointerup', onPointerUp );
			document.removeEventListener( 'pointermove', onPointerMove );

			dispatch( events.stop, arguments );

			renderer.setAnimationLoop( null );

		};

		this.render = function ( time ) {

			dispatch( events.update, { time: time * 1000, delta: 0 /* TODO */ } );

			renderer.render( scene, camera );

		};

		this.dispose = function () {

			renderer.dispose();

			camera = undefined;
			scene = undefined;

		};

		//

		function onKeyDown( event ) {
			if(pos == 0){
				moveTo(new THREE.Vector3(5,7,9), new THREE.Vector3(1,1,1))
				pos++
			}else if(pos == 1){
				moveTo(new THREE.Vector3(12,9,10), new THREE.Vector3(-35,31,20))
				pos++
			}
			dispatch( events.keydown, event );

		}

		function onKeyUp( event ) {

			dispatch( events.keyup, event );

		}

		function onPointerDown( event ) {

			dispatch( events.pointerdown, event );

		}

		function onPointerUp( event ) {

			dispatch( events.pointerup, event );

		}

		function onPointerMove( event ) {

			dispatch( events.pointermove, event );

		}

	}

};

export { APP };
