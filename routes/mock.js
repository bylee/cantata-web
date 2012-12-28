var _ = require( 'underscore' );
var path = require( 'fs' );

osp = null;
if ( path.existsSync( './tizen-native.node' ) ) {
	osp = require( './tizen-native.node' );
} else {
	osp = require( './tizen-native.js' );
}

exports.index = function( req, res ) {
	res.send( 'index', { title: 'Express' });
};

exports.contacts = function( req, res ) {
    var contacts = new osp.Contacts();
    console.log( JSON.stringify( contacts.list(), null, '\t' ) );     
	res.send( JSON.stringify( contacts.list() ) );     
};

exports.category = function() {
};
exports.category.add = function( req, res ) {
	console.log( 'Body: ' + req.body.name );
	var contacts = new osp.Contacts();
	contacts.add( req.body.name );
	context.io.sockets.emit( 'newCategory', [ req.body.name ] );
};
