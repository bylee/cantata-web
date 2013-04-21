( function() {
	/* Utils */

	endsWith = function( str, checker ) { 
		if ( str != null && checker != null && str.length >= checker.length ) { 
			if( str.substr( str.length - checker.length ) == checker ) { 
				return true;
			} else {
				return false;
			}   
		} else {
			return false;
		}   
	};

	startsWith = function( str, checker ) { 
		if ( str != null && checker != null && str.length >= checker.length ) { 
			if ( 0 == checker.length ) {
				return true;
			}
			if ( str.substr( 0, checker.toUpperCase().length ) == checker ) { 
				return true;
			} else {
				return false;
			}   
		} else {
			return false;
		}   
	};
	addPath = function( path1, path2 ) { 
		if ( ! path1 ) { 
			path1 = '';
		} else if ( ! path2 ) { 
			path2 = '';
		}   

		if ( endsWith( path1, '/' ) ) { 
			return addPath( path1.substr( 0, path1.length - 1 ), path2 );
		} else if ( startsWith( path2, '/' ) ) { 
			return addPath( path1, path2.substr( 1 ) );
		} else {
			return path1 + '/' + path2;
		}   
	};

	getFilenameFrom = function( path ) { 
		var index = path.lastIndexOf( '/' );
		if ( index < 0 ) { 
			return path;
		}   

		return path.substr( index + 1 );
	};

	getParentFrom = function( path ) { 
		var index = path.lastIndexOf( '/' );
		if ( index <= 0 ) { 
			return '/';
		}   

		return path.substr( 0, index );
	}

	/* MVC Object */
	Model = Backbone.Model.extend( {
	} );
	Model.bind( 'remove', function() { this.destroy(); } );

	Collection = Backbone.Collection.extend( {
	} );

	View = function( options ) {
		this.bindings = [];
		Backbone.View.apply( this, [ options ] );
	}
	_.extend( View.prototype, Backbone.View.prototype, {
		initialize: function() {
			console.log( this.cid + ' created', this );
			this.model = this.model || new Model();
			this.prototype = this.prototype || {};
			if ( !( this.prototype.template ) ) {
				if ( this['template-id'] ) {
					var tmplId = '#' + this['template-id'];
					var tmpl = $( tmplId ).html().trim();
					console.log( 'Template :' + tmplId, tmpl );
					this.prototype.template = _.template( tmpl );

					this.$el = $( this.prototype.template( this.model.toJSON() ) );
				}
			} else {
				this.$el = $( this.prototype.template( this.model.toJSON() ) );
			}
			_.each( this.elements, function( element ) { 
				console.log( element );
				this['$' + element] = this.$el.find( '*' ).andSelf().filter( '#' + element );
				console.log( this['$' + element] );
			}, this );
			this.$el.attr( 'data-view-cid', this.cid );

			_.bindAll( this );
			if ( this.init ) {
				this.init();
			}
			this.bindTo( this.model, 'reset', this.render );
			this.bindTo( this.model, 'destroy', this.dispose );
			if ( this.initEvent ) {
				this.initEvent();
			}
		},
		render: function() {
			return this;
		},
		bindTo: function ( model, ev, callback ) {
			model.bind( ev, callback, this );
			if ( !( this.bindings ) ) {

			}
			this.bindings.push( { model: model, ev: ev, callback: callback } );
		},

		unbindFromAll: function () {
			if ( this.bindings ) {
				_.each(this.bindings, function ( binding ) {
					binding.model.unbind( binding.ev, binding.callback );
				});
			}
			this.bindings = [];
		},

		dispose: function() {
			this.remove();
			this.model.unbind( 'reset', this.render );
			this.unbind();
		}
	} );
	View.extend = Backbone.View.extend;

	Widget = Model.extend( {
		initialize: function() {
		},

		isLoaded: function() {
			return this.loaded;
		},
		parse: function( model ) {
			this.loaded = true;
			return model;
		}
	} );

	WidgetView = View.extend( {
		render: function() {
			if ( !this.model.isLoaded() ) {
				return this;
			}
			return this;
		},
	} );

	BasicWidget = Widget.extend( {
	} );

	BasicWidgetView = WidgetView.extend( {
		'template-id':	'tmpl-basic-widget',
		'elements': [ 'setting' ],
		initEvent: function() {
			this.$setting.click( this.onClickSetting );
		},
		onClickSetting: function() {
			new SettingPopup( { model: this.options.parent.model.get( 'setting' ) } ).open();
		}
	} );

	Setting = Model.extend( {
	} );
	SettingPopup = View.extend( {
		'template-id': 'tmpl-setting-popup',
		init: function( options ) {
			this.$curton = $( '#curton' );
			this.$curton.css( { visibility: 'visible' } );
			this.$curton.append( this.$el );
		},
		open: function() {
		}
	} );

	Music = Model.extend( {
	} );

	Musics = Collection.extend( {
		model: Music
	} );

	MusicWidget = Widget.extend( {
		defaults: {
			"num_of_song": "0"
		},
		url: '/musics',
		parse: function( collection ) {
			this.musics = new Musics( collection["musicInfo-list"] );
			this.set( 'num_of_song', this.musics.size() );
			this.set( 'index', 0 );
			this.loaded = true;
			return null;
		},
		current: function() {
			var index = this.get( 'index' );
			if ( index != undefined ) {
				return this.musics.at( this.get( 'index' ) );
			}
		},
		previous: function() {
			var index = this.get( 'index' );
			this.set( 'index', ( 0 == index )?(this.musics.size()-1):(index-1) );
		},
		next: function() {
			var index = this.get( 'index' );
			this.set( 'index', ( this.musics.size()-1 == index )?0:(index+1) );
		},
	} );

	MusicWidgetView = WidgetView.extend( {
		'template-id': 'tmpl-music-widget',
		'elements': ['audio', 'prev', 'play', 'next', 'numOfSong', 'nameOfSong', 'songTitle',
				   'played', 'remainder', 'handle', 'playedText', 'remainderText' ],
		initialize: function( options ) {
			WidgetView.prototype.initialize.apply( this, [options] );
			var that = this;
			this.parent = options.parent;

			this.bindTo( this.model, 'change', this.render );
			
			this.$prev.click( this.prev );
			this.$play.click( this.play );
			this.$next.click( this.next );
			this.$audio.on( 'ended', this.next );
			this.$handle.bind( 'mousedown', function( e ) {
				if ( 'play' != that.$play.attr( 'status' ) ) {
					return ;
				}

				if ( !( that.$audio[0].duration ) ) {
					console.log( 'Endless music' );
					return ;
				}

				that.dragPoint = { x: e.pageX, y: e.pageY };
				that.dragTime = that.$audio[0].currentTime;
				that.parent.startDrag( that );
			} );
		},
		render: function() {
			this.$numOfSong.html( this.model.get( 'num_of_song' ) );
			var current = this.model.current();
			if ( current ) {
				this.$songTitle.html( current.get( 'name' ) );
				this.$audio.attr( 'src', '/musics/' + current.get( 'id' ) );
			}
			return this;
		},
		musicChanged: function() {
			var current = this.model.current();
			this.$nameOfSong.html( current.get( 'name' ) );
			this.$audio.attr( 'src', '/musics/' + current.get( 'id' ) );
			if ( 'play' == this.$play.attr( 'status' ) ) {
				this.$audio[0].play();
			}
		},
		prev: function() {
			var played = this.$audio[0].currentTime;
			if ( played < 3 ) {
				this.model.previous();
			}
			this.musicChanged();
		},
		play: function() {
			var current = this.model.current();
			if ( 'play' == this.$play.attr( 'status' ) ) {
				this.$audio[0].pause();
				this.$play.attr( 'status', '' );
				clearInterval( this.timer );
			} else if ( this.$audio.attr( 'src' ) ) {
				this.$audio[0].play();
				this.$play.attr( 'status', 'play' );
				this.timer = setInterval( this.updateProgress, 1000 );
			}
		},
		next: function() {
			this.model.next();
			this.musicChanged();
		},
		updateProgress: function() {
			var totalWidth = 385;
			var played = this.$audio[0].currentTime;
			var duration = this.$audio[0].duration;
			var remainder = duration - played;
			var position = played/duration * totalWidth;

			this.$playedText.text( this.formatToTime( played ) );
			this.$played.width( position );
			this.$remainderText.text( this.formatToTime( remainder ) );
			this.$remainder.width( totalWidth - position );
			this.$handle.css( { left: position + 'px' } );
		},
		formatToTime: function( value ) {
			if ( value == NaN || value == Infinity ) {
				return '?:?';
			}
			var i = Math.ceil( value );
			var m = parseInt( i / 60 );
			var s = i % 60;
			return m + ":" + s;
		},
		leaveDrag: function() {
		},
		drag: function( offset ) {
			console.log( 'X: ', offset.x - this.dragPoint.x, ', Y: ', offset.y - this.dragPoint.y );
			var handleChange = offset.x - this.dragPoint.x;
			var totalWidth = 385;
			var duration = this.$audio[0].duration;
			var timeChange = ( handleChange ) / totalWidth * duration;
			var time = this.dragTime + timeChange;

			console.log( 'start position: ', this.dragPoint.x, ', change: ', handleChange );
			console.log( 'start time: ', this.dragTime, ', time: ', time );
			//this.$audio[0].pause();
			this.$audio[0].currentTime = time;
			//this.$audio[0].play();
		},
	} );
	Gauge = Model.extend( {
   	} );

	CircleGaugeView = View.extend( {
		'template-id': 'tmpl-circle-gauge',
		'elements': [ 'spinner', 'filler', 'mask', 'inner', 'name' ],
		rotate: function( obj, degree ) {
			obj.css( {
				'-webkit-transform': 'rotate(' + degree + 'deg)',
				'-moz-transform': 'rotate(' + degree + 'deg)',
				'-ms-transform': 'rotate(' + degree + 'deg)',
				'-o-transform': 'rotate(' + degree + 'deg)',
				'transform': 'rotate(' + degree + 'deg)',
				'-webkit-transform-origin': '100%',
				'-moz-transform-origin': '100%',
				'-ms-transform-origin': '100%',
				'-o-transform-origin': '100%',
				'transform-origin': '100%'
			} );

		},
		render: function() {
			var fill = this.model.get( 'fill' );
			var color = this.model.get( 'color' );
			var hexColor = color.match( /^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/);
			var hex = function( x ) {
				return ( "0"+parseInt(x).toString(16)).slice( -2 );
			};
			var colorStr = '#' + hex( hexColor[1] ) + hex( hexColor[2] ) + hex( hexColor[3] );

			if ( fill < 0.5 ) {
				this.$filler.css( { opacity: 0 } );
				this.$mask.css( { opacity: 1 } );
			} else {
				this.$filler.css( { opacity: 1 } );
				this.$mask.css( { opacity: 0 } );
			}
			this.$el.css( { color: colorStr } );

			this.rotate( this.$spinner, 360 * fill );
			this.$filler.css( { background: colorStr } );
			this.$spinner.css( { background: colorStr } );
			this.$inner.text( ( fill * 100 ) + '%' );
			this.$name.text( this.model.get( 'name' ) );

			return this;
		}
	} );

	StorageOverview = Model.extend( {
		defaults: {
			y: 0
		}
	} );
	StorageOverviewView = View.extend( {
		'template-id': 'tmpl-storage-overview',
		'elements': [ 'icon', 'name', 'numOfItem' ],
		render: function() {
			this.$name.text( this.model.get( 'name' ) );
			this.$numOfItem.text( this.model.get( 'num-of-item' ) );
			this.$icon.css( { "background-position-y": this.model.get( 'y' ) + 'px' } );

			return this;
		}
	} );


	StorageWidget = Widget.extend( {
		initialize: function( options ) {
			Widget.prototype.initialize.apply( this, [ options ] );
		},
		url: '/system/storage'
	} );
	StorageWidgetView = WidgetView.extend( {
		'template-id': 'tmpl-storage-widget',
		'elements': [ 'used', 'value', 'unused',
					 'battery-gauge', 'rom-gauge', 'ram-gauge', 'cpu-gauge',
					  'storage-contact', 'storage-message', 'storage-music', 'storage-photo',
					  'storage-video', 'storage-app', 'storage-other'

	   	],
		init: function( options ) {
			this.bindTo( this.model, 'change', this.render );

			this._battery = new CircleGaugeView( {
				model: new Gauge( {
					name: 'Battery',
					color: 'rgb( 119, 163, 0 )',
					fill: 0.2
				} )
			} );
			console.log( 'this', this );
			this['$battery-gauge'].append( this._battery.render().$el );
			this._rom = new CircleGaugeView( {
				model: new Gauge( {
					name: 'ROM',
					color: 'rgb( 163, 122, 0 )',
					fill: 0.4
				} )
			} );
			this['$rom-gauge'].append( this._rom.render().$el );
			this._ram = new CircleGaugeView( {
				model: new Gauge( {
					name: 'RAM',
					color: 'rgb( 0, 121, 163 )',
					fill: 0.68
				} )
			} );
			this['$ram-gauge'].append( this._ram.render().$el );
			this._cpu = new CircleGaugeView( {
				model: new Gauge( {
					name: 'CPU',
					color: 'rgb( 196, 91, 187 )',
					fill: 0.84
				} )
			} );
			this['$cpu-gauge'].append( this._cpu.render().$el );

			this._contact = new StorageOverviewView( {
				model: new StorageOverview( {
					name: 'Contacts'
				} )
			} );
			this['$storage-contact'].append( this._contact.render().$el );

			this._message = new StorageOverviewView( {
				model: new StorageOverview( {
					name: 'Messages',
					y: -49
				} )
			} );
			this['$storage-message'].append( this._message.render().$el );

			this._music = new StorageOverviewView( { model: new StorageOverview( { name: 'Music', y: -98 } ) } );
			this['$storage-music'].append( this._music.render().$el );

			this._photo = new StorageOverviewView( { model: new StorageOverview( { name: 'Photo', y: -147 } ) } );
			this['$storage-photo'].append( this._photo.render().$el );

			this._video = new StorageOverviewView( { model: new StorageOverview( { name: 'Video', y: -196 } ) } );
			this['$storage-video'].append( this._video.render().$el );

			this._app = new StorageOverviewView( { model: new StorageOverview( { name: 'Apps', y: -245 } ) } );
			this['$storage-app'].append( this._app.render().$el );

			this._other = new StorageOverviewView( { model: new StorageOverview( { name: 'Others', y: -294 } ) } );
			this['$storage-other'].append( this._other.render().$el );

		},

		render: function() {
			var used = this.model.get( 'usage' ) || 0;
			var unused = this.model.get( 'remainder' ) || 0;
			var total = this.model.get( 'total' ) || 1;
			this.$value.text( used + ' / ' + total );
			
			this.$used.width( ( used / total * 100 + '%' ) );
			this.$unused.css( 'left', ( used / total * 100 + '%' ) );
			this.$unused.width( ( unused / total * 100 + '%' ) );
			this._battery.render();
			this._rom.render();
			this._ram.render();
			this._cpu.render();

			this._contact.render();
			this._message.render();
			this._music.render();
			this._photo.render();
			this._video.render();
			this._app.render();
			this._other.render();
			return this;
		},
	} );

	MessagesWidget = Widget.extend( {
	} );
	MessagesWidgetView = WidgetView.extend( {
		initialize: function( options ) {
			this.template = _.template( $( '#message-widget-template' ).html() );
			View.prototype.initialize.apply( this, [ options ] );
			this.$el.html( this.template( this.model ) );
		}
	} );

	ContactsWidget = Widget.extend( {
	} );
	ContactsWidgetView = WidgetView.extend( {
		initialize: function( options ) {
			this.template = _.template( $( '#contacts-widget-template' ).html() );
			View.prototype.initialize.apply( this, [ options ] );
			this.$el.html( this.template( this.model ) );
		}
	} );

	PhotosWidget = Widget.extend( {
	} );
	PhotosWidgetView = WidgetView.extend( {
		initialize: function( options ) {
			this.template = _.template( $( '#photos-widget-template' ).html() );
			View.prototype.initialize.apply( this, [ options ] );

			this.$el.html( this.template( this.model ) );
		}
	} );

	File = Model.extend( {
	} );
	FileView = View.extend( {
		'template-id': 'tmpl-files-file',
			 'elements': [ 'icon', 'info', 'deleteBtn', 'cutBtn' ],
		initialize: function( options ) {
			View.prototype.initialize.apply( this, [ options ] );
			var that = this;
			this.parent = options.parent;
			this.$cutBtn.click( function() {
				that.parent.addCutList( that.model );
			} );

			var moveTo = function() {
				that.parent.model.set( 'topath', addPath( that.parent.model.get( 'path' ), that.model.get( 'name' ) ) );
			};
			this.$icon.click( moveTo );
			this.$info.click( moveTo );
		},

		render: function() {
			if ( this.parent.cutList.find( function( f ) { return f.get( 'path' ) == this.model.get( 'path' ); }, this ) ) {
				this.$el.addClass( 'cut' );
			} else {
				this.$el.removeClass( 'cut' );
			}
			return this;
		}
	} );
	Files = Collection.extend( {
		model: File
	} );

	FilesWidget = Widget.extend( {
		defaults: {
			path: '',
			topath: '/'
		},
		initialize: function() {
			this.bind( 'change:topath', function() { if ( this.get( 'topath' ) && this.get( 'path' ) != this.get( 'topath' ) ) { this.fetch(); } }, this );
			this.files = new Files();
		},
		url: function () {
			return '/musics';
			if ( this.get( 'topath' ) ) {
				return addPath( '/files/', this.get( 'topath' ) );
			} else {
				return addPath( '/files/', this.get( 'path' ) );
			}
		},
		parse: function( collection ) {
			var file;
			while ( file = this.files.pop() )
			{
				file.destroy();
			}

			var path = this.get( 'topath' );
			console.log( 'Files path: ', path );
			_.each( collection, function( model ) {
				model['path'] = addPath( path, model['name'] );
			} );
			this.files.add( collection );
			console.log( 'Files: ', this.files );

			this.loaded = true;
			this.set( 'path', path );
			this.unset( 'topath' );
			this.set( 'num-of-files', this.files.size() );
			this.trigger( 'reset' );
			return null;
		}
	} );
	FileFragmentView = View.extend( {
		tagName: 'li',
		events: { 'click': 'moveTo' },
		initialize: function( options ) {
			this.template = _.template( $( '#files-path-fragment-template' ).html() );
			View.prototype.initialize.apply( this, [ options ] );
			this.parent = options.parent;
			this.$el.html( $( this.template( this.model.toJSON() ).trim() ) );
		},
		moveTo: function( options ) {
			this.parent.model.set( 'topath', this.model.get( 'path' ) );
		},
	} );
	FilesWidgetView = WidgetView.extend( {
		initialize: function( options ) {
			var that = this;
			this.template = _.template( $( '#files-widget-template' ).html() );
			View.prototype.initialize.apply( this, [ options ] );
			this.bindTo( this.model, 'reset', this.render );

			this.cutList = new Files();
			this.bindTo( this.cutList, 'reset', this.cutListChanged );
			this.bindTo( this.cutList, 'add', this.cutListChanged );
			this.bindTo( this.cutList, 'change', this.cutListChanged );
			this.bindTo( this.model, 'reset', this.cutListChanged );

			this.$contents = $( this.template( this.model ).trim() );
			this.$numOfFiles = this.$contents.find( '.num-of-item' );
			this.$pasteBtn = this.$contents.find( '#files-paste' );
			this.$cancelBtn = this.$contents.find( '#files-cancel' );


			this.$pasteBtn.click( function() {
				that.paste.call( that );
			} );

			this.$cancelBtn.click( function() {
				that.cutList.reset();
			} );
			this.$path = this.$contents.find( '#files-path' );
			this.$list = this.$contents.find( '#files-list' );

			this.$el.html( this.$contents );
		},
		cutListChanged: function() {
			if ( !this.cutList.isEmpty() ) {
				this.$cancelBtn.attr( 'pastable', '' );
				var path = this.model.get( 'path' );
				if ( this.cutList.find( function( cut ) {
					return startsWith( path, cut.get( 'path' ) ) || path == getParentFrom( cut.get( 'path' ) );
				} ) ) {
					this.$pasteBtn.removeAttr( 'pastable' );
				} else {
					this.$pasteBtn.attr( 'pastable', '' );
				}
			} else {
				this.$pasteBtn.removeAttr( 'pastable' );
				this.$cancelBtn.removeAttr( 'pastable' );
			}
		},
		render: function() {
			this.$numOfFiles.html( this.model.get( 'num-of-files' ) );
			this.renderPath();
			this.renderFiles();

			return this;
		},
		renderPath: function() {
			this.$path.empty();
			var path = this.model.get( 'path' );
			var fragments = path.split( '/' );
			var base = '/';

			var fragmentView = new FileFragmentView( {
				parent: this,
				model: new Model( { name: 'Home', path: base } )
			} );
			this.$path.append( fragmentView.render().$el );
			_.each( fragments, function( fragment ) {
				if ( '' == fragment.trim() ) {
					return ;
				}
				this.$path.append( '<span>&gt;</span>' );
				base = addPath( base, fragment );
				var fragmentView = new FileFragmentView( {
					parent: this,
					model: new Model( { name: fragment, path: base } )
				} );
				this.$path.append( fragmentView.render().$el );
			}, this );
		},
		renderFiles: function() {
			var files = this.model.files;

			if ( ! ( files ) ) {
				return ;
			}

			if ( this.children ) {
				for ( cid in this.children ) {
					this.children[cid].dispose();
				}
			}
			this.children = {};
			files.each( function( file ) {
				var view = new FileView( { parent: this, model: file } ).render();
				view.bindTo( this.cutList, 'change', view.render );
				view.bindTo( this.cutList, 'add', view.render );
				view.bindTo( this.cutList, 'reset', view.render );
				this.children[view.cid] = view;
				this.$list.append( view.$el );
			}, this );

		},
		addCutList: function( cut ) {
			this.cutList.add( cut.clone() );
		},
		paste: function() {
			$.ajax( this.model.url(), {
				type: 'PUT',
				data: JSON.stringify( { path: this.cutList.toJSON() } )
			} );
		}
	} );

	AppsWidget = Widget.extend( {
	} );

	AppsWidgetView = WidgetView.extend( {
		initialize: function( options ) {
			this.template = _.template( $( '#apps-widget-template' ).html() );
			View.prototype.initialize.apply( this, [ options ] );

			this.$el.html( this.template( this.model ) );
		}
	} );

	App = Model.extend( {
		defaults: {
			setting: new Setting()
		}
	} );

	AppView = View.extend( {
		'template-id': 'app-template',
		'elements': [ 'basic-widget', 'music-widget', 'messages-widget', 'contacts-widget', 'photos-widget', 'files-widget', 'apps-widget', 'storage-widget' ],
		initialize: function( options ) {
			var that = this;
			View.prototype.initialize.apply( this, [ options ] );

			var endDrag = function( e ) {
				if ( !( that.callback ) ) {
					return ;
				}
				that.callback.leaveDrag( e );
				that.callback = null;
				console.log( 'End drag' );
			}

			$( 'body' ).mouseleave( endDrag );
			$( 'body' ).mouseup( endDrag );
			$( 'body' ).mousemove( function( e ) {
				if ( !( that.callback ) ) {
					return ;
				}
				that.callback.drag.call( that.callback, { x: e.pageX, y: e.pageY } );
			} );

			var errorHandler = function( model, options ) {
				console.log( 'Error for ', model );
				console.log( 'Options: ', options );
			};

			( this.basicWidget = new BasicWidget() );
			( this.musicWidget = new MusicWidget() ).fetch();
			( this.messagesWidget = new MessagesWidget() );
			( this.contactsWidget = new ContactsWidget() );
			( this.photosWidget = new PhotosWidget() );
			( this.filesWidget = new FilesWidget() );
			( this.appsWidget = new AppsWidget() );
			( this.storageWidget = new StorageWidget() ).fetch( { error: errorHandler } );

			this.children = [
			new BasicWidgetView( { parent: this, model: this.basicWidget } ),
			new MusicWidgetView( { parent: this, model: this.musicWidget } ),
			new MessagesWidgetView( { parent: this, model: this.messagesWidget } ),
			new ContactsWidgetView( { parent: this, model: this.contactsWidget } ),
			new PhotosWidgetView( { parent: this, model: this.photosWidget } ),
			new FilesWidgetView( { parent: this, model: this.filesWidget } ),
			new AppsWidgetView( { parent: this, model: this.appsWidget } ),
			new StorageWidgetView( { parent: this, model: this.storageWidget } ) ];

			this['$basic-widget'].append( this.children[0].render().$el );
			this['$music-widget'].append( this.children[1].render().$el );
			this['$messages-widget'].append( this.children[2].render().$el );
			this['$contacts-widget'].append( this.children[3].render().$el );
			this['$photos-widget'].append( this.children[4].render().$el );
			this['$files-widget'].append( this.children[5].render().$el );
			this['$apps-widget'].append( this.children[6].render().$el );
			this['$storage-widget'].append( this.children[7].render().$el );
		},

		render: function() {
			var result = _.find( this.children, function( view ) { return !view.model.isLoaded() } );
			if ( result ) {
				// progress
			} else
			{
			}
			return this;
		},
		startDrag: function( callback ) {
			this.callback = callback;
		}
	} );
} )();
