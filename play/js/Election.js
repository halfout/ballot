/****************************

SINGLETON CLASS on how to COUNT UP THE BALLOTS
and RENDER IT INTO THE CAPTION

*****************************/

var Election = {};

Election.score = function(model, options){

	// Tally the approvals & get winner!
	var tally = _tally(model, function(tally, ballot){
		for(var candidate in ballot){
			tally[candidate] += ballot[candidate];
		}
	});
	
	for(var candidate in tally){
		tally[candidate] /= model.getTotalVoters();
	}
	var winners = _countWinner(tally);
	var winner = winners[0];


	// Caption
	var text = "";
	text += "<span class='small'>";
	text += "<b>highest average score wins</b><br>";
	for(var i=0; i<model.candidates.length; i++){
		var c = model.candidates[i].id;
		text += _icon(c)+"'s score: "+(tally[c].toFixed(2))+" out of 5.00<br>";
	}
	if(!winner | winners.length>=2){
		// NO WINNER?! OR TIE?!?!
		var color = _colorWinner(model, "tie");
		text += _tietext(winners);
	} else {
		var color = _colorWinner(model, winner);
		text += "<br>";
		text += _icon(winner)+" has the highest score, so...<br>";
		text += "</span>";
		text += "<br>";
		text += "<b style='color:"+color+"'>"+winner.toUpperCase()+"</b> WINS";
	}
	model.caption.innerHTML = text;

};

Election.approval = function(model, options){

	// Tally the approvals & get winner!
	var tally = _tally(model, function(tally, ballot){
		var approved = ballot.approved;
		for(var i=0; i<approved.length; i++) tally[approved[i]]++;
	});
	var winners = _countWinner(tally);
	var winner = winners[0];

	
	// Caption
	var text = "";
	text += "<span class='small'>";
	text += "<b>most approvals wins</b><br>";
	for(var i=0; i<model.candidates.length; i++){
		var c = model.candidates[i].id;
		text += _icon(c)+" got "+tally[c]+" approvals<br>";
	}
	if(!winner | winners.length>=2){
		// NO WINNER?! OR TIE?!?!
		var color = _colorWinner(model, "tie");
		text += _tietext(winners);
	} else {
		var color = _colorWinner(model, winner);
		text += "<br>";
		text += _icon(winner)+" is most approved, so...<br>";
		text += "</span>";
		text += "<br>";
		text += "<b style='color:"+color+"'>"+winner.toUpperCase()+"</b> WINS";
	}
	model.caption.innerHTML = text;
};

Election.condorcet = function(model, options){

	var text = "";
	text += "<span class='small'>";
	text += "<b>who wins each one-on-one?</b><br>";

	var ballots = model.getBallots();

	// Create the WIN tally
	var tally = {};
	for(var candidateID in model.candidatesById) tally[candidateID] = 0;

	// For each combination... who's the better ranking?
	for(var i=0; i<model.candidates.length-1; i++){
		var a = model.candidates[i];
		for(var j=i+1; j<model.candidates.length; j++){
			var b = model.candidates[j];

			// Actually figure out who won.
			var aWins = 0;
			var bWins = 0;
			for(var k=0; k<ballots.length; k++){
				var rank = ballots[k].rank;
				if(rank.indexOf(a.id)<rank.indexOf(b.id)){
					aWins++; // a wins!
				}else{
					bWins++; // b wins!
				}
			}

			// WINNER?
			var winner = (aWins>bWins) ? a : b;
			if (aWins != bWins) {
				tally[winner.id]++;

				// Text.
				var by,to;
				if(winner==a){
					by = aWins;
					to = bWins;
				}else{
					by = bWins;
					to = aWins;
				}
				text += _icon(a.id)+" vs "+_icon(b.id)+": "+_icon(winner.id)+" wins by "+by+" to "+to+"<br>";
			} else { //tie
				tally[a.id]++;
				tally[b.id]++;
				text += _icon(a.id)+" vs "+_icon(b.id)+": "+"TIE"+"<br>";
			}
		}
	}

	// Was there one who won all????
	var topWinners = [];
	for(var id in tally){
		if(tally[id]==model.candidates.length-1){
			topWinners.push(id);
		}
	}
	var topWinner = topWinners[0];
	
	// Winner... or NOT!!!!
	text += "<br>";
	if (topWinners.length == 1) {
		var color = _colorWinner(model, topWinner);
		text += _icon(topWinner)+" beats all other candidates in one-on-one races.<br>";
		text += "</span>";
		text += "<br>";
		text += "<b style='color:"+color+"'>"+topWinner.toUpperCase()+"</b> WINS";
	}else if (topWinners.length >= 2) {
		var color = _colorWinner(model, "tie");
		text += _tietext(topWinners);
	} else {
		var color = _colorWinner(model, "tie");
		text += "NOBODY beats everyone else in one-on-one races.<br>";
		text += "</span>";
		text += "<br>";
		text += "THERE'S NO WINNER.<br>";
		text += "<b id='ohno'>OH NO.</b>";
	}

	// what's the loop?

	model.caption.innerHTML = text;

};

Election.borda = function(model, options){

	// Tally the approvals & get winner!
	var tally = _tally(model, function(tally, ballot){
		for(var i=0; i<ballot.rank.length; i++){
			var candidate = ballot.rank[i];
			tally[candidate] += i; // the rank!
		}
	});
	var winners = _countLoser(tally); // LOWER score is best!
	var winner = winners[0];

	// Caption
	var text = "";
	text += "<span class='small'>";
	text += "<b>lower score is better</b><br>";
	for(var i=0; i<model.candidates.length; i++){
		var c = model.candidates[i].id;
		text += _icon(c)+"'s total score: "+tally[c]+"<br>";
	}
	if(!winner | winners.length>=2){
		// NO WINNER?! OR TIE?!?!
		var color = _colorWinner(model, "tie");
		text += _tietext(winners);
	}else{		
		var color = _colorWinner(model, winner);
		text += "<br>";
		text += _icon(winner)+" has the <i>lowest</i> score, so...<br>";
		text += "</span>";
		text += "<br>";
		text += "<b style='color:"+color+"'>"+winner.toUpperCase()+"</b> WINS";
	}
	model.caption.innerHTML = text;

};

Election.irv = function(model, options){

	var text = "";
	text += "<span class='small'>";

	var finalWinner = null;
	var roundNum = 1;

	var candidates = [];
	for(var i=0; i<model.candidates.length; i++){
		candidates.push(model.candidates[i].id);
	}

	while(!finalWinner){

		text += "<b>round "+roundNum+":</b><br>";
		text += "who's voters' #1 choice?<br>";

		// Tally the approvals & get winner!
		var pre_tally = _tally(model, function(tally, ballot){
			var first = ballot.rank[0]; // just count #1
			tally[first]++;
		});

		// ONLY tally the remaining candidates...
		var tally = {};
		for(var i=0; i<candidates.length; i++){
			var cID = candidates[i];
			tally[cID] = pre_tally[cID];
		}

		// Say 'em...
		for(var i=0; i<candidates.length; i++){
			var c = candidates[i];
			text += _icon(c)+":"+tally[c];
			if(i<candidates.length-1) text+=", ";
		}
		text += "<br>";

		// Do they have more than 50%?
		var winners = _countWinner(tally);
		var winner = winners[0];
		var ratio = tally[winner]/model.getTotalVoters();
		if(ratio>0.5){
			if (winners.length >= 2) {		
				finalWinner = "tie";
				break;
			}
			finalWinner = winner;
			text += _icon(winner)+" has more than 50%<br>";
			break;
		}

		// Otherwise... runoff...
		var losers = _countLoser(tally);
		var loser = losers[0];
		if (losers.length >= 2) {finalWinner = "elimination tie"; break;}
		text += "nobody's more than 50%. ";
		text += "eliminate loser, "+_icon(loser)+". next round!<br><br>";

		// ACTUALLY ELIMINATE
		candidates.splice(candidates.indexOf(loser), 1); // remove from candidates...
		var ballots = model.getBallots();
		for(var i=0; i<ballots.length; i++){
			var rank = ballots[i].rank;
			rank.splice(rank.indexOf(loser), 1); // REMOVE THE LOSER
		}

		// And repeat!
		roundNum++;
	
	}
	if (finalWinner == "tie") {
		var color = _colorWinner(model, "tie");
		text += _tietext(winners);
	} else if (finalWinner == "elimination tie") {
		var color = _colorWinner(model, "tie");
		text += "who is the loser?";
		text += _tietext(losers);
	} else {
		// END!
		var color = _colorWinner(model, finalWinner);
		text += "</span>";
		text += "<br>";
		text += "<b style='color:"+color+"'>"+winner.toUpperCase()+"</b> WINS";	
	}
	model.caption.innerHTML = text;
};

Election.plurality = function(model, options){

	options = options || {};

	// Tally the approvals & get winner!
	var tally = _tally(model, function(tally, ballot){
		tally[ballot.vote]++;
	});
	var winners = _countWinner(tally);
	var winner = winners[0];

	// Caption
	var text = "";
	text += "<span class='small'>";
	if(options.sidebar){
		text += "<b>most votes wins</b><br>";
	}
	for(var i=0; i<model.candidates.length; i++){
		var c = model.candidates[i].id;
		if(options.sidebar){
			text += _icon(c)+" got "+tally[c]+" votes<br>";
		}else{
			text += c+": "+tally[c];
			if(options.verbose) text+=" votes";
			if(i<model.candidates.length-1) text+=", ";
		}
	}
	// Caption text for winner, or tie
	if (winners.length == 1) {
		var color = _colorWinner(model, winner);
		if(options.sidebar){
			text += "<br>";
			text += _icon(winner)+" has most votes, so...<br>";
		}
		text += "</span>";
		text += "<br>";
		text += "<b style='color:"+color+"'>"+winner.toUpperCase()+"</b> WINS";
	} else {
		var color = _colorWinner(model, "tie");
		text += _tietext(winners);
	}
	
	model.caption.innerHTML = text;

};

var _tally = function(model, tallyFunc){

	// Create the tally
	var tally = {};
	for(var candidateID in model.candidatesById) tally[candidateID] = 0;

	// Count 'em up
	var ballots = model.getBallots();
	for(var i=0; i<ballots.length; i++){
		tallyFunc(tally, ballots[i]);
	}
	
	// Return it.
	return tally;

}

var _countWinner = function(tally){

	// TO DO: TIES as an array?!?! // attempted

	var highScore = -1;
	var winners = [];

	for(var candidate in tally){
		var score = tally[candidate];
		if(score>highScore) {
			winners = [];
		}
		if(score>=highScore){
			highScore = score;
			winners.push(candidate);
		}
	}
	if (highScore == 0) { return 0; }

	return winners;

}

var _countLoser = function(tally){

	// TO DO: TIES as an array?!?!

	var lowScore = Infinity;
	var winner = null;

	for(var candidate in tally){
		var score = tally[candidate];
		if(score<lowScore) {
			winners = [];
		}
		if(score<=lowScore){
			lowScore = score;
			winners.push(candidate);
		}
	}
	return winners;
}

var _colorWinner = function(model, winner){
	if (winner == "tie" | winner == "elimination tie") {
		var color = "#000"; // BLACK.
	} else {
		var color = (winner) ? Candidate.graphics[winner].fill : "";
	}
	model.winnerColor[0] = color;
	model.tracernewfromelection = [];
	for(var i=0; i<model.candidates.length; i++){
		var c = model.candidates[i];
		var setnew = [c.x*2,c.y*2,color];
		model.tracernewfromelection.push(setnew);
	}
	model.canvas.style.borderColor = color;
	return color;
	// I notice that I never add any ties to the tracer
	// so the pattern recognition handles ties.
}

function _tietext(winners) {
	text = "";
	for ( var i=0; i < winners.length; i++) {
		if(i) {
			text += " and ";
		} 
		text += _icon(winners[i]); 
	}
	text += " tie<br>";
	text += "</span>";
	text += "<br>";	
	text += "<b>TIE</b>";
	return text;
}