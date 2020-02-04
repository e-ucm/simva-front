var Utils = {
	getFormData: function($form){
	    var unindexed_array = $form.serializeArray();
	    var indexed_array = {};

	    $.map(unindexed_array, function(n, i){
	        indexed_array[n['name']] = n['value'];
	    });

	    return indexed_array;
	},

	post: function(url, body, callback){
		$.ajax({
			type: 'POST',
			url: url,
			data: JSON.stringify(body),
			contentType: 'application/json',
			dataType: 'json',
			success: function(data){
				callback(null, data);
			},
			error: callback
		});
	},

	get: function(url, callback){
		$.ajax({
			type: 'GET',
			url: url,
			contentType: 'application/json',
			dataType: 'json',
			success: function(data){
				callback(null, data);
			},
			error: callback
		});
	},
}
