var Utils = {
	getFormData: function($form){
	    var unindexed_array = $form.serializeArray();
	    var indexed_array = {};

	    $.map(unindexed_array, function(n, i){
	        indexed_array[n['name']] = n['value'];
	    });

	    return indexed_array;
	},
	
	toggleIframeInFloating: function(url) {
		const $el = $('#iframe_floating');
		if ($el.hasClass('shown')) {
			this.hideIframeFloating();
		} else {
			const self = this;
			const $content = $el.find('.iframe_content').empty();

			// Switch to iframe mode
			$el.addClass('is-iframe');

			const $iframe = $('<iframe class="iframe" frameborder="0"></iframe>');

			const $loader = $(`
				<div class="iframe_loader">
					<div class="lds-roller"><div></div><div></div><div></div>
					<div></div><div></div><div></div><div></div><div></div></div>
				</div>
			`);

			$content.append($loader).append($iframe);

			$iframe.on('load', function() {
				$loader.remove();
			});

			$iframe.attr('src', url);
			self.showIframeFloating();
		}
	},

	toggleHTMLInFloating: function(html) {
		const $el = $('#iframe_floating');
		if ($el.hasClass('shown')) {
			this.hideIframeFloating();
		} else {
			const $modal = $('#iframe_floating');
			$modal.find('.iframe_content')
					.empty()
					.append(html);
			this.showIframeFloating();
		}
	},

	toggleAddForm: function(id) {
		const $el = $('#iframe_floating');
		if ($el.hasClass('shown')) {
			this.hideIframeFloating();
		} else {
			if (id === 'iframe_floating') {
				this.showIframeFloating();
			} else {
				const $modal = $('#iframe_floating');
				const form = $(`#${id}`);

				// Grab the deepest .form content, skipping .new_element/.floater wrappers
				const formContent = form.is('.new_element')
					? form.find('.form').first().parent() 
					: form;

				$modal.find('.iframe_content')
					.empty()
					.append(formContent.html());

				this.showIframeFloating();
			};
		}
	},

	showIframeFloating: function() {
		$('#iframe_floating').addClass('shown');
	},

	hideIframeFloating: function() {
		$('#iframe_floating').removeClass('shown is-iframe');
		$('#iframe_floating').find('.iframe_content')
							.empty();
	},

	toggleSubmit : function(form){
		$(form).find('input[type="submit"]').toggle();
		$(form).find('.loader').toggle();
	},

	changeTab : function(tab, form, subform){
		// Support both string id and direct element reference
		let $form = typeof form === 'string' ? $(`#${form}`) : $(form);
		let $tab = typeof tab === 'string' ? $(`#${tab}`) : $(tab);
		let $subform = typeof subform === 'string' ? $(`#${subform}`) : $(subform);
		
		// Find the first .tabs header inside the form or container
		const $tabsHeader = $form.find('.tabs').first();
		$tabsHeader.find('.tab').removeClass('selected');
		$tab.addClass('selected');

		// Hide all .subform elements inside the form/container
		$form.find('.subform').each(function() {
			$(this).hide().removeClass('selected');
			if (this.hasAttribute('hidden')) {
				this.removeAttribute('hidden');
			}
			this.style.display = 'none';
		});

		// Show and select the requested subform by id (must be inside the form/container)
		let $targetSubform = $form.find($subform);
		if ($targetSubform.length === 0) {
			// fallback: try global if not found inside form
			$targetSubform = $($subform);
		}
		$targetSubform.show().addClass('selected');
		if ($targetSubform.length > 0) {
			// $targetSubform[0].style.display = 'block';
		}
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
		Utils.toggleHTMLInFloating(renderedContent);
	},

	openResultContent: function(source){
		if(!this.isDownloadUrl(source)) {
			this.displayResultInFloatingFrame(source);
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
				this.displayResultInFloatingFrame(content);
			})
			.catch((error) => {
				if(errorHeading && typeof $ !== 'undefined' && $.toast) {
					$.toast({
						heading: error.message,
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