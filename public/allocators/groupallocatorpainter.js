if(!AllocatorFactory){
	var AllocatorFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var GroupAllocatorPainter = {
	supportedType: "group",
	type_translated: "group.type",
	simple_name: "group.title",
	description: "group.description",
	add_title: "allocator.add.title",
	add_message : "add.message",
	add_error : "add.error",
	type_title: "type.title",
	participant_title: "participant.title",
	test_title: "test.title",
	
	tests: [],
	groups: [],
	participants: [],
	allocator: null,
	study: null,

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
		let groupid = null;
		for (var i = this.groups.length - 1; i >= 0; i--) {
			if(this.groups[i].participants.includes(student)){
				groupid = this.groups[i].group_id;
				break;
			}
		}

		let notallocated = !((typeof this.allocator.allocations !== 'undefined')
						&& (typeof this.allocator.allocations[groupid] !== 'undefined'));

		return (!notallocated && this.allocator.allocations[groupid] === activity.session_id)
				|| (notallocated && this.tests[0].session_id === activity.session_id);
	},

	paintAllocator: function(allocator){
		this.allocator = allocator;

		let topaint = `<p class="subtitle italic">${this.type_title}: <span id="allocator_type">${this.type_translated}</span></p>
			<p class="subtitle justified">${this.description}</p>
			<table id="allocator_groups" class="allocations">`;

		for (var i = 0; i < this.groups.length; i++) {
			if(allocator.allocations && allocator.allocations[this.groups[i].group_id]){
				topaint += this.generateRow({group: this.groups[i], test: allocator.allocations[this.groups[i].group_id]});
			}else{
				topaint += this.generateRow({group: this.groups[i], test: this.tests[0]});
			}
		}

		topaint += '</table>';

		$('#allocator_content').html(topaint);
	},

	generateRow: function(allocation){
		let topaint = `<tr>
			<td>${allocation.group.group_name}</td>
			<td>
				<select id="allocation_${allocation.group.group_id}" 
					onchange="GroupAllocatorPainter.updateAllocation('${allocation.group.group_id}')"
				>`;

		for (var i = 0; i < this.tests.length; i++) {
			let selected=(this.tests[i].session_id === allocation.test ? 'selected' : '')
			topaint += `<option value="${this.tests[i].session_id}" ${selected}>${this.tests[i].session_name}</option>`;
		}
		return topaint;
	},

	updateAllocation: function(group){
		let previous = null
		let tmp = this;
		const selectedTest = $(`#allocation_${group}`).val();

		if(!this.allocator.allocations){
			this.allocator.allocations = {};
		}

		previous = this.allocator.allocations[group];
		this.allocator.allocations[group]  = $(`#allocation_${group}`).val();
		Simva.allocateToSession(tmp.study.simlet_id, selectedTest, group, {}, function(error, result){
			if(error){
				tmp.allocator.allocations[group] = previous;
				$(`#allocation_${group}`).val(previous);

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
					position: 'top-right',
					icon: 'success',
					stack: false
				});
				reloadStudy();
			}
		});
	},

	addAllocation: function(){
		let tmp = this;

		let participant = $('#edit_allocator_content select[name="username"]').val();
		let test = $('#edit_allocator_content select[name="test"]').val();

		if(!this.allocator.allocations){
			this.allocator.allocations = {};
		}

		this.allocator.allocations[participant] = test;

		Simva.allocateToSession(this.study.simlet_id, test, participant, {}, function(error, result){
			if(error){
				delete tmp.allocator.allocations[participant];
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
					position: 'top-right',
					icon: 'success',
					stack: false
				});
				toggleAllocatorForm();
				tmp.paintAllocator(tmp.allocator);
				reloadStudy();
			}
		});
	}
}

AllocatorFactory.addPainter(GroupAllocatorPainter);