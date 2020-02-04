var Utils = {
	getFormData: function($form){
	    var unindexed_array = $form.serializeArray();
	    var indexed_array = {};

	    $.map(unindexed_array, function(n, i){
	        indexed_array[n['name']] = n['value'];
	    });

	    return indexed_array;
	},

	post: function(url, body, callback, jwt){
		$.ajax({
			type: 'POST',
			url: url,
			data: JSON.stringify(body),
			contentType: 'application/json',
			dataType: 'json',
			cache: false,
			beforeSend: function (xhr) {
				if(jwt){
					xhr.setRequestHeader("Authorization", "Bearer " + jwt);
				}
			},
			success: function(data){
				callback(null, data);
			},
			error: callback
		});
	},

	put: function(url, body, callback, jwt){
		$.ajax({
			type: 'PUT',
			url: url,
			data: JSON.stringify(body),
			contentType: 'application/json',
			dataType: 'json',
			cache: false,
			beforeSend: function (xhr) {
				if(jwt){
					xhr.setRequestHeader("Authorization", "Bearer " + jwt);
				}
			},
			success: function(data){
				callback(null, data);
			},
			error: callback
		});
	},

	get: function(url, callback, jwt){

		$.ajax({
			type: 'GET',
			url: url,
			contentType: 'application/json',
			dataType: 'json',
			cache: false,
			beforeSend: function (xhr) {
				if(jwt){
					xhr.setRequestHeader("Authorization", "Bearer " + jwt);
				}
			},
			success: function(data){
				callback(null, data);
			},
			error: callback
		});
	},
}
