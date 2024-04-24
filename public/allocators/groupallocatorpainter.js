if(!AllocatorFactory){
	var AllocatorFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var GroupAllocatorPainter = {
	supportedType: 'group',
	simpleName: 'Group Allocator',
	description: 'Group Allocator',

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
		return 'Add Allocation';
	},

	getFormContent: function(){
		return "";
	},

	isAllocatedToActivity: function(student, activity){
		let groupid = null;
		for (var i = this.groups.length - 1; i >= 0; i--) {
			if(this.groups[i].participants.includes(student)){
				groupid = this.groups[i]._id;
				break;
			}
		}

		let notallocated = !((typeof this.allocator.extra_data !== 'undefined')
						&& (typeof this.allocator.extra_data.allocations[groupid] !== 'undefined'));

		return (!notallocated && this.allocator.extra_data.allocations[groupid] === activity.test)
				|| (notallocated && this.tests[0]._id === activity.test);
	},

	paintAllocator: function(allocator){
		this.allocator = allocator;

		let topaint = '<p class="subtitle italic">Type: <span id="allocator_type">' + allocator.type + '</span></p>'
			+ '<p class="subtitle justified">' + this.description + '</p>'
			+ '<table id="allocator_groups" class="allocations">';

		for (var i = 0; i < this.groups.length; i++) {
			if(allocator.extra_data && allocator.extra_data.allocations && allocator.extra_data.allocations[this.groups[i]._id]){
				topaint += this.generateRow({group: this.groups[i], test: allocator.extra_data.allocations[this.groups[i]._id]});
			}else{
				topaint += this.generateRow({group: this.groups[i], test: this.tests[0]});
			}
		}

		topaint += '</table>';

		$('#allocator_content').html(topaint);
	},

	generateRow: function(allocation){
		let topaint = '<tr><td>' + allocation.group.name + '</td>'
			+ '<td><select id="allocation_' + allocation.group._id
			+'" onchange="GroupAllocatorPainter.updateAllocation(\'' + allocation.group._id + '\')">';

		for (var i = 0; i < this.tests.length; i++) {
			topaint += '<option value="' + this.tests[i]._id + '" '
				+ (this.tests[i]._id === allocation.test ? 'selected' : '') + '>'
				+ this.tests[i].name + '</option>';
		}

		return topaint;
	},

	updateAllocation: function(group){
		let previous = null
		let tmp = this;

		if(!this.allocator.extra_data){
			this.allocator.extra_data = {};
		}

		if(!this.allocator.extra_data.allocations){
			this.allocator.extra_data.allocations = {};
		}

		previous = this.allocator.extra_data.allocations[group];
		this.allocator.extra_data.allocations[group]  = $('#allocation_' + group).val();
		Simva.updateAllocator(this.study._id, this.allocator, function(error, result){
			if(error){
				tmp.allocator.extra_data.allocations[group] = previous;
				$('#allocation_' + group).val(previous);

				$.toast({
					heading: 'Error adding the allocation',
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			}else{
				$.toast({
				heading: 'Allocator updated',
				position: 'top-right',
				icon: 'success',
				stack: false
			});
			}
		});
	},

	addAllocation: function(){
		let tmp = this;

		let participant = $('#edit_allocator_content select[name="username"]').val();
		let test = $('#edit_allocator_content select[name="test"]').val();

		console.log(participant);
		console.log(test);

		if(!this.allocator.extra_data){
			this.allocator.extra_data = {};
		}

		if(!this.allocator.extra_data.allocations){
			this.allocator.extra_data.allocations = {};
		}

		this.allocator.extra_data.allocations[participant] = test;

		Simva.updateAllocator(this.study._id, this.allocator, function(error, result){
			if(error){
				delete tmp.allocator.extra_data.allocations[participant];
				$.toast({
					heading: 'Error adding the allocation',
					text: error.message,
					position: 'top-right',
					icon: 'error',
					stack: false
				});
			}else{
				$.toast({
					heading: 'Allocator updated',
					position: 'top-right',
					icon: 'success',
					stack: false
				});
				toggleAllocatorForm();
				tmp.paintAllocator(tmp.allocator);
			}
		});
	}
}

AllocatorFactory.addPainter(GroupAllocatorPainter);