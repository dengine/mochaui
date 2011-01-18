/*
 ---

 name: Core

 script: Core.js

 description: MUI - A Web Applications User Interface Framework.

 copyright: (c) 2007-2009 Greg Houston, <http://greghoustondesign.com/>.

 license: MIT-style license.

 authors:
 - Scott F. Frederick
 - Joel Lindau

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

 requires:
 - Core:1.3.0/Array
 - Core:1.3.0/Element
 - Core:1.3.0/Browser
 - Core:1.3.0/Request
 - Core:1.3.0/Request.HTML
 - More:1.3.0/Assets

 provides: [MUI, MochaUI, MUI.Require]

 ...
 */

Browser.webkit = (Browser.safari || Browser.chrome);

var MUI = MochaUI = {

	version: '0.9.7',

	options: {
		theme: 'default',
		advancedEffects: false,			// Effects that require fast browsers and are cpu intensive.
		standardEffects: true			// Basic effects that tend to run smoothly.
	},

	path: {
		source:  '../Source/Core/',		// Path to MochaUI source JavaScript
		themes:  '../Source/Themes/',	// Path to MochaUI Themes
		plugins: 'plugins/'				// Path to Plugins
	},

	// Returns the path to the current theme directory
	themePath: function(){
		return MUI.path.themes + MUI.options.theme + '/';
	},

	files: {}

};

MUI.files[MUI.path.source + 'Core.js'] = 'loaded';

MUI.append = function(o) {
	Object.append(MUI,o);
	return MUI;
};

MUI.append({

	Windows: {
		instances: {}
	},

	ieSupport: 'excanvas',  // Makes it easier to switch between Excanvas and Moocanvas for testing	

	/*

	 Function: updateContent
	 Replace the content of a window or panel.

	 Arguments:
	 updateOptions - (object)

	 updateOptions:
	 element - The parent window or panel.
	 childElement - The child element of the window or panel recieving the content.
	 method - ('get', or 'post') The way data is transmitted.
	 data - (hash) Data to be transmitted
	 title - (string) Change this if you want to change the title of the window or panel.
	 content - (string or element) An html loadMethod option.
	 loadMethod - ('html', 'xhr', or 'iframe')
	 url - Used if loadMethod is set to 'xhr' or 'iframe'.
	 scrollbars - (boolean)
	 padding - (object)
	 onContentLoaded - (function)

	 */
	updateContent: function(options){

		options = Object.merge({
			element:	  null,
			childElement: null,
			method:	   null,
			data:		 null,
			title:		null,
			content:	  null,
			loadMethod:   null,
			url:		  null,
			scrollbars:   null,
			padding:	  null,
			require:	  {}
			//onContentLoaded: null
		},options);

		options.require = Object.merge({
			css: [], images: [], js: [], onload: null
		}, options.require);

		var args = {};

		if (!options.element) return;
		var element = options.element;

		args.recipient = MUI.Windows.instances[element.id] ? 'window' : 'panel';

		var instance = element.retrieve('instance');
		if (options.title) instance.titleEl.set('html', options.title);

		var contentEl = instance.contentEl;
		args.contentContainer = options.childElement != null ? options.childElement : instance.contentEl;
		var contentWrapperEl = instance.contentWrapperEl;

		if (!options.loadMethod){
			options.loadMethod = !instance.options.loadMethod ? !options.url ? 'html' : 'xhr' : instance.options.loadMethod;
		}

		// Set scrollbars if loading content in main content container.
		// Always use 'hidden' for iframe windows
		var scrollbars = options.scrollbars || instance.options.scrollbars;
		if (args.contentContainer == instance.contentEl){
			contentWrapperEl.setStyles({
				'overflow': scrollbars != false && options.loadMethod != 'iframe' ? 'auto' : 'hidden'
			});
		}

		if (options.padding != null){
			contentEl.setStyles({
				'padding-top': options.padding.top,
				'padding-bottom': options.padding.bottom,
				'padding-left': options.padding.left,
				'padding-right': options.padding.right
			});
		}

		// Remove old content.
		if (args.contentContainer == contentEl){
			contentEl.empty().show();
			// Panels are not loaded into the padding div, so we remove them separately.
			contentEl.getAllNext('.column').destroy();
			contentEl.getAllNext('.columnHandle').destroy();
		}

		args.onContentLoaded = function(){

			if (options.require.js.length || typeof options.require.onload == 'function'){
				new MUI.Require({
					js: options.require.js,
					onload: function(){
						if (Browser.opera){
							options.require.onload.delay(100);
						}
						else {
							options.require.onload();
						}
						(options.onContentLoaded && options.onContentLoaded != null) ? options.onContentLoaded() : instance.fireEvent('contentLoaded', element);
					}.bind(this)
				});
			}
			else {
				(options.onContentLoaded && options.onContentLoaded != null) ? options.onContentLoaded() : instance.fireEvent('contentLoaded', element);
			}

		};

		if (options.require.css.length || options.require.images.length){
			new MUI.Require({
				css: options.require.css,
				images: options.require.images,
				onload: function(){
					this.loadSelect(instance, options, args);
				}.bind(this)
			});
		}
		else {
			this.loadSelect(instance, options, args);
		}
	},

	loadSelect: function(instance, options, args){

		// Load new content.
		switch (options.loadMethod){
			case 'xhr':
				this.updateContentXHR(instance, options, args);
				break;
			case 'iframe':
				this.updateContentIframe(instance, options, args);
				break;
			case 'json':
				this.updateContentJSON(instance, options, args);
				break;
			case 'html':
			default:
				this.updateContentHTML(instance, options, args);
				break;
		}

	},

	updateContentJSON: function(instance, options, args){
		var contentEl = instance.contentEl;
		var contentContainer = args.contentContainer;

		new Request({
			url: options.url,
			update: contentContainer,
			method: options.method != null ? options.method : 'get',
			data: options.data != null ? Object.toQueryString(options.data) : '',
			evalScripts: false,
			evalResponse: false,
			headers: {'Content-Type':'application/json'},
			onRequest: function(){
				if (args.recipient == 'window' && contentContainer == contentEl){
					instance.showSpinner();
				}
				else if (args.recipient == 'panel' && contentContainer == contentEl && $('spinner')){
					$('spinner').show();
				}
			}.bind(this),
			onFailure: function(){
				if (contentContainer == contentEl){
					contentContainer.set('html', '<p><strong>Error Loading XMLHttpRequest</strong></p>');
					if (recipient == 'window'){
						instance.hideSpinner();
					}
					else if (recipient == 'panel' && $('spinner')){
						$('spinner').hide();
					}
				}

				if (contentContainer == contentEl){
					contentContainer.set('html', '<p><strong>Error Loading XMLHttpRequest</strong></p>');
					if (args.recipient == 'window'){
						instance.hideSpinner();
					}
					else if (args.recipient == 'panel' && $('spinner')){
						$('spinner').hide();
					}
				}
			}.bind(this),
			onException: function(){
			}.bind(this),
			onSuccess: function(json){
				if (contentContainer == contentEl){
					if (contentContainer == contentEl){
						if (args.recipient == 'window') instance.hideSpinner();
						else if (args.recipient == 'panel' && $('spinner')) $('spinner').hide();
					}
					json = JSON.decode(json);
					// calls onLoaded event instead of onContentLoaded
					// onLoaded - event should call updateContent again with loadMethod='html'
					instance.fireEvent('loaded', [options.element, json, instance]);
				}
			}.bind(this),
			onComplete: function(){
			}.bind(this)
		}).get();
	},

	updateContentXHR: function(instance, options, args){
		var contentEl = instance.contentEl;
		var contentContainer = args.contentContainer;
		var onContentLoaded = args.onContentLoaded;
		new Request.HTML({
			url: options.url,
			update: contentContainer,
			method: options.method != null ? options.method : 'get',
			data: options.data != null ? Object.toQueryString(options.data) : '',
			evalScripts: instance.options.evalScripts,
			evalResponse: instance.options.evalResponse,
			onRequest: function(){
				if (args.recipient == 'window' && contentContainer == contentEl){
					instance.showSpinner();
				}
				else if (args.recipient == 'panel' && contentContainer == contentEl && $('spinner')){
					$('spinner').show();
				}
			}.bind(this),
			onFailure: function(response){
				if (contentContainer == contentEl){
					var getTitle = new RegExp("<title>[\n\r\\s]*(.*)[\n\r\\s]*</title>", "gmi");
					var error = getTitle.exec(response.responseText);
					if (!error) error = 'Unknown';
					contentContainer.set('html', '<h3>Error: ' + error[1] + '</h3>');
					if (args.recipient == 'window'){
						instance.hideSpinner();
					}
					else if (args.recipient == 'panel' && $('spinner')){
						$('spinner').hide();
					}
				}
			}.bind(this),
			onSuccess: function(){
				contentEl.addClass("pad");
				if (contentContainer == contentEl){
					if (args.recipient == 'window') instance.hideSpinner();
					else if (args.recipient == 'panel' && $('spinner')) $('spinner').hide();
				}
				Browser.ie4 ? onContentLoaded.delay(750) : onContentLoaded();
			}.bind(this),
			onComplete: function(){
			}.bind(this)
		}).send();
	},

	updateContentIframe: function(instance, options, args){
		var contentEl = instance.contentEl;
		var contentContainer = args.contentContainer;
		var contentWrapperEl = instance.contentWrapperEl;
		var onContentLoaded = args.onContentLoaded;
		if (instance.options.contentURL == '' || contentContainer != contentEl){
			return;
		}
		contentEl.removeClass("pad");
		contentEl.setStyle("padding", "0px");
		instance.iframeEl = new Element('iframe', {
			'id': instance.options.id + '_iframe',
			'name': instance.options.id + '_iframe',
			'class': 'mochaIframe',
			'src': options.url,
			'marginwidth': 0,
			'marginheight': 0,
			'frameBorder': 0,
			'scrolling': 'auto',
			'styles': {
				'height': contentWrapperEl.offsetHeight - contentWrapperEl.getStyle('border-top').toInt() - contentWrapperEl.getStyle('border-bottom').toInt(),
				'width': instance.panelEl ? contentWrapperEl.offsetWidth - contentWrapperEl.getStyle('border-left').toInt() - contentWrapperEl.getStyle('border-right').toInt() : '100%'
			}
		}).inject(contentEl);

		// Add onload event to iframe so we can hide the spinner and run onContentLoaded()
		instance.iframeEl.addEvent('load', function(){
			if (args.recipient == 'window') instance.hideSpinner();
			else if (args.recipient == 'panel' && contentContainer == contentEl && $('spinner')) $('spinner').hide();
			Browser.ie4 ? onContentLoaded.delay(50) : onContentLoaded();
		}.bind(this));
		if (args.recipient == 'window') instance.showSpinner();
		else if (args.recipient == 'panel' && contentContainer == contentEl && $('spinner')) $('spinner').show();
	},

	updateContentHTML: function(instance, options, args){
		var contentEl = instance.contentEl;
		var contentContainer = args.contentContainer;
		var onContentLoaded = args.onContentLoaded;
		var elementTypes = new Array('element', 'textnode', 'whitespace', 'collection');

		contentEl.addClass("pad");
		if (elementTypes.contains(typeOf(options.content))){
			options.content.inject(contentContainer);
		} else {
			contentContainer.set('html', options.content);
		}
		if (contentContainer == contentEl){
			if (args.recipient == 'window') instance.hideSpinner();
			else if (args.recipient == 'panel' && $('spinner')) $('spinner').hide();
		}
		Browser.ie4 ? onContentLoaded.delay(50) : onContentLoaded();
	},

	/*

	 Function: reloadIframe
	 Reload an iframe. Fixes an issue in Firefox when trying to use location.reload on an iframe that has been destroyed and recreated.

	 Arguments:
	 iframe - This should be both the name and the id of the iframe.

	 Syntax:
	 (start code)
	 MUI.reloadIframe(element);
	 (end)

	 Example:
	 To reload an iframe from within another iframe:
	 (start code)
	 parent.MUI.reloadIframe('myIframeName');
	 (end)

	 */
	reloadIframe: function(iframe){
		var src = $(iframe).src;
		Browser.firefox ? $(iframe).src = src : top.frames[iframe].location.reload(true);
	},

	roundedRect: function(ctx, x, y, width, height, radius, rgb, a){
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.beginPath();
		ctx.moveTo(x, y + radius);
		ctx.lineTo(x, y + height - radius);
		ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
		ctx.lineTo(x + width - radius, y + height);
		ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
		ctx.lineTo(x + width, y + radius);
		ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
		ctx.lineTo(x + radius, y);
		ctx.quadraticCurveTo(x, y, x, y + radius);
		ctx.fill();
	},

	triangle: function(ctx, x, y, width, height, rgb, a){
		ctx.beginPath();
		ctx.moveTo(x + width, y);
		ctx.lineTo(x, y + height);
		ctx.lineTo(x + width, y + height);
		ctx.closePath();
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
	},

	circle: function(ctx, x, y, diameter, rgb, a){
		ctx.beginPath();
		ctx.arc(x, y, diameter, 0, Math.PI * 2, true);
		ctx.fillStyle = 'rgba(' + rgb.join(',') + ',' + a + ')';
		ctx.fill();
	},

	notification: function(message){
		new MUI.Window({
			loadMethod: 'html',
			closeAfter: 1500,
			type: 'notification',
			addClass: 'notification',
			content: message,
			width: 220,
			height: 40,
			y: 53,
			padding:  { top: 10, right: 12, bottom: 10, left: 12 },
			shadowBlur: 5
		});
	},

	/*

	 Function: toggleEffects
	 Turn effects on and off

	 */
	toggleAdvancedEffects: function(link){
		if (!MUI.options.advancedEffects){
			MUI.options.advancedEffects = true;
			if (link){
				this.toggleAdvancedEffectsLink = new Element('div', {
					'class': 'check',
					'id': 'toggleAdvancedEffects_check'
				}).inject(link);
			}
		}
		else {
			MUI.options.advancedEffects = false;
			if (this.toggleAdvancedEffectsLink){
				this.toggleAdvancedEffectsLink.destroy();
			}
		}
	},
	/*

	 Function: toggleStandardEffects
	 Turn standard effects on and off

	 */
	toggleStandardEffects: function(link){
		if (!MUI.options.standardEffects){
			MUI.options.standardEffects = true;
			if (link){
				this.toggleStandardEffectsLink = new Element('div', {
					'class': 'check',
					'id': 'toggleStandardEffects_check'
				}).inject(link);
			}
		}
		else {
			MUI.options.standardEffects = false;
			if (this.toggleStandardEffectsLink){
				this.toggleStandardEffectsLink.destroy();
			}
		}
	},

	/*

	 The underlay is inserted directly under windows when they are being dragged or resized
	 so that the cursor is not captured by iframes or other plugins (such as Flash)
	 underneath the window.

	 */
	underlayInitialize: function(){
		var windowUnderlay = new Element('div', {
			'id': 'windowUnderlay',
			'styles': {
				'height': parent.getCoordinates().height,
				'opacity': .01,
				'display': 'none'
			}
		}).inject(document.body);
	},
	setUnderlaySize: function(){
		$('windowUnderlay').setStyle('height', parent.getCoordinates().height);
	}
});

/* 

 function: fixPNG
 Bob Osola's PngFix for IE6.

 example:
 (begin code)
 <img src="xyz.png" alt="foo" width="10" height="20" onload="fixPNG(this)">
 (end)

 note:
 You must have the image height and width attributes specified in the markup.

 */

function fixPNG(myImage){
	if (Browser.ie4 && document.body.filters){
		var imgID = (myImage.id) ? "id='" + myImage.id + "' " : "";
		var imgClass = (myImage.className) ? "class='" + myImage.className + "' " : "";
		var imgTitle = (myImage.title) ? "title='" + myImage.title + "' " : "title='" + myImage.alt + "' ";
		var imgStyle = "display:inline-block;" + myImage.style.cssText;
		myImage.outerHTML = "<span " + imgID + imgClass + imgTitle
				+ " style=\"" + "width:" + myImage.width
				+ "px; height:" + myImage.height
				+ "px;" + imgStyle + ";"
				+ "filter:progid:DXImageTransform.Microsoft.AlphaImageLoader"
				+ "(src=\'" + myImage.src + "\', sizingMethod='scale');\"></span>";
	}
}

// Blur all windows if user clicks anywhere else on the page
document.addEvent('mousedown', function(){
	MUI.blurAll.delay(50);
});

window.addEvent('domready', function(){
	MUI.underlayInitialize();
});

window.addEvent('resize', function(){
	if ($('windowUnderlay')){
		MUI.setUnderlaySize();
	}
	else {
		MUI.underlayInitialize();
	}
});

Element.implement({
	hide: function(){
		this.setStyle('display', 'none');
		return this;
	},
	show: function(){
		this.setStyle('display', 'block');
		return this;
	}
});

/*

 Shake effect by Uvumi Tools
 http://tools.uvumi.com/element-shake.html

 Function: shake

 Example:
 Shake a window.
 (start code)
 $('parametrics').shake()
 (end)

 */

Element.implement({
	shake: function(radius, duration){
		radius = radius || 3;
		duration = duration || 500;
		duration = (duration / 50).toInt() - 1;
		var parent = this.getParent();
		if (parent != $(document.body) && parent.getStyle('position') == 'static'){
			parent.setStyle('position', 'relative');
		}
		var position = this.getStyle('position');
		if (position == 'static'){
			this.setStyle('position', 'relative');
			position = 'relative';
		}
		if (Browser.ie){
			parent.setStyle('height', parent.getStyle('height'));
		}
		var coords = this.getPosition(parent);
		if (position == 'relative' && !Browser.opera){
			coords.x -= parent.getStyle('paddingLeft').toInt();
			coords.y -= parent.getStyle('paddingTop').toInt();
		}
		var morph = this.retrieve('morph');
		var oldOptions;
		if (morph){
			morph.cancel();
			oldOptions = morph.options;
		}

		this.set('morph', {
			duration:50,
			link:'chain'
		});

		for (var i = 0; i < duration; i++){
			morph.start({
				top:coords.y + Number.random(-radius, radius),
				left:coords.x + Number.random(-radius, radius)
			});
		}

		morph.start({
			top:coords.y,
			left:coords.x
		}).chain(function(){
			if (oldOptions){
				this.set('morph', oldOptions);
			}
		}.bind(this));

		return this;
	}
});

String.implement({

	parseQueryString: function(){
		var vars = this.split(/[&;]/);
		var rs = {};
		if (vars.length) vars.each(function(val){
			var keys = val.split('=');
			if (keys.length && keys.length == 2) rs[decodeURIComponent(keys[0])] = decodeURIComponent(keys[1]);
		});
		return rs;
	}

});

// Mootools Patch: Fixes issues in Safari, Chrome, and Internet Explorer caused by processing text as XML. 
Request.HTML.implement({

	processHTML: function(text){
		var match = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
		text = (match) ? match[1] : text;
		var container = new Element('div');
		return container.set('html', text);
	}

});

/*

 Examples:
 (start code)
 getCSSRule('.myRule');
 getCSSRule('#myRule');
 (end)

 */
MUI.getCSSRule = function(selector){
	for (var ii = 0; ii < document.styleSheets.length; ii++){
		var mysheet = document.styleSheets[ii];
		var myrules = mysheet.cssRules ? mysheet.cssRules : mysheet.rules;
		for (i = 0; i < myrules.length; i++){
			if (myrules[i].selectorText == selector){
				return myrules[i];
			}
		}
	}
	return false;
};

// This makes it so Request will work to some degree locally
if (location.protocol == "file:"){

	Request.implement({
		isSuccess : function(status){
			return (status == 0 || (status >= 200) && (status < 300));
		}
	});

	Browser.Request = function(){
		return $try(function(){
			return new ActiveXObject('MSXML2.XMLHTTP');
		}, function(){
			return new XMLHttpRequest();
		});
	};

}

MUI.Require = new Class({

	Implements: [Options],

	options: {
		css: [],
		images: [],
		js: []
		//onload: null
	},

	initialize: function(options){
		this.setOptions(options);
		options = this.options;

		this.assetsToLoad = options.css.length + options.images.length + options.js.length;
		this.assetsLoaded = 0;

		var cssLoaded = 0;

		// Load CSS before images and JavaScript

		if (options.css.length){
			options.css.each(function(sheet){

				this.getAsset(sheet, function(){
					if (cssLoaded == options.css.length - 1){

						if (this.assetsLoaded == this.assetsToLoad - 1){
							this.requireOnload();
						}
						else {
							// Add a little delay since we are relying on cached CSS from XHR request.
							this.assetsLoaded++;
							this.requireContinue.delay(50, this);
						}
					}
					else {
						cssLoaded++;
						this.assetsLoaded++;
					}
				}.bind(this));
			}.bind(this));
		}
		else if (!options.js.length && !options.images.length){
			this.options.onload();
			return true;
		}
		else {
			this.requireContinue.delay(50, this); // Delay is for Safari
		}

	},

	requireOnload: function(){
		this.assetsLoaded++;
		if (this.assetsLoaded == this.assetsToLoad){
			this.options.onload();
			return true;
		}

	},

	requireContinue: function(){

		var options = this.options;
		if (options.images.length){
			options.images.each(function(image){
				this.getAsset(image, this.requireOnload.bind(this));
			}.bind(this));
		}

		if (options.js.length){
			options.js.each(function(script){
				this.getAsset(script, this.requireOnload.bind(this));
			}.bind(this));
		}

	},

	getAsset: function(source, onload){

		// If the asset is loaded, fire the onload function.
		if (MUI.files[source] == 'loaded'){
			if (typeof onload == 'function'){
				onload();
			}
			return true;
		}

		// If the asset is loading, wait until it is loaded and then fire the onload function.
		// If asset doesn't load by a number of tries, fire onload anyway.
		else if (MUI.files[source] == 'loading'){
			var tries = 0;
			var checker = (function(){
				tries++;
				if (MUI.files[source] == 'loading' && tries < '100') return;
				clearInterval(checker);
				if (typeof onload == 'function'){
					onload();
				}
			}).periodical(50);
		}

		// If the asset is not yet loaded or loading, start loading the asset.
		else {
			MUI.files[source] = 'loading';

			properties = {
				'onload': onload != 'undefined' ? onload : null
			};

			// Add to the onload function
			var oldonload = properties.onload;
			properties.onload = function(){
				MUI.files[source] = 'loaded';
				if (oldonload){
					oldonload();
				}
			}.bind(this);

			switch (source.match(/\.\w+$/)[0]){
				case '.js': return Asset.javascript(source, properties);
				case '.css': return Asset.css(source, properties);
				case '.jpg':
				case '.png':
				case '.gif': return Asset.image(source, properties);
			}

			alert('The required file "' + source + '" could not be loaded');
		}
	}

});

Object.append(Asset,{

	/* Fix an Opera bug in Mootools 1.2 */
	javascript: function(source, properties){
		properties = Object.merge({
			//onload: null,
			document: document,
			check: Function.from(true)
		},properties);

		if ($(properties.id)){
			properties.onload();
			return $(properties.id);
		}

		var script = new Element('script', {'src': source, 'type': 'text/javascript'});

		var load = properties.onload.bind(script), check = properties.check, doc = properties.document;
		delete properties.onload;
		delete properties.check;
		delete properties.document;

		if (!Browser.webkit419 && !Browser.opera){
			script.addEvents({
				load: load,
				readystatechange: function(){
					if (Browser.ie && ['loaded', 'complete'].contains(this.readyState))
						load();
				}
			}).setProperties(properties);
		}
		else {
			var checker = (function(){
				if (!$try(check)) return;
				clearInterval(checker);
				// Opera has difficulty with multiple scripts being injected into the head simultaneously. We need to give it time to catch up.
				Browser.opera ? load.delay(500) : load();
			}).periodical(50);
		}
		return script.inject(doc.head);
	},

	// Get the CSS with XHR before appending it to document.head so that we can have an onload callback.
	css: function(source, properties){

		properties = Object.merge({
			id: null,
			media: 'screen'
			//onload: null
		},properties);

		new Request({
			method: 'get',
			url: source,
			onComplete: function(){
				new Element('link', {
					'id': properties.id,
					'rel': 'stylesheet',
					'media': properties.media,
					'type': 'text/css',
					'href': source
				}).inject(document.head);
				properties.onload();
			}.bind(this),
			onFailure: function(){
			},
			onSuccess: function(){
			}.bind(this)
		}).send();
	}

});

/*

 REGISTER PLUGINS

 Register Components and Plugins for Lazy Loading

 How this works may take a moment to grasp. Take a look at MUI.Window below.
 If we try to create a new Window and Window.js has not been loaded then the function
 below will run. It will load the CSS required by the MUI.Window Class and then
 then it will load Window.js. Here is the interesting part. When Window.js loads,
 it will overwrite the function below, and new MUI.Window(arg) will be ran
 again. This time it will create a new MUI.Window instance, and any future calls
 to new MUI.Window(arg) will immediately create new windows since the assets
 have already been loaded and our temporary function below has been overwritten.

 Example:

 MyPlugins.append({

 MyGadget: function(arg){
 new MUI.Require({
 css: [MUI.path.plugins + 'myGadget/css/style.css'],
 images: [MUI.path.plugins + 'myGadget/images/background.gif']
 js: [MUI.path.plugins + 'myGadget/scripts/myGadget.js'],
 onload: function(){
 new MyPlguins.MyGadget(arg);
 }
 });
 }

 });

 -------------------------------------------------------------------- */

MUI.append({

	newWindowsFromHTML: function(arg){
		new MUI.Require({
			js: [MUI.path.plugins + 'mochaui/Window/Windows-from-html.js'],
			onload: function(){
				new MUI.newWindowsFromHTML(arg);
			}
		});
	},

	newWindowsFromJSON: function(arg){
		new MUI.Require({
			js: [MUI.path.plugins + 'mochaui/Window/Windows-from-json.js'],
			onload: function(){
				new MUI.newWindowsFromJSON(arg);
			}
		});
	},

	arrangeCascade: function(){
		new MUI.Require({
			js: [MUI.path.plugins + 'mochaui/Window/Arrange-cascade.js'],
			onload: function(){
				new MUI.arrangeCascade();
			}
		});
	},

	arrangeTile: function(){
		new MUI.Require({
			js: [MUI.path.plugins + 'mochaui/Window/Arrange-tile.js'],
			onload: function(){
				new MUI.arrangeTile();
			}
		});
	},

	saveWorkspace: function(){
		new MUI.Require({
			js: [MUI.path.plugins + 'mochaui/Layout/Workspaces.js'],
			onload: function(){
				new MUI.saveWorkspace();
			}
		});
	},

	loadWorkspace: function(){
		new MUI.Require({
			js: [MUI.path.plugins + 'mochaui/Layout/Workspaces.js'],
			onload: function(){
				new MUI.loadWorkspace();
			}
		});
	},

	Themes: {
		init: function(arg){
			new MUI.Require({
				js: [MUI.path.source + 'Themes.js'],
				onload: function(){
					MUI.Themes.init(arg);
				}
			});
		}
	}

});

if (Browser.webkit){
	new MUI.Require({
		js: [MUI.path.plugins + 'mochaui/Window/WebKitShadower.js']
	});
}