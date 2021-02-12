const PART_XPOS     = 0;  //  position    
const PART_YPOS     = 1;
const PART_ZPOS     = 2;
const PART_WPOS     = 3;            // (why include w? for matrix transforms; 
                                    // for vector/point distinction
const PART_XVEL     = 4;  //  velocity -- ALWAYS a vector: x,y,z; no w. (w==0)    
const PART_YVEL     = 5;
const PART_ZVEL     = 6;
const PART_X_FTOT   = 7;  // force accumulator:'ApplyForces()' fcn clears
const PART_Y_FTOT   = 8;  // to zero, then adds each force to each particle.
const PART_Z_FTOT   = 9;        
const PART_R        =10;  // color : red,green,blue, alpha (opacity); 0<=RGBA<=1.0
const PART_G        =11;  
const PART_B        =12;
const PART_MASS     =13;  	// mass, in kilograms
const PART_DIAM 	=14;	// on-screen diameter (in pixels)
const PART_RENDMODE =15;	// on-screen appearance (square, round, or soft-round)
 // Other useful particle values, currently unused
const PART_AGE      =16;  // # of frame-times until re-initializing (Reeves Fire)
const PART_SIZE     =17
/*
const PART_CHARGE   =17;  // for electrostatic repulsion/attraction
const PART_MASS_VEL =18;  // time-rate-of-change of mass.
const PART_MASS_FTOT=19;  // force-accumulator for mass-change
const PART_R_VEL    =20;  // time-rate-of-change of color:red
const PART_G_VEL    =21;  // time-rate-of-change of color:grn
const PART_B_VEL    =22;  // time-rate-of-change of color:blu
const PART_R_FTOT   =23;  // force-accumulator for color-change: red
const PART_G_FTOT   =24;  // force-accumulator for color-change: grn
const PART_B_FTOT   =25;  // force-accumulator for color-change: blu
*/
const PART_MAXVAR   =18;  // Size of array in CPart uses to store its values.


// Array-Name consts that select PartSys objects' numerical-integration solver:
//------------------------------------------------------------------------------
// EXPLICIT methods: GOOD!
//    ++ simple, easy to understand, fast, but
//    -- Requires tiny time-steps for stable stiff systems, because
//    -- Errors tend to 'add energy' to any dynamical system, driving
//        many systems to instability even with small time-steps.
const SOLV_EULER       = 0;       // Euler integration: forward,explicit,...
const SOLV_MIDPOINT    = 1;       // Midpoint Method (see Pixar Tutorial)
const SOLV_ADAMS_BASH  = 2;       // Adams-Bashforth Explicit Integrator
const SOLV_RUNGEKUTTA  = 3;       // Arbitrary degree, set by 'solvDegree'

// IMPLICIT methods:  BETTER!
//          ++Permits larger time-steps for stiff systems, but
//          --More complicated, slower, less intuitively obvious,
//          ++Errors tend to 'remove energy' (ghost friction; 'damping') that
//              aids stability even for large time-steps.
//          --requires root-finding (iterative: often no analytical soln exists)
const SOLV_OLDGOOD     = 4;      //  early accidental 'good-but-wrong' solver
const SOLV_BACK_EULER  = 5;      // 'Backwind' or Implicit Euler
const SOLV_BACK_MIDPT  = 6;      // 'Backwind' or Implicit Midpoint
const SOLV_BACK_ADBASH = 7;      // 'Backwind' or Implicit Adams-Bashforth

// SEMI-IMPLICIT METHODS: BEST?
//          --Permits larger time-steps for stiff systems,
//          ++Simpler, easier-to-understand than Implicit methods
//          ++Errors tend to 'remove energy) (ghost friction; 'damping') that
//              aids stability even for large time-steps.
//          ++ DOES NOT require the root-finding of implicit methods,
const SOLV_VERLET      = 8;       // Verlet semi-implicit integrator;
const SOLV_VEL_VERLET  = 9;       // 'Velocity-Verlet'semi-implicit integrator
const SOLV_LEAPFROG    = 10;      // 'Leapfrog' integrator
const SOLV_MAX         = 11;      // number of solver types available.

const NU_EPSILON  = 10E-15;         // a tiny amount; a minimum vector length
                                    // to use to avoid 'divide-by-zero'

//=============================================================================
//==============================================================================

function VBOPartSys(){
 
  this.VERT_SRC =
  ' precision mediump float;                 \n' + // req'd in OpenGL ES if we use 'float'
  ' uniform    int u_runMode;                \n' + // particle system state: // 0=reset; 1= pause; 2=step; 3=run
  ' attribute vec4 a_Position;               \n' +
  ' uniform   mat4 u_ModelMat;               \n' +
  ' varying   vec4 v_Color;                  \n' +
  ' void main() {                            \n' +
  '   gl_PointSize = 20.0;                 \n' +// TRY MAKING THIS LARGER...
  '   gl_Position = u_ModelMat * a_Position; \n' +  
  '   if(u_runMode == 0) {                   \n' +
  '     v_Color = vec4(1.0, 0.0, 0.0, 1.0);  \n' +   // red: 0==reset
  '     }                                    \n' +
  '   else if(u_runMode == 1) {              \n' +
  '     v_Color = vec4(1.0, 1.0, 0.0, 1.0);  \n' +  // yellow: 1==pause
  '     }                                    \n' +
  '   else if(u_runMode == 2) {              \n' +    
  '     v_Color = vec4(1.0, 1.0, 1.0, 1.0);  \n' +  // white: 2==step
  '     }                                    \n' +
  '   else {                                 \n' +
  '     v_Color = vec4(0.2, 1.0, 0.2, 1.0);        \n' +  // green: >=3 ==run
  '     }                                    \n' +
  ' }                                        \n' ;

this.FRAG_SRC =
  'precision mediump float;                                 \n' +
  'varying vec4 v_Color;                                    \n' +
  'void main() {                                            \n' +
  '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));  \n' +
  '  if(dist < 0.5) {                                       \n' + 
  '   gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0); \n' +
  '  } else { discard; }                                    \n' +
  '}                                                        \n' ;       
  this.randX = 0;   // random point chosen by call to roundRand()
  this.randY = 0;
  this.randZ = 0;
  this.isFountain = 0;  // Press 'f' or 'F' key to toggle; if 1, apply age 
                        // age constraint, which re-initializes particles whose
                        // lifetime falls to zero, forming a 'fountain' of
                        // freshly re-initialized bouncy-balls.
  this.forceList = [];            // (empty) array to hold CForcer objects
                                  // for use by ApplyAllForces().
                                  // NOTE: this.forceList.push("hello"); appends
                                  // string "Hello" as last element of forceList.
                                  // console.log(this.forceList[0]); prints hello.
  this.limitList = [];            // (empty) array to hold CLimit objects
                                  // for use by doContstraints()
  this.u_runModeID;
  this.shaderLoc;
  this.ModelMat = new Matrix4();
  this.u_ModelMatLoc;
}
VBOPartSys.prototype.roundRand = function(){
//==============================================================================
// When called, find a new 3D point (this.randX, this.randY, this.randZ) chosen 
// 'randomly' and 'uniformly' inside a sphere of radius 1.0 centered at origin.  
//		(within this sphere, all regions of equal volume are equally likely to
//		contain the the point (randX, randY, randZ, 1).

do {			// RECALL: Math.random() gives #s with uniform PDF between 0 and 1.
    this.randX = 2.0*Math.random() -1.0; // choose an equally-likely 2D point
    this.randY = 2.0*Math.random() -1.0; // within the +/-1 cube, but
    this.randZ = 2.0*Math.random() -1.0;
    }       // is x,y,z outside sphere? try again!
while(this.randX*this.randX + 
      this.randY*this.randY + 
      this.randZ*this.randZ >= 1.0); 
}

// INIT FUNCTIONS:
//==================
// Each 'init' function initializes everything in our particle system. Each 
// creates all necessary state variables, force-applying objects, 
// constraint-applying objects, solvers and all other values needed to prepare
// the particle-system to run without any further adjustments.

VBOPartSys.prototype.initBouncy2D = function(count){

}
VBOPartSys.prototype.initBouncy3D = function(count) {
    this.partCount = count; 
    this.s1 = new Float32Array(this.partCount * PART_MAXVAR)
    this.s2 = new Float32Array(this.partCount * PART_MAXVAR)
    this.s1dot = new Float32Array(this.partCount * PART_MAXVAR)

// Create & init all force-causing objects------------------------------------
    fTmp = new CForcer();
    fTmp.forceType = F_GRAV_E;      
    fTmp.targFirst = 0;             
    fTmp.targCount = -1;            
    this.forceList.push(fTmp);

    fTmp = new CForcer();          
    fTmp.forceType = F_DRAG;
    fTmp.Kdrag = 0.15;              
    fTmp.targFirst = 0;             
    fTmp.targCount = -1;            
    this.forceList.push(fTmp); 

    console.log("PartSys.initBouncy3D() created PartSys.forceList[] array of ");
    console.log("\t\t", this.forceList.length, "CForcer objects:");
    for(i=0; i<this.forceList.length; i++) {
        console.log("CForceList[",i,"]");
        this.forceList[i].printMe();
        } 
// Create & init all constraint-causing objects-------------------------------
    var cTmp = new CLimit();      // creat constraint-causing object, and
    cTmp.hitType = HIT_BOUNCE_VEL;  // set how particles 'bounce' from its surface,
    cTmp.limitType = LIM_VOL;       // confine particles inside axis-aligned 
                                    // rectangular volume that
    cTmp.targFirst = 0;             // applies to ALL particles; starting at 0 
    cTmp.partCount = -1;            // through all the rest of them.
    cTmp.xMin = -1.0; cTmp.xMax = 1.0;  // box extent:  +/- 1.0 box at origin
    cTmp.yMin = -1.0; cTmp.yMax = 1.0;
    cTmp.zMin = -1.0; cTmp.zMax = 1.0;
    cTmp.Kresti = 1.0;              // bouncyness: coeff. of restitution.
                                    // (and IGNORE all other CLimit members...)
    this.limitList.push(cTmp);      // append this 'box' constraint object to the
                                    // 'limitList' array of constraint-causing objects.                                
    // Report:
    console.log("PartSys.initBouncy3D() created PartSys.limitList[] array of ");
    console.log("\t\t", this.limitList.length, "CLimit objects.");

    this.INIT_VEL =  0.15 * 60.0;		// initial velocity in meters/sec.
	                  // adjust by ++Start, --Start buttons. Original value 
										// was 0.15 meters per timestep; multiply by 60 to get
                    // meters per second.
    this.drag = 0.985;// units-free air-drag (scales velocity); adjust by d/D keys
    this.grav = 9.832;// gravity's acceleration(meter/sec^2); adjust by g/G keys.
                        // on Earth surface, value is 9.832 meters/sec^2.
    this.resti = 1.0; // units-free 'Coefficient of Restitution' for 
                        // inelastic collisions.  Sets the fraction of momentum 
                                            // (0.0 <= resti < 1.0) that remains after a ball 
                                            // 'bounces' on a wall or floor, as computed using 
                                            // velocity perpendicular to the surface. 
                                            // (Recall: momentum==mass*velocity.  If ball mass does 
                                            // not change, and the ball bounces off the x==0 wall,
                                            // its x velocity xvel will change to -xvel * resti ).
                                            
    //--------------------------init Particle System Controls:
    this.runMode =  2;// Master Control: 0=reset; 1= pause; 2=step; 3=run
    this.solvType = SOLV_EULER;// adjust by s/S keys.
                        // SOLV_EULER (explicit, forward-time, as 
                                            // found in BouncyBall03.01BAD and BouncyBall04.01badMKS)
                                            // SOLV_OLDGOOD for special-case implicit solver, reverse-time, 
                                            // as found in BouncyBall03.GOOD, BouncyBall04.goodMKS)
    this.bounceType = 1;	// floor-bounce constraint type:
                                            // ==0 for velocity-reversal, as in all previous versions
                                            // ==1 for Chapter 3's collision resolution method, which
                                            // uses an 'impulse' to cancel any velocity boost caused
                                            // by falling below the floor.
    
    // INITIALIZE s1, s2:
    var j = 0;
    for (var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR){
        this.roundRand();
        this.s1[j + PART_XPOS] = -0.5 + 0.1 * this.randX;
        this.s1[j + PART_YPOS] = -0.5 + 0.1 * this.randY;
        this.s1[j + PART_ZPOS] = -0.8 + 0.1 * this.randZ;
        this.s1[j + PART_WPOS] =  1.0;
        this.roundRand();
        this.s1[j + PART_XVEL] = this.INIT_VEL * (0.4 + 0.2*this.randX);
        this.s1[j + PART_YVEL] = this.INIT_VEL * (0.4 + 0.2*this.randY);
        this.s1[j + PART_ZVEL] = this.INIT_VEL * (0.4 + 0.2*this.randZ);
        this.s1[j + PART_MASS] = 1.0;
        this.s1[j + PART_DIAM] =  2.0 + 10*Math.random();
        this.s1[j + PART_RENDMODE] = 0.0;
        this.s1[j + PART_AGE] = 30 + 100*Math.random();
        this.s1[j + PART_SIZE] = 20.0;
        
        this.s2.set(this.s1);
    }
    this.FSIZE = this.s1.BYTES_PER_ELEMENT;


}
VBOPartSys.prototype.applyForces = function(s,fList){
    var j = 0;
    for (var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR){
        s[j + PART_X_FTOT] = 0.0
        s[j + PART_X_FTOT] = 0.0
        s[j + PART_X_FTOT] = 0.0
    }
    for (var k = 0; k < fList.length; k++){
        if (fList[k].forceType <= 0){
            continue;
        }
        // HOW THIS WORKS:
        // Most, but not all CForcer objects apply a force to many particles, and
        // the CForcer members 'targFirst' and 'targCount' tell us which ones:
        // *IF* targCount == 0, the CForcer applies ONLY to particle numbers e1,e2
        //          (e.g. the e1 particle begins at s[fList[k].e1 * PART_MAXVAR])
        // *IF* targCount < 0, apply the CForcer to 'targFirst' and all the rest
        //      of the particles that follow it in the state variable s.
        // *IF* targCount > 0, apply the CForcer to exactly 'targCount' particles,
        //      starting with particle number 'targFirst'
        // Begin by presuming targCount < 0;
        var m = fList[k].targFirst;
        var mmax = this.partCount;
        console.log(fList[k].targCount)

        if(fList[k].targCount ==0){
            m=mmax=0;
        }
        else if(fList[k].targCount > 0){
            var tmp = fList[k].targCount;
            if(tmp<mmax) mmax = tmp;
            else console.log("\n\n!!PartSys.applyForces() index error!!\n\n");}


            switch(fList[k].forceType){
                case F_MOUSE:
                    onsole.log("PartSys.applyForces(), fList[",k,"].forceType:", 
                                    fList[k].forceType, "NOT YET IMPLEMENTED!!");
                    break;
                case F_GRAV_E:
                    console.log(fList[k])
                    var j = m*PART_MAXVAR;
                    for(;m<mmax;m++,j+=PART_MAXVAR){
                        console.log('XFORCE',s[j+PART_X_FTOT])
                        s[j+PART_X_FTOT] += s[j+PART_MASS] * fList[k].gravConst * fList[k].downDir.elements[0];
                        s[j+PART_Y_FTOT] += s[j+PART_MASS] * fList[k].gravConst * fList[k].downDir.elements[1];
                        s[j+PART_Z_FTOT] += s[j+PART_MASS] * fList[k].gravConst * fList[k].downDir.elements[2];
                    }
                    break;
                case F_GRAV_P:    // planetary gravity between particle # e1 and e2.
                    console.log("PartSys.applyForces(), fList[",k,"].forceType:", 
                                            fList[k].forceType, "NOT YET IMPLEMENTED!!");
                    break;
                case F_WIND:      // Blowing-wind-like force-field; fcn of 3D position1
                    console.log("PartSys.applyForces(), fList[",k,"].forceType:", 
                                            fList[k].forceType, "NOT YET IMPLEMENTED!!");
                    break;
                case F_BUBBLE:    // Constant inward force (bub_force)to a 3D centerpoint 
                                // bub_ctr if particle is > bub_radius away from it.
                    console.log("PartSys.applyForces(), fList[",k,"].forceType:", 
                                            fList[k].forceType, "NOT YET IMPLEMENTED!!");
                    break;
                case F_DRAG:      // viscous drag: force = -K_drag * velocity.
                    var j = m*PART_MAXVAR;  // state var array index for particle # m
                    for(; m<mmax; m++, j+=PART_MAXVAR) { // for every particle# from m to mmax-1,
                                // force from gravity == mass * gravConst * downDirection
                        s[j + PART_X_FTOT] -= fList[k].K_drag * s[j + PART_XVEL]; 
                        s[j + PART_Y_FTOT] -= fList[k].K_drag * s[j + PART_YVEL];
                        s[j + PART_Z_FTOT] -= fList[k].K_drag * s[j + PART_ZVEL];
                    }
                    break;
                case F_SPRING:
                    console.log("PartSys.applyForces(), fList[",k,"].forceType:", 
                                                fList[k].forceType, "NOT YET IMPLEMENTED!!");
                    break;
                case F_SPRINGSET:
                    console.log("PartSys.applyForces(), fList[",k,"].forceType:", 
                                            fList[k].forceType, "NOT YET IMPLEMENTED!!");
                    break;
                case F_CHARGE:
                    console.log("PartSys.applyForces(), fList[",k,"].forceType:", 
                                            fList[k].forceType, "NOT YET IMPLEMENTED!!");
                    break;
                default:
                    console.log('aaaaaa',fList[k])
                    console.log("!!!ApplyForces() fList[",k,"] invalid forceType:", fList[k].forceType);
                    break;
            }
        }
    }
// s1dot contains the corresponding derivatives of the state variables.
VBOPartSys.prototype.dotFinder = function(s1dot,s1){
    var invMass;
    var j = 0;
    for(var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR){
        s1dot[j + PART_XPOS]     = s1[j + PART_XVEL];
        s1dot[j + PART_YPOS]     = s1[j + PART_YVEL];
        s1dot[j + PART_ZPOS]     = s1[j + PART_ZVEL];
        s1dot[j + PART_WPOS]     = 0.0;
        invMass                  = 1.0 / s1[j + PART_MASS];
        s1dot[j + PART_XVEL]     = s1[j + PART_X_FTOT] * invMass;
        s1dot[j + PART_YVEL]     = s1[j + PART_Y_FTOT] * invMass;
        s1dot[j + PART_ZVEL]     = s1[j + PART_Z_FTOT] * invMass;
        s1dot[j + PART_X_FTOT]   = 0.0;
        s1dot[j + PART_Y_FTOT]   = 0.0;
        s1dot[j + PART_Z_FTOT]   = 0.0;
        s1dot[j + PART_R]        = 0.0;
        s1dot[j + PART_G]        = 0.0;
        s1dot[j + PART_B]        = 0.0;
        s1dot[j + PART_MASS]     = 0.0;
        s1dot[j + PART_DIAM]     = 0.0;
        s1dot[j + PART_RENDMODE] = 0.0;
        s1dot[j + PART_AGE]      = 0.0;
        s1dot[j + PART_SIZE]     = 0.0;
    }
}
VBOPartSys.prototype.render = function(s){
    gl.bufferSubData(
        gl.ARRAY_BUFFER,
        0,
        this.s1
    );
    gl.uniform1i(this.u_runModeID, this.runMode);
    gl.drawArrays( gl.POINTS, 0, this.partCount);

}
VBOPartSys.prototype.solver = function(){
    switch(this.solvType){
        case SOLV_EULER:
            for (var n = 0; n < this.s1.length; n++){
                this.s2[n] = this.s1[n] + this.s1dot[n] * (g_timeStep * 0.001);
            }
        break;
        case SOLV_OLDGOOD:
            var j = 0;
            for (var i = 0; i < this.partCount; i+=1, j+= PART_MAXVAR){
                this.s2[j + PART_YVEL] -= this.grav*(g_timeStep*0.001);
                this.s2[j + PART_XVEL] *= this.drag;
                this.s2[j + PART_YVEL] *= this.drag;
                this.s2[j + PART_ZVEL] *= this.drag;

                this.s2[j + PART_XPOS] += this.s2[j + PART_XVEL] * (g_timeStep * 0.001)
                this.s2[j + PART_YPOS] += this.s2[j + PART_YVEL] * (g_timeStep * 0.001)
                this.s2[j + PART_ZPOS] += this.s2[j + PART_ZVEL] * (g_timeStep * 0.001)
            }
        break;
        case SOLV_MIDPOINT:         // Midpoint Method (see lecture notes)
            var sM = new Float32Array(this.partCount * PART_MAXVAR);
            var sMdot = new Float32Array(this.partCount * PART_MAXVAR);

            for (var n = 0; n < this.s1.length; n++) {
                sM[n] = this.s1[n] + this.s1dot[n] * (g_timeStep * 0.001 * 0.5);
            }

            this.dotFinder(sMdot, sM);

            for (var n = 0; n < this.s1.length; n++) {
                this.s2[n] = this.s1[n] + sMdot[n] * (g_timeStep * 0.001)
            }

        break;
        case SOLV_ADAMS_BASH:       // Adams-Bashforth Explicit Integrator
            console.log('NOT YET IMPLEMENTED: this.solvType==' + this.solvType);
        break;
        case SOLV_RUNGEKUTTA:       // Arbitrary degree, set by 'solvDegree'
            console.log('NOT YET IMPLEMENTED: this.solvType==' + this.solvType);
        break;
        case SOLV_BACK_EULER:       // 'Backwind' or Implicit Euler
             var sErr = new Float32Array(this.partCount * PART_MAXVAR);
             var s2Intermediate = new Float32Array(this.partCount * PART_MAXVAR);
             var s2IntermediateDot = new Float32Array(this.partCount * PART_MAXVAR);

             //First Calculate s2(0)
             for (var n = 0; n < this.s1.length; n++) {
                 s2Intermediate[n] = this.s1[n] + this.s1dot[n] * (g_timeStep * 0.001)
             }

             //Find the s2(0) dot
             this.dotFinder(s2IntermediateDot, s2Intermediate);

             //Calculate the Error
             for (var n = 0; n < this.s1.length; n++) {
                 sErr[n] = (s2IntermediateDot[n] - this.s1dot[n]) * g_timeStep * 0.001;
             }

             //Find the next timestep
             for (var n = 0; n < this.s1.length; n++) {
                 this.s2[n] = s2Intermediate[n] + sErr[n] * g_timeStep * 0.001;
             }

             break;
        case  SOLV_BACK_MIDPT:      // 'Backwind' or Implicit Midpoint
            var sErr = new Float32Array(this.partCount * PART_MAXVAR);
            var s2Intermediate = new Float32Array(this.partCount * PART_MAXVAR);
            var s2IntermediateDot = new Float32Array(this.partCount * PART_MAXVAR);
            var sM = new Float32Array(this.partCount * PART_MAXVAR);
            var sMdot = new Float32Array(this.partCount * PART_MAXVAR);
            var s3 = new Float32Array(this.partCount * PART_MAXVAR);

            //First Calculate s2(0)
            for (var n = 0; n < this.s1.length; n++) {
                s2Intermediate[n] = this.s1[n] + this.s1dot[n] * (g_timeStep * 0.001)
            }

            //Find the s2(0) dot
            this.dotFinder(s2IntermediateDot, s2Intermediate);

            //Half-step with s2(0) derivative
            for (var n = 0; n < s2Intermediate.length; n++) {
                sM[n] = s2Intermediate[n] - s2IntermediateDot[n] * g_timeStep * 0.001 * 0.5;
            }

            //Fint the sMdot 
            this.dotFinder(sMdot, sM);

            for (var n = 0; n < s2Intermediate.length; n++) {
                s3[n] = s2Intermediate[n] - sMdot[n] * g_timeStep * 0.001;
            }

            //Find the error
            for (var n = 0; n < s2Intermediate.length; n++) {
                sErr[n] = s3[n] - this.s1[n];
            }

            //Set the next TimeStep
            for (var n = 0; n < s2Intermediate.length; n++) {
                this.s2[n] = s2Intermediate[n] - (sErr[n] * 0.5);
            }
        break;
        case SOLV_BACK_ADBASH:      // 'Backwind' or Implicit Adams-Bashforth
            console.log('NOT YET IMPLEMENTED: this.solvType==' + this.solvType);
        break;
        case SOLV_VERLET:          // Verlet semi-implicit integrator;
            console.log('NOT YET IMPLEMENTED: this.solvType==' + this.solvType);
        break;
        case SOLV_VEL_VERLET:      // 'Velocity-Verlet'semi-implicit integrator
            console.log('NOT YET IMPLEMENTED: this.solvType==' + this.solvType);
        break;
        case SOLV_LEAPFROG:        // 'Leapfrog' integrator
            console.log('NOT YET IMPLEMENTED: this.solvType==' + this.solvType);
        break;
        default:
            console.log('?!?! unknown solver: this.solvType==' + this.solvType);
        break;
            }
		return;
}
VBOPartSys.prototype.doConstraints = function(sNow,sNext,cList){
if(this.bounceType==0){
    var j = 0;
    for(var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR){
        if(this.s2[j + PART_XPOS] < -0.9 && this.s2[j + PART_XVEL] < 0.0){
            this.s2[j + PART_XVEL] = -this.resti * this.s2[j + PART_XVEL];
        }
        else if(this.s2[j + PART_XPOS] > 0.9 && this.s2[j + PART_XVEL] > 0.0){
            this.s2[j + PART_XVEL] = -this.resti * this.s2[j + PART_XVEL];
        }
        if(this.s2[j + PART_YPOS] < -0.9 && this.s2[j + PART_YVEL] < 0.0) {
            this.s2[j + PART_YVEL] = -this.resti * this.s2[j + PART_YVEL];
        }
        else if( this.s2[j + PART_YPOS] >  0.9 && this.s2[j + PART_YVEL] > 0.0) {		
  			this.s2[j + PART_YVEL] = -this.resti * this.s2[j + PART_YVEL];
  		}
        if(this.s2[j + PART_ZPOS] < -0.9 && this.s2[j + PART_ZVEL] < 0.0) {
            this.s2[j + PART_ZVEL] = -this.resti * this.s2[j + PART_ZVEL];
        }
        else if( this.s2[j + PART_ZPOS] >  0.9 && this.s2[j + PART_ZVEL] > 0.0) {		
  		    this.s2[j + PART_ZVEL] = -this.resti * this.s2[j + PART_ZVEL];
        }
    
    if(      this.s2[j + PART_YPOS] < -0.9) this.s2[j + PART_YPOS] = -0.9;
    else if( this.s2[j + PART_YPOS] >  0.9) this.s2[j + PART_YPOS] =  0.9; // ceiling
    if(      this.s2[j + PART_XPOS] < -0.9) this.s2[j + PART_XPOS] = -0.9; // left wall
    else if( this.s2[j + PART_XPOS] >  0.9) this.s2[j + PART_XPOS] =  0.9; // right wall
    if(      this.s2[j + PART_ZPOS] < -0.9) this.s2[j + PART_ZPOS] = -0.9; // near wall
    else if( this.s2[j + PART_ZPOS] >  0.9) this.s2[j + PART_ZPOS] =  0.9; // far wall
    }
}
else if(this.bounceType == 1){
    var j = 0;
    for(var i = 0; i < this.partCount; i += 1, j+= PART_MAXVAR){
        // Left wall
        if(this.s2[j + PART_XPOS] < -0.9){
            this.s2[j + PART_XPOS] = -0.9;
            this.s2[j + PART_XVEL] = this.s1[j + PART_XVEL];
            this.s2[j + PART_XVEL] *= this.drag;
            if(this.s2[j + PART_XVEL] < 0.0)
                this.s2[j + PART_XVEL] = -this.resti * this.s2[j + PART_XVEL];
            else
                this.s2[j + PART_XVEL] = this.resti * this.s2[j + PART_XVEL];
        }
        // Right wall
        else if(this.s2[j + PART_XPOS] > 0.9) { // && this.s2[j + PART_XVEL] > 0.0) {	
            // collision!
            this.s2[j + PART_XPOS] = 0.9; // 1) resolve contact: put particle at wall.
            this.s2[j + PART_XVEL] = this.s1[j + PART_XVEL];	// 2a) undo velocity change:
            this.s2[j + PART_XVEL] *= this.drag;			        // 2b) apply drag:
            // 3) BOUNCE:  reversed velocity*coeff-of-restitution.
            // ATTENTION! VERY SUBTLE PROBLEM HERE! 
            // need a velocity-sign test here that ensures the 'bounce' step will 
            // always send the ball outwards, away from its wall or floor collision. 
            if(this.s2[j + PART_XVEL] > 0.0) 
                this.s2[j + PART_XVEL] = -this.resti * this.s2[j + PART_XVEL]; // need sign change--bounce!
            else 
                this.s2[j + PART_XVEL] =  this.resti * this.s2[j + PART_XVEL];	// sign changed-- don't need another.
            }
        //--------  floor (-Y) wall  --------------------------------------------
        if(this.s2[j + PART_YPOS] < -0.9) { // && this.s2[j + PART_YVEL] < 0.0) {		
            // collision! floor...  
            this.s2[j + PART_YPOS] = -0.9;// 1) resolve contact: put particle at wall.
            this.s2[j + PART_YVEL] = this.s1[j + PART_YVEL];	// 2a) undo velocity change:
            this.s2[j + PART_YVEL] *= this.drag;		          // 2b) apply drag:	
            // 3) BOUNCE:  reversed velocity*coeff-of-restitution.
            // ATTENTION! VERY SUBTLE PROBLEM HERE!
            // need a velocity-sign test here that ensures the 'bounce' step will 
            // always send the ball outwards, away from its wall or floor collision.
            if(this.s2[j + PART_YVEL] < 0.0) 
                this.s2[j + PART_YVEL] = -this.resti * this.s2[j + PART_YVEL]; // need sign change--bounce!
            else 
                this.s2[j + PART_YVEL] =  this.resti * this.s2[j + PART_YVEL];	// sign changed-- don't need another.
            }
        //--------  ceiling (+Y) wall  ------------------------------------------
  		else if( this.s2[j + PART_YPOS] > 0.9 ) { // && this.s2[j + PART_YVEL] > 0.0) {
            // collision! ceiling...
            this.s2[j + PART_YPOS] = 0.9;// 1) resolve contact: put particle at wall.
            this.s2[j + PART_YVEL] = this.s1[j + PART_YVEL];	// 2a) undo velocity change:
            this.s2[j + PART_YVEL] *= this.drag;			        // 2b) apply drag:
            // 3) BOUNCE:  reversed velocity*coeff-of-restitution.
            // ATTENTION! VERY SUBTLE PROBLEM HERE!
            // need a velocity-sign test here that ensures the 'bounce' step will 
            // always send the ball outwards, away from its wall or floor collision.
            if(this.s2[j + PART_YVEL] > 0.0) 
                this.s2[j + PART_YVEL] = -this.resti * this.s2[j + PART_YVEL]; // need sign change--bounce!
            else 
                this.s2[j + PART_YVEL] =  this.resti * this.s2[j + PART_YVEL];	// sign changed-- don't need another.
          }
        //--------  near (-Z) wall  --------------------------------------------- 
  		if( this.s2[j + PART_ZPOS] < -0.9 ) { // && this.s2[j + PART_ZVEL] < 0.0 ) {
            // collision! 
            this.s2[j + PART_ZPOS] = -0.9;// 1) resolve contact: put particle at wall.
            this.s2[j + PART_ZVEL] = this.s1[j + PART_ZVEL];  // 2a) undo velocity change:
            this.s2[j + PART_ZVEL] *= this.drag;			        // 2b) apply drag:
            // 3) BOUNCE:  reversed velocity*coeff-of-restitution.
            // ATTENTION! VERY SUBTLE PROBLEM HERE! ------------------------------
            // need a velocity-sign test here that ensures the 'bounce' step will 
            // always send the ball outwards, away from its wall or floor collision. 
            if( this.s2[j + PART_ZVEL] < 0.0) 
                this.s2[j + PART_ZVEL] = -this.resti * this.s2[j + PART_ZVEL]; // need sign change--bounce!
            else 
                this.s2[j + PART_ZVEL] =  this.resti * this.s2[j + PART_ZVEL];	// sign changed-- don't need another.
        }
        //--------  far (+Z) wall  ---------------------------------------------- 
  		else if( this.s2[j + PART_ZPOS] >  0.9) { // && this.s2[j + PART_ZVEL] > 0.0) {	
            // collision! 
            this.s2[j + PART_ZPOS] = 0.9; // 1) resolve contact: put particle at wall.
            this.s2[j + PART_ZVEL] = this.s1[j + PART_ZVEL];  // 2a) undo velocity change:
            this.s2[j + PART_ZVEL] *= this.drag;			        // 2b) apply drag:
            // 3) BOUNCE:  reversed velocity*coeff-of-restitution.
            // ATTENTION! VERY SUBTLE PROBLEM HERE! ------------------------------
            // need a velocity-sign test here that ensures the 'bounce' step will 
            // always send the ball outwards, away from its wall or floor collision.   			
            if(this.s2[j + PART_ZVEL] > 0.0) 
                this.s2[j + PART_ZVEL] = -this.resti * this.s2[j + PART_ZVEL]; // need sign change--bounce!
            else 
                this.s2[j + PART_ZVEL] =  this.resti * this.s2[j + PART_ZVEL];	// sign changed-- don't need another.
            } // end of (+Z) wall constraint
    }
}

else {
    console.log('?!?! unknown constraint: PartSys.bounceType==' + this.bounceType);
    return;
}
//-----------------------------add 'age' constraint:
if(this.isFountain == 1)    // When particle age falls to zero, re-initialize
// to re-launch from a randomized location with
// a randomized velocity and randomized age.
    {
        var j = 0;  // i==particle number; j==array index for i-th particle
        for(var i = 0; i < this.partCount; i += 1, j+= PART_MAXVAR) {
            this.s2[j + PART_AGE] -= 1;     // decrement lifetime.
            if(this.s2[j + PART_AGE] <= 0) { // End of life: RESET this particle!
                this.roundRand();       // set this.randX,randY,randZ to random location in 
                // a 3D unit sphere centered at the origin.
                //all our bouncy-balls stay within a +/- 0.9 cube centered at origin; 
                // set random positions in a 0.1-radius ball centered at (-0.8,-0.8,-0.8)
                this.s2[j + PART_XPOS] = -0.0 + 0.2*this.randX; 
                this.s2[j + PART_YPOS] = -0.4 + 0.2*this.randY;  
                this.s2[j + PART_ZPOS] = -0.0 + 0.2*this.randZ;
                this.s2[j + PART_WPOS] =  1.0;      // position 'w' coordinate;
                this.roundRand(); // Now choose random initial velocities too:
                this.s2[j + PART_XVEL] =  this.INIT_VEL*(0.0 + 0.2*this.randX);
                this.s2[j + PART_YVEL] =  this.INIT_VEL*(0.5 + 0.2*this.randY);
                this.s2[j + PART_ZVEL] =  this.INIT_VEL*(0.0 + 0.2*this.randZ);
                this.s2[j + PART_MASS] =  1.0;      // mass, in kg.
                this.s2[j + PART_DIAM] =  2.0 + 10*Math.random(); // on-screen diameter, in pixels
                this.s2[j + PART_RENDMODE] = 0.0;
                this.s2[j + PART_AGE] = 30 + 100*Math.random();
            } // if age <=0
        } // for loop thru all particles
    }
}

VBOPartSys.prototype.swap = function(){
this.s1.set(this.s2)
}

VBOPartSys.prototype.vboInit = function(){
// a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc){
        console.log(this.constructor.name + 
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
        }
    gl.program = this.shaderLoc;
// b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return -1;
  }
    gl.useProgram(this.shaderLoc);
// Specify the purpose of our newly-created VBO on the GPU.  
    gl.bindBuffer(gl.ARRAY_BUFFER,this.vboLoc);
// Fill the GPU's newly-created VBO object with the vertex data we stored in
//  our 'vboContents' member (JavaScript Float32Array object).    
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
    this.s1, 		// JavaScript Float32Array
    gl.DYNAMIC_DRAW);			// Usage hint.
    
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc,'a_Position')
    if(this.a_PosLoc < 0) {
        console.log(this.constructor.name + 
                                '.init() Failed to get GPU location of attribute a_PosLoc');
        return -1;	// error exit.
      }
    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat');
    if (!this.u_ModelMatLoc) { 
        console.log(this.constructor.name + 
    						'.init() failed to get GPU location for u_ModelMatrix uniform');
    return;
  }  
  console.log('VBO box init');

}

VBOPartSys.prototype.switchToMe = function(){
// a) select our shader program:
    gl.useProgram(this.shaderLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.vboLoc)
    gl.vertexAttribPointer(
        this.a_PosLoc,
        4,
        gl.FLOAT,
        false,
        PART_MAXVAR * this.FSIZE,
        PART_XPOS * this.FSIZE
    );
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.uniform1i(this.u_runModeID, this.runMode);
}

VBOPartSys.prototype.isReady = function(){
    var isOK = true;
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name + 
                                '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
      }
      if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
          console.log(this.constructor.name + 
                              '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
      }
      return isOK;

}
VBOPartSys.prototype.adjust = function(){
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.adjust() call you needed to call this.switchToMe()!!');
    }
    this.ModelMat.setIdentity();
// THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    this.ModelMat.set(g_worldMat);	// use our global, shared camera.
// READY to draw in 'world' coord axes.
	
//  this.ModelMat.rotate(g_angleNow0, 0, 0, 1);	  // rotate drawing axes,
//  this.ModelMat.translate(0.35, 0, 0);							// then translate them.
//  Transfer new uniforms' values to the GPU:-------------
// Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.ModelMat.elements);	// send data from Javascript.
// Adjust the attributes' stride and offset (if necessary)
// (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
}
