var Utils = {
	getFormData: function($form){
	    var unindexed_array = $form.serializeArray();
	    var indexed_array = {};

	    $.map(unindexed_array, function(n, i){
	        indexed_array[n['name']] = n['value'];
	    });

	    return indexed_array;
	},
	
	toggleAddForm : function(id){
		$(`#${id}`).toggleClass('shown');
	},

	toggleSubmit : function(form){
		$(form).find('input[type="submit"]').toggle();
		$(form).find('.loader').toggle();
	},

	post: function(url, body, callback){
		$.ajax({
			type: 'POST',
			url: url,
			data: JSON.stringify(body),
			contentType: 'application/json',
			dataType: 'json',
			cache: false,
			success: function(data){
				callback(null, data);
			},
			error: function(error){
				callback(error);
			},
		});
	},

	
	postForm: function(url, formData, callback){
	    $.ajax({
	       type: 'POST',
	       url: url,
	       data: formData,
	       processData: false,
	       contentType: false,
	       cache: false,
	       success: function(data){
		       callback(null, data);
	       },
	       error: function(error){
		       callback(error);
	       },
	    });
	},

	patch: function(url, body, callback){
		$.ajax({
			type: 'PATCH',
			url: url,
			data: JSON.stringify(body),
			contentType: 'application/json',
			dataType: 'json',
			cache: false,
			success: function(data){
				callback(null, data);
			},
			error: function(error){
				callback(error);
			},
		});
	},

	patchForm: function(url, formData, callback){
	    $.ajax({
	       type: 'PATCH',
	       url: url,
	       data: formData,
	       processData: false,
	       contentType: false,
	       cache: false,
	       success: function(data){
		       callback(null, data);
	       },
	       error: function(error){
		       callback(error);
	       },
	    });
	},

	put: function(url, body, callback){
		$.ajax({
			type: 'PUT',
			url: url,
			data: JSON.stringify(body),
			contentType: 'application/json',
			dataType: 'json',
			cache: false,
			success: function(data){
				callback(null, data);
			},
			error: function(error){
				callback(error);
			},
		});
	},

	get: function(url, callback){
		$.ajax({
			type: 'GET',
			url: url,
			contentType: 'application/json',
			dataType: 'json',
			cache: false,
			success: function(data){
				callback(null, data);
			},
			error: function(error){
				callback(error);
			},
		});
	},

	getPDF: function(url, callback){
		var req = new XMLHttpRequest();
		req.open("GET", url, true);
		req.setRequestHeader('Authorization',`Bearer ${jwt}`);
		req.responseType = "blob";

		req.onload = function (event) {
			var blob = req.response;
			callback(null, blob);
		};

		req.send();
	},

	delete: function(url, callback){
		$.ajax({
			type: 'DELETE',
			url: url,
			contentType: 'application/json',
			dataType: 'json',
			cache: false,
			success: function(data){
				callback(null, data);
			},
			error: function(error){
				callback(error);
			},
		});
	},

	download: function(filename, text){
		var element = document.createElement('a');
		element.setAttribute('href', `data:text/plain;charset=utf-8, ${encodeURIComponent(text)}`);
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	},

	decodeJWT: function (token) {
	    var base64Url = token.split('.')[1];
	    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
	    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
	        return `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`;
	    }).join(''));

	    return JSON.parse(jsonPayload);
	}
}