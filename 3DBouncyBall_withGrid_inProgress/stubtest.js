var gl;
var g_canvas
var g_digits = 5;

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

var g_ModelMatrix = new Matrix4();
var current_rotation = 0;
var x_Coordinate = -8;
var y_Coordinate = 0;
var z_Coordinate = 0.5;
var x_lookAt = 0;
var y_lookAt = 0;
var z_lookAt = z_Coordinate;

var lookAtVector = new Vector3([x_lookAt, y_lookAt, z_lookAt]);
var eyePosVector = new Vector3([x_Coordinate, y_Coordinate, z_Coordinate]);


ground = new groundVBO();

function main(){
    g_canvas = document.getElementById('webgl');
    gl = g_canvas.getContext('webgl',{preserveDrawingBuffer: true})
    if (!gl) {
        console.log('main() Failed to get the rendering context for WebGL');
        return;
      }
    gl.clearColor(0.25, 0.25, 0.25, 1);	// RGBA color for clearing WebGL framebuffer
    gl.clear(gl.COLOR_BUFFER_BIT);		  // clear it once to set that color as bkgnd.
    gl.enable(gl.DEPTH_TEST);

    ground.init();

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
      /*
        if (updateRotAngle == true) {
            g_rotAngle += g_angleRate * updateRotAngleSign * g_timeStep * 0.001;
      }
      */
    
      return elapsed;
    }

function drawAll(){
    ground.switchToMe();
    ground.adjust();
    ground.render();
}