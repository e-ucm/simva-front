if(!AllocatorFactory){
	var AllocatorFactory = {
		Painters: {},
		addPainter: function(painter){
			this.Painters[painter.supportedType] = painter;
		},
	}
}

var DefaultAllocatorPainter = {
	supportedType: 'default',
	simpleName: 'Default Allocator',
	description: 'This allocator automatically assigns upcoming participants to the first test available.',

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

	isAllocatedToActivity: function(student, activity){
		let isallocated = typeof allocator.extra_data.allocations[student] === 'undefined';

		return (isallocated && allocator.extra_data.allocations[student] === activity.test)
				|| (!isallocated && activity.test === this.tests[0]._id);
	},

	getFormContent: function(){
		let toret = '<p>Participant: </p><select name="username">';
		for (var i = 0; i < participants.length; i++) {
			if(allocator.extra_data && allocator.extra_data.allocations){
				if(allocator.extra_data.allocations[participants[i].username]){
					continue;
				}
			}

			toret += '<option value="' + participants[i].username + '">' + participants[i].username  + '</option>';
		}

		toret += '</select><p>Test: </p><select name="test">';

		for (var i = 0; i < tests.length; i++) {
			toret += '<option value="' + tests[i]._id + '">' + tests[i].name + '</option>';
		}

		toret += '</select><input type="button" value="Add Allocator" onclick="DefaultAllocatorPainter.addAllocation()">';

		return toret;
	},

	paintAllocator: function(allocator){
		this.allocator = allocator;

		let topaint = '<p class="subtitle italic">Type: <span id="allocator_type">' + allocator.type + '</span></p>'
			+ '<p class="subtitle justified">' + this.description + '</p>'
			+ '<table id="allocator_participants" class="allocations">';

		if(allocator.extra_data && allocator.extra_data.allocations){
			let keys = Object.keys(allocator.extra_data.allocations);

			for (var i = 0; i < keys.length; i++) {
				topaint += this.generateRow({username: keys[i], test: allocator.extra_data.allocations[keys[i]]});
			}
		}

		topaint += '</table>'
			+ '<input class="violet" type="button" value="Add Allocation" onclick="toggleAllocatorForm()">';

		$('#allocator_content').html(topaint);
	},

	generateRow: function(allocation){
		let topaint = '<tr><td>' + allocation.username + '</td>'
			+ '<td><select id="allocation_' + allocation.username
			+'" onchange="DefaultAllocatorPainter.updateAllocation(\'' + allocation.username + '\')">';

		for (var i = 0; i < this.tests.length; i++) {
			topaint += '<option value="' + this.tests[i]._id + '" '
				+ (this.tests[i]._id === allocation.test ? 'selected' : '') + '>'
				+ this.tests[i].name + '</option>';
		}

		return topaint;
	},

	updateAllocation: function(participant){
		let previous = this.allocator.extra_data.allocations[participant];
		let tmp = this;

		if(this.allocator.extra_data && this.allocator.extra_data.allocations){
			this.allocator.extra_data.allocations[participant]  = $('#allocation_' + participant).val();
			Simva.updateAllocator(this.study._id, this.allocator, function(error, result){
				if(error){
					tmp.allocator.extra_data.allocations[participant] = previous;
					$('#allocation_' + participant).val(previous);

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
		}
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

AllocatorFactory.addPainter(DefaultAllocatorPainter);