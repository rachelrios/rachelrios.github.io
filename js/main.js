/**
 * main.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2016, Codrops
 * http://www.codrops.com
 */
;(function(window) {

	'use strict';

	// Helper vars and functions.
	function extend(a, b) {
		for(var key in b) {
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	}

	function createDOMEl(type, className, content) {
		var el = document.createElement(type);
		el.className = className || '';
		el.innerHTML = content || '';
		return el;
	}

	/**
	 * RevealFx obj.
	 */
	function RevealFx(el, options) {
		this.el = el;
		this.options = extend({}, this.options);
		extend(this.options, options);
		this._init();
	}

	/**
	 * RevealFx options.
	 */
	RevealFx.prototype.options = {
		// If true, then the content will be hidden until it´s "revealed".
		isContentHidden: true,
		// The animation/reveal settings. This can be set initially or passed when calling the reveal method.
		revealSettings: {
			// Animation direction: left right (lr) || right left (rl) || top bottom (tb) || bottom top (bt).
			direction: 'lr',
			// Revealer´s background color.
			bgcolor: '#f0f0f0',
			// Animation speed. This is the speed to "cover" and also "uncover" the element (seperately, not the total time).
			duration: 500,
			// Animation easing. This is the easing to "cover" and also "uncover" the element.
			easing: 'easeInOutQuint',
			// percentage-based value representing how much of the area should be left covered.
			coverArea: 0,
			// Callback for when the revealer is covering the element (halfway through of the whole animation).
			onCover: function(contentEl, revealerEl) { return false; },
			// Callback for when the animation starts (animation start).
			onStart: function(contentEl, revealerEl) { return false; },
			// Callback for when the revealer has completed uncovering (animation end).
			onComplete: function(contentEl, revealerEl) { return false; }
		}
	};

	/**
	 * Init.
	 */
	RevealFx.prototype._init = function() {
		this._layout();
	};

	/**
	 * Build the necessary structure.
	 */
	RevealFx.prototype._layout = function() {
		var position = getComputedStyle(this.el).position;
		if( position !== 'fixed' && position !== 'absolute' && position !== 'relative' ) {
			this.el.style.position = 'relative';
		}
		// Content element.
		this.content = createDOMEl('div', 'block-revealer__content', this.el.innerHTML);
		if( this.options.isContentHidden) {
			this.content.style.opacity = 0;
		}
		// Revealer element (the one that animates)
		this.revealer = createDOMEl('div', 'block-revealer__element');
		this.el.classList.add('block-revealer');
		this.el.innerHTML = '';
		this.el.appendChild(this.content);
		this.el.appendChild(this.revealer);
	};

	/**
	 * Gets the revealer element´s transform and transform origin.
	 */
	RevealFx.prototype._getTransformSettings = function(direction) {
		var val, origin, origin_2;

		switch (direction) {
			case 'lr' :
				val = 'scale3d(0,1,1)';
				origin = '0 50%';
				origin_2 = '100% 50%';
				break;
			case 'rl' :
				val = 'scale3d(0,1,1)';
				origin = '100% 50%';
				origin_2 = '0 50%';
				break;
			case 'tb' :
				val = 'scale3d(1,0,1)';
				origin = '50% 0';
				origin_2 = '50% 100%';
				break;
			case 'bt' :
				val = 'scale3d(1,0,1)';
				origin = '50% 100%';
				origin_2 = '50% 0';
				break;
			default :
				val = 'scale3d(0,1,1)';
				origin = '0 50%';
				origin_2 = '100% 50%';
				break;
		};

		return {
			// transform value.
			val: val,
			// initial and halfway/final transform origin.
			origin: {initial: origin, halfway: origin_2},
		};
	};

	/**
	 * Reveal animation. If revealSettings is passed, then it will overwrite the options.revealSettings.
	 */
	RevealFx.prototype.reveal = function(revealSettings) {
		// Do nothing if currently animating.
		if( this.isAnimating ) {
			return false;
		}
		this.isAnimating = true;

		// Set the revealer element´s transform and transform origin.
		var defaults = { // In case revealSettings is incomplete, its properties deafault to:
				duration: 500,
				easing: 'easeInOutQuint',
				delay: 0,
				bgcolor: '#f0f0f0',
				direction: 'lr',
				coverArea: 0
			},
			revealSettings = revealSettings || this.options.revealSettings,
			direction = revealSettings.direction || defaults.direction,
			transformSettings = this._getTransformSettings(direction);

		this.revealer.style.WebkitTransform = this.revealer.style.transform =  transformSettings.val;
		this.revealer.style.WebkitTransformOrigin = this.revealer.style.transformOrigin =  transformSettings.origin.initial;

		// Set the Revealer´s background color.
		this.revealer.style.backgroundColor = revealSettings.bgcolor || defaults.bgcolor;

		// Show it. By default the revealer element has opacity = 0 (CSS).
		this.revealer.style.opacity = 1;

		// Animate it.
		var self = this,
			// Second animation step.
			animationSettings_2 = {
				complete: function() {
					self.isAnimating = false;
					if( typeof revealSettings.onComplete === 'function' ) {
						revealSettings.onComplete(self.content, self.revealer);
					}
				}
			},
			// First animation step.
			animationSettings = {
				delay: revealSettings.delay || defaults.delay,
				complete: function() {
					self.revealer.style.WebkitTransformOrigin = self.revealer.style.transformOrigin = transformSettings.origin.halfway;
					if( typeof revealSettings.onCover === 'function' ) {
						revealSettings.onCover(self.content, self.revealer);
					}
					anime(animationSettings_2);
				}
			};

		animationSettings.targets = animationSettings_2.targets = this.revealer;
		animationSettings.duration = animationSettings_2.duration = revealSettings.duration || defaults.duration;
		animationSettings.easing = animationSettings_2.easing = revealSettings.easing || defaults.easing;

		var coverArea = revealSettings.coverArea || defaults.coverArea;
		if( direction === 'lr' || direction === 'rl' ) {
			animationSettings.scaleX = [0,1];
			animationSettings_2.scaleX = [1,coverArea/100];
		}
		else {
			animationSettings.scaleY = [0,1];
			animationSettings_2.scaleY = [1,coverArea/100];
		}

		if( typeof revealSettings.onStart === 'function' ) {
			revealSettings.onStart(self.content, self.revealer);
		}
		anime(animationSettings);
	};

	window.RevealFx = RevealFx;

})(window);
/**
 * main.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2017, Codrops
 * http://www.codrops.com
 */
;(function(window) {

	'use strict';

	/**
	 * StackFx: The parent class.
	 */
	function StackFx(el) {
		this.DOM = {};
		this.DOM.el = el;
		this.DOM.stack = this.DOM.el.querySelector('.stack');
		this.DOM.stackItems = [].slice.call(this.DOM.stack.children);
		this.totalItems = this.DOM.stackItems.length;
		this.DOM.img = this.DOM.stack.querySelector('.stack__figure > .stack__img');
		this.DOM.caption = this.DOM.el.querySelector('.grid__item-caption');
		this.DOM.title = this.DOM.caption.querySelector('.grid__item-title');
		this.DOM.columns = {left: this.DOM.caption.querySelector('.column--left'), right: this.DOM.caption.querySelector('.column--right')};
	}

	StackFx.prototype._removeAnimeTargets = function() {
		anime.remove(this.DOM.stackItems);
		anime.remove(this.DOM.img);
		anime.remove(this.DOM.title);
		anime.remove(this.DOM.columns.left);
		anime.remove(this.DOM.columns.right);
	};

	/************************************************************************
	 * VegaFx.
	 ************************************************************************/
	function VegaFx(el) {
		StackFx.call(this, el);
		this._initEvents();
	}

	VegaFx.prototype = Object.create(StackFx.prototype);
	VegaFx.prototype.constructor = VegaFx;

	VegaFx.prototype._initEvents = function() {
		var self = this;
		this._mouseenterFn = function() {
			self._removeAnimeTargets();
			self._in();
		};
		this._mouseleaveFn = function() {
			self._removeAnimeTargets();
			self._out();
		};
		this.DOM.stack.addEventListener('mouseenter', this._mouseenterFn);
		this.DOM.stack.addEventListener('mouseleave', this._mouseleaveFn);
	};

	VegaFx.prototype._in = function() {
		var self = this;

		this.DOM.stackItems.map(function(e, i) {
			e.style.opacity = i !== self.totalItems - 1 ? 0.2*i+0.2 : 1
		});

		anime({
			targets: this.DOM.stackItems,
			translateZ: [
				{
					value: function(target, index) {
						return index*8 + 8;
					},
					duration: 200 ,
					easing: [0.42,0,1,1]
				},
				{
					value: function(target, index) {
						return index*20 + 20;
					},
					duration: 700,
					easing: [0.2,1,0.3,1]
				}
			],
			rotateX: [
				{
					value: function(target, index) {
						return -1 * (index*2 + 2);
					},
					duration: 200,
					easing: [0.42,0,1,1]
				},
				{
					value: 0,
					duration: 700,
					easing: [0.2,1,0.3,1]
				}
			]
		});

		anime({
			targets: this.DOM.img,
			duration: 900,
			easing: [0.2,1,0.3,1],
			scale: 0.7
		});

		anime({
			targets: this.DOM.title,
			translateY: {
				value: [35,0],
				duration: 500,
				easing: [0.5,1,0.3,1]
			},
			opacity: {
				value: [0,1],
				duration: 400,
				easing: 'linear'
			}
		});

		anime({
			targets: [this.DOM.columns.left, this.DOM.columns.right],
			translateY: [
				{
					value: function(target, index) {
						return index === 0 ? [40,0] : [60,0];
					},
					duration: 500,
					easing: [0.5,1,0.3,1],
					delay: 100
				}
			],
			opacity: [
				{value: [0,0], duration: 1, easing: 'linear'},
				{value: 1, delay: 100, duration: 400, easing: 'linear'}
			]
		});
	};

	VegaFx.prototype._out = function() {
		var self = this;

		anime({
			targets: this.DOM.stackItems,
			translateZ: [
				{
					value: function(target, index) {
						return index * 20 + 20 - 8;
					},
					duration: 200 ,
					easing: [0.42,0,1,1]
				},
				{
					value: 0,
					duration: 900,
					easing: [0.2,1,0.3,1]
				}
			],
			rotateX: [
				{
					value: function(target, index) {
						return index*2 + 2;
					},
					duration: 200,
					easing: [0.42,0,1,1]
				},
				{
					value: 0,
					duration: 900,
					easing: [0.2,1,0.3,1]
				}
			],
			opacity: {
				value: function(target, index, cnt) {
					return index !== cnt - 1 ? 0 : 1
				},
				duration: 900,
				delay: 200,
				easing: [0.2,1,0.3,1]
			}
		});

		anime({
			targets: this.DOM.img,
			duration: 900,
			easing: [0.2,1,0.3,1],
			scale: 1
		});

		anime({
			targets: this.DOM.title,
			duration: 750,
			easing: [0.2,1,0.3,1],
			translateY: 0,
			opacity: 1
		});

		anime({
			targets: [this.DOM.columns.left, this.DOM.columns.right],
			duration: 750,
			easing: [0.2,1,0.3,1],
			translateY: 0,
			opacity: 1
		});
	};

	window.VegaFx = VegaFx;

	/************************************************************************
	 * CastorFx.
	 ************************************************************************/
	function CastorFx(el) {
		StackFx.call(this, el);
		this._initEvents();
	}

	CastorFx.prototype = Object.create(StackFx.prototype);
	CastorFx.prototype.constructor = CastorFx;

	CastorFx.prototype._initEvents = function() {
		var self = this;
		this._mouseenterFn = function() {
			self._removeAnimeTargets();
			self._in();
		};
		this._mouseleaveFn = function() {
			self._removeAnimeTargets();
			self._out();
		};
		this.DOM.stack.addEventListener('mouseenter', this._mouseenterFn);
		this.DOM.stack.addEventListener('mouseleave', this._mouseleaveFn);
	};

	CastorFx.prototype._in = function() {
		var self = this;

		anime({
			targets: this.DOM.stackItems,
			rotateX: {
				value: function(target, index, cnt) {
					return index === cnt - 1 ? 0 : [70, 0];
				},
				duration: 1000,
				easing: 'easeOutExpo'
			},
			translateZ: {
				value: function(target, index, cnt) {
					return index === cnt - 1 ? index*20 : [-300, index*20];
				},
				duration: 1000,
				easing: 'easeOutExpo'
			},
			opacity: {
				value: function(target, index, cnt) {
					return index === cnt - 1 ? 1 : [0,0.2*index+0.2];
				},
				duration: 1000,
				easing: 'linear'
			},
			delay: function(target, index, cnt) {
				return (cnt-index-1)*100
			}
		});

		anime({
			targets: this.DOM.img,
			duration: 1000,
			easing: 'easeOutExpo',
			scale: 0.7
		});

		anime({
			targets: this.DOM.title,
			duration: 1000,
			easing: 'easeOutExpo',
			translateZ: 30
		});
	};

	CastorFx.prototype._out = function() {
		var self = this;

		anime({
			targets: this.DOM.stackItems,
			duration: 1000,
			easing: 'easeOutExpo',
			translateZ: 0,
			opacity: function(target, index, cnt) {
				return index !== cnt - 1 ? 0 : 1
			}
		});

		anime({
			targets: this.DOM.img,
			duration: 1000,
			easing: 'easeOutExpo',
			scale: 1
		});

		anime({
			targets: this.DOM.title,
			duration: 1000,
			easing: 'easeOutExpo',
			translateZ: 0
		});

		anime({
			targets: [this.DOM.columns.left, this.DOM.columns.right],
			duration: 500,
			easing: 'easeOutExpo',
			delay: function(target, index) {
				return index === 0 ? 150 : 200;
			},
			translateX: 0,
			translateY: 0
		});
	};

	window.CastorFx = CastorFx;

	/************************************************************************
	 * HamalFx.
	 ************************************************************************/
	function HamalFx(el) {
		StackFx.call(this, el);
		this._initEvents();
	}

	HamalFx.prototype = Object.create(StackFx.prototype);
	HamalFx.prototype.constructor = HamalFx;

	HamalFx.prototype._initEvents = function() {
		var self = this;
		this._mouseenterFn = function() {
			self._removeAnimeTargets();
			self._in();
		};
		this._mouseleaveFn = function() {
			self._removeAnimeTargets();
			self._out();
		};
		this.DOM.stack.addEventListener('mouseenter', this._mouseenterFn);
		this.DOM.stack.addEventListener('mouseleave', this._mouseleaveFn);
	};

	HamalFx.prototype._in = function() {
		var self = this;

		this.DOM.stackItems.map(function(e, i) {
			e.style.opacity = i !== self.totalItems - 1 ? 0.2*i+0.2 : 1
		});

		anime({
			targets: this.DOM.stackItems,
			duration: 1000,
			easing: 'easeOutExpo',
			translateY: function(target, index) {
				return -1*index*5;
			},
			rotate: function(target, index, cnt) {
				if( index === cnt - 1 ) {
					return 0;
				}
				else {
					return index%2 ? (cnt-index)*1 : -1*(cnt-index)*1;
				}
			},
			scale: function(target, index, cnt) {
				if( index === cnt - 1 ) {
					return 1;
				}
				else {
					return 1.05;
				}
			},
			delay: function(target, index, cnt) {
				return (cnt-index-1)*30
			}
		});

		anime({
			targets: this.DOM.img,
			duration: 1000,
			easing: 'easeOutExpo',
			scale: 0.7
		});

		anime({
			targets: [this.DOM.columns.left, this.DOM.columns.right],
			duration: 1000,
			easing: 'easeOutExpo',
			translateX: function(target, index) {
				return index === 0 ? -30 : 30;
			}
		});

	};

	HamalFx.prototype._out = function() {
		var self = this;

		anime({
			targets: this.DOM.stackItems,
			duration: 500,
			easing: 'easeOutExpo',
			translateY: 0,
			rotate: 0,
			scale: 1,
			opacity: function(target, index, cnt) {
				return index !== cnt - 1 ? 0 : 1
			}
		});

		anime({
			targets: this.DOM.img,
			duration: 1000,
			easing: 'easeOutElastic',
			scale: 1
		});

		anime({
			targets: [this.DOM.columns.left, this.DOM.columns.right],
			duration: 500,
			easing: 'easeOutExpo',
			translateX: 0
		});
	};

	window.HamalFx = HamalFx;

	/************************************************************************
	 * PolarisFx.
	 ************************************************************************/
	function PolarisFx(el) {
		StackFx.call(this, el);
		this._initEvents();
	}

	PolarisFx.prototype = Object.create(StackFx.prototype);
	PolarisFx.prototype.constructor = PolarisFx;

	PolarisFx.prototype._initEvents = function() {
		var self = this;
		this._mouseenterFn = function() {
			self._removeAnimeTargets();
			self._in();
		};
		this._mouseleaveFn = function() {
			self._removeAnimeTargets();
			self._out();
		};
		this.DOM.stack.addEventListener('mouseenter', this._mouseenterFn);
		this.DOM.stack.addEventListener('mouseleave', this._mouseleaveFn);
	};

	PolarisFx.prototype._in = function() {
		var self = this;

		this.DOM.stackItems.map(function(e, i) {
			e.style.opacity = i !== self.totalItems - 1 ? 0.2*i+0.2 : 1
		});

		anime({
			targets: this.DOM.stackItems,
			duration: 1000,
			easing: 'easeOutElastic',
			translateZ: function(target, index) {
				return index*10;
			},
			delay: function(target, index, cnt) {
				return (cnt-index-1)*20
			}
		});

		anime({
			targets: this.DOM.img,
			duration: 500,
			easing: 'easeOutExpo',
			scale: 0.7
		});

		anime({
			targets: this.DOM.title,
			duration: 1000,
			easing: 'easeOutElastic',
			translateZ: 30
		});

		anime({
			targets: [this.DOM.columns.left, this.DOM.columns.right],
			duration: 1000,
			easing: 'easeOutElastic',
			translateX: function(target, index) {
				return index === 0 ? -30 : 30;
			},
			translateY: 30
		});
	};

	PolarisFx.prototype._out = function() {
		var self = this;

		anime({
			targets: this.DOM.stackItems,
			duration: 1000,
			easing: 'easeOutExpo',
			translateZ: 0,
			opacity: function(target, index, cnt) {
				return index !== cnt - 1 ? 0 : 1
			}
		});

		anime({
			targets: this.DOM.img,
			duration: 1000,
			easing: 'easeOutExpo',
			scale: 1
		});

		anime({
			targets: this.DOM.title,
			duration: 500,
			delay: 100,
			easing: 'easeOutExpo',
			translateZ: 0
		});

		anime({
			targets: [this.DOM.columns.left, this.DOM.columns.right],
			duration: 500,
			easing: 'easeOutExpo',
			delay: function(target, index) {
				return index === 0 ? 150 : 200;
			},
			translateX: 0,
			translateY: 0
		});
	};

	window.PolarisFx = PolarisFx;

	/************************************************************************
	 * AlphardFx.
	 ************************************************************************/
	function AlphardFx(el) {
		StackFx.call(this, el);
		this._initEvents();
	}

	AlphardFx.prototype = Object.create(StackFx.prototype);
	AlphardFx.prototype.constructor = AlphardFx;

	AlphardFx.prototype._initEvents = function() {
		var self = this;
		this._mouseenterFn = function() {
			self._removeAnimeTargets();
			self._in();
		};
		this._mouseleaveFn = function() {
			self._removeAnimeTargets();
			self._out();
		};
		this.DOM.stack.addEventListener('mouseenter', this._mouseenterFn);
		this.DOM.stack.addEventListener('mouseleave', this._mouseleaveFn);
	};

	AlphardFx.prototype._in = function() {
		var self = this;

		this.DOM.stackItems.map(function(e, i) {
			e.style.opacity = i !== self.totalItems - 1 ? 0.2*i+0.2 : 1
		});

		anime({
			targets: this.DOM.stackItems,
			opacity: {
				value: function(target, index, cnt) {
					return index !== cnt - 1 ? [0,0.2*index+0.2] : 1
				},
				duration: 1,
				easing: 'linear',
				delay: function(target, index, cnt) {
					return (cnt-index-1)*30 + 250
				}
			},
			rotate: [
				{
					value: 12,
					duration: 250,
					easing: 'easeOutQuad'
				},
				{
					value: function(target, index) {
						return -1*index*3 - 3;
					},
					duration: 1000,
					easing: 'easeOutExpo'
				}
			],
			delay: function(target, index, cnt) {
				return (cnt-index-1)*30
			}
		});

		anime({
			targets: this.DOM.img,
			rotate: [
				{
					value: [0,12],
					duration: 250,
					easing: 'easeOutQuad',
				},
				{
					value: [12,0],
					duration: 1200,
					delay: 50,
					easing: 'easeOutExpo',
				}
			]
		});

		anime({
			targets: [this.DOM.columns.left, this.DOM.columns.right],
			duration: 500,
			easing: 'easeOutExpo',
			translateY: function(target, index) {
				return index === 0 ? -5 : 5;
			}
		});
	};

	AlphardFx.prototype._out = function() {
		var self = this;

		anime({
			targets: this.DOM.stackItems,
			duration: 500,
			easing: 'easeOutExpo',
			rotate: 0,
			opacity: function(target, index, cnt) {
				return index !== cnt - 1 ? 0 : 1
			}
		});

		anime({
			targets: this.DOM.img,
			duration: 1000,
			easing: 'easeOutExpo',
			rotate: 1
		});

		anime({
			targets: [this.DOM.columns.left, this.DOM.columns.right],
			duration: 500,
			easing: 'easeOutExpo',
			translateY: 0
		});
	};

	window.AlphardFx = AlphardFx;

	/************************************************************************
	 * AltairFx.
	 ************************************************************************/
	function AltairFx(el) {
		StackFx.call(this, el);
		this._initEvents();
	}

	AltairFx.prototype = Object.create(StackFx.prototype);
	AltairFx.prototype.constructor = AltairFx;

	AltairFx.prototype._initEvents = function() {
		var self = this;
		this._mouseenterFn = function() {
			self._removeAnimeTargets();
			self._in();
		};
		this._mouseleaveFn = function() {
			self._removeAnimeTargets();
			self._out();
		};
		this.DOM.stack.addEventListener('mouseenter', this._mouseenterFn);
		this.DOM.stack.addEventListener('mouseleave', this._mouseleaveFn);
	};

	AltairFx.prototype._in = function() {
		var self = this;

		this.DOM.stackItems.map(function(e, i) {
			e.style.opacity = i !== self.totalItems - 1 ? 0.2*i+0.2 : 1
		});

		anime({
			targets: this.DOM.stackItems,
			duration: 1000,
			easing: 'easeOutElastic',
			translateZ: function(target, index, cnt) {
				return index*3;
			},
			rotateX: function(target, index, cnt) {
				return -1*index*4;
			},
			delay: function(target, index, cnt) {
				return (cnt-index-1)*30
			}
		});

		anime({
			targets: this.DOM.img,
			duration: 500,
			easing: 'easeOutExpo',
			scale: 0.7
		});

		anime({
			targets: this.DOM.title,
			duration: 1000,
			easing: 'easeOutElastic',
			translateY: 20
		});

		anime({
			targets: [this.DOM.columns.left, this.DOM.columns.right],
			duration: 1000,
			easing: 'easeOutElastic',
			translateY: function(target, index) {
				return index === 0 ? 30 : 20;
			}
		});
	};

	AltairFx.prototype._out = function() {
		var self = this;

		anime({
			targets: this.DOM.stackItems,
			duration: 500,
			easing: 'easeOutExpo',
			opacity: function(target, index, cnt) {
				return index !== cnt - 1 ? 0 : 1
			},
			translateZ: 0,
			rotateX: 0
		});

		anime({
			targets: this.DOM.img,
			duration: 500,
			easing: 'easeOutExpo',
			scale: 1
		});

		anime({
			targets: [this.DOM.columns.left, this.DOM.columns.right, this.DOM.title],
			duration: 500,
			easing: 'easeOutExpo',
			translateY: 0
		});
	};

	window.AltairFx = AltairFx;

	/************************************************************************
	 * RigelFx.
	 ************************************************************************/
	function RigelFx(el) {
		StackFx.call(this, el);
		this._initEvents();
	}

	RigelFx.prototype = Object.create(StackFx.prototype);
	RigelFx.prototype.constructor = RigelFx;

	RigelFx.prototype._initEvents = function() {
		var self = this;
		this._mouseenterFn = function() {
			self._removeAnimeTargets();
			self._in();
		};
		this._mouseleaveFn = function() {
			self._removeAnimeTargets();
			self._out();
		};
		this.DOM.stack.addEventListener('mouseenter', this._mouseenterFn);
		this.DOM.stack.addEventListener('mouseleave', this._mouseleaveFn);
	};

	RigelFx.prototype._in = function() {
		var self = this;

		anime({
			targets: this.DOM.stackItems,
			translateZ: {
				value: function(target, index) {
					return index*10;
				},
				duration: 800,
				easing: 'easeOutExpo',
				delay: 200
			},
			opacity: {
				value: function(target, index, cnt) {
					return index !== cnt - 1 ? [0,0.1*index+0.1] : 1
				},
				duration: 1,
				easing: 'linear',
				delay: 200
			},
			translateY: [
				{
					value: function(target, index) {
						return -1*index*10;
					},
					duration: 800,
					delay: 200,
					elasticity: 300
				},
			],
			scaleY: [
				{
					value: 0.8,
					duration: 200,
					easing: 'easeOutExpo'
				},
				{
					value: 1,
					duration: 800,
					elasticity: 300
				}
			],
			scaleX: [
				{
					value: 1.1,
					duration: 200,
					easing: 'easeOutExpo'
				},
				{
					value: 1,
					duration: 800,
					elasticity: 300
				}
			]
		});

		anime({
			targets: this.DOM.img,
			duration: 900,
			easing: 'easeOutExpo',
			delay: 200,
			scale: 0.7
		});

		anime({
			targets: this.DOM.title,
			translateY: {
				value: [200,0],
				duration: 800,
				easing: 'easeOutExpo',
			},
			opacity: {
				value: [0,1],
				duration: 400,
				delay: 200,
				easing: 'linear'
			}
		});

		anime({
			targets: [this.DOM.columns.left, this.DOM.columns.right],
			translateY: [
				{
					value: [60,0],
					duration: 800,
					easing: 'easeOutExpo',
					delay: 200
				}
			],
			opacity: [
				{value: [0,0], duration: 1, easing: 'linear'},
				{value: 1, delay: 300, duration: 400, easing: 'linear'}
			]
		});
	};

	RigelFx.prototype._out = function() {
		var self = this;

		anime({
			targets: this.DOM.stackItems,
			duration: 800,
			easing: 'easeOutElastic',
			translateZ: 0,
			opacity: function(target, index, cnt) {
				return index !== cnt - 1 ? 0 : 1
			},
			translateY: 0
		});

		anime({
			targets: this.DOM.img,
			duration: 800,
			easing: 'easeOutElastic',
			scale: 1
		});

		anime({
			targets: this.DOM.title,
			duration: 800,
			easing: 'easeOutExpo',
			translateY: 0,
			opacity: 1
		});

		anime({
			targets: [this.DOM.columns.left, this.DOM.columns.right],
			duration: 800,
			easing: 'easeOutExpo',
			translateY: 0,
			opacity: 1
		});
	};

	window.RigelFx = RigelFx;

	/************************************************************************
	 * CanopusFx.
	 ************************************************************************/
	function CanopusFx(el) {
		StackFx.call(this, el);
		this._initEvents();
	}

	CanopusFx.prototype = Object.create(StackFx.prototype);
	CanopusFx.prototype.constructor = CanopusFx;

	CanopusFx.prototype._initEvents = function() {
		var self = this;
		this._mouseenterFn = function() {
			self._removeAnimeTargets();
			self._in();
		};
		this._mouseleaveFn = function() {
			self._removeAnimeTargets();
			self._out();
		};
		this.DOM.stack.addEventListener('mouseenter', this._mouseenterFn);
		this.DOM.stack.addEventListener('mouseleave', this._mouseleaveFn);
	};

	CanopusFx.prototype._in = function() {
		var self = this;

		this.DOM.stackItems.map(function(e, i) {
			e.style.opacity = i !== self.totalItems - 1 ? 0 : 1
		});

		var self = this;
		anime({
			targets: this.DOM.stackItems,
			translateZ: {
				value: function(target, index, cnt) {
					return -1*(cnt-index-1)*20;
				},
				duration: 800,
				easing: 'easeOutExpo',
				delay: function(target, index, cnt) {
					return (cnt-index-1)*70 + 200;
				}
			},
			translateY: [
				{
					value: function(target, index) {
						return -1*index*20 - 30;
					},
					duration: 800,
					delay: function(target, index, cnt) {
						return (cnt-index-1)*70 + 200;
					},
					elasticity: 500
				},
			],
			scaleY: [
				{
					value: function(target, index, cnt) {
						return index === cnt-1 ? 0.6 : 1;
					},
					duration: 200,
					easing: 'easeOutExpo'
				},
				{
					value: 0.8,
					duration: 800,
					elasticity: 450
				}
			],
			scaleX: [
				{
					value: function(target, index, cnt) {
						return index === cnt-1 ? 1.1 : 1;
					},
					duration: 200,
					easing: 'easeOutExpo'
				},
				{
					value: 0.8,
					duration: 800,
					elasticity: 300
				}
			],
			opacity: {
				value: function(target, index, cnt) {
					return index === cnt-1 ? 1 : [0,0.2*index+0.2];
				},
				duration: 200,
				easing: 'linear',
				delay: function(target, index, cnt) {
					return (cnt-index-1)*70 + 200;
				}
			}
		});

		anime({
			targets: this.DOM.img,
			scale: [
				{
					value: 1.8,
					duration: 200,
					easing: 'easeOutExpo'
				},
				{
					value: 0.7,
					duration: 1100,
					easing: 'easeOutExpo'
				}
			]
		});

		anime({
			targets: [this.DOM.title, this.DOM.columns.left, this.DOM.columns.right],
			duration: 1000,
			easing: 'easeOutElastic',
			translateY: -30,
			delay: 200
		});
	};

	CanopusFx.prototype._out = function() {
		var self = this;

		anime({
			targets: this.DOM.stackItems,
			duration: 500,
			easing: 'easeOutExpo',
			translateZ: 0,
			translateY: 0,
			scaleY: 1,
			scaleX: 1,
			opacity: function(target, index, cnt) {
				return index !== cnt - 1 ? 0 : 1
			}
		});

		anime({
			targets: this.DOM.img,
			duration: 500,
			easing: 'easeOutExpo',
			scale: 1
		});

		anime({
			targets: [this.DOM.title, this.DOM.columns.left, this.DOM.columns.right],
			duration: 500,
			easing: 'easeOutExpo',
			translateY: 0
		});
	};

	window.CanopusFx = CanopusFx;

	/************************************************************************
	 * PolluxFx.
	 ************************************************************************/
	function PolluxFx(el) {
		StackFx.call(this, el);
		this._initEvents();
	}

	PolluxFx.prototype = Object.create(StackFx.prototype);
	PolluxFx.prototype.constructor = PolluxFx;

	PolluxFx.prototype._initEvents = function() {
		var self = this;
		this._mouseenterFn = function() {
			self._removeAnimeTargets();
			self._in();
		};
		this._mouseleaveFn = function() {
			self._removeAnimeTargets();
			self._out();
		};
		this.DOM.stack.addEventListener('mouseenter', this._mouseenterFn);
		this.DOM.stack.addEventListener('mouseleave', this._mouseleaveFn);
	};

	PolluxFx.prototype._in = function() {
		var self = this;

		anime({
			targets: this.DOM.stackItems,
			duration: 1000,
			opacity: {
				value: function(target, index, cnt) {
					return index !== cnt - 1 ? [0,0.1*index+0.1] : 1
				},
				easing: 'linear',
				delay: function(target, index, cnt) {
					return (cnt-index-1)*60;
				}
			},
			translateY: {
				value: function(target, index) {
					return -1*index*10;
				},
				easing: 'easeInOutCubic'
			},
			rotateX: {
				value: 80,
				easing: 'easeInOutCubic'
			},
			rotateZ: {
				value: 360,
				easing: 'easeInOutCubic',
				delay: function(target, index, cnt) {
					return (cnt-index-1)*60;
				}
			}
		});

		anime({
			targets: this.DOM.img,
			duration: 1000,
			easing: 'easeInOutCubic',
			scale: 0.7
		});

		anime({
			targets: this.DOM.title,
			rotate: [
				{
					value: [0,10],
					duration: 300,
					delay: 300,
					easing: 'easeOutCubic',
				},
				{
					value: [-20,0],
					duration: 300,
					easing: 'easeOutCubic',
				}
			],
			opacity: [
				{
					value: [1,0],
					duration: 100,
					delay: 300,
					easing: 'easeOutCubic'
				},
				{
					value: [0,1],
					duration: 100,
					delay: 300,
					easing: 'easeOutCubic'
				}
			]
		});
	};

	PolluxFx.prototype._out = function() {
		var self = this;

		anime({
			targets: this.DOM.stackItems,
			duration: 1000,
			opacity: {
				value: function(target, index, cnt) {
					return index !== cnt - 1 ? 0 : 1
				},
				easing: 'linear',
				delay: function(target, index) {
					return index*60;
				},
			},
			translateY: {
				value: 0,
				easing: 'easeInOutCubic'
			},
			rotateX: {
				value: 0,
				easing: 'easeInOutCubic'
			},
			rotateZ: {
				value: 0,
				easing: 'easeInOutCubic',
				delay: function(target, index, cnt) {
					return (cnt-index-1)*60;
				}
			}
		});

		anime({
			targets: this.DOM.img,
			duration: 1000,
			easing: 'easeInOutCubic',
			scale: 1
		});

		anime({
			targets: this.DOM.title,
			duration: 1000,
			easing: 'easeInOutCubic',
			rotate: 0,
			opacity: 1
		});
	};

	window.PolluxFx = PolluxFx;

	/************************************************************************
	 * DenebFx.
	 ************************************************************************/
	function DenebFx(el) {
		StackFx.call(this, el);
		this._initEvents();
	}

	DenebFx.prototype = Object.create(StackFx.prototype);
	DenebFx.prototype.constructor = DenebFx;

	DenebFx.prototype._initEvents = function() {
		var self = this;
		this._mouseenterFn = function() {
			self._removeAnimeTargets();
			self._in();
		};
		this._mouseleaveFn = function() {
			self._removeAnimeTargets();
			self._out();
		};
		this.DOM.stack.addEventListener('mouseenter', this._mouseenterFn);
		this.DOM.stack.addEventListener('mouseleave', this._mouseleaveFn);
	};

	DenebFx.prototype._in = function() {
		var self = this;

		anime({
			targets: this.DOM.stackItems,
			duration: 1000,
			easing: [0.2,1,0.3,1],
			rotate: 360,
			opacity: function(target, index, cnt) {
				return index !== cnt - 1 ? [0,0.1*index+0.1] : 1
			},
			delay: function(target, index, cnt) {
				return (cnt-index-1)*30;
			}
		});

		anime({
			targets: this.DOM.img,
			duration: 1100,
			delay: 20,
			easing: [0.2,1,0.3,1],
			scale: 0.7,
			rotate: 360
		});

		anime({
			targets: [this.DOM.columns.left, this.DOM.columns.right],
			duration: 650,
			delay: 400,
			easing: [0.2,1,0.3,1],
			rotate: [-20,0],
			opacity: 1
		});
	};

	DenebFx.prototype._out = function() {
		var self = this;

		anime({
			targets: this.DOM.stackItems,
			duration: 1000,
			easing: [0.2,1,0.3,1],
			rotate: 0,
			opacity: function(target, index, cnt) {
				return index !== cnt - 1 ? [0,0.1*index+0.1] : 1
			},
			delay: function(target, index, cnt) {
				return (cnt-index-1)*30;
			}
		});

		anime({
			targets: this.DOM.img,
			duration: 1750,
			easing: [0.2,1,0.3,1],
			scale: 1,
			rotate: 0
		});

		anime({
			targets: [this.DOM.columns.left, this.DOM.columns.right],
			duration: 400,
			easing: 'easeInCubic',
			rotate: [0,-10],
			opacity: 0
		});
	};

	window.DenebFx = DenebFx;

})(window);
