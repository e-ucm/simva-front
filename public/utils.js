var Utils = {
	// JQUERY AJAX WRAPPERS
	
	/**
	 * Send an async POST request to the specified url where the request body is a JSON object 
	 * 
	 * @param {string} url - url to send the request to
	 * @param {Object} body - data to send in the request
	 * @param {Function} callback - function to call when the request gets a response (either on success or on error) 
	 */
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

	/**
	 * Send an async POST request to the specified url where the request body is a FormData object
	 * 
	 * @param {string} url - url to send the request to
	 * @param {FormData} body - data to send in the request
	 * @param {Function} callback - function to call when the request gets a response (either on success or on error) 
	 */
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

	/**
	 * Send an async PATCH request to the specified url where the request body is a JSON object 
	 * 
	 * @param {string} url - url to send the request to
	 * @param {Object} body - data to send in the request
	 * @param {Function} callback - function to call when the request gets a response (either on success or on error) 
	 */
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

	/**
	 * Send an async PATCH request to the specified url where the request body is a FormData object
	 * 
	 * @param {string} url - url to send the request to
	 * @param {FormData} body - data to send in the request
	 * @param {Function} callback - function to call when the request gets a response (either on success or on error) 
	 */
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

	/**
	 * Send an async PUT request to the specified url where the request body is a JSON object 
	 * 
	 * @param {string} url - url to send the request to
	 * @param {Object} body - data to send in the request
	 * @param {Function} callback - function to call when the request gets a response (either on success or on error) 
	 */
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

	/**
	 * Send an async GET request to the specified url
	 * 
	 * @param {string} url - url to send the request to
	 * @param {Function} callback - function to call when the request gets a response (either on success or on error) 
	 */
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

	/**
	 * Send an async DELETE request to the specified url
	 * 
	 * @param {string} url - url to send the request to
	 * @param {Function} callback - function to call when the request gets a response (either on success or on error) 
	 */
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
	
	
	// FLOATING MENUS

	/**
	 * Convert a html form into an object containing its data. For a form field to
	 * be included in the returned object, it must include the "name" property 
	 *  
	 * @param {Object} $form - jquery object of the form
	 * @returns {Object} - object containing the form data, where each key is the "name" property of each form field
	 */
	getFormData: function($form){
		// Get an array of objects where each object contains the data of each form field
	    const unindexed_array = $form.serializeArray();
		
		// Convert the array into an object, using the "name" property of the form field as the key
	    let indexed_array = {};
	    $.map(unindexed_array, function(n, i){
	        indexed_array[n['name']] = n['value'];
	    });
		
	    return indexed_array;
	},
	

	showIframeFloating: function() {
		$('#iframe_floating').addClass('shown');
	},

	hideIframeFloating: function() {
		$('#iframe_floating').removeClass('shown is-iframe');
		$('#iframe_floating').find('.iframe_content').empty();
	},

	
	/**
	 * Show/hide a floating menu that contains an iframe 
	 * 
	 * @param {string} url - url to open in the iframe  
	 */
	toggleIframeInFloating: function(url) {
		const $el = $('#iframe_floating');
		if ($el.hasClass('shown')) {
			this.hideIframeFloating();
		} else {
			// Remove all previous contents from the floating menu
			const $content = $el.find('.iframe_content').empty();

			// Switch to iframe mode
			$el.addClass('is-iframe');

			// Add the iframe and a loader to the floating menu
			const $iframe = $('<iframe class="iframe" frameborder="0"></iframe>');
			const $loader = $(`
				<div class="iframe_loader">
					<div class="lds-roller"><div></div><div></div><div></div>
					<div></div><div></div><div></div><div></div><div></div></div>
				</div>
			`);
			$content.append($loader).append($iframe);

			// Set the iframe url
			$iframe.attr('src', url);

			$iframe.on('load', function() {
				$loader.remove();
			});

			this.showIframeFloating();
		}
	},

	/**
	 * Show/hide html contents in a floating menu 
	 * 
	 * @param {string} html - html string to show in the floating menu
	 */
	toggleHTMLInFloating: function(html) {
		const $el = $('#iframe_floating');
		if ($el.hasClass('shown')) {
			this.hideIframeFloating();
		} else {
			const $modal = $('#iframe_floating');
			// Remove all previous contents from the floating menu and append the html contents 
			$modal.find('.iframe_content')
					.empty()
					.append(html);
			this.showIframeFloating();
		}
	},

	/**
	 * Show/hide a form inside a floating menu
	 * 
	 * @param {string} id - id attribute of the form 
	 */
	toggleFormInFloating: function(id) {
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

				// Remove all previous contents from the floating menu and append the form elements to it
				$modal.find('.iframe_content')
					.empty()
					.append(formContent.html());

				this.showIframeFloating();
			};
		}
	},

	/**
	 * Hides the submit button of the floating form and shows the loader
	 */
	toggleSubmit : function(){
		$('#iframe_floating').find('input[type="submit"]').toggle();
		$('#iframe_floating').find('.loader').toggle();
	},


	/**
	 * Select the chosen tab inside of a "tabs" element inside of a "form" element and show the chosen "subform" 
	 * 
	 * @param {string} tab - id / jquery object reference of the tab button that calls this function
	 * @param {string} form - id / jquery object reference of the "form" (element containing both the tab buttons and each tab's contents) that contains the tab to show
	 * @param {String} subform - id / jquery object reference of the "subform" (element containing the tab elements) to show
	 */
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
	},


	// DOWNLOAD DATA

	/**
	 * Check if the url is a download url
	 * 
	 * @param {string} url - url to check
	 * @returns {Boolean} - true if the URL is an absolute or protocol-relative URL 
	 * (like https://example.com or //cdn.example.com) or a root-relative path (like /home)
	 */
	isDownloadUrl: function(url){
		if(typeof url !== 'string') {
			return false;
		}
		return /^(https?:)?\/\//.test(url) || url.startsWith('/');
	},

	download: function(filename, text) {
		let element = document.createElement('a');
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
	    let base64Url = token.split('.')[1];
	    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
	    let jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
	        return `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`;
	    }).join(''));

	    return JSON.parse(jsonPayload);
	}
}