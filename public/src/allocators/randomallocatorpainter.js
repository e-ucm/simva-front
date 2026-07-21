if(!AllocatorFactory){
	var AllocatorFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var RandomAllocatorPainter = {
	supportedType: "random",
	type_translated: "random.type",
	simple_name: "random.title",
	description: "random.description",
	add_title: "allocator.add.title",
	add_message : "add.message",
	add_error : "add.error",
	type_title: "type.title",
	participant_title: "participant.title",
	test_title: "test.title",
	percentage_title: "Percentage",
	
	tests: [],
	groups: [],
	participants: [],
	allocator: null,
	study: null,
	percentages: {},

	setStudy: function(study){
		this.study = study;
	},

	setTests: function(tests){
		this.tests = tests;
	},

	setParticipants: function(participants){
		this.participants = participants;
	},

	setGroups: function(groups){
		this.groups = groups;
	},

	getFormTitle: function(){
		return this.add_title;
	},

	getFormContent: function(){
		return "";
	},

	isAllocatedToActivity: function(student, activity){
		// In random allocator, check allocations
		let groupid = null;
		for (var i = this.groups.length - 1; i >= 0; i--) {
			if(this.groups[i].participants.includes(student)){
				groupid = this.groups[i].group_id;
				break;
			}
		}

		let notallocated = !((typeof this.allocator.allocations !== 'undefined')
						&& (typeof this.allocator.allocations[student] !== 'undefined'));

		if(!notallocated){
			return this.allocator.allocations[student] === activity.session_id;
		}
		
		// If not allocated yet, check if this is the first session as default
		return this.tests.length > 0 && this.tests[0].session_id === activity.session_id;
	},

	initPercentages: function(allocator){
		this.percentages = {};
		// Initialize percentages from allocator data if available
		if(allocator.percentages){
			for(let i = 0; i < allocator.percentages.length; i++){
				let p = allocator.percentages[i];
				this.percentages[p.session_id] = p.percentage;
			}
		}
		// Fill in missing sessions with equal distribution
		let assignedSessions = Object.keys(this.percentages).length;
		if(assignedSessions < this.tests.length){
			let remaining = 100 - Object.values(this.percentages).reduce((a, b) => a + b, 0);
			let perSession = Math.floor(remaining / (this.tests.length - assignedSessions));
			for(let i = 0; i < this.tests.length; i++){
				if(this.percentages[this.tests[i].session_id] === undefined){
					this.percentages[this.tests[i].session_id] = perSession;
				}
			}
		}
	},

	paintAllocator: function(allocator){
		this.allocator = allocator;
		this.initPercentages(allocator);

		let topaint = `<p class="subtitle italic">${this.type_title}: <span id="allocator_type">${this.type_translated}</span></p>
			<p class="subtitle justified">${this.description}</p>
			<div class="random-allocator-config">
				<h4>Session Distribution Percentages</h4>
				<p class="help-text">Set the percentage of participants to allocate to each session. Total should equal 100%.</p>
				<table id="allocator_percentages" class="allocations">
					<thead>
						<tr>
							<th>Session</th>
							<th>Percentage (%)</th>
						</tr>
					</thead>
					<tbody>`;

		for (var i = 0; i < this.tests.length; i++) {
			let sessionId = this.tests[i].session_id;
			let percentage = this.percentages[sessionId] || 0;
			topaint += `<tr>
				<td>${this.tests[i].session_name}</td>
				<td>
					<input type="number" id="percentage_${sessionId}" 
						class="percentage-input" 
						value="${percentage}" 
						min="0" max="100" 
						onchange="RandomAllocatorPainter.updatePercentageTotal()">
				</td>
			</tr>`;
		}

		topaint += `</tbody>
					<tfoot>
						<tr>
							<td><strong>Total</strong></td>
							<td><span id="percentage_total">0</span>%</td>
						</tr>
					</tfoot>
				</table>
				<div class="random-allocator-actions">
					<input class="green" type="button" value="Allocate Randomly" onclick="RandomAllocatorPainter.allocateRandomly()">
					<input type="button" value="Distribute Equally" onclick="RandomAllocatorPainter.distributeEqually()">
				</div>
			</div>
			<hr>
			<h4>Current Allocations</h4>
			<table id="allocator_participants" class="allocations">
				<thead>
					<tr>
						<th>Participant</th>
						<th>Allocated Session</th>
					</tr>
				</thead>
				<tbody>`;

		if(allocator.allocations){
			let keys = Object.keys(allocator.allocations);
			for (var i = 0; i < keys.length; i++) {
				let participantId = keys[i];
				let participant = this.participants.find(p => p.user_id == participantId);
				let displayUser = participant ? (participant.isToken ? participant.token : participant.username) : participantId;
				let sessionId = allocator.allocations[participantId];
				let session = this.tests.find(t => t.session_id == sessionId);
				let sessionName = session ? session.session_name : 'Unknown';
				topaint += `<tr>
					<td>${displayUser}</td>
					<td>${sessionName}</td>
				</tr>`;
			}
		}

		topaint += `</tbody></table>`;

		$('#allocator_content').html(topaint);
		this.updatePercentageTotal();
	},

	paintAllocatorForGroup: function(group, selector){
		this.allocator = group;
		this.initPercentages(group);

		let topaint = `<p class="subtitle italic">${this.type_title}: <span>${this.type_translated}</span></p>
			<p class="subtitle justified">${this.description}</p>
			<div class="random-allocator-config">
				<h4>Session Distribution Percentages</h4>
				<table class="allocations">
					<thead>
						<tr>
							<th>Session</th>
							<th>Percentage (%)</th>
						</tr>
					</thead>
					<tbody>`;

		for (var i = 0; i < this.tests.length; i++) {
			let sessionId = this.tests[i].session_id;
			let percentage = this.percentages[sessionId] || 0;
			topaint += `<tr>
				<td>${this.tests[i].session_name}</td>
				<td>
					<input type="number" id="group_percentage_${group.group_id}_${sessionId}" 
						class="percentage-input" 
						value="${percentage}" 
						min="0" max="100" 
						onchange="RandomAllocatorPainter.updateGroupPercentageTotal('${group.group_id}')">
				</td>
			</tr>`;
		}

		topaint += `</tbody>
					<tfoot>
						<tr>
							<td><strong>Total</strong></td>
							<td><span id="group_percentage_total_${group.group_id}">0</span>%</td>
						</tr>
					</tfoot>
				</table>
				<div class="random-allocator-actions">
					<input class="green" type="button" value="Allocate Randomly" onclick="RandomAllocatorPainter.allocateGroupRandomly('${group.group_id}')">
					<input type="button" value="Distribute Equally" onclick="RandomAllocatorPainter.distributeGroupEqually('${group.group_id}')">
				</div>
			</div>`;

		$(selector).html(topaint);
		this.updateGroupPercentageTotal(group.group_id);
	},

	updatePercentageTotal: function(){
		let total = 0;
		for(let i = 0; i < this.tests.length; i++){
			let sessionId = this.tests[i].session_id;
			let val = parseInt($(`#percentage_${sessionId}`).val()) || 0;
			total += val;
		}
		$('#percentage_total').text(total);
		if(total === 100){
			$('#percentage_total').css('color', 'green');
		} else {
			$('#percentage_total').css('color', 'red');
		}
	},

	updateGroupPercentageTotal: function(groupId){
		let total = 0;
		for(let i = 0; i < this.tests.length; i++){
			let sessionId = this.tests[i].session_id;
			let val = parseInt($(`#group_percentage_${groupId}_${sessionId}`).val()) || 0;
			total += val;
		}
		$(`#group_percentage_total_${groupId}`).text(total);
		if(total === 100){
			$(`#group_percentage_total_${groupId}`).css('color', 'green');
		} else {
			$(`#group_percentage_total_${groupId}`).css('color', 'red');
		}
	},

	distributeEqually: function(){
		let perSession = Math.floor(100 / this.tests.length);
		let remainder = 100 - (perSession * this.tests.length);
		
		for(let i = 0; i < this.tests.length; i++){
			let sessionId = this.tests[i].session_id;
			let value = perSession + (i < remainder ? 1 : 0);
			$(`#percentage_${sessionId}`).val(value);
		}
		this.updatePercentageTotal();
	},

	distributeGroupEqually: function(groupId){
		let perSession = Math.floor(100 / this.tests.length);
		let remainder = 100 - (perSession * this.tests.length);
		
		for(let i = 0; i < this.tests.length; i++){
			let sessionId = this.tests[i].session_id;
			let value = perSession + (i < remainder ? 1 : 0);
			$(`#group_percentage_${groupId}_${sessionId}`).val(value);
		}
		this.updateGroupPercentageTotal(groupId);
	},

	collectPercentages: function(){
		let percentages = [];
		for(let i = 0; i < this.tests.length; i++){
			let sessionId = this.tests[i].session_id;
			let percentage = parseInt($(`#percentage_${sessionId}`).val()) || 0;
			percentages.push({
				session_id: sessionId,
				percentage: percentage
			});
		}
		return percentages;
	},

	collectGroupPercentages: function(groupId){
		let percentages = [];
		for(let i = 0; i < this.tests.length; i++){
			let sessionId = this.tests[i].session_id;
			let percentage = parseInt($(`#group_percentage_${groupId}_${sessionId}`).val()) || 0;
			percentages.push({
				session_id: sessionId,
				percentage: percentage
			});
		}
		return percentages;
	},

	allocateRandomly: function(){
		let tmp = this;
		let percentages = this.collectPercentages();
		let total = percentages.reduce((a, b) => a + b.percentage, 0);
		
		if(total !== 100){
			$.toast({
				heading: tmp.add_error,
				text: 'Percentages must sum to 100%',
				position: 'top-right',
				icon: 'error',
				stack: false
			});
			return;
		}
		
		// Trigger random allocation for all groups with percentages
		for(let i = 0; i < this.groups.length; i++){
			let groupId = this.groups[i].group_id;
			let sessionIds = this.tests.map(t => t.session_id);
			
			Simva.allocateRandomly(tmp.study.simlet_id, groupId, { sessions: sessionIds, percentages: percentages }, function(error, result){
				if(error){
					$.toast({
						heading: tmp.add_error,
						text: error.message,
						position: 'top-right',
						icon: 'error',
						stack: false
					});
				}else{
					$.toast({
						heading: tmp.add_message,
						text: 'Participants allocated randomly',
						position: 'top-right',
						icon: 'success',
						stack: false
					});
					reloadStudy();
				}
			});
		}
	},

	allocateGroupRandomly: function(groupId){
		let tmp = this;
		let percentages = this.collectGroupPercentages(groupId);
		let total = percentages.reduce((a, b) => a + b.percentage, 0);
		
		if(total !== 100){
			$.toast({
				heading: tmp.add_error,
				text: 'Percentages must sum to 100%',
				position: 'top-right',
				icon: 'error',
				stack: false
			});
			return;
		}
		
		let sessionIds = this.tests.map(t => t.session_id);
		
		Simva.allocateRandomly(tmp.study.simlet_id, groupId, { sessions: sessionIds, percentages: percentages }, function(error, result){
			if(error){
				$.toast({
					heading: tmp.add_error,
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			}else{
				$.toast({
					heading: tmp.add_message,
					text: 'Participants allocated randomly',
					position: 'top-right',
					icon: 'success',
					stack: false
				});
				reloadStudy();
			}
		});
	}
}

AllocatorFactory.addPainter(RandomAllocatorPainter);
