var gl;
var g_canvas
var g_digits = 5;

// For keyboard, mouse-click-and-drag: -----------------
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;

//--Animation---------------
var g_isClear = 1;		  // 0 or 1 to enable or disable screen-clearing in the
    									// draw() function. 'C' or 'c' key toggles in myKeyPress().
var g_last = Date.now();				//  Timestamp: set after each frame of animation,
																// used by 'animate()' function to find how much
																// time passed since we last updated our canvas.
var g_stepCount = 0;						// Advances by 1 for each timestep, modulo 1000,
																// (0,1,2,3,...997,998,999,0,1,2,..) to identify
																// WHEN the ball bounces.  RESET by 'r' or 'R' key.

var g_timeStep = 1000.0/60.0;			// current timestep in milliseconds (init to 1/60th sec)
var g_timeStepMin = g_timeStep;   //holds min,max timestep values since last keypress.
var g_timeStepMax = g_timeStep;

var rad = 20;
var theta = 0;
var delta_z = 0;

var g_worldMat = new Matrix4();
var current_rotation = 0;
var x_Coordinate = -35;
var y_Coordinate = 1.5;
var z_Coordinate = 0.5;


var x_lookAt = x_Coordinate + rad;
var y_lookAt = y_Coordinate;
var z_lookAt = z_Coordinate;

var g_rotAngle = 0.0;
var updateRotAngle = false;
var updateRotAngleSign = 1;
var g_angleRate = 10.0;

var lookAtVector = new Vector3([x_lookAt, y_lookAt, z_lookAt]);
var eyePosVector = new Vector3([x_Coordinate, y_Coordinate, z_Coordinate]);

solverType = 5;
//bouncyball variables
var bouncyballCount = 100;
var bouncyGravity = true;

//spring pair variables
var kspring = 20.0;
var kdamp = 1.0;
var springpairGravity = true;

// spring mesh variables
var kspring = 15.0;
var kdamp = 2.5;
var restL = 0.02;
var width = 10;
var height = 15;
var windForce = 0.1;
var springmeshGravity = false;

// boids variables
var partcount = 100;
var vel = 1;
var ka = 3;
var kv = 1;
var kc = 4;
var rad = 1.5;

// flame variables
var firecount = 500;

// Tornado variables
var torcount = 500;

bouncyball = new VBOPartSys();
springpair = new VBOPartSys();
springmesh = new VBOPartSys();
boids = new VBOPartSys();
flame = new VBOPartSys();
tornado = new VBOPartSys();

ground = new groundVBO();
cubeBouncyBall = new cubeVBO(1.0, 0.0, -6.0, 0.0);
cubeSpringPair = new cubeVBO(1.0, 0.0, 9.0, 0.0);
cubeBoids      = new cubeVBO(1.0, 0.0, -3.0, 0.0);
cubeSpringMesh = new cubeVBO(1.0, 0.0, 6.0, 0.0);
cubeFlame      = new cubeVBO(1.0, 0.0, 0.0, 0.0);
cubeTornado    = new cubeVBO(1.0, 0.0, 3.0, 0.0);

function main(){
    g_canvas = document.getElementById('webgl');
    gl = g_canvas.getContext('webgl',{preserveDrawingBuffer: true})
    if (!gl) {
        console.log('main() Failed to get the rendering context for WebGL');
        return;
      }

    window.addEventListener("keydown", myKeyDown, false);
    window.addEventListener("keyup", myKeyUp, false);
    window.addEventListener("mousedown", myMouseDown);
    window.addEventListener("mousemove", myMouseMove);
    window.addEventListener("mouseup", myMouseUp);
    window.addEventListener("click", myMouseClick);
    window.addEventListener("dblclick", myMouseDblClick);
    window.onload = windowLoad();
    gl.clearColor(0, 0, 0, 1);	// RGBA color for clearing WebGL framebuffer
    gl.clear(gl.COLOR_BUFFER_BIT);		  // clear it once to set that color as bkgnd.
    gl.enable(gl.DEPTH_TEST);

    ground.init();
    cubeBouncyBall.init();
    cubeSpringPair.init();
    cubeSpringMesh.init();
    cubeBoids.init();
    cubeFlame.init();
    cubeTornado.init();

    bouncyball.initBouncy3D(bouncyballCount,0.0,-6.0,0.0,bouncyGravity,solverType);
    bouncyball.vboInit();

    springpair.initSpringPair(2, 0.0, 9.0, 0.0, kspring, kdamp,springpairGravity, solverType);
    springpair.vboInit();

    springmesh.initSpringMesh(0.0, 6.0, 0.0, kspring, kdamp, height, width, restL, windForce, springmeshGravity, solverType);
    springmesh.vboInit();

    boids.initFlocking(partcount,0.0,-3.0,0.0,ka,kv,kc,rad,vel,solverType);
    boids.vboInit();

    flame.initFireReeves(firecount,0.0,0.0,0.0,solverType);
    flame.vboInit();

    tornado.initTornado(torcount,0.0,3.0,0.0,solverType);
    tornado.vboInit();

    var tick = function() {
        g_timeStep = animate();
                          // find how much time passed (in milliseconds) since the
                          // last call to 'animate()'.
        if(g_timeStep > 200) {   // did we wait > 0.2 seconds?
          // YES. That's way too long for a single time-step; somehow our particle
          // system simulation got stopped -- perhaps user switched to a different
          // browser-tab or otherwise covered our browser window's HTML-5 canvas.
          // Resume simulation with a normal-sized time step:
          g_timeStep = 1000/60;
          }
        // Update min/max for timeStep:
        if     (g_timeStep < g_timeStepMin) g_timeStepMin = g_timeStep;
        else if(g_timeStep > g_timeStepMax) g_timeStepMax = g_timeStep;
        drawAll(); // compute new particle state at current time
        requestAnimationFrame(tick, g_canvas);
                          // Call tick() again 'at the next opportunity' as seen by
                          // the HTML-5 element 'g_canvas'.
      };
      tick();
}
function animate() {
    //==============================================================================
    // Returns how much time (in milliseconds) passed since the last call to this fcn.
      var now = Date.now();
      var elapsed = now - g_last;	// amount of time passed, in integer milliseconds
      g_last = now;               // re-set our stopwatch/timer.

      // INSTRUMENTATION:  (delete if you don't care how much the time-steps varied)
      g_stepCount = (g_stepCount +1)%1000;		// count 0,1,2,...999,0,1,2,...
      //-----------------------end instrumentation

      if (updateRotAngle == true) {
        g_rotAngle += g_angleRate * updateRotAngleSign * g_timeStep * 0.001;
      }
      return elapsed;
    }

function drawAll(){
    if (g_isClear == 1) gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    setCamera()
    if (bouncyball.runMode >1){
        if (bouncyball.runMode == 2){
            bouncyball.runMode = 1;
        }
        ground.switchToMe();
        ground.adjust();
        ground.render();

        cubeBouncyBall.switchToMe();
        cubeBouncyBall.adjust();
        cubeBouncyBall.render();

        cubeSpringPair.switchToMe();
        cubeSpringPair.adjust();
        cubeSpringPair.render();

        cubeSpringMesh.switchToMe();
        cubeSpringMesh.adjust();
        cubeSpringMesh.render();

        cubeBoids.switchToMe();
        cubeBoids.adjust();
        cubeBoids.render();

        cubeFlame.switchToMe();
        cubeFlame.adjust();
        cubeFlame.render();

        cubeTornado.switchToMe();
        cubeTornado.adjust();
        cubeTornado.render();

        bouncyball.switchToMe();
        bouncyball.adjust();
        bouncyball.applyForces(bouncyball.s1,bouncyball.forceList);
        bouncyball.dotFinder(bouncyball.s1dot, bouncyball.s1);
        bouncyball.solver();
        bouncyball.doConstraints(bouncyball.s1,bouncyball.s2,bouncyball.limitList);
        bouncyball.render();
        bouncyball.swap();

        springpair.switchToMe();
        springpair.adjust();
        springpair.applyForces(springpair.s1,springpair.forceList);
        springpair.dotFinder(springpair.s1dot, springpair.s1);
        springpair.solver();
        springpair.doConstraints(springpair.s1,springpair.s2,springpair.limitList);
        springpair.render();
        springpair.swap();

        springmesh.switchToMe();
        springmesh.adjust();
        springmesh.applyForces(springmesh.s1,springmesh.forceList);
        springmesh.dotFinder(springmesh.s1dot, springmesh.s1);
        springmesh.solver();
        springmesh.doConstraints(springmesh.s1,springmesh.s2,springmesh.limitList);
        springmesh.render();
        springmesh.swap();

        boids.switchToMe();
        boids.adjust();
        boids.applyForces(boids.s1,boids.forceList);
        boids.dotFinder(boids.s1dot,boids.s1);
        boids.solver();
        boids.doConstraints(boids.s1,boids.s2,boids.limitList);
        boids.render();
        boids.swap();

        flame.switchToMe();
        flame.adjust();
        flame.applyForces(flame.s1,flame.forceList);
        flame.dotFinder(flame.s1dot,flame.s1);
        flame.solver();
        flame.doConstraints(flame.s1,flame.s2,flame.limitList);
        flame.render();
        flame.swap();

        tornado.switchToMe();
        tornado.adjust();
        tornado.applyForces(tornado.s1,tornado.forceList);
        tornado.dotFinder(tornado.s1dot,tornado.s1);
        tornado.solver();
        tornado.doConstraints(tornado.s1,tornado.s2,tornado.limitList);
        tornado.render();
        tornado.swap();


    }
    else{
        ground.switchToMe();
        ground.adjust();
        ground.render();
        
        cubeBouncyBall.switchToMe();
        cubeBouncyBall.adjust();
        cubeBouncyBall.render();

        cubeSpringPair.switchToMe();
        cubeSpringPair.adjust();
        cubeSpringPair.render();

        cubeSpringMesh.switchToMe();
        cubeSpringMesh.adjust();
        cubeSpringMesh.render();

        cubeBoids.switchToMe();
        cubeBoids.adjust();
        cubeBoids.render();

        cubeFlame.switchToMe();
        cubeFlame.adjust();
        cubeFlame.render();

        cubeTornado.switchToMe();
        cubeTornado.adjust();
        cubeTornado.render();

        bouncyball.switchToMe()
        bouncyball.adjust()
        bouncyball.render()

        springpair.switchToMe();
        springpair.adjust();
        springpair.render();

        springmesh.switchToMe();
        springmesh.adjust();
        springmesh.render();

        boids.switchToMe();
        boids.adjust();
        boids.render();

        flame.switchToMe();
        //flame.adjust();
        flame.render();

        tornado.switchToMe();
        tornado.adjust();
        tornado.render();

    }



}
function setCamera() {
    //============================================================================
    // PLACEHOLDER:  sets a fixed camera at a fixed position for use by
    // ALL VBObox objects.  REPLACE This with your own camera-control code.

        g_worldMat.setIdentity();
        g_worldMat.perspective(30.0,   // FOVY: top-to-bottom vertical image angle, in degrees
                          1.0,   // Image Aspect Ratio: camera lens width/height
                          1.0,   // camera z-near distance (always positive; frustum begins at z = -znear)
                          100.0);  // camera z-far distance (always positive; frustum ends at z = -zfar)

		g_worldMat.lookAt(  x_Coordinate,   y_Coordinate,   z_Coordinate,
							x_lookAt,       y_lookAt,  		z_lookAt,
							0,  			0,      		1);
        // READY to draw in the 'world' coordinate system.
    //------------END COPY

    }
function moveForwardBackward(sign){
    var moveVel = 0.2;
    
    Dx = x_lookAt - x_Coordinate;
    Dy = y_lookAt - y_Coordinate;
    Dz = z_lookAt - z_Coordinate;
    var D = rad * moveVel;
    x_Coordinate += sign * Dx * moveVel;
    y_Coordinate += sign * Dy * moveVel;
    z_Coordinate += sign * Dz * moveVel;
    x_lookAt += sign * Dx * moveVel;
    y_lookAt += sign * Dy * moveVel;
    z_lookAt += sign * Dz * moveVel;
}

function moveLeftRight(sign){
    var moveVel = 0.1;

    v1 = new Vector3([x_lookAt-x_Coordinate,y_lookAt-y_Coordinate,z_lookAt-z_Coordinate]);
    v2 = new Vector3([0,0,1]);

    res = cross(v2,v1);
    dir = res[2];
    x_Coordinate += sign * dir.elements[0] * moveVel;
    y_Coordinate += sign * dir.elements[1] * moveVel;
    z_Coordinate += sign * dir.elements[2] * moveVel;
    x_lookAt += sign * dir.elements[0] * moveVel;
    y_lookAt += sign * dir.elements[1] * moveVel;
    z_lookAt += sign * dir.elements[2] * moveVel;
    
}

function moveAimLeftRight(sign){
    rotAngle = 0.05;
    theta += rotAngle * sign;
    x_lookAt = x_Coordinate + Math.cos(theta) * rad;
    y_lookAt = y_Coordinate + Math.sin(theta) * rad;
}

function moveAimUpDown(sign){
    rotAngle = 0.05;
    delta_z += rotAngle * sign;
    //console.log(delta_z)
    z_lookAt = z_Coordinate + Math.sin(delta_z) * rad;
    x_lookAt = x_Coordinate + Math.cos(delta_z) * rad;
}

function cross(v1,v2){
    x1 = v1.elements[0];
    y1 = v1.elements[1];
    z1 = v1.elements[2];

    x2 = v2.elements[0];
    y2 = v2.elements[1];
    z2 = v2.elements[2];

    normal = new Vector3([(y1*z2-y2*z1),-(x1*z2-x2*z1),(x1*y2-x2*y1)]);
    mag = Math.sqrt(Math.pow(normal.elements[0],2)+Math.pow(normal.elements[1],2)+Math.pow(normal.elements[2],2));
    dir = new Vector3([normal.elements[0]/mag,normal.elements[1]/mag,normal.elements[2]/mag]);
    return [normal,mag,dir]


}


//===================Mouse and Keyboard event-handling Callbacks===============
//=============================================================================
function myMouseDown(ev) {
    //=============================================================================
    // Called when user PRESSES down any mouse button;
    // 									(Which button?    console.log('ev.button='+ev.button);   )
    // 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
    //		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)

    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
      var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
      var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
      var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
    //  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);

        // Convert to Canonical View Volume (CVV) coordinates too:
      var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
                               (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
        var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
                                 (g_canvas.height/2);
    //	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);

        isDrag = true;											// set our mouse-dragging flag
        xMclik = x;													// record where mouse-dragging began
        yMclik = y;
        //	document.getElementById('MouseResult1').innerHTML =
        //'myMouseDown() at CVV coords x,y = '+x.toFixed(g_digits)+
        //                                ', '+y.toFixed(g_digits)+'<br>';
    };

function myMouseMove(ev) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)

    if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
    var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
    var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp.toFixed(g_digits),',\t',yp.toFixed(g_digits));

    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
                            (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
    var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
                                (g_canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

    // find how far we dragged the mouse:
    xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
    yMdragTot += (y - yMclik);
    xMclik = x;													// Make next drag-measurement from here.
    yMclik = y;
// (? why no 'document.getElementById() call here, as we did for myMouseDown()
// and myMouseUp()? Because the webpage doesn't get updated when we move the
// mouse. Put the web-page updating command in the 'draw()' function instead)
};

function myMouseUp(ev) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
    var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
    var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);

    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
                            (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
    var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
                                (g_canvas.height/2);
//	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);

    isDrag = false;											// CLEAR our mouse-dragging flag, and
    // accumulate any final bit of mouse-dragging we did:
    xMdragTot += (x - xMclik);
    yMdragTot += (y - yMclik);
//	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot.toFixed(g_digits),',\t',
//	                                               yMdragTot.toFixed(g_digits));
    // Put it on our webpage too...
    //document.getElementById('MouseResult1').innerHTML =
    //'myMouseUp() at CVV coords x,y = '+x+', '+y+'<br>';
};

function myMouseClick(ev) {
//=============================================================================
// Called when user completes a mouse-button single-click event
// (e.g. mouse-button pressed down, then released)
//
//    WHICH button? try:  console.log('ev.button='+ev.button);
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

    // STUB
//	console.log("myMouseClick() on button: ", ev.button);
}

function myMouseDblClick(ev) {
//=============================================================================
// Called when user completes a mouse-button double-click event
//
//    WHICH button? try:  console.log('ev.button='+ev.button);
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

    // STUB
//	console.log("myMouse-DOUBLE-Click() on button: ", ev.button);
}

function myKeyDown(kev) {
//============================================================================
    g_timeStepMin = g_timeStep;
    g_timeStepMax = g_timeStep;

    switch(kev.code) {
        case "KeyW":
            //translationOnCamera(1, false);
            moveForwardBackward(1);
        break;
        case "KeyS":
            moveForwardBackward(-1);
        break;
        case "KeyA":
            moveLeftRight(1);
            //StrafingOnCamera(-1);
        break;
        case "KeyD":
            moveLeftRight(-1);
            //StrafingOnCamera(1);
        break;
        case "ArrowUp":
            //rotationOnCamera(1, true);
            moveAimUpDown(1);
            break;
        case "ArrowDown":
            moveAimUpDown(-1);
            //rotationOnCamera(-1, true);
            break;
        case "ArrowLeft" :
            /*
            updateRotAngle = true;
            updateRotAngleSign = 1;
            rotationOnCamera(1, false);
            */
            moveAimLeftRight(1);
            break;
        case "ArrowRight":
            moveAimLeftRight(-1);
            /*
            updateRotAngle = true;
            updateRotAngleSign = -1;
            rotationOnCamera(1, false);
            */
            break;
    case "KeyP":
	  if(bouncyball.runMode == 3) bouncyball.runMode = 1;		// if running, pause
						  else bouncyball.runMode = 3;		          // if paused, run.
	  document.getElementById('KeyDown').innerHTML =
			  'myKeyDown() p/P key: toggle Pause/unPause!';    // print on webpage
	  console.log("p/P key: toggle Pause/unPause!");   			// print on console,
		break;
    case "KeyR":    // r/R for RESET:
        if(kev.shiftKey==false) {   // 'r' key: SOFT reset; boost velocity only
            bouncyball.runMode = 3;  // RUN!
/*
            var j=0; // array index for particle i
            for(var i = 0; i < bouncyball.partCount; i += 1, j+= PART_MAXVAR) {
            bouncyball.roundRand();  // make a spherical random var.
                    if(  bouncyball.s2[j + PART_XVEL] > 0.0) // ADD to positive velocity, and
                        bouncyball.s2[j + PART_XVEL] += 1.7 + 0.4*bouncyball.randX*bouncyball.INIT_VEL;
                                                        // SUBTRACT from negative velocity:
                    else bouncyball.s2[j + PART_XVEL] -= 1.7 + 0.4*bouncyball.randX*bouncyball.INIT_VEL;

                    if(  bouncyball.s2[j + PART_YVEL] > 0.0)
                        bouncyball.s2[j + PART_YVEL] += 1.7 + 0.4*bouncyball.randY*bouncyball.INIT_VEL;
                    else bouncyball.s2[j + PART_YVEL] -= 1.7 + 0.4*bouncyball.randY*bouncyball.INIT_VEL;

                    if(  bouncyball.s2[j + PART_ZVEL] > 0.0)
                        bouncyball.s2[j + PART_ZVEL] += 1.7 + 0.4*bouncyball.randZ*bouncyball.INIT_VEL;
                    else bouncyball.s2[j + PART_ZVEL] -= 1.7 + 0.4*bouncyball.randZ*bouncyball.INIT_VEL;
                    }
        }
        else {      // HARD reset: position AND velocity, BOTH state vectors:
            bouncyball.runMode = 0;			// RESET!
            // Reset state vector s1 for ALL particles:
            var j=0; // array index for particle i
            for(var i = 0; i < bouncyball.partCount; i += 1, j+= PART_MAXVAR) {
                bouncyball.roundRand();
                        bouncyball.s2[j + PART_XPOS] =  -0.9;      // lower-left corner of CVV
                        bouncyball.s2[j + PART_YPOS] =  -0.9;      // with a 0.1 margin
                        bouncyball.s2[j + PART_ZPOS] =  0.0;
                        bouncyball.s2[j + PART_XVEL] =  3.7 + 0.4*bouncyball.randX*bouncyball.INIT_VEL;
                        bouncyball.s2[j + PART_YVEL] =  3.7 + 0.4*bouncyball.randY*bouncyball.INIT_VEL; // initial velocity in meters/sec.
                bouncyball.s2[j + PART_ZVEL] =  3.7 + 0.4*bouncyball.randZ*bouncyball.INIT_VEL;
                // do state-vector s2 as well: just copy all elements of the float32array.
                bouncyball.s2.set(bouncyball.s1);
            } // end for loop*/
        } // end HARD reset
        document.getElementById('KeyDown').innerHTML =
        'myKeyDown() r/R key: soft/hard Reset.';	// print on webpage,
        console.log("r/R: soft/hard Reset");      // print on console,
        break;
    case "Space":
        bouncyball.runMode = 2;
        document.getElementById('KeyDown').innerHTML =
			  'myKeyDown() space bar: single step!';    // print on webpage
        console.log(bouncyball.s1,bouncyball.s2)
            break;
    case "ShiftLeft":
            verticalMovement(1);
            break;
    case "ControlLeft":
            verticalMovement(-1);
            break;
    default:
            document.getElementById('KeyDown').innerHTML =
            	'myKeyDown():UNUSED,keyCode='+kev.keyCode;
            console.log("UNUSED key:", kev.keyCode);
    break;
    }
    }

function myKeyUp(kev) {
//=============================================================================
// Called when user releases ANY key on the keyboard.
// Rarely needed -- most code needs only myKeyDown().

    switch(kev.code) {
    case 'ArrowLeft' :
    updateRotAngle = false;
    break;

    case 'ArrowRight' :
    updateRotAngle = false;
    break;
    }

}


function ChangeSolvers(index) {
    var solvers = new Uint8Array([SOLV_EULER, SOLV_MIDPOINT, SOLV_ADAMS_BASH, SOLV_RUNGEKUTTA, SOLV_OLDGOOD, SOLV_BACK_EULER, SOLV_BACK_MIDPT, SOLV_BACK_ADBASH, SOLV_VERLET]);
    all_Particle_systems[current_part_sys].g_partA.solvType = solvers[index];
}

//Control panel using google dat.gui
var bouncyballGui = function(){
    this.particles = bouncyballCount;
    this.AddGravity = bouncyGravity;
    //var solvers = new Uint8Array([SOLV_EULER, SOLV_MIDPOINT, SOLV_ADAMS_BASH, SOLV_RUNGEKUTTA, SOLV_OLDGOOD, SOLV_BACK_EULER, SOLV_BACK_MIDPT, SOLV_BACK_ADBASH, SOLV_VERLET]);
    this.ChangeSolver= solverType;

    this.reload = function(){
        bouncyballCount = this.particles;
        bouncyGravity = this.AddGravity;
        var solvers = new Uint8Array([SOLV_EULER, SOLV_MIDPOINT, SOLV_ADAMS_BASH, SOLV_RUNGEKUTTA, SOLV_OLDGOOD, SOLV_BACK_EULER, SOLV_BACK_MIDPT, SOLV_BACK_ADBASH, SOLV_VERLET]);
        solverType = solvers[this.ChangeSolver];
        console.log(solverType);

        bouncyball = new VBOPartSys();
        bouncyball.initBouncy3D(bouncyballCount,0.0,-6.0,0.0,bouncyGravity,solverType);
        bouncyball.vboInit();
    }   
}

var springpairGui = function(){
    this.K_Spring = kspring;
    this.K_Damp = kdamp;
    this.AddGravity = springpairGravity;
    this.ChangeSolver= solverType;
    this.reload = function(){
        kspring = this.K_Spring;
        kdamp = this.K_Damp;
        springpairGravity = this.AddGravity;
        var solvers = new Uint8Array([SOLV_EULER, SOLV_MIDPOINT, SOLV_ADAMS_BASH, SOLV_RUNGEKUTTA, SOLV_OLDGOOD, SOLV_BACK_EULER, SOLV_BACK_MIDPT, SOLV_BACK_ADBASH, SOLV_VERLET]);
        solverType = solvers[this.ChangeSolver];

        springpair = new VBOPartSys();
        springpair.initSpringPair(2,0.0,9.0,0.0,kspring,kdamp,springpairGravity,solverType);
        springpair.vboInit();
    }   
}

var boidsGui = function(){
    this.particles = partcount;
    this.Init_Velocity = vel;
    this.K_avoidence = ka;
    this.K_velocity = kv;
    this.K_centering = kc;
    this.Radius = rad;
    this.ChangeSolver= solverType;
    this.reload = function(){
        partcount = this.particles;
        ka = this.K_avoidence;
        kv = this.K_velocity;
        kc = this.K_centering;
        rad = this.Radius;
        vel = this.Init_Velocity;
        var solvers = new Uint8Array([SOLV_EULER, SOLV_MIDPOINT, SOLV_ADAMS_BASH, SOLV_RUNGEKUTTA, SOLV_OLDGOOD, SOLV_BACK_EULER, SOLV_BACK_MIDPT, SOLV_BACK_ADBASH, SOLV_VERLET]);
        solverType = solvers[this.ChangeSolver];
        
        boids = new VBOPartSys();
        boids.initFlocking(partcount,0.0,-3.0,0.0,ka,kv,kc,rad,vel,solverType);
        boids.vboInit();
    }
}

var springmeshGui = function(){
    this.Height = height;
    this.Width = width;
    this.K_Spring = kspring;
    this.K_Damp = kdamp;
    this.Rest_Length = restL;
    this.Wind_Strength = windForce;
    this.AddGravity = springmeshGravity;
    this.ChangeSolver= solverType;
    this.reload = function(){
        kspring = this.K_Spring;
        kdamp = this.K_Damp;
        height = this.Height;
        width = this.Width;
        restL = this.Rest_Length;
        windForce = this.Wind_Strength;
        springmeshGravity = this.AddGravity;
        var solvers = new Uint8Array([SOLV_EULER, SOLV_MIDPOINT, SOLV_ADAMS_BASH, SOLV_RUNGEKUTTA, SOLV_OLDGOOD, SOLV_BACK_EULER, SOLV_BACK_MIDPT, SOLV_BACK_ADBASH, SOLV_VERLET]);
        solverType = solvers[this.ChangeSolver];

        springmesh = new VBOPartSys();
        springmesh.initSpringMesh(0.0, 6.0, 0.0, kspring, kdamp, height, width, restL, windForce, springmeshGravity, solverType);
        springmesh.vboInit();
    } 

}

var tornadoGui = function(){
    this.particles = torcount;
    this.ChangeSolver= solverType;
    this.reload = function(){
        torcount = this.particles;
        bubrad = this.Bubble_Radius;
        var solvers = new Uint8Array([SOLV_EULER, SOLV_MIDPOINT, SOLV_ADAMS_BASH, SOLV_RUNGEKUTTA, SOLV_OLDGOOD, SOLV_BACK_EULER, SOLV_BACK_MIDPT, SOLV_BACK_ADBASH, SOLV_VERLET]);
        solverType = solvers[this.ChangeSolver];

        tornado = new VBOPartSys();
        tornado.initTornado(torcount,0.0,3.0,0.0,solverType);
        tornado.vboInit();
    }
}

var flameGui = function(){
    this.particles = firecount;
    this.ChangeSolver= solverType;
    this.reload = function(){
        firecount = this.particles;
        var solvers = new Uint8Array([SOLV_EULER, SOLV_MIDPOINT, SOLV_ADAMS_BASH, SOLV_RUNGEKUTTA, SOLV_OLDGOOD, SOLV_BACK_EULER, SOLV_BACK_MIDPT, SOLV_BACK_ADBASH, SOLV_VERLET]);
        solverType = solvers[this.ChangeSolver];

        flame = new VBOPartSys();
        flame.initFireReeves(firecount,0.0,0.0,0.0,solverType);
        flame.vboInit();
    }
}


function windowLoad(){
    var bouncyballFolder = new bouncyballGui();
    var springpairFolder = new springpairGui();
    var springmeshFolder = new springmeshGui();
    var boidsFolder = new boidsGui();
    var tornadoFolder = new tornadoGui();
    var flameFolder = new flameGui();
    var gui = new dat.GUI();

    var normalSpringPair = gui.addFolder('Spring Pair #1');
    normalSpringPair.add(springpairFolder,'K_Spring',0.5,20);
    normalSpringPair.add(springpairFolder,'K_Damp',0.5,20);
    normalSpringPair.add(springpairFolder,'AddGravity');
    normalSpringPair.add(springpairFolder,'ChangeSolver',{'SOLV_EULER':SOLV_EULER,'SOLV_MIDPOINT':SOLV_MIDPOINT,'SOLV_BACK_EULER':SOLV_BACK_EULER,'SOLV_BACK_MIDPT':SOLV_BACK_MIDPT});
    normalSpringPair.add(springpairFolder,'reload');
    //normalSpringPair.open();


    var normalSpringMesh = gui.addFolder('Spring Mesh #2');
    normalSpringMesh.add(springmeshFolder,'Height');
    normalSpringMesh.add(springmeshFolder,'Width');
    normalSpringMesh.add(springmeshFolder,'Rest_Length',0.01,1);
    normalSpringMesh.add(springmeshFolder,'K_Spring',0.5,20);
    normalSpringMesh.add(springmeshFolder,'K_Damp',0.5,20);
    normalSpringMesh.add(springmeshFolder,'Wind_Strength',0.01,10);
    normalSpringMesh.add(springmeshFolder,'AddGravity');
    normalSpringMesh.add(springmeshFolder,'ChangeSolver',{'SOLV_EULER':SOLV_EULER,'SOLV_MIDPOINT':SOLV_MIDPOINT,'SOLV_BACK_EULER':SOLV_BACK_EULER,'SOLV_BACK_MIDPT':SOLV_BACK_MIDPT});
    normalSpringMesh.add(springmeshFolder,'reload');
    //normalSpringMesh.open();

    var normaltornado = gui.addFolder('Tornado #3');
    normaltornado.add(tornadoFolder,'particles');
    normaltornado.add(tornadoFolder,'ChangeSolver',{'SOLV_EULER':SOLV_EULER,'SOLV_MIDPOINT':SOLV_MIDPOINT,'SOLV_BACK_EULER':SOLV_BACK_EULER,'SOLV_BACK_MIDPT':SOLV_BACK_MIDPT})
    normaltornado.add(tornadoFolder,'reload');
    //normaltornado.open();

    var normalflame = gui.addFolder('Flame #4');
    normalflame.add(flameFolder,'particles');
    normalflame.add(flameFolder,'ChangeSolver',{'SOLV_EULER':SOLV_EULER,'SOLV_MIDPOINT':SOLV_MIDPOINT,'SOLV_BACK_EULER':SOLV_BACK_EULER,'SOLV_BACK_MIDPT':SOLV_BACK_MIDPT})
    normalflame.add(flameFolder,'reload');
    //normalflame.open();


    var normalboids = gui.addFolder('Boids #5');
    normalboids.add(boidsFolder,'particles');
    normalboids.add(boidsFolder,'Init_Velocity');
    normalboids.add(boidsFolder,'K_avoidence',0.5,10);
    normalboids.add(boidsFolder,'K_velocity',0.5,10);
    normalboids.add(boidsFolder,'K_centering',0.5,10);
    normalboids.add(boidsFolder,'Radius',0.1,2);
    normalboids.add(boidsFolder,'ChangeSolver',{'SOLV_EULER':SOLV_EULER,'SOLV_MIDPOINT':SOLV_MIDPOINT,'SOLV_BACK_EULER':SOLV_BACK_EULER,'SOLV_BACK_MIDPT':SOLV_BACK_MIDPT})
    normalboids.add(boidsFolder,'reload');
    //normalboids.open();

    var normalBouncyball = gui.addFolder('Bouncy Balls #6');
    normalBouncyball.add(bouncyballFolder, 'particles');
    normalBouncyball.add(bouncyballFolder,'AddGravity');
    normalBouncyball.add(bouncyballFolder,'ChangeSolver',{'SOLV_EULER':SOLV_EULER,'SOLV_MIDPOINT':SOLV_MIDPOINT,'SOLV_BACK_EULER':5,'SOLV_BACK_MIDPT':SOLV_BACK_MIDPT});
    normalBouncyball.add(bouncyballFolder, 'reload');
    //normalBouncyball.open();
}












