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
	self.me_moving_new = 1;
	self.me_moving_old = 1;
	self.hasyee = false;
	self.gridx = [];
	self.gridy = [];
	self.gridl = [];
	self.config_old = [];
	self.config_new = [];
	self.counter = 0;
	self.doingyee = false;
	self.dynamicyee = false;
	self.yeeon = true;
	self.TurnOnYee = function() {
		self.dynamicyee = true;
		self.yeeon = true;
		model.update();
	}	
	self.TurnOffYee = function() {
		self.dynamicyee = false;
		self.yeeon = true;
		model.update();
	}	
	self.TurnOffYeeAllTheWay = function() {
		self.dynamicyee = false;
		self.yeeon = false;
		model.update();
	}	
	self.votersmovedold = 0;
	self.update = function(){
	
		// Clear it all!
		ctx.clearRect(0,0,canvas.width,canvas.height); // keep it if we are dragging something
		
		var dynamic_yee = self.dynamicyee; // under development
		if (dynamic_yee) {
			var density = 20.0
		} else {
			var density= 10.0;
		}
		var flag_draw_tracer = false;
				
		// Move the one that's being dragged, if any
		for(var j=0; j<self.voters.length; j++){
			var voter = self.voters[j];
			voter.update();
		}
		for(var j=0; j<self.candidates.length; j++){
			var c = self.candidates[j];
			c.update();
		}
		var mouse_move = Mouse.dragging ? 1 : 0;
		if (mouse_move){
		self.me_moving_old = self.me_moving_new;
		var min_length = Math.min(self.candidates.length,self.tracerold.length,self.tracernewfromelection.length);
		for(var i=0; i<min_length; i++){ // see if the new tracer is in a different position.  only keep new positions.
			if (self.tracerold[i][0] != self.tracernewfromelection[i][0] | self.tracerold[i][1] != self.tracernewfromelection[i][1]) {				
				self.tracer.push(self.tracernewfromelection[i]);
				self.me_moving_new = i;  // self.me_moving_new = Mouse.dragging.id;  This makes everything very slow!
			}
		}
		}
		
		if(mouse_move){
			Mouse.dragging.moveTo(Mouse.x, Mouse.y);
		} else {
			self.tracer = [];
		}			
		self.me_moving_new = self.me_moving_new % self.candidates.length;
		var newshape = self.me_moving_new != self.me_moving_old;
		//var configchanged = self.tracerold[self.me_moving_new][0] == self.tracernewfromelection[self.me_moving_new][0] & self.tracerold[self.me_moving_new][1] == self.tracernewfromelection[self.me_moving_new][1]; // we know we're inside an update, so any update other than a position change is a config change
		if (!mouse_move) {
			self.config_new = [self.numOfCandidates*1,self.numofVoters*1,self.voterType.name+"id"];
		}
		var votersmoved = !!Mouse.dragging ? (Mouse.dragging.hasOwnProperty("ballots") ? 1 : 0 ): 0;
		var configchanged = self.config_old != self.config_new;
		var votersbecamemobile = (votersmoved & !self.votersmovedold) | dynamic_yee;
		if ( !mouse_move | (newshape | configchanged ) | votersbecamemobile ) {  // figure out if we need to recalculate the yee diagram
			//  if we changed which shape we are dragging,
			// or if we are updating and we haven't moved (which means a configuration changed)
			self.tracer = []; // if we changed shapes, then erase tracer history
			//console.log("redid"+self.counter);
			self.counter++;
			WIDTH = ctx.canvas.width; // draw yee diagram
			HEIGHT = ctx.canvas.height;
			if(dynamic_yee) {
				oldx = self.candidates[1].x;
				oldy = self.candidates[1].y;
			} else {
				if (mouse_move) {
					oldx = Mouse.dragging.x;
					oldy = Mouse.dragging.y;
				} else {
					oldx = self.candidates[self.me_moving_new].x
					oldy = self.candidates[self.me_moving_new].y
				}
			}
			if (self.yeeon) {
				self.doingyee = true;
				self.gridx = [];
				self.gridy = [];
				self.gridl = []; 
				for(var x=0.0, cx=0; x<=WIDTH; x+= density, cx++) {
				  for(var y=0.0, cy=0; y<=HEIGHT; y+= density, cy++) {
					if(dynamic_yee) {
						self.candidates[1].x = x*.5;
						self.candidates[1].y = y*.5;
					} else {
						if(mouse_move) {
							Mouse.dragging.x = x*.5;
							Mouse.dragging.y = y*.5;  // don't use Draggable.moveTo because it adds an offset
						} else {
							self.candidates[self.me_moving_new].x = x*.5;
							self.candidates[self.me_moving_new].y = y*.5;
						}
					}
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
				self.doingyee = false;
				if(dynamic_yee) {
					self.candidates[1].x = oldx;
					self.candidates[1].y = oldy;
				} else {
					if(mouse_move) {
						Mouse.dragging.x = oldx;
						Mouse.dragging.y = oldy;  // don't use Draggable.moveTo because it adds an offset
					} else {
						self.candidates[self.me_moving_new].x = oldx;
						self.candidates[self.me_moving_new].y = oldy;
					}
				}
				self.hasyee=true; // in development
			}
		} 
		
		self.votersmovedold = votersmoved;
		
		if (mouse_move) {
		self.tracerold = self.tracernewfromelection; // clean up for next time
		}
		//self.tracer = self.tracer.slice(-400); // keep tracer short
		self.config_old = self.config_new;

		// DRAW 'EM ALL.
		// Draw voters' BG first, then candidates, then voters.
		
		if(self.yeeon & self.hasyee){
			for(var k=0;k<self.gridx.length;k++) {
				ctx.fillStyle = self.gridl[k];
				ctx.fillRect(self.gridx[k]-density*.5-1, self.gridy[k]-density*.5-1, density+2, density+2);
			}
		}	

		// Draw tracer
		if (flag_draw_tracer) {
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

