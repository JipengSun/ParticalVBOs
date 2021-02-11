var gl;
var g_canvas;
var g_digits = 5;

var isDrag = false;
var xMclick = 0.0;
var yMclick = 0.0;
var xMdragTot = 0.0;
var yMdragTot = 0.0;

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

var g_partVBO = new VBOPartSys();
var g_groundVBO = new VBObox0();
g_worldMat = new Matrix4();

var g_show0 = 1;								// 0==Show, 1==Hide VBO0 contents on-screen.
var g_show1 = 1;								// 	"					"			VBO1		"				"				" 
var g_show2 = 1;                //  "         "     VBO2    "       "       "

function main(){
    g_canvas = document.getElementById('webgl');
    gl = g_canvas.getContext("webgl", { preserveDrawingBuffer: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    gl.clearColor(0.2, 0.2, 0.2, 1);	  // RGBA color for clearing <canvas>
    gl.enable(gl.DEPTH_TEST);
    g_partVBO.initBouncy3D(10);
    g_partVBO.vboInit();

    setCamera();

    gl.clearColor(0.2, 0.2, 0.2, 1);
    window.addEventListener("keydown", myKeyDown, false);
	// After each 'keydown' event, call the 'myKeyDown()' function.  The 'false' 
	// arg (default) ensures myKeyDown() call in 'bubbling', not 'capture' stage)
	// ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
	window.addEventListener("keyup", myKeyUp, false);
	// Called when user RELEASES the key.  Now rarely used...
	// MOUSE:--------------------------------------------------
	// Create 'event listeners' for a few vital mouse events 
	// (others events are available too... google it!).  
	window.addEventListener("mousedown", myMouseDown); 
	// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
    window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	
	window.addEventListener("click", myMouseClick);				
    window.addEventListener("dblclick", myMouseDblClick); 
    console.log('start to draw');
    printControls();
    console.log('start to draw!!');
    var tick = function() {		    // locally (within main() only), define our 
            // self-calling animation function. 
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
        drawAll();                // Draw all the VBObox contents
        requestAnimationFrame(tick, g_canvas); // browser callback request; wait
            // til browser is ready to re-draw canvas, then
       
    };
    tick();                       // do it again! 	
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
      return elapsed;
    }

function drawAll(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var b4Draw = Date.now();
    var b4Wait = b4Draw - g_last;
    if(g_show0 == 1) {	// IF user didn't press HTML button to 'hide' VBO0:
        console.log('begin to draw');
        g_partVBO.switchToMe();
        g_partVBO.adjust()
        g_partVBO.applyForces(g_partVBO.s1, g_partVBO.forceList);
        g_partVBO.dotFinder(g_partVBO.s1dot, g_partVBO.s1)
        g_partVBO.solver();
        g_partVBO.doConstraints();
        g_partVBO.render();
        g_partVBO.swap();
    }
    printControls();		// Display particle-system status on-screen. 
    
    if(g_show1 == 1) { // IF user didn't press HTML button to 'hide' VBO1:
    g_groundVBO.switchToMe();  // Set WebGL to render from this VBObox.
    g_groundVBO.adjust();		  // Send new values for uniforms to the GPU, and
    g_groundVBO.draw();			  // draw our VBO's contents using our shaders.
	  }
    /*
	if(g_show2 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
	phongBox.switchToMe();  // Set WebGL to render from this VBObox.
  	phongBox.adjust();		  // Send new values for uniforms to the GPU, and
  	phongBox.draw();			  // draw our VBO's contents using our shaders.
  	}
    */
}
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
            document.getElementById('MouseResult1').innerHTML = 
        'myMouseDown() at CVV coords x,y = '+x.toFixed(g_digits)+
                                        ', '+y.toFixed(g_digits)+'<br>';
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
    document.getElementById('MouseResult1').innerHTML = 
    'myMouseUp() at CVV coords x,y = '+x+', '+y+'<br>';
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
// Called when user presses down ANY key on the keyboard;
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of a mess of JavaScript keyboard event handling,
// see:    http://javascript.info/tutorial/keyboard-events
//
// NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
//        'keydown' event deprecated several read-only properties I used
//        previously, including kev.charCode, kev.keyCode. 
//        Revised 2/2019:  use kev.key and kev.code instead.
//
/*
    // On console, report EVERYTHING about this key-down event:  
    console.log("--kev.code:",      kev.code,   "\t\t--kev.key:",     kev.key, 
                "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
                "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);
*/
    // On webpage, report EVERYTING about this key-down event:              
    document.getElementById('KeyDown').innerHTML = ''; // clear old result
    document.getElementById('KeyMod').innerHTML = ''; 
    document.getElementById('KeyMod' ).innerHTML = 
        "   --kev.code:"+kev.code   +"      --kev.key:"+kev.key+
    "<br>--kev.ctrlKey:"+kev.ctrlKey+" --kev.shiftKey:"+kev.shiftKey+
    "<br> --kev.altKey:"+kev.altKey +"  --kev.metaKey:"+kev.metaKey;  

    // RESET our g_timeStep min/max recorder on every key-down event:
    g_timeStepMin = g_timeStep;
    g_timeStepMax = g_timeStep;

    switch(kev.code) {
    case "Digit0":
            g_partVBO.runMode = 0;			// RESET!
            document.getElementById('KeyDown').innerHTML =  
            'myKeyDown() digit 0 key. Run Mode 0: RESET!';    // print on webpage,
            console.log("Run Mode 0: RESET!");                // print on console.
        break;
    case "Digit1":
            g_partVBO.runMode = 1;			// PAUSE!
            document.getElementById('KeyDown').innerHTML =  
            'myKeyDown() digit 1 key. Run Mode 1: PAUSE!';    // print on webpage,
            console.log("Run Mode 1: PAUSE!");                // print on console.
        break;
    case "Digit2":
            g_partVBO.runMode = 2;			// STEP!
            document.getElementById('KeyDown').innerHTML =  
            'myKeyDown() digit 2 key. Run Mode 2: STEP!';     // print on webpage,
            console.log("Run Mode 2: STEP!");                 // print on console.
        break;
    case "Digit3":
            g_partVBO.runMode = 3;			// RESET!
            document.getElementById('KeyDown').innerHTML =  
            'myKeyDown() digit 3 key. Run Mode 3: RUN!';      // print on webpage,
            console.log("Run Mode 3: RUN!");                  // print on console.
        break;
    case "KeyB":                // Toggle floor-bounce constraint type
            if(g_partVBO.bounceType==0) g_partVBO.bounceType = 1;   // impulsive vs simple
            else g_partVBO.bounceType = 0;
            document.getElementById('KeyDown').innerHTML =  
            'myKeyDown() b/B key: toggle bounce mode.';	      // print on webpage,
            console.log("b/B key: toggle bounce mode.");      // print on console. 
        break;
    case "KeyC":                // Toggle screen-clearing to show 'trails'
            g_isClear += 1;
            if(g_isClear > 1) g_isClear = 0;
            document.getElementById('KeyDown').innerHTML =  
            'myKeyDown() c/C key: toggle screen clear.';	 // print on webpage,
            console.log("c/C: toggle screen-clear g_isClear:",g_isClear); // print on console,
        break;
    case "KeyD":      // 'd'  INCREASE drag loss; 'D' to DECREASE drag loss
        if(kev.shiftKey==false) g_partVBO.drag *= 0.995; // permit less movement.
        else {
        g_partVBO.drag *= 1.0 / 0.995;
        if(g_partVBO.drag > 1.0) g_partVBO.drag = 1.0;  // don't let drag ADD energy!
        }
        document.getElementById('KeyDown').innerHTML =  
        'myKeyDown() d/D key: grow/shrink drag.';	 // print on webpage,
        console.log("d/D: grow/shrink drag:", g_partVBO.drag); // print on console,
        break;
    case "KeyF":    // 'f' or 'F' to toggle particle fountain on/off
        g_partVBO.isFountain += 1;
        if(g_partVBO.isFountain > 1) g_partVBO.isFountain = 0;
        document.getElementById('KeyDown').innerHTML =  
        "myKeyDown() f/F key: toggle age constraint (fountain).";	// print on webpage,
            console.log("F: toggle age constraint (fountain)."); // print on console,
        break;
    case "KeyG":    // 'g' to REDUCE gravity; 'G' to increase.
        if(kev.shiftKey==false) 		g_partVBO.grav *= 0.99;		// shrink 1%
        else                        g_partVBO.grav *= 1.0/0.98; // grow 2%
        document.getElementById('KeyDown').innerHTML =  
        'myKeyDown() g/G key: shrink/grow gravity.';	 			// print on webpage,
        console.log("g/G: shrink/grow gravity:", g_partVBO.grav); 	// print on console,
        break;
    case "KeyM":    // 'm' to REDUCE mass; 'M' to increase.
        if(kev.shiftKey==false)     g_partVBO.mass *= 0.98;   // shrink 2%
        else                        g_partVBO.mass *= 1.0/0.98; // grow 2%  
        document.getElementById('KeyDown').innerHTML =  
        'myKeyDown() m/M key: shrink/grow mass.';	 				      // print on webpage,
        console.log("m/M: shrink/grow mass:", g_partVBO.mass); 		// print on console,
        break;
    case "KeyP":
        if(g_partVBO.runMode == 3) g_partVBO.runMode = 1;		// if running, pause
                            else g_partVBO.runMode = 3;		          // if paused, run.
        document.getElementById('KeyDown').innerHTML =  
                'myKeyDown() p/P key: toggle Pause/unPause!';    // print on webpage
        console.log("p/P key: toggle Pause/unPause!");   			// print on console,
            break;
    case "KeyR":    // r/R for RESET: 
        if(kev.shiftKey==false) {   // 'r' key: SOFT reset; boost velocity only
            g_partVBO.runMode = 3;  // RUN!
        var j=0; // array index for particle i
        for(var i = 0; i < g_partVBO.partCount; i += 1, j+= PART_MAXVAR) {
            g_partVBO.roundRand();  // make a spherical random var.
                if(  g_partVBO.s2[j + PART_XVEL] > 0.0) // ADD to positive velocity, and 
                        g_partVBO.s2[j + PART_XVEL] += 1.7 + 0.4*g_partVBO.randX*g_partVBO.INIT_VEL;
                                                        // SUBTRACT from negative velocity: 
                else g_partVBO.s2[j + PART_XVEL] -= 1.7 + 0.4*g_partVBO.randX*g_partVBO.INIT_VEL; 

                if(  g_partVBO.s2[j + PART_YVEL] > 0.0) 
                        g_partVBO.s2[j + PART_YVEL] += 1.7 + 0.4*g_partVBO.randY*g_partVBO.INIT_VEL; 
                else g_partVBO.s2[j + PART_YVEL] -= 1.7 + 0.4*g_partVBO.randY*g_partVBO.INIT_VEL;

                if(  g_partVBO.s2[j + PART_ZVEL] > 0.0) 
                        g_partVBO.s2[j + PART_ZVEL] += 1.7 + 0.4*g_partVBO.randZ*g_partVBO.INIT_VEL; 
                else g_partVBO.s2[j + PART_ZVEL] -= 1.7 + 0.4*g_partVBO.randZ*g_partVBO.INIT_VEL;
                }
        }
        else {      // HARD reset: position AND velocity, BOTH state vectors:
            g_partVBO.runMode = 0;			// RESET!
        // Reset state vector s1 for ALL particles:
        var j=0; // array index for particle i
        for(var i = 0; i < g_partVBO.partCount; i += 1, j+= PART_MAXVAR) {
                g_partVBO.roundRand();
                    g_partVBO.s2[j + PART_XPOS] =  -0.9;      // lower-left corner of CVV
                    g_partVBO.s2[j + PART_YPOS] =  -0.9;      // with a 0.1 margin
                    g_partVBO.s2[j + PART_ZPOS] =  0.0;	
                    g_partVBO.s2[j + PART_XVEL] =  3.7 + 0.4*g_partVBO.randX*g_partVBO.INIT_VEL;	
                    g_partVBO.s2[j + PART_YVEL] =  3.7 + 0.4*g_partVBO.randY*g_partVBO.INIT_VEL; // initial velocity in meters/sec.
                g_partVBO.s2[j + PART_ZVEL] =  3.7 + 0.4*g_partVBO.randZ*g_partVBO.INIT_VEL;
                // do state-vector s2 as well: just copy all elements of the float32array.
                g_partVBO.s2.set(g_partVBO.s1);
        } // end for loop
        } // end HARD reset
        document.getElementById('KeyDown').innerHTML =  
        'myKeyDown() r/R key: soft/hard Reset.';	// print on webpage,
        console.log("r/R: soft/hard Reset");      // print on console,
        break;
        case "KeyS":
            if(g_partVBO.solvType == SOLV_EULER) g_partVBO.solvType = SOLV_OLDGOOD;  
            else g_partVBO.solvType = SOLV_EULER;     
            document.getElementById('KeyDown').innerHTML =  
            'myKeyDown() found s/S key. Switch solvers!';       // print on webpage.
            console.log("s/S: Change Solver:", g_partVBO.solvType); // print on console.
            break;
        case "Space":
        g_partVBO.runMode = 2;
        document.getElementById('KeyDown').innerHTML =  
        'myKeyDown() found Space key. Single-step!';   // print on webpage,
        console.log("SPACE bar: Single-step!");        // print on console.
        break;
        case "ArrowLeft": 	
            // and print on webpage in the <div> element with id='Result':
        g_EyeX -= 0.1;
            document.getElementById('KeyDown').innerHTML =
                'myKeyDown(): Arrow-Left,keyCode='+kev.keyCode;
            console.log("Arrow-Left key(UNUSED)");
            break;
        case "ArrowRight":
        g_EyeX += 0.1;
            document.getElementById('KeyDown').innerHTML =
                'myKeyDown(): Arrow-Right,keyCode='+kev.keyCode;
            console.log("Arrow-Right key(UNUSED)");
            break;
        case "ArrowUp":	
        g_EyeY += 0.1;	
            document.getElementById('KeyDown').innerHTML =
                'myKeyDown(): Arrow-Up,keyCode='+kev.keyCode;
            console.log("Arrow-Up key(UNUSED)");
            break;
        case "ArrowDown":
        g_EyeY -= 0.1;	
            document.getElementById('KeyDown').innerHTML =
                'myKeyDown(): Arrow-Down,keyCode='+kev.keyCode;
                console.log("Arrow-Down key(UNUSED)");
            break;	
        case "KeyN":
        g_EyeZ -= 0.1;	
            document.getElementById('KeyDown').innerHTML =
                'KeyDown(): Arrow-Down,keyCode='+kev.keyCode;
                console.log("Arrow-Down key(UNUSED)");
            break;
        case "KeyJ":
        g_EyeZ += 0.1;	
            document.getElementById('KeyDown').innerHTML =
                'KeyDown(): Arrow-Down,keyCode='+kev.keyCode;
                console.log("Arrow-Down key(UNUSED)");
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

    console.log("myKeyUp():\n--kev.code:",kev.code,"\t\t--kev.key:", kev.key);
}

function printControls() {
//==============================================================================
// Print current state of the particle system on the webpage:
    var recipTime = 1000.0 / g_timeStep;			// to report fractional seconds
    var recipMin  = 1000.0 / g_timeStepMin;
    var recipMax  = 1000.0 / g_timeStepMax; 
    var solvTypeTxt;												// convert solver number to text:
    if(g_partVBO.solvType==0) solvTypeTxt = 'Explicit--(unstable!)<br>';
                        else  solvTypeTxt = 'Implicit--(stable)<br>'; 
    var bounceTypeTxt;											// convert bounce number to text
    if(g_partVBO.bounceType==0) bounceTypeTxt = 'Velocity Reverse(no rest)<br>';
                            else bounceTypeTxt = 'Impulsive (will rest)<br>';
    var fountainText;
    if(g_partVBO.isFountain==0) fountainText = 'OFF: ageless particles.<br>';
    else                      fountainText = 'ON: re-cycle old particles.<br>';
    var xvLimit = g_partVBO.s2[PART_XVEL];	// find absolute values of s2[PART_XVEL]
    if(g_partVBO.s2[PART_XVEL] < 0.0) xvLimit = -g_partVBO.s2[PART_XVEL];
    var yvLimit = g_partVBO.s2[PART_YVEL];	// find absolute values of s2[PART_YVEL]
    if(g_partVBO.s2[PART_YVEL] < 0.0) yvLimit = -g_partVBO.s2[PART_YVEL];
    
    document.getElementById('KeyControls').innerHTML = 
                '<b>Solver = </b>' + solvTypeTxt + 
                '<b>Bounce = </b>' + bounceTypeTxt +
                '<b>Fountain =</b>' + fountainText +
                '<b>drag = </b>' + g_partVBO.drag.toFixed(5) + 
                ', <b>grav = </b>' + g_partVBO.grav.toFixed(5) +
                ' m/s^2; <b>yVel = +/-</b> ' + yvLimit.toFixed(5) + 
                ' m/s; <b>xVel = +/-</b> ' + xvLimit.toFixed(5) + 
                ' m/s;<br><b>timeStep = </b> 1/' + recipTime.toFixed(3) + ' sec' +
                                ' <b>min:</b> 1/' + recipMin.toFixed(3)  + ' sec' + 
                                ' <b>max:</b> 1/' + recipMax.toFixed(3)  + ' sec<br>';
                ' <b>stepCount: </b>' + g_stepCount.toFixed(3) ;
}


function onPlusButton() {
//==============================================================================
    g_partVBO.INIT_VEL *= 1.2;		// grow
    console.log('Initial velocity: '+g_partVBO.INIT_VEL);
}

function onMinusButton() {
//==============================================================================
    g_partVBO.INIT_VEL /= 1.2;		// shrink
    console.log('Initial velocity: '+g_partVBO.INIT_VEL);
}
           
function VBO0toggle() {
    //=============================================================================
    // Called when user presses HTML-5 button 'Show/Hide VBO0'.
      if(g_show0 != 1) g_show0 = 1;				// show,
      else g_show0 = 0;										// hide.
      console.log('g_show0: '+g_show0);
    }
function VBO1toggle() {
    //=============================================================================
    // Called when user presses HTML-5 button 'Show/Hide VBO1'.
        if(g_show1 != 1) g_show1 = 1;			// show,
        else g_show1 = 0;									// hide.
        console.log('g_show1: '+g_show1);
    }
    
function VBO2toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO2'.
    if(g_show2 != 1) g_show2 = 1;			// show,
    else g_show2 = 0;									// hide.
    console.log('g_show2: '+g_show2);
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
    
        g_worldMat.lookAt( 3.0, 3.0, 7.0,	// center of projection
                                       0.0, 0.0, 0.0,	// look-at point 
                                       0.0, 1.0, 0.0);	// View UP vector.
        // READY to draw in the 'world' coordinate system.
    //------------END COPY
    
    }