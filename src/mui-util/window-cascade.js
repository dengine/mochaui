/*
 ---

 name: Arrange-cascade

 script: Arrange-cascade.js

 description: MUI - Cascade windows.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [MUI.arrangeCascade]
 ...
 */

MUI.files[MUI.path.plugins + 'MUI/Window/arrange-cascade.js'] = 'loaded';

MUI.extend({

	arrangeCascade: function(){

		var viewportTopOffset = 30;    // Use a negative number if neccessary to place first window where you want it
		var viewportLeftOffset = 20;
		var windowTopOffset = 50;    // Initial vertical spacing of each window
		var windowLeftOffset = 40;

		// See how much space we have to work with
		var coordinates = document.getCoordinates();

		var openWindows = 0;
		MUI.each(function(instance){
			if (instance.className != 'MUI.Window') return;
			if (!instance.isMinimized && instance.options.draggable) openWindows ++;
		});

		if ((windowTopOffset * (openWindows + 1)) >= (coordinates.height - viewportTopOffset)){
			var topOffset = (coordinates.height - viewportTopOffset) / (openWindows + 1);
		}
		else {
			var topOffset = windowTopOffset;
		}

		if ((windowLeftOffset * (openWindows + 1)) >= (coordinates.width - viewportLeftOffset - 20)){
			var leftOffset = (coordinates.width - viewportLeftOffset - 20) / (openWindows + 1);
		}
		else {
			var leftOffset = windowLeftOffset;
		}

		var x = viewportLeftOffset;
		var y = viewportTopOffset;
		$$('.mocha').each(function(windowEl){
			var instance = windowEl.retrieve('instance');
			if (!instance.isMinimized && !instance.isMaximized && instance.options.draggable){
				id = windowEl.id;
				MUI.focusWindow(windowEl);
				x += leftOffset;
				y += topOffset;

				if (MUI.options.advancedEffects == false){
					windowEl.setStyles({
						'top': y,
						'left': x
					});
				}
				else {
					var cascadeMorph = new Fx.Morph(windowEl, {
						'duration': 550
					});
					cascadeMorph.start({
						'top': y,
						'left': x
					});
				}
			}
		}.bind(this));
	}

});
