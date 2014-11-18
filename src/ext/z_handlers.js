/* Code is available under the Piblic Domain (Unlicense) */

z.addHandler( "addClass", function ( e, data ) {
	if ( data[0] ) this.classList.add( data[0] );
});
z.addHandler( "removeClass", function ( e, data ) {
	if ( data[0] ) this.classList.remove( data[0] );
});
z.addHandler( "swapClass", function ( e, data ) {
	if ( data[0] ) this.classList.toggle( data[0] );
});

z.addHandler( "addClassIfMatch", function ( e, data ) {
	var
		className = data[0],
		property = data[1],
		constant = data[2],
		action = (className && property && e.data[property] && e.data[property] == constant)? "add" : "remove"
	;

	this.classList[action]( className );
});
z.addHandler( "removeClassIfMatch", function ( e, data ) {
	var
		className = data[0],
		property = data[1],
		constant = data[2],
		action = (className && property && e.data[property] && e.data[property] != constant)? "add" : "remove"
	;

	this.classList[action]( className );
});

z.addHandler( "addClassIfAttrMatch", function ( e, data ) {
	var
		className = data[0],
		attrName = data[1],
		key = this.getAttribute(attrName),
		action = (className && key && e.data[key] !== undefined )? "add" : "remove"
	;

	this.classList[action]( className );
});

z.addHandler( "execMethodIfMatch", function ( e, data ) {
	var
		property = data[0],
		constant = data[1],
		method = data[2],
		mArr = method.split("."),
		instance = (mArr.length > 1)? window[mArr[0]] : window,
		method = (mArr.length > 1)? mArr[1] : mArr[0],
		methodArgs = data.slice(3)
	;

	instance[method].call( window, methodArgs );

});

z.addHandler( "postMessage", function ( e, data ) {

	rm.postMessage( e.data );
	
});
z.addHandler( "postMessageIfMatch", function ( e, data ) {
	var
		property = data[0],
		constant = data[1]
	;

	if ( e.data[property] == constant ) rm.postMessage( e.data );
	
});
z.addHandler( "collectPostMessage", function ( e, data ) {
	
	var
		action = data[0],
		propagation = (data[1])? data.slice(1) : "*",
		tmpData = e.data
	;

	tmpData.action = action;
	if ( !( tmpData.data instanceof Object) ) tmpData.data = {};

	z.dispatch( { e: "collectData", f: this, p: propagation, data: tmpData.data } );
	
});
z.addHandler( "collectPostMixin", function ( e, data ) {
	
	var
		propagation = (data[0])? data : "*",
		tmpData = e.data
	;

	if ( !( tmpData.data instanceof Object) ) tmpData.data = {};

	z.dispatch( { e: "collectData", f: this, p: propagation, data: tmpData.data } );
	
});

z.addHandler( "fillInData", function ( e, data ) { /* Experimental */
	var
		property = data[0]
	;

	if ( e.data[property] !== undefined && e.data[property] !== null ) {
		this.innerHTML = e.data[property];
	}
	
});

z.addHandler( "collectAsArr", function ( e, data ) {
	var
		property = data[0]
	;

	if ( e.data[property] === undefined ) e.data[property] = [];

	var dataArr = e.data[property];

	var nextItem = dataArr.length;

	z.dispatch( { e: "collectAsArr", f: this, p: "parent", data: dataArr, __index__: nextItem } );

	dataArr.reverse();
	 
});
z.addHandler( "collectAsObj", function ( e, data ) {
	var
		propagation = ( data[0] ) ? data[0] : "parent";
	;

	if ( e.__index__ === undefined ) return;
			
	var tmpObj = e.data[ e.__index__ ] = { };

	z.dispatch( { e: "collectAsObj", f: this, p: propagation, data: tmpObj } );

});

z.addHandler( "collectData", function ( e, data ) {/* Experimental */

	try {

	var
		name = this.name || this.id || data[0],
		nodeName = this.nodeName,
		value = "",
		eData = e.data
	;

	if ( name === undefined ) return;

	switch ( nodeName ) {
		case "SELECT":
			if ( this.multiple ) {
				value = [];
				for ( var i=this.options.length; i--; ) {
					var option = this.options[i];
					if ( option.selected ) value.unshift( option.value );
				}                   
			}
			else
			{
				value = this.value;
			}
			
			break;
		case "INPUT":
			if ( this.type === "checkbox" || this.type === "radio" ) {
				value = ( eData[name] instanceof Array )? eData[name] : [];
				value.unshift( (this.checked)? this.value : "" );
			}
			else
			{
				value = this.value;
			}
			break;
		default:
			value = this.textContent.trim();
	}	
	eData[name] = value;

	} catch(e){ }

});

z.addHandler( "restoreDefaultValue", function ( e, data ) {

	var 
		nodeName = this.nodeName
	;

	if ( nodeName === "INPUT" && ( this.type === "checkbox" || this.type === "radio" ) ) {
		this.checked = this.defaultChecked;
		return;
	}

	if ( nodeName === "SELECT" ) {
		for( var i=this.options.length; i--; ) {
			var option = this.options[i];
			option.selected = option.defaultSelected;
		}
	}

	if ( this.defaultValue !== undefined ) {
		this.value = this.defaultValue;
	}
});

z.addHandler( "removeChild", function ( e, data ) {

	this.parentNode.removeChild(this);

});

z.addHandler( "clearContent", function ( e, data ) {

	this.innerHTML = "";

});

z.addHandler( "clearAttr", function ( e, data ) {

	for ( var i=0, l=data.length; i<l; i++ ) {
		this.setAttribute(data[i], "");
	}

});
z.addHandler( "setAttr", function ( e, data ) {

	var 
		attrName = data[0],
		attrValue = data[1] || 1;
	;

	if ( !attrName ) return;

	this.setAttribute( attrName, attrValue );

});

z.addHandler( "debug", function ( e, data ) {

	console.log(this, e, data);

});