  function drawGrid(){
    var floatsPerVertex = 7;
    var xcount = 1000;			// # of lines to draw in x,y to make the grid.
    var ycount = 1000;		
    var xymax	= 100.0;			// grid size; extends to cover +/-xymax in x and y.
    var xColr = new Float32Array([0.2, 0.2, 0.2]);	// gray
    //var yColr = new Float32Array([0.0, 1.0, 1.0]);	// bright blue
    var yColr = new Float32Array([0.4, 0.0, 0.8]);	// purple
    
    // Create an (global) array to hold this ground-plane's vertices:
    gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
        // draw a grid made of xcount+ycount lines; 2 vertices per line.
        
    var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
    var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
    
    // First, step thru x values as we make vertical lines of constant-x:
    for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
    if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
      gndVerts[j  ] = -xymax + (v  )*xgap;	// x
      gndVerts[j+1] = -xymax;								// y
      gndVerts[j+2] = -1.0;									// z
      gndVerts[j+3] = 1.0;
    }
    else {				// put odd-numbered vertices at (xnow, +xymax, 0).
      gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
      gndVerts[j+1] = xymax;								// y
      gndVerts[j+2] = -1.0;									// z
      gndVerts[j+3] = 1.0;
    }
    gndVerts[j+4] = xColr[0];			// red
    gndVerts[j+5] = xColr[1];			// grn
    gndVerts[j+6] = xColr[2];			// blu
    }
    // Second, step thru y values as wqe make horizontal lines of constant-y:
    // (don't re-initialize j--we're adding more vertices to the array)
    for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
    if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
      gndVerts[j  ] = -xymax;								// x
      gndVerts[j+1] = -xymax + (v  )*ygap;	// y
      gndVerts[j+2] = -1.0;									// z
      gndVerts[j+3] = 1.0;
    }
    else {					// put odd-numbered vertices at (+xymax, ynow, 0).
      gndVerts[j  ] = xymax;								// x
      gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
      gndVerts[j+2] = -1.0;									// z
      gndVerts[j+3] = 1.0;
    }
    gndVerts[j+4] = yColr[0];			// red
    gndVerts[j+5] = yColr[1];			// grn
    gndVerts[j+6] = yColr[2];			// blu
    }

  }
  function groundVBO() {
    //=============================================================================
    //=============================================================================
    // CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
    // needed to render vertices from one Vertex Buffer Object (VBO) using one 
    // separate shader program (a vertex-shader & fragment-shader pair) and one
    // set of 'uniform' variables.
    
    // Constructor goal: 
    // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
    // written into code) in all other VBObox functions. Keeping all these (initial)
    // values here, in this one coonstrutor function, ensures we can change them 
    // easily WITHOUT disrupting any other code, ever!
    
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    'attribute vec4 a_Position;\n' +
    'attribute vec3 a_Color;\n' +
    'uniform mat4 u_ModelMat;\n' +
    'varying vec3 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_ModelMat * a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '}\n';
    
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec3 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = vec4(v_Color,1.0);\n' +
    '}\n';
    
    drawGrid();

    this.vboContents =  gndVerts;
    
    this.vboVerts = gndVerts.length/7;						// # of vertices held in 'vboContents' array
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                    // bytes req'd by 1 vboContents array element;
                    // (why? used to compute stride and offset 
                    // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;               
                    // total number of bytes stored in vboContents
                    // (#  of floats in vboContents array) * 
                    // (# of bytes/float).
    this.vboStride = this.vboBytes/this.vboVerts;
                    // (== # of bytes to store one complete vertex).
                    // From any attrib in a given vertex in the VBO, 
                    // move forward by 'vboStride' bytes to arrive 
                    // at the same attrib for the next vertex. 
    
          //----------------------Attribute sizes
    this.vboFcount_a_Pos0 =  4;    // # of floats in the VBO needed to store the
                    // attribute named a_Pos0. (4: x,y,z,w values)
    this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
    console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
            this.vboFcount_a_Colr0) *   // every attribute in our VBO
            this.FSIZE == this.vboStride, // for agreeement with'stride'
            "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");
    
          //----------------------Attribute offsets  
    this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
                    // of 1st a_Pos0 attrib value in vboContents[]
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                    // (4 floats * bytes/float) 
                    // # of bytes from START of vbo to the START
                    // of 1st a_Colr0 attrib value in vboContents[]
          //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                    // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
                    // set by compile/link of VERT_SRC and FRAG_SRC.
                //------Attribute locations in our shaders:
    this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
    this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute
    
          //---------------------- Uniform locations &values in our shaders
    this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ModelMat;							// GPU location for u_ModelMat uniform


    this.Tx = 0.0;
    this.Ty = 0.0;
    this.Tz = -1.5;
  
    };
   
  groundVBO.prototype.init = function() {
  //=============================================================================
  // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
  // kept in this VBObox. (This function usually called only once, within main()).
  // Specifically:
  // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
  //  executable 'program' stored and ready to use inside the GPU.  
  // b) create a new VBO object in GPU memory and fill it by transferring in all
  //  the vertex data held in our Float32array member 'VBOcontents'. 
  // c) Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
  // -------------------
  // CAREFUL!  before you can draw pictures using this VBObox contents, 
  //  you must call this VBObox object's switchToMe() function too!
  //--------------------
  // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
    console.log(this.constructor.name + 
          '.init() create executable Shaders on the GPU. Bye!');
    return;
    }
  // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
  //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
  
    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
  
  // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
    console.log(this.constructor.name + 
          '.init() failed to create VBO in GPU. Bye!'); 
    return;
    }
    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
            this.vboLoc);				  // the ID# the GPU uses for this buffer.
    console.log(this.vboLoc+ 
      'first bufferid for groundVBO');
    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
            this.vboContents, 		// JavaScript Float32Array
            gl.STATIC_DRAW);			// Usage hint.
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.
  
    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if(this.a_PosLoc < 0) {
    console.log(this.constructor.name + 
          '.init() Failed to get GPU location of attribute a_Position');
    return -1;	// error exit.
    }
    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Color');
    if(this.a_ColrLoc < 0) {
    console.log(this.constructor.name + 
          '.init() failed to get the GPU location of attribute a_Color');
    return -1;	// error exit.
    }
  
     // Get the storage location of u_ModelMat
   this.u_ModelMat = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat');
   if (!this.u_ModelMat) { 
     console.log('Failed to get the storage location of u_ModelMat');
     return;
   } 
  }

  groundVBO.prototype.switchToMe = function() {
    //==============================================================================
    // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
    //
    // We only do this AFTER we called the init() function, which does the one-time-
    // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
    // even then, you are STILL not ready to draw our VBObox's contents onscreen!
    // We must also first complete these steps:
    //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
    //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
    //  c) tell the GPU to connect the shader program's attributes to that VBO.
    
    // a) select our shader program:
      gl.useProgram(this.shaderLoc);
    //		Each call to useProgram() selects a shader program from the GPU memory,
    // but that's all -- it does nothing else!  Any previously used shader program's 
    // connections to attributes and uniforms are now invalid, and thus we must now
    // establish new connections between our shader program's attributes and the VBO
    // we wish to use.  
      
    // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
    //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
    //    supply values to use as attributes in our newly-selected shader program:
      gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
                        this.vboLoc);			// the ID# the GPU uses for our VBO.
    // c) connect our newly-bound VBO to supply attribute variable values for each
    // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
    // this sets up data paths from VBO to our shader units:
      // 	Here's how to use the almost-identical OpenGL version of this function:
      //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
      gl.vertexAttribPointer(
        this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
        this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,			// type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
              //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
              // stored attrib for this vertex to the same stored attrib
              //  for the next vertex in our VBO.  This is usually the 
              // number of bytes used to store one complete vertex.  If set 
              // to zero, the GPU gets attribute values sequentially from 
              // VBO, starting at 'Offset'.	
              // (Our vertex size in bytes: 4 floats for pos + 3 for color)
        this.vboOffset_a_Pos0);						
              // Offset == how many bytes from START of buffer to the first
              // value we will actually use?  (We start with position).
      gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                  gl.FLOAT, false, 
                  this.vboStride, this.vboOffset_a_Colr0);
              
      // --Enable this assignment of each of these attributes to its' VBO source:
      gl.enableVertexAttribArray(this.a_PosLoc);
      gl.enableVertexAttribArray(this.a_ColrLoc);

  }
  
  groundVBO.prototype.render = function() {
  //=============================================================================
  // Render current VBObox contents.
    gl.drawArrays(gl.LINES,							// use this drawing primitive, and
    0,	// start at this vertex number, and
    this.vboVerts);		// draw this many vertices
  
  }

  groundVBO.prototype.adjust = function(){


    this.ModelMat.setIdentity();
// THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    this.ModelMat.set(g_worldMat);	// use our global, shared camera.
// READY to draw in 'world' coord axes.
	
//  this.ModelMat.rotate(g_angleNow0, 0, 0, 1);	  // rotate drawing axes,
//  this.ModelMat.translate(0.35, 0, 0);							// then translate them.
//  Transfer new uniforms' values to the GPU:-------------
// Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_ModelMat, false, this.ModelMat.elements);
// Adjust the attributes' stride and offset (if necessary)
// (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
 


  }

  function cubeVBO(width,offset_x,offset_y,offset_z){
    this.VERT_SRC = //--------------------- VERTEX SHADER source code 
    'precision highp float;                 \n' +        // req'd in OpenGL ES if we use 'float'
    //
    'uniform mat4 u_ModelMat0;              \n' +
    'attribute vec4 a_Pos0;                 \n' +
    'attribute vec3 a_Colr0;                \n' +
    'varying vec3 v_Colr0;                  \n' +
    //
    'void main() {                          \n' +
    '  gl_Position = u_ModelMat0 * a_Pos0;  \n' +
    '  v_Colr0 = a_Colr0;                   \n' +
    ' }                                     \n';

    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    'precision mediump float;               \n' +
    'varying vec3 v_Colr0;                  \n' +
    'void main() {                          \n' +
    '  gl_FragColor = vec4(v_Colr0, 1.0);   \n' + 
    '}                                      \n';

    this.buildVertice(width,offset_x,offset_y,offset_z)
    this.drawCube();
    this.vboVerts = this.vboContents.length / 7;

    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    console.log("F_Size :: ", this.FSIZE);
    // bytes req'd by 1 vboContents array element;
    // (why? used to compute stride and offset 
    // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;
    // total number of bytes stored in vboContents
    // (#  of floats in vboContents array) * 
    // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts;
    // (== # of bytes to store one complete vertex).
    // From any attrib in a given vertex in the VBO, 
    // move forward by 'vboStride' bytes to arrive 
    // at the same attrib for the next vertex. 
    this.vboFcount_a_Pos0 = 4;    // # of floats in the VBO needed to store the
    // attribute named a_Pos0. (4: x,y,z,w values)
    this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values)
    console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
        this.vboFcount_a_Colr0) *   // every attribute in our VBO
        this.FSIZE == this.vboStride, // for agreeement with'stride'
        "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");

    //----------------------Attribute offsets  
    this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
    // of 1st a_Pos0 attrib value in vboContents[]
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;
    // (4 floats * bytes/float) 
    // # of bytes from START of vbo to the START
    // of 1st a_Colr0 attrib value in vboContents[]
    //-----------------------GPU memory locations:
    this.vboLoc;                  // GPU Location for Vertex Buffer Object, 
    // returned by gl.createBuffer() function call
    this.shaderLoc;               // GPU Location for compiled Shader-program  
    // set by compile/link of VERT_SRC and FRAG_SRC.
    //------Attribute locations in our shaders:
    this.a_PosLoc;                // GPU location for 'a_Pos0' attribute
    this.a_ColrLoc;               // GPU location for 'a_Colr0' attribute

    //---------------------- Uniform locations &values in our shaders
    this.ModelMat = new Matrix4();  // Transforms CVV axes to model axes.
    this.u_ModelMatLoc;             // GPU location for u_ModelMat uniform

  }
  cubeVBO.prototype.buildVertice = function(width,offset_x,offset_y,offset_z){
    this.V1 = new Vector3([width + offset_x, width + offset_y, width + offset_z]);
    this.V2 = new Vector3([width + offset_x, -width + offset_y, width + offset_z]);
    this.V3 = new Vector3([width + offset_x, -width + offset_y, -width + offset_z]);
    this.V4 = new Vector3([width + offset_x, width + offset_y, -width + offset_z]);
    this.V5 = new Vector3([-width + offset_x, width + offset_y, -width + offset_z]);
    this.V6 = new Vector3([-width + offset_x, width + offset_y, width + offset_z]);
    this.V7 = new Vector3([-width + offset_x, -width + offset_y, width + offset_z]);
    this.V8 = new Vector3([-width + offset_x, -width + offset_y, -width + offset_z]);
  }
  cubeVBO.prototype.drawCube = function(){
    this.vboContents = new Float32Array(
      [
        this.V1.elements[0], this.V1.elements[1], this.V1.elements[2], 1.0, 1.0, 1.0, 1.0,         
        this.V2.elements[0], this.V2.elements[1], this.V2.elements[2], 1.0, 1.0, 1.0, 1.0,         

        this.V2.elements[0], this.V2.elements[1], this.V2.elements[2], 1.0, 1.0, 1.0, 1.0,         
        this.V3.elements[0], this.V3.elements[1], this.V3.elements[2], 1.0, 1.0, 1.0, 1.0,         

        this.V3.elements[0], this.V3.elements[1], this.V3.elements[2], 1.0, 1.0, 1.0, 1.0,         
        this.V4.elements[0], this.V4.elements[1], this.V4.elements[2], 1.0, 1.0, 1.0, 1.0,         

        this.V4.elements[0], this.V4.elements[1], this.V4.elements[2], 1.0, 1.0, 1.0, 1.0,         
        this.V1.elements[0], this.V1.elements[1], this.V1.elements[2], 1.0, 1.0, 1.0, 1.0,


        this.V4.elements[0], this.V4.elements[1], this.V4.elements[2], 1.0, 1.0, 1.0, 1.0,         
        this.V5.elements[0], this.V5.elements[1], this.V5.elements[2], 1.0, 1.0, 1.0, 1.0,         

        this.V5.elements[0], this.V5.elements[1], this.V5.elements[2], 1.0, 1.0, 1.0, 1.0,         
        this.V6.elements[0], this.V6.elements[1], this.V6.elements[2], 1.0, 1.0, 1.0, 1.0,         

        this.V6.elements[0], this.V6.elements[1], this.V6.elements[2], 1.0, 1.0, 1.0, 1.0,         
        this.V7.elements[0], this.V7.elements[1], this.V7.elements[2], 1.0, 1.0, 1.0, 1.0,         

        this.V7.elements[0], this.V7.elements[1], this.V7.elements[2], 1.0, 1.0, 1.0, 1.0,         
        this.V8.elements[0], this.V8.elements[1], this.V8.elements[2], 1.0, 1.0, 1.0, 1.0,         

        this.V8.elements[0], this.V8.elements[1], this.V8.elements[2], 1.0, 1.0, 1.0, 1.0,         
        this.V5.elements[0], this.V5.elements[1], this.V5.elements[2], 1.0, 1.0, 1.0, 1.0,         

        this.V8.elements[0], this.V8.elements[1], this.V8.elements[2], 1.0, 1.0, 1.0, 1.0,         
        this.V3.elements[0], this.V3.elements[1], this.V3.elements[2], 1.0, 1.0, 1.0, 1.0,         

        this.V7.elements[0], this.V7.elements[1], this.V7.elements[2], 1.0, 1.0, 1.0, 1.0,         
        this.V2.elements[0], this.V2.elements[1], this.V2.elements[2], 1.0, 1.0, 1.0, 1.0,         

        this.V6.elements[0], this.V6.elements[1], this.V6.elements[2], 1.0, 1.0, 1.0, 1.0,         
        this.V1.elements[0], this.V1.elements[1], this.V1.elements[2], 1.0, 1.0, 1.0, 1.0
      ]
    );
  }
  cubeVBO.prototype.init = function(){
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }

    gl.program = this.shaderLoc;    // (to match cuon-utils.js -- initShaders())

    // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER,        // GLenum 'target' for this GPU buffer 
        this.vboLoc);         // the ID# the GPU uses for this buffer.

    gl.bufferData(gl.ARRAY_BUFFER,        // GLenum target(same as 'bindBuffer()')
        this.vboContents,     // JavaScript Float32Array
        gl.STATIC_DRAW);      // Usage hint.

    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if (this.a_PosLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Pos0');
        return -1;  // error exit.
    }

    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if (this.a_ColrLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_Colr0');
        return -1;  // error exit.
    }

    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
    if (!this.u_ModelMatLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMat1 uniform');
        return;
    }
  }

  cubeVBO.prototype.switchToMe = function(){
    gl.useProgram(this.shaderLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER,          // GLenum 'target' for this GPU buffer 
        this.vboLoc);         // the ID# the GPU uses for our VBO.

    gl.vertexAttribPointer(
        this.a_PosLoc,
        this.vboFcount_a_Pos0,
        gl.FLOAT,
        false,

        this.vboStride,

        this.vboOffset_a_Pos0);

    gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Colr0);

    // --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
  }

  cubeVBO.prototype.isReady = function(){
    var isOK = true;

    if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
  }

  cubeVBO.prototype.adjust = function(){
    this.ModelMat.setIdentity();
// THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    this.ModelMat.set(g_worldMat);	// use our global, shared camera.
// READY to draw in 'world' coord axes.
	
//  this.ModelMat.rotate(g_angleNow0, 0, 0, 1);	  // rotate drawing axes,
//  this.ModelMat.translate(0.35, 0, 0);							// then translate them.
//  Transfer new uniforms' values to the GPU:-------------
// Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_ModelMatLoc, false, this.ModelMat.elements);
// Adjust the attributes' stride and offset (if necessary)
// (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
  }

  cubeVBO.prototype.render = function(){
    if (this.isReady() == false) {
      console.log('ERROR! before' + this.constructor.name +
          '.draw() call you needed to call this.switchToMe()!!');
  }

  gl.drawArrays(gl.LINES,
      0,
      this.vboVerts);
  //console.log(this.vboVerts)
  }

  cubeVBO.prototype.reload = function(){
    gl.bufferSubData(gl.ARRAY_BUFFER,  // GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents);   // the JS source-data array used to fill VBO
  }

