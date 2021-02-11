    function Groundgrid() {
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
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'uniform vec4 translation;'+
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * (a_Position + translation);\n' +
    '  v_Color = a_Color;\n' +
    '}\n';
    
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';
    
    this.xcount = 100;			// # of lines to draw in x,y to make the grid.
    this.ycount = 100;		
    this.xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
    this.xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
    this.yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
    
    // Create an (global) array to hold this ground-plane's vertices:
    this.gndVerts = new Float32Array(floatsPerVertex*2*(this.xcount+this.ycount));
        // draw a grid made of xcount+ycount lines; 2 vertices per line.
        
    this.xgap = this.xymax/(this.xcount-1);		// HALF-spacing between lines in x,y;
    this.ygap = this.xymax/(this.ycount-1);		// (why half? because v==(0line number/2))
    
    // First, step thru x values as we make vertical lines of constant-x:
    for(v=0, j=0; v<2*this.xcount; v++, j+= floatsPerVertex) {
    if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
      this.gndVerts[j  ] = -this.xymax + (v  )*this.xgap;	// x
      this.gndVerts[j+2] = -this.xymax;								// y
      this.gndVerts[j+1] = -1.0;									// z
    }
    else {				// put odd-numbered vertices at (xnow, +xymax, 0).
      this.gndVerts[j  ] = -this.xymax + (v-1)*this.xgap;	// x
      this.gndVerts[j+2] = this.xymax;								// y
      this.gndVerts[j+1] = -1.0;									// z
    }
    this.gndVerts[j+3] = this.xColr[0];			// red
    this.gndVerts[j+4] = this.xColr[1];			// grn
    this.gndVerts[j+5] = this.xColr[2];			// blu
    }
    // Second, step thru y values as wqe make horizontal lines of constant-y:
    // (don't re-initialize j--we're adding more vertices to the array)
    for(v=0; v<2*this.ycount; v++, j+= floatsPerVertex) {
    if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
      this.gndVerts[j  ] = -this.xymax;								// x
      this.gndVerts[j+2] = -this.xymax + (v  )*this.ygap;	// y
      this.gndVerts[j+1] = -1.0;									// z
    }
    else {					// put odd-numbered vertices at (+xymax, ynow, 0).
      this.gndVerts[j  ] = this.xymax;								// x
      this.gndVerts[j+2] = -this.xymax + (v-1)*this.ygap;	// y
      this.gndVerts[j+1] = -1.0;									// z
    }
    this.gndVerts[j+3] = this.yColr[0];			// red
    this.gndVerts[j+4] = this.yColr[1];			// grn
    this.gndVerts[j+5] = this.yColr[2];			// blu
    }


    this.vboContents =  this.gndVerts
    console.log(this.vboContents.length + 'aaaaaa'+this.vboContents.length/6+
      'aaaaaaaaaaaaaaaaaaaa'); 
    
    this.vboVerts = 6;						// # of vertices held in 'vboContents' array
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                    // bytes req'd by 1 vboContents array element;
                    // (why? used to compute stride and offset 
                    // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;               
                    // total number of bytes stored in vboContents
                    // (#  of floats in vboContents array) * 
                    // (# of bytes/float).
    this.vboStride = this.FSIZE * 6; 
                    // (== # of bytes to store one complete vertex).
                    // From any attrib in a given vertex in the VBO, 
                    // move forward by 'vboStride' bytes to arrive 
                    // at the same attrib for the next vertex. 
    
          //----------------------Attribute sizes
    this.vboFcount_a_Pos0 =  3;    // # of floats in the VBO needed to store the
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
    this.mvpMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_MvpMatrix;							// GPU location for u_ModelMat uniform
    this.translation;
    this.number = this.vboContents.length/floatsPerVertex;
    this.Tx = 0.0;
    this.Ty = 0.0;
    this.Tz = -1.5;
  
    };
    
  Groundgrid.prototype.init = function() {
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
      'first bufferid for groundgrid');
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
  
     // Get the storage location of u_MvpMatrix
   this.u_MvpMatrix = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
   if (!this.u_MvpMatrix) { 
     console.log('Failed to get the storage location of u_MvpMatrix');
     return;
   }

   this.translation = gl.getUniformLocation(this.shaderLoc, 'translation');
 
  }

  Groundgrid.prototype.switchToMe = function() {
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
      console.log(this.vboLoc+ 
        'bufferid for groundgrid');
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

  
   gl.uniform4f(this.translation, this.Tx, this.Ty, this.Tz, 0.0);
 
    }
  
  Groundgrid.prototype.draw = function() {
  //=============================================================================
  // Render current VBObox contents.
  console.log(this.constructor.name + 
    '.init() get the GPU location of attribute a_Color');

   gl.uniform4f(this.translation, this.Tx, this.Ty, this.Tz, 0.0);
    
    gl.drawArrays(gl.LINES,							// use this drawing primitive, and
    0,	// start at this vertex number, and
    this.number);		// draw this many vertices
   
  
  }

  Groundgrid.prototype.adjust = function(){
  
    this.mvpMatrix.setIdentity();
// THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    this.mvpMatrix.set(g_worldMat);	// use our global, shared camera.
// READY to draw in 'world' coord axes.
	
//  this.ModelMat.rotate(g_angleNow0, 0, 0, 1);	  // rotate drawing axes,
//  this.ModelMat.translate(0.35, 0, 0);							// then translate them.
//  Transfer new uniforms' values to the GPU:-------------
// Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
gl.uniformMatrix4fv(this.u_MvpMatrix, false, this.mvpMatrix.elements);
// Adjust the attributes' stride and offset (if necessary)
// (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
}