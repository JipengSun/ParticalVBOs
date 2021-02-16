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

var g_worldMat = new Matrix4();
var current_rotation = 0;
var x_Coordinate = -15;
var y_Coordinate = 0;
var z_Coordinate = 0.5;
var x_lookAt = 0;
var y_lookAt = 0;
var z_lookAt = z_Coordinate;

var g_rotAngle = 0.0;
var updateRotAngle = false;
var updateRotAngleSign = 1;
var g_angleRate = 10.0;

var lookAtVector = new Vector3([x_lookAt, y_lookAt, z_lookAt]);
var eyePosVector = new Vector3([x_Coordinate, y_Coordinate, z_Coordinate]);

//bouncyball variables
var bouncyballCount = 100;

//spring pair variables
var kspring = 10.0;
var kdamp = 1.0;

//boids variables
var partcount = 100;
var ka = 3;
var kv = 1;
var kc = 4;
var rad = 0.5;

bouncyball = new VBOPartSys();
springpair = new VBOPartSys();
boids = new VBOPartSys();

ground = new groundVBO();
cubeBouncyBall = new cubeVBO(1.0, 0.0, -3.0, 0.0);
cubeSpringPair = new cubeVBO(1.0, 0.0, 3.0, 0.0);
cubeBoids      = new cubeVBO(1.0, 0.0, 0.0, 0.0);


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
    gl.clearColor(0.25, 0.25, 0.25, 1);	// RGBA color for clearing WebGL framebuffer
    gl.clear(gl.COLOR_BUFFER_BIT);		  // clear it once to set that color as bkgnd.
    gl.enable(gl.DEPTH_TEST);

    ground.init();
    cubeBouncyBall.init();
    cubeSpringPair.init();
    cubeBoids.init();

    bouncyball.initBouncy3D(bouncyballCount,0.0,-3.0,0.0);
    bouncyball.vboInit();
    springpair.initSpringPair(2,0.0,3.0,0.0,kspring,kdamp);
    springpair.vboInit();
    boids.initFlocking(partcount,0.0,0.0,0.0,ka,kv,kc,rad);
    boids.vboInit();

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

        cubeBoids.switchToMe();
        cubeBoids.adjust();
        cubeBoids.render();

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

        boids.switchToMe();
        boids.adjust();
        boids.applyForces(boids.s1,boids.forceList);
        boids.dotFinder(boids.s1dot,boids.s1);
        boids.solver();
        boids.doConstraints(boids.s1,boids.s2,boids.limitList);
        boids.render();
        boids.swap();


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

        cubeBoids.switchToMe();
        cubeBoids.adjust();
        cubeBoids.render();

        bouncyball.switchToMe()
        bouncyball.adjust()
        bouncyball.render()

        springpair.switchToMe();
        springpair.adjust();
        springpair.render();

        boids.switchToMe();
        boids.adjust();
        boids.render();

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

function MoveCameraLocation(sign, displacement) {
    x_Coordinate = x_Coordinate + sign * displacement[0] * g_timeStep * 0.001 * 15;
    y_Coordinate = y_Coordinate + sign * displacement[1] * g_timeStep * 0.001 * 15;
    z_Coordinate = z_Coordinate + sign * displacement[2] * g_timeStep * 0.001 * 15;

    Range(x_Coordinate + sign * displacement[0] * g_timeStep * 0.001 * 10, x_Coordinate + sign * displacement[0] * g_timeStep * 0.001 * 15, x_Coordinate);
    Range(y_Coordinate + sign * displacement[1] * g_timeStep * 0.001 * 10, y_Coordinate + sign * displacement[1] * g_timeStep * 0.001 * 15, y_Coordinate);
    Range(z_Coordinate + sign * displacement[2] * g_timeStep * 0.001 * 10, z_Coordinate + sign * displacement[2] * g_timeStep * 0.001 * 15, z_Coordinate);

  eyePosVector = new Vector3([x_Coordinate, y_Coordinate, z_Coordinate]);
}

function MoveLookAtPoint(sign, displacement) {
    x_lookAt = x_lookAt + sign * displacement[0] * g_timeStep * 0.001 * 10;
    y_lookAt = y_lookAt + sign * displacement[1] * g_timeStep * 0.001 * 10;
    z_lookAt = z_lookAt + sign * displacement[2] * g_timeStep * 0.001 * 10;

    Range(x_lookAt + sign * displacement[0] * g_timeStep * 0.001 * 10, x_lookAt + sign * displacement[0] * g_timeStep * 0.001 * 10, x_lookAt);
    Range(y_lookAt + sign * displacement[1] * g_timeStep * 0.001 * 10, y_lookAt + sign * displacement[1] * g_timeStep * 0.001 * 10, y_lookAt);
    Range(z_lookAt + sign * displacement[2] * g_timeStep * 0.001 * 10, z_lookAt + sign * displacement[2] * g_timeStep * 0.001 * 10, z_lookAt);

    lookAtVector = new Vector3([x_lookAt, y_lookAt, z_lookAt]);
}

function translationOnCamera(sign) {
  var displacement = new Float32Array([(x_lookAt - x_Coordinate) * 0.2,
                                       (y_lookAt - y_Coordinate) * 0.3,
                                       (z_lookAt - z_Coordinate) * 0.2]);

  MoveCameraLocation(sign, displacement);
  MoveLookAtPoint(sign, displacement);
}

function StrafingOnCamera(sign) {
    var eyePosVectorNew = new Vector3([eyePosVector.elements[0], eyePosVector.elements[1], eyePosVector.elements[2]]);
    var perpendicular_axis = lookAtVector.cross(eyePosVectorNew).normalize();


    x_Coordinate += sign * perpendicular_axis.elements[0] * g_timeStep * 0.001 * 10;
    x_lookAt += sign * perpendicular_axis.elements[0] * g_timeStep * 0.001 * 10;

    y_lookAt += sign * perpendicular_axis.elements[1] * g_timeStep * 0.001 * 10;
    y_Coordinate += sign * perpendicular_axis.elements[1] * g_timeStep * 0.001 * 10;
}

function verticalMovement(sign) {
    var vertical_axis = eyePosVector.normalize();
    z_Coordinate += sign * vertical_axis.elements[2] * g_timeStep * 0.001 * 10;
    z_lookAt += sign * vertical_axis.elements[2] * g_timeStep * 0.001 * 10;
}

function rotationOnCamera(sign, isVerticalAxis) {
    if (isVerticalAxis)
        z_lookAt += sign * g_timeStep * 0.001 * 10;
  else
    {

        eyePosVector = new Vector3([x_Coordinate, y_Coordinate, z_Coordinate]);
        lookAtVector = new Vector3([x_lookAt, y_lookAt, z_lookAt]);

        lookdir = eyePosVector.subtract(lookAtVector).normalize();


        x_lookAt = Math.cos(g_rotAngle * 0.05 * sign) + x_Coordinate;
        y_lookAt = y_Coordinate + Math.sin(g_rotAngle * 0.05 * sign);

  }

  eyePosVector = new Vector3([x_Coordinate, y_Coordinate, z_Coordinate]);
  lookAtVector = new Vector3([x_lookAt, y_lookAt, z_lookAt]);
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

    boids_ControlBox  = false;

    switch(kev.code) {
        case "KeyW":
            if (!boids_ControlBox)
                translationOnCamera(1, false);
            else
                MoveAggressor(1, true);
        break;
        case "KeyS":
            if (!boids_ControlBox)
                translationOnCamera(-1, false);
            else
                MoveAggressor(-1, true);
        break;
        case "KeyA":
            if (!boids_ControlBox)
                StrafingOnCamera(-1);
            else
                MoveAggressor(1, false);
        break;
        case "KeyD":
            if (!boids_ControlBox)
                StrafingOnCamera(1);
            else
                MoveAggressor(-1, false);
        break;
    case "ArrowUp":
        rotationOnCamera(1, true);
        break;
    case "ArrowDown":
        rotationOnCamera(-1, true);
        break;
    case "ArrowRight":
        updateRotAngle = true;
        updateRotAngleSign = -1;
        rotationOnCamera(1, false);
        break;
    case "ArrowLeft" :
        updateRotAngle = true;
        updateRotAngleSign = 1;
        rotationOnCamera(1, false);
        break;
    case "KeyL":
        all_Particle_systems[current_part_sys].debug();
        break;
    case "Digit0":
            all_Particle_systems[current_part_sys].bouncyball.runMode = 0;			// RESET!
            document.getElementById('KeyDown').innerHTML =
            'myKeyDown() digit 0 key. Run Mode 0: RESET!';    // print on webpage,
        break;
    case "Digit1":
            all_Particle_systems[current_part_sys].bouncyball.runMode = 1;			// PAUSE!
            document.getElementById('KeyDown').innerHTML =
            'myKeyDown() digit 1 key. Run Mode 1: PAUSE!';    // print on webpage,
        break;
    case "Digit2":
            all_Particle_systems[current_part_sys].bouncyball.runMode = 2;			// STEP!
            document.getElementById('KeyDown').innerHTML =
            'myKeyDown() digit 2 key. Run Mode 2: STEP!';     // print on webpage,
        break;
    case "Digit3":
            all_Particle_systems[current_part_sys].bouncyball.runMode = 3;			// RESET!
            document.getElementById('KeyDown').innerHTML =
            'myKeyDown() digit 3 key. Run Mode 3: RUN!';      // print on webpage,
            console.log("Run Mode 3: RUN!");                  // print on console.
        break;
    case "KeyB":                // Toggle floor-bounce constraint type
            if(all_Particle_systems[current_part_sys].bouncyball.bounceType==0) all_Particle_systems[current_part_sys].bouncyball.bounceType = 1;   // impulsive vs simple
            else all_Particle_systems[current_part_sys].bouncyball.bounceType = 0;
            document.getElementById('KeyDown').innerHTML =
            'myKeyDown() b/B key: toggle bounce mode.';	      // print on webpage,
        break;
    case "KeyC":                // Toggle screen-clearing to show 'trails'
            g_isClear += 1;
            if(g_isClear > 1) g_isClear = 0;
            document.getElementById('KeyDown').innerHTML =
            'myKeyDown() c/C key: toggle screen clear.';	 // print on webpage,
        break;
    case "KeyF":    // 'f' or 'F' to toggle particle fountain on/off
            current_part_sys += 1;
            if (current_part_sys >= all_Particle_systems.length) current_part_sys = 0;
        break;
    /*
    case "KeyP":
        if(all_Particle_systems[current_part_sys].bouncyball.runMode == 3) all_Particle_systems[current_part_sys].bouncyball.runMode = 1;		// if running, pause
                            else all_Particle_systems[current_part_sys].bouncyball.runMode = 3;		          // if paused, run.
        //document.getElementById('KeyDown').innerHTML =
            //  'myKeyDown() p/P key: toggle Pause/unPause!';    // print on webpage
        //console.log("p/P key: toggle Pause/unPause!");   			// print on console,
            break;
    case "KeyR":    // r/R for RESET:
        if(kev.shiftKey==false) {   // 'r' key: SOFT reset; boost velocity only
            all_Particle_systems[current_part_sys].bouncyball.runMode = 3;  // RUN!
        var j=0; // array index for particle i
            for (var i = 0; i < all_Particle_systems[current_part_sys].bouncyball.partCount; i += 1, j += PART_MAXVAR) {
                if (all_Particle_systems[current_part_sys].bouncyball.particleSystemType == SPRING_SOLID) {
                    all_Particle_systems[current_part_sys].bouncyball.s1[j + PART_YPOS] += 1.0;
                }
                else {
                    all_Particle_systems[current_part_sys].bouncyball.roundRand();  // make a spherical random var.
                    if (all_Particle_systems[current_part_sys].bouncyball.s2[j + PART_XVEL] > 0.0) // ADD to positive velocity, and
                        all_Particle_systems[current_part_sys].bouncyball.s1[j + PART_XVEL] += 1.7 + 0.4 * all_Particle_systems[current_part_sys].bouncyball.randX * all_Particle_systems[current_part_sys].bouncyball.INIT_VEL;
                    // SUBTRACT from negative velocity:
                    else all_Particle_systems[current_part_sys].bouncyball.s1[j + PART_XVEL] -= 1.7 + 0.4 * all_Particle_systems[current_part_sys].bouncyball.randX * all_Particle_systems[current_part_sys].bouncyball.INIT_VEL;

                    if (all_Particle_systems[current_part_sys].bouncyball.s2[j + PART_YVEL] > 0.0)
                        all_Particle_systems[current_part_sys].bouncyball.s1[j + PART_YVEL] += 1.7 + 0.4 * all_Particle_systems[current_part_sys].bouncyball.randY * all_Particle_systems[current_part_sys].bouncyball.INIT_VEL;
                    else all_Particle_systems[current_part_sys].bouncyball.s1[j + PART_YVEL] -= 1.7 + 0.4 * all_Particle_systems[current_part_sys].bouncyball.randY * all_Particle_systems[current_part_sys].bouncyball.INIT_VEL;

                    if (all_Particle_systems[current_part_sys].bouncyball.s2[j + PART_ZVEL] > 0.0)
                        all_Particle_systems[current_part_sys].bouncyball.s1[j + PART_ZVEL] += 1.7 + 0.4 * all_Particle_systems[current_part_sys].bouncyball.randZ * all_Particle_systems[current_part_sys].bouncyball.INIT_VEL;
                    else all_Particle_systems[current_part_sys].bouncyball.s1[j + PART_ZVEL] -= 1.7 + 0.4 * all_Particle_systems[current_part_sys].bouncyball.randZ * all_Particle_systems[current_part_sys].bouncyball.INIT_VEL;
                }
            }
        }
        else {      // HARD reset: position AND velocity, BOTH state vectors:
            all_Particle_systems[current_part_sys].bouncyball.runMode = 0;			// RESET!
        // Reset state vector s1 for ALL particles:
        var j=0; // array index for particle i
        for(var i = 0; i < all_Particle_systems[current_part_sys].bouncyball.partCount; i += 1, j+= PART_MAXVAR) {
                all_Particle_systems[current_part_sys].bouncyball.roundRand();
                    all_Particle_systems[current_part_sys].bouncyball.s2[j + PART_XPOS] =  -0.9;      // lower-left corner of CVV
                    all_Particle_systems[current_part_sys].bouncyball.s2[j + PART_YPOS] =  -0.9;      // with a 0.1 margin
                    all_Particle_systems[current_part_sys].bouncyball.s2[j + PART_ZPOS] =  0.0;
                    all_Particle_systems[current_part_sys].bouncyball.s2[j + PART_XVEL] =  3.7 + 0.4*all_Particle_systems[current_part_sys].bouncyball.randX*all_Particle_systems[current_part_sys].bouncyball.INIT_VEL;
                    all_Particle_systems[current_part_sys].bouncyball.s2[j + PART_YVEL] =  3.7 + 0.4*all_Particle_systems[current_part_sys].bouncyball.randY*all_Particle_systems[current_part_sys].bouncyball.INIT_VEL; // initial velocity in meters/sec.
                all_Particle_systems[current_part_sys].bouncyball.s2[j + PART_ZVEL] =  3.7 + 0.4*all_Particle_systems[current_part_sys].bouncyball.randZ*all_Particle_systems[current_part_sys].bouncyball.INIT_VEL;
                // do state-vector s2 as well: just copy all elements of the float32array.
            all_Particle_systems[current_part_sys].bouncyball.s2.set(all_Particle_systems[current_part_sys].bouncyball.s1);
        } // end for loop
        } // end HARD reset
        //document.getElementById('KeyDown').innerHTML =
        //'myKeyDown() r/R key: soft/hard Reset.';	// print on webpage,
        //console.log("r/R: soft/hard Reset");      // print on console,
        break;
        */
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
        console.log(bouncyball.s1,bouncyball.s2)
            break;
        case "ShiftLeft":
            verticalMovement(1);
            break;
        case "ControlLeft":
            verticalMovement(-1);
            break;
    default:
            //document.getElementById('KeyDown').innerHTML =
            //	'myKeyDown():UNUSED,keyCode='+kev.keyCode;
            //console.log("UNUSED key:", kev.keyCode);
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

function Range(min, max, number) {
    if (number < min) return min;
    else if (number > max) return max;
    else return number;
}


//Control panel using google dat.gui
var bouncyballGui = function(){
    this.particles = bouncyballCount;

    this.reload = function(){
        bouncyballCount = this.particles;
        /*this.shaderLoc = createProgram(gl, this.VSHADER_SOURCE_PARTICLE, this.FSHADER_SOURCE_PARTICLE);
        if (!this.shaderLoc) {
            console.log(this.constructor.name + 
                        '.init() failed to create executable Shaders on the GPU. Bye!');
            return;
        }
        this.g_partA.initBouncy3D(count, this.shaderLoc);*/
        bouncyball = new VBOPartSys();
        bouncyball.initBouncy3D(bouncyballCount,0.0,-3.0,0.0);
        bouncyball.vboInit();
    }   
}

var springpairGui = function(){
    this.K_Spring = kspring;
    this.K_Damp = kdamp;
    this.reload = function(){
        kspring = this.K_Spring;
        kdamp = this.K_Damp;
        springpair = new VBOPartSys();
        springpair.initSpringPair(2,0.0,3.0,0.0,kspring,kdamp)
        springpair.vboInit();
    }   
}

var boidsGui = function(){
    this.particles = partcount;
    this.K_avoidence = ka;
    this.K_velocity = kv;
    this.K_centering = kc;
    this.Radius = rad;
    this.reload = function(){
        partcount = this.particles;
        ka = this.K_avoidence;
        kv = this.K_velocity;
        kc = this.K_centering;
        rad = this.Radius;
        
        boids = new VBOPartSys();
        boids.initFlocking(partcount,0.0,0.0,0.0,0.0,ka,kv,kc,rad);
        boids.vboInit();
    }
}

function windowLoad(){
    var bouncyballFolder = new bouncyballGui();
    var springpairFolder = new springpairGui();
    var boidsFolder = new boidsGui();
    var gui = new dat.GUI();

    var normalBouncyball = gui.addFolder('Bouncy Balls');
    normalBouncyball.add(bouncyballFolder, 'particles');
    normalBouncyball.add(bouncyballFolder, 'reload');
    normalBouncyball.open();

    var normalSpringPair = gui.addFolder('Spring Pair');
    normalSpringPair.add(springpairFolder,'K_Spring',0.5,20);
    normalSpringPair.add(springpairFolder,'K_Damp',0.5,10);
    normalSpringPair.add(springpairFolder,'reload');
    normalSpringPair.open();

    var normalboids = gui.addFolder('Boids');
    normalboids.add(boidsFolder,'particles');
    normalboids.add(boidsFolder,'K_avoidence',0.5,10);
    normalboids.add(boidsFolder,'K_velocity',0.5,10);
    normalboids.add(boidsFolder,'K_centering',0.5,10);
    normalboids.add(boidsFolder,'Radius',0.1,2);
    normalboids.add(boidsFolder,'reload')
    normalboids.open()
}












