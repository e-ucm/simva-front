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
		if (id === 'iframe_floating') {
			this.toggleIframeFloating();
		} else {
			$(`#${id}`).toggleClass('shown');
		}
	},

	showIframeFloating: function() {
		$('#iframe_floating').css('display', 'table').addClass('shown');
	},

	hideIframeFloating: function() {
		$('#iframe_floating').removeClass('shown').css('display', 'none');
	},

	toggleIframeFloating: function() {
		const $el = $('#iframe_floating');
		if ($el.hasClass('shown')) {
			this.hideIframeFloating();
		} else {
			this.showIframeFloating();
		}
	},

	toggleSubmit : function(form){
		$(form).find('input[type="submit"]').toggle();
		$(form).find('.loader').toggle();
	},

	changeTab : function(tab, form, subform){
		// Avoid affecting nested forms by only targeting the buttons (.tab) of the first tabs header (.tabs) 
		// under the form and the sibilings of the header that are tabs contents (.subform)
		$(`#${form} .tabs:first .tab`).removeClass('selected');
		$(`#${form} .tabs:first`).siblings(".subform").removeClass('selected');
		
		$(tab).addClass('selected');

		// Hide all subforms in the modal
		$(`#${form} .subform`).hide();
		// Show the selected subform
		$(`#${subform}`).show();
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

	isDownloadUrl: function(value){
		if(typeof value !== 'string') {
			return false;
		}

		return /^(https?:)?\/\//.test(value) || value.startsWith('/');
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

	downloadContent: function(source, filename, errorHeading){
		if(!this.isDownloadUrl(source)) {
			this.download(filename, source);
			return;
		}

		fetch(source)
			.then((response) => {
				if(!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}
				return response.blob();
			})
			.then((blob) => {
				const objectUrl = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = objectUrl;
				link.download = filename;
				link.style.display = 'none';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(objectUrl);
			})
			.catch((error) => {
				if(errorHeading && typeof $ !== 'undefined' && $.toast) {
					$.toast({
						heading: errorHeading,
						text: error.message,
						position: 'top-right',
						icon: 'error',
						stack: false
					});
				}
			});
	},

	displayResultInFloatingFrame: function(content, floatingId){
		const stringifyres = String(content)
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		const renderedContent = `<pre style="padding: 20px; background-color: #f0f0f0; color: #333; font-family: monospace; white-space: pre-wrap; word-wrap: break-word;">${stringifyres}</pre>`;
		const targetFloatingId = floatingId || 'iframe_floating';
		const iframe = $(`#${targetFloatingId} iframe`)[0];
		if(!iframe || !iframe.contentWindow || !iframe.contentWindow.document) {
			return;
		}

		const context = iframe.contentWindow.document;
		const body = $('body', context);
		body.html(renderedContent);
		body.css({
			'margin': '0',
			'padding': '0',
			'overflow': 'auto',
			'height': '100vh'
		});

		this.showIframeFloating();
	},

	openResultContent: function(source, errorHeading, floatingId){
		if(!this.isDownloadUrl(source)) {
			this.displayResultInFloatingFrame(source, floatingId);
			return;
		}

		fetch(source)
			.then((response) => {
				if(!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}
				return response.text();
			})
			.then((content) => {
				this.displayResultInFloatingFrame(content, floatingId);
			})
			.catch((error) => {
				if(errorHeading && typeof $ !== 'undefined' && $.toast) {
					$.toast({
						heading: errorHeading,
						text: error.message,
						position: 'top-right',
						icon: 'error',
						stack: false
					});
				}
			});
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