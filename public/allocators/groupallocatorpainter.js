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


	paintAllocatorForGroup: function(group, selector){
		this.allocator = group;

		// Get the allocated session for this group from allocations
		let allocatedTest = (group.allocations && group.allocations[group.group_id]) 
			? group.allocations[group.group_id] 
			: (this.tests.length > 0 ? this.tests[0].session_id : null);

		// Add the allocator info
		let topaint = `
			<p class="subtitle italic">${this.type_title}: <span>${this.type_translated}</span></p>
			<p class="subtitle justified">${this.description}</p>
			<p>${this.test_title}: <select id="allocation_group_${group.group_id}"  onchange="GroupAllocatorPainter.updateAllocationForGroup('${group.group_id}')">;
		`;

		// Add all the sessions to the selector
		for (var i = 0; i < this.tests.length; i++) {
			let selected = (this.tests[i].session_id === allocatedTest ? 'selected' : '');
			topaint += `<option value="${this.tests[i].session_id}" ${selected}>${this.tests[i].session_name}</option>`;
		}
		topaint += `</p>`;

		$(selector).html(topaint);
	},

	updateAllocationForGroup: function(groupId){
		let tmp = this;
		const selectedTest = $(`#allocation_group_${groupId}`).val();

		Simva.allocateToSession(tmp.study.simlet_id, groupId, selectedTest, {}, function(error, result){
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
					position: 'top-right',
					icon: 'success',
					stack: false
				});
				reloadStudy();
			}
		});
	}
	
}

AllocatorFactory.addPainter(GroupAllocatorPainter);