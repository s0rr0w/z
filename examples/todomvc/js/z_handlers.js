/* Code is available under the Piblic Domain (Unlicense) */

z.addHandler( "debug", function ( e, data ) {

	console.log(this, e, data);

});

z.addHandler( "addClass", function ( e, data ) {
	if ( data[0] ) this.classList.add( data[0] );
});
z.addHandler( "removeClass", function ( e, data ) {
	if ( data[0] ) this.classList.remove( data[0] );
});
z.addHandler( "swapClass", function ( e, data ) {
	if ( data[0] ) this.classList.toggle( data[0] );
});

z.addHandler( "clearValue", function ( e, data ) {
	this.value = "";
});

z.addHandler( "smartClassProcess", function ( e, data ) {
	var
		eData = e.data,
		reverse = !(data[0] == "add" || data[0] == "addOnly"),
		oneWay = (data[0].indexOf("Only") !== -1),
		className = data[1],
		expressions = data.slice(2),
		res = false,
		thisNode = this
	;
	for ( var i=expressions.length; i-->0; ) {
		var
			exprArr = expressions[i].split("="),
			existCheck = false
		;
		expr = exprArr.map( function (e) {
			if ( e.indexOf("$") == 0 ) return eData[e.slice(1)];
			if ( e.indexOf("@") == 0 ) return thisNode.getAttribute(e.slice(1));
			if ( e.indexOf("?") == 0 ) {
				existCheck = true;
				try { return !!(eData[e.slice(1)].length) } catch (e) { return false };
			}
			return e
		})

		if ( existCheck ) {
			if (expr[0]) res = true;
		}
		else
		{
			if ( expr[0] == expr[1] ) res = true;
			if ( exprArr[1] === undefined && expr[0] ) res = true;
		}
	};

	var
		aRes = (reverse)? !res : res,
		action = (aRes)? "add" : "remove"
	;

	if (data[0] == "toggle" && res) {
		var hasClass = this.classList.contains(className);
		if (aRes && hasClass) action = "remove";
		if (!aRes && !hasClass) action = "add";
	}

	if (oneWay && !res) return;

	this.classList[action]( className );
});

z.addHandler( "setAttr", function ( e, data ) {

	var
		eData = e.data,
		attrName = data[0],
		defaultValue = data[1] || 1,
		propertyName = data[2] || attrName,
		attrValue = (eData[propertyName] !== undefined)? eData[propertyName] : defaultValue
	;

	if ( !attrName ) return;

	this.setAttribute( attrName, attrValue );

});

z.addHandler( "checkIf", function ( e, data ) {

	var
		eData = e.data,
		expressions = data,
		res = false,
		thisNode = this
	;

	for ( var i=expressions.length; i-->0; ) {
		var exprArr = expressions[i].split("=");
		expr = exprArr.map( function (e) {
			if ( e.indexOf("$") == 0 ) return eData[e.slice(1)];
			if ( e.indexOf("@") == 0 ) return thisNode.getAttribute(e.slice(1));
			return e
		})

		if ( expr[0] == expr[1] ) res = true;
	}

	this.checked = res;

});

z.addHandler( "collectData", function ( e, data ) {

	var
		name = this.name || this.id || data[0],
		mode = data[1] || "replace",
		nodeName = this.nodeName,
		value = "",
		eData = e.data,
		keyExists = false
	;

	if ( name === undefined ) return;

	if ( eData.hasOwnProperty(name) ) keyExists = true;
	if ( keyExists && mode == "once" ) return;

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
			if ( this.type === "checkbox" ) {
				if ( mode == "simple" ) {
					value = (this.checked);
				}
				else
				{
					value = ( eData[name] instanceof Array )? eData[name] : [];
					value.unshift( (this.checked)? this.value : "" );
				}
			}
			else
			{
				if ( this.type === "radio" && !this.checked ) return;
				value = this.value;
			}
			break;
		case "TEXTAREA":
			{
				value = this.value;
				break;
			}

		default:
			value = this.textContent.trim();
	}

	eData[name] = value;

});

z.addHandler( "removeChildAndDispatch", function ( e, data ) {

	var
		parentNode = this.parentNode,
		eData = e.data,
		execArr = eData.dispatch || [],
		that = this,
		execArr = execArr.map(function(d){
			d.f = ( d.f )? z.getParentNode( that, d.f ) : parentNode;
			d.data = eData;
			return d;
		})
	;

	parentNode.removeChild(this);

	for ( var i=0, l=execArr.length; i<l; i++) {
		var dispatchObj = execArr[i];
		if ( dispatchObj.use ) {
			z.dispatchById.call( dispatchObj.f, dispatchObj.use );
		}
		else
		{
			z.dispatch( dispatchObj );
		}
	}

});

z.addHandler( "countMe", function ( e, data ) {

	var
		eData = e.data,
		key = data[0],
		nodeKeyName = data[1] || false,
		reverse = nodeKeyName && nodeKeyName.indexOf("!") === 0
	;

	if (!key) return;

	if (!eData[key]) eData[key] = 0;

	if (nodeKeyName) {
		var
			nodeKeyName = (reverse)? nodeKeyName.slice(1) : nodeKeyName,
			ret = (reverse)? !!(this[nodeKeyName]) : !(this[nodeKeyName])
		;

		if (ret) return;
	}
		
	eData[key]++;

});

z.addHandler( "propagationJump", function ( e, data ) {

	var
		f = data[0],
		propagation = data.slice(1),
		eData = e.data,
		broadcast = true
	;

	if (!f) return;

	if (!propagation.length) {
		broadcast = false;
		propagation = "parent";
	}

	var newE = Object.create(e, { f: { value: z.getParentNode(this, f) }, p: { value: propagation }, b: { value: broadcast } } );
	newE.data = e.data;
	z.dispatch( newE );

});

z.addHandler( "removeChild", function ( e, data ) {

	this.parentNode.removeChild(this);

});

z.addHandler( "setValue", function ( e, data ) {

	var
		eData = e.data,
		prop = data[0] || null,
		propVal = eData[prop] || ""
	;

	this.value = propVal;

});

z.addHandler( "focusIt", function ( e, data ) {
	window.setTimeout( function() { this.focus(); }.bind(this), 10);
});

z.addHandler( "collectAsArr", function ( e, data ) {
	var
		property = data[0]
	;

	if ( e.data[property] === undefined ) e.data[property] = [];

	var dataArr = e.data[property];

	z.dispatch( { e: "collectAsArr", f: this, p: "parent", data: dataArr } );

});

z.addHandler( "collectAsObj", function ( e, data ) {
	var
		propagation = ( data[0] ) ? data.join() : "parent",
		tmpObj = {}
	;

	z.dispatch( { e: "collectAsObj", f: this, p: propagation, data: tmpObj } );

	e.data.unshift(tmpObj);
});

z.addHandler( "collectClassPresent", function ( e, data ) {

	var
		name = data[0],
		className = data[1],
		reverse = !!(data[2] && data[2] === "reverse"),
		eData = e.data
	;

	if ( name === undefined || className === undefined ) return;

	var boolVal = this.classList.contains(className);
	eData[name] = (reverse)? !boolVal : boolVal;

});

z.addHandler( "saveDataToLocalStorage", function ( e, data ) {

	var ns = data[0];

	if (!ns) return;

	localStorage[ns] = JSON.stringify(e.data);

});

z.addHandler( "loadDataFromLocalStorage", function ( e, data ) {

	var ns = data[0];

	if (!ns) return;

	e.data[ns] = JSON.parse(localStorage[ns]);

});

z.addHandler( "getUrlHash", function ( e, data ) {

	var
		param = data[0],
		defaultValue = data[1] || null,
		hash = window.location.hash.split("#/")[1],
		hash = hash || defaultValue || ""
	;

	if (!param) return;

	e.data[param] = hash;

});