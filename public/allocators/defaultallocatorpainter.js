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
	type_translated: "group.type",
	simple_name: "default.title",
	description: "default.description",
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

	isAllocatedToActivity: function(student, activity){
		let notallocated = !((typeof allocator.extra_data !== 'undefined')
						&& (typeof allocator.extra_data.allocations[student] !== 'undefined'));

		return (!notallocated && allocator.extra_data.allocations[student] === activity.session_id)
				|| (notallocated && activity.session_id === this.tests[0]._id);
	},

	getFormContent: function(){
		let toret = `<p>${this.participant_title}: </p><select name="username">`;
		for (var i = 0; i < participants.length; i++) {
			if(allocator.extra_data && allocator.extra_data.allocations){
				if(allocator.extra_data.allocations[participants[i].username]){
					continue;
				}
			}

			toret += `<option value="${participants[i].username}">${allocator.data.displayparticipants[participants[i].username]}</option>`;
		}

		toret += `</select><p>${this.test_title}: </p><select name="test">`;

		for (var i = 0; i < tests.length; i++) {
			toret += `<option value="${tests[i]._id}">${tests[i].session_name}</option>`;
		}

		toret += `</select><input type="button" value="${this.add_title}" onclick="DefaultAllocatorPainter.addAllocation()">`;

		return toret;
	},

	paintAllocator: function(allocator){
		this.allocator = allocator;

		let topaint = `<p class="subtitle italic">${this.type_title}: <span id="allocator_type">${this.type_translated}</span></p>
			<p class="subtitle justified">${this.description}</p>
			<table id="allocator_participants" class="allocations">`;

		if(allocator.extra_data && allocator.extra_data.allocations){
			let keys = Object.keys(allocator.extra_data.allocations);

			for (var i = 0; i < keys.length; i++) {
				topaint += this.generateRow({username: keys[i], displayUser : allocator.data.displayparticipants[keys[i]], test: allocator.extra_data.allocations[keys[i]]});
			}
		}

		topaint += '</table><input class="violet" type="button" value="Add Allocation" onclick="toggleAllocatorForm()">';

		$('#allocator_content').html(topaint);
	},

	generateRow: function(allocation){
		let topaint = `<tr><td>${allocation.displayUser}</td>
			<td><select id="allocation_${allocation.username}"
			onchange="DefaultAllocatorPainter.updateAllocation('${allocation.username}')">`;

		for (var i = 0; i < this.tests.length; i++) {
			selected=(this.tests[i]._id === allocation.test ? 'selected' : '')
			topaint += `<option value="${this.tests[i]._id}" ${selected}> 
			${this.tests[i].session_name}</option>`;
		}

		return topaint;
	},

	updateAllocation: function(participant){
		let previous = this.allocator.extra_data.allocations[participant];
		let tmp = this;

		if(this.allocator.extra_data && this.allocator.extra_data.allocations){
			this.allocator.extra_data.allocations[participant]  = $(`#allocation_${participant}`).val();
			Simva.updateAllocator(this.study._id, this.allocator, function(error, result){
				if(error){
					tmp.allocator.extra_data.allocations[participant] = previous;
					$(`#allocation_${participant}`).val(previous);

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
	},

	addAllocation: function(){
		let tmp = this;

		let participant = $('#edit_allocator_content select[name="username"]').val();
		let test = $('#edit_allocator_content select[name="test"]').val();
		
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

AllocatorFactory.addPainter(DefaultAllocatorPainter);