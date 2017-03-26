/***************************

A MODEL:
- Draggable candidates & voter(s)
- Has to draw & up 'em up & down appropriately.

***************************/

function Model(config){

	var self = this;

	// Properties
	config = config || {};
	self.id = config.id || "model";
	self.size = config.size || 300;
	self.scale = config.scale || 1; // TO DO: actually USE this.
	self.border = config.border || 10;

	// RETINA canvas, whatever.
	var canvas = document.createElement("canvas");
	canvas.setAttribute("class", "interactive");
	canvas.width = canvas.height = self.size*2; // retina!
	canvas.style.width = canvas.style.height = self.size+"px";
	canvas.style.borderWidth = self.border+"px";
	var ctx = canvas.getContext("2d");
	self.canvas = canvas;
	self.ctx = ctx;

	// My DOM: title + canvas + caption
	self.dom = document.createElement("div");
	self.dom.setAttribute("class", "model");
	self.dom.style.width = (self.size+2*self.border)+"px"; // size+2*borders!
	self.title = document.createElement("div");
	self.title.id = "title";
	self.caption = document.createElement("div");
	self.caption.id = "caption";
	self.caption.style.width = self.dom.style.width;
	self.dom.appendChild(self.title);
	self.dom.appendChild(self.canvas);
	self.dom.appendChild(self.caption);

	// MAH MOUSE
	self.mouse = new Mouse(self.id, self.canvas);

	// Draggables
	self.draggables = [];
	self.draggableManager = new DraggableManager(self);

	// Candidates & Voter(s)
	self.candidates = [];
	self.candidatesById = {};
	self.voters = [];
	self.addCandidate = function(id, x, y){
		var candidate = new Candidate({
			model: self,
			id:id, x:x, y:y
		});
		self.candidates.push(candidate);
		self.draggables.push(candidate);
		self.candidatesById[id] = candidate;
	};
	self.addVoters = function(config){
		config.model = self;
		var DistClass = config.dist;
		var voters = new DistClass(config);
		self.voters.push(voters);
		self.draggables.push(voters);
	};

	// Init!
	self.onInit = function(){}; // TO IMPLEMENT
	self.init = function(){
		self.onInit();
		self.update();
	};

	// Reset!
	self.reset = function(noInit){
		self.candidates = [];
		self.candidatesById = {};
		self.voters = [];
		self.draggables = [];
		if(!noInit) self.init();
		self.tracer = [];
	};

	// Update!
	self.onUpdate = function(){}; // TO IMPLEMENT
	self.tracerold = Array.apply(null, Array(5)).map(function(){return [0,0,'rgb(0,0,0)']});
	self.tracernewfromelection = self.tracerold;	
	self.tracer = self.tracerold;
	self.me_moving_new = 0;
	self.hasyee = false;
	self.gridx = [];
	self.gridy = [];
	self.gridl = [];

	self.update = function(){
	
		// Clear it all!
		ctx.clearRect(0,0,canvas.width,canvas.height); // keep it if we are dragging something
		
		var density= 10.0;
				
		// Move the one that's being dragged, if any
		if(Mouse.dragging){
			Mouse.dragging.moveTo(Mouse.x, Mouse.y);
			for(var j=0; j<self.voters.length; j++){
				var voter = self.voters[j];
				voter.update();
			}
			for(var j=0; j<self.candidates.length; j++){
				var c = self.candidates[j];
				c.update();
			}
			
			self.me_moving_old = self.me_moving_new;
			for(var i=0; i<self.candidates.length; i++){ // see if the new tracer is in a different position.  only keep new positions.
				if (self.tracerold[i][0] != self.tracernewfromelection[i][0] | self.tracerold[i][1] != self.tracernewfromelection[i][1]) {				
					self.tracer.push(self.tracernewfromelection[i]);
					self.me_moving_new = i;
				}
			}
			i--;
			self.tracerold = self.tracernewfromelection; // clean up for next time
			if (self.me_moving_new != self.me_moving_old) { 
				self.tracer = []; // if we changed shapes, then erase tracer history
				
				WIDTH = ctx.canvas.width; // draw yee diagram
				HEIGHT = ctx.canvas.height;
				oldx = Mouse.dragging.x;
				oldy = Mouse.dragging.y;
				self.gridx = [];
				self.gridy = [];
				self.gridl = []; 
				for(var x=0.0, cx=0; x<=WIDTH; x+= density, cx++) {
				  for(var y=0.0, cy=0; y<=HEIGHT; y+= density, cy++) {
					Mouse.dragging.x = x*.5;
					Mouse.dragging.y = y*.5;  // don't use Draggable.moveTo because it adds an offset
					model.election(model, {sidebar:false});
 					for(var j=0; j<self.voters.length; j++){
 						var voter = self.voters[j];
 						voter.update();
 					}
					var a = self.tracernewfromelection[self.me_moving_new][2];
				    self.gridx.push(x);
				    self.gridy.push(y);
				    self.gridl.push(a);
					// model.caption.innerHTML = "Calculating " + Math.round(x/WIDTH*100) + "%"; // doesn't work yet 
				  }
				}
				Mouse.dragging.x = oldx;
				Mouse.dragging.y = oldy;
				self.hasyee=true;
			}
			//self.tracer = self.tracer.slice(-400); // keep tracer short
		} else {
			self.tracer = [];
		}

		// DRAW 'EM ALL.
		// Draw voters' BG first, then candidates, then voters.
		
		if(self.hasyee){
			for(var k=0;k<self.gridx.length;k++) {
				ctx.fillStyle = self.gridl[k];
				ctx.fillRect(self.gridx[k]-density*.5-1, self.gridy[k]-density*.5-1, density+2, density+2);
			}
		}	

		// Draw tracer
		ctx.strokeStyle = 'rgb(0,0,0)';
		ctx.lineWidth = 1; // border around tracer
    
		var size_radius = 5;
		var trace, x, y, fill;
		for(var i=0; i<self.tracer.length; i++){
			trace = self.tracer[i];
			x = trace[0];
			y = trace[1];
			fill = trace[2];
			ctx.fillStyle = fill; // make a circle
			ctx.beginPath();
			ctx.arc(x, y, size_radius, 0, Math.TAU, true);
			ctx.fill();
			ctx.stroke();
		}
		
		for(var i=0; i<self.voters.length; i++){
			var voter = self.voters[i];
			voter.update();
			voter.draw(ctx);
		}
		for(var i=0; i<self.candidates.length; i++){
			var c = self.candidates[i];
			c.update();
			c.draw(ctx);
		}

		// Update!
		self.onUpdate();
		publish(self.id+"-update");

	};

	// HELPERS:
	self.getBallots = function(){
		var ballots = [];
		for(var i=0; i<self.voters.length; i++){
			var voter = self.voters[i];
			ballots = ballots.concat(voter.ballots);
		}
		return ballots;
	};
	self.getTotalVoters = function(){
		var count = 0;
		for(var i=0; i<self.voters.length; i++){
			var voter = self.voters[i];
			count += voter.points.length;
		}
		return count;
	};


};

