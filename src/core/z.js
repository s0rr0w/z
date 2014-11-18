/* Code is available under the Piblic Domain (Unlicense) */

var z = (function(){

	var 
		handlers = {},
		templates = document,
		globals = null,
		plurals = [],
		pluralFuncs = [
  			/* 0: Chinese */ [1, function(n) { return 0 }],
			/* 1: English */ [2, function(n) { return (n!=1)?1:0 }],
			/* 2: French */ [2, function(n) { return (n>1)?1:0 }],
			/* 3: Latvian */ [3, function(n) { return (n%10==1&&n%100!=11)?1:(n!=0)?2:0 }],
			/* 4: Scottish Gaelic */ [4, function(n) { return (n==1||n==11)?0:(n==2||n==12)?1:(n>0&&n<20)?2:3 }],
			/* 5: Romanian */ [3, function(n) { return (n==1)?0:(n==0||n%100>0&&n%100<20)?1:2 }],
			/* 6: Lithuanian */ [3, function(n) { return (n%10==1&&n%100!=11)?0:(n%10>=2&&(n%100<10||n%100>=20))?2:1 }],
			/* 7: Ukrainian */ [3, function(n) { return (n%10==1&&n%100!=11)?0:(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?1:2 }],
			/* 8: Slovak */ [3, function(n) { return (n==1)?0:(n>=2&&n<=4)?1:2 }],
			/* 9: Polish */ [3, function(n) { return (n==1)?0:(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?1:2 }],
			/* 10: Slovenian */ [4, function(n) { return (n%100==1)?0:(n%100==2)?1:(n%100==3||n%100==4)?2:3 }],
			/* 11: Irish Gaeilge */ [5, function(n) { return (n==1)?0:(n==2)?1:(n>=3&&n<=6)?2:(n>=7&&n<=10)?3:4 }],
			/* 12: Arabic */ [6, function(n) { return (n==0)?5:(n==1)?0:(n==2)?1:(n%100>=3&&n%100<=10)?2:(n%100>=11&&n%100<=99)?3:4 }],
			/* 13: Maltese */ [4, function(n) { return (n==1)?0:(n==0||n%100>0&&n%100<=10)?1:(n%100>10&&n%100<20)?2:3 }],
			/* 14: Macedonian */ [3, function(n) { return (n%10==1)?0:(n%10==2)?1:2 }],
			/* 15: Icelandic */ [2, function(n) { return (n%10==1&&n%100!=11)?0:1 }],
			/* 16: Breton */ [5, function(n) { return (n%10==1&&n%100!=11&&n%100!=71&&n%100!=91)?0:(n%10==2&&n%100!=12&&n%100!=72&&n%100!=92)?1:((n%10==3||n%10==4||n%10==9)&&n%100!=13&&n%100!=14&&n%100!=19&&n%100!=73&&n%100!=74&&n%100!=79&&n%100!=93&&n%100!=94&&n%100!=99)?2:(n%1000000==0&&n!=0)?3:4 }]
		]
	;

	var init = function ( ) {
		try {
			addZStyles();
			detachTemplateContainer();
			addGlobalContainer();
			processAllNodes(document);
		} catch(e){}
	};

	var addZStyles = function( ) {
		var 
			zElements = [ "template", "e", "dispatch", "exec", "hidden", "handler", "#zTemplates", "#zGlobal" ],
			styleNode = document.createElement('style'),
			styleSheet
		;
		styleNode.appendChild(document.createTextNode(''));// Safari magic ...

 		document.head.appendChild(styleNode);

		styleSheet = styleNode.sheet;

		styleSheet.insertRule( zElements.join(", ") + "{ display: none !important; }", 0 );
		
	};

	var detachTemplateContainer = function () {

		var tplNode = $("zTemplates");
		if ( tplNode ) {
			var 
				tplNode = tplNode.parentNode.removeChild(tplNode),
				iFrameNode = document.createElement("iframe"),
				bodyNode = document.body
			;

			iFrameNode.width = iFrameNode.height = 0;
			iFrameNode.id = "zTemplates";
			bodyNode.insertBefore(iFrameNode, bodyNode.firstChild);

			var iFrameDoc = iFrameNode.contentDocument;

			iFrameDoc.open();
			iFrameDoc.write("<!DOCTYPE HTML>\n<html><body>" + tplNode.innerHTML + "</body></html>");
			iFrameDoc.close();

			templates = iFrameNode.contentDocument;	

		}

	};

	var addGlobalContainer = function () {

		var 
			bodyNode = document.body
		;

		globals = document.createElement("global");

		bodyNode.insertBefore(globals, bodyNode.firstChild);

	};

	var processAllNodes = function ( container ) {
		processENodes(container);
		processHandlerNodes(container);
		processWrapperNodes(container);
		processPluralNodes();
		processExecNodes(container);
	};

	var processENodes = function ( container ) {

		var eList = container.getElementsByTagName( "e" );

		for ( var i=0, l=eList.length; i<l; i++ ) {

			var 
				node = eList[i],
				eventName = node.getAttribute("on"),
				handler = node.getAttribute("do"),
				isGlobal = node.hasAttribute("global")
			;

			if ( !eventName || !handler ) continue;

			var 
				parentNode = node.parentNode,
				targetNode = parentNode,
				params = (node.textContent)? node.textContent.split(",") : []
			;
			
			if ( parentNode.nodeName.toUpperCase() === "WRAPPER" ) {
				targetNode = parentNode.getElementsByTagName("*").item(0);
			};
			
			if ( !targetNode._e_ ) targetNode._e_ = {};
			var eObj = targetNode._e_;

			if ( !eObj[eventName] ) eObj[eventName] = [];

			eObj[eventName].push( { h: handler, p: params } );

			if ( isGlobal && eObj[eventName].global === undefined ) {
				eObj[eventName].global = true;
				registerShadowNode( eventName, targetNode );
			}
		}

		while( eList.length ) {
			var node = eList[0];
			node.parentNode.removeChild(node);
		}

	};

	var processExecNodes = function ( container ) {

		var eList = container.querySelectorAll( "exec" );
		
		for ( var i=0, l=eList.length; i<l; i++ ) {

			var 
				node = eList[i],
				childNodes = node.childNodes
			;

			for ( var j=0, k=childNodes.length; j<k; j++ ) {
				var 
					childNode = childNodes[j],
					nodeName = childNode.nodeName.toLowerCase()
				;

				switch ( nodeName ) {
					case "dispatch":
						processDispatchNode( childNode )();
						break;
				}
			}

			if( document.body.contains(node) ) node.parentNode.removeChild(node);

		}

	};

	var processHandlerNodes = function ( container ) {

		var eList = container.getElementsByTagName( "handler" );

		for ( var i=0, l=eList.length; i<l; i++ ) {

			var 
				node = eList[i],
				childNodes = node.childNodes,
				onAttr = node.getAttribute("on"),
				keys = node.getAttribute("keys"),
				parentNode = node.parentNode,
				targetNode = parentNode
			;

			if ( parentNode.nodeName.toUpperCase() === "WRAPPER" ) {
				targetNode = parentNode.getElementsByTagName("*").item(0);
			};

			for ( var j=0, k=childNodes.length; j<k; j++ ) {
				var 
					childNode = childNodes[j],
					nodeName = childNode.nodeName.toLowerCase()
				;

				switch ( nodeName ) {
					case "dispatch":
						var tmpFunc = processDispatchNode( childNode );
						if ( keys ) {
							tmpFunc = handlerWithKeyLimits.bind( this, tmpFunc, keys );
						}
						targetNode.addEventListener( onAttr, tmpFunc, false );
						break;
				}
			}

		}

	};

	var processWrapperNodes = function ( container ) {

		var eList = container.getElementsByTagName( "wrapper" );

		for ( var i=0, l=eList.length; i<l; i++ ) {
			var 
				node = eList[i],
				targetNode = node.getElementsByTagName("*").item(0),
				parentNode = node.parentNode
			;

			parentNode.insertBefore( targetNode, node );
		
		}

	};

	var processPluralNodes = function () {

		var eList = templates.getElementsByTagName( "plurals" );

		for ( var i=0, l=eList.length; i<l; i++ ) {
			var 
				node = eList[i],
				jsonStr = node.textContent,
				rule = node.getAttribute("rule") || 1;
			;

			if ( !(plurals[rule] instanceof Object) ) plurals[rule] = {};

			try {

				var jsonObj = JSON.parse( jsonStr );

				for ( var pKey in jsonObj ) {
					if ( ! jsonObj.hasOwnProperty( pKey ) ) continue;
					plurals[rule][pKey] = jsonObj[pKey];
				}

			} catch ( e ) {}
		
		}
		for ( var i=0, l=eList.length; i<l; i++ ) {
			var node = eList[i];
			node.parentNode.removeChild( node );
		}

	};

	var dispatch = function () {
		try {

			var 
				DOMEvnt = ( arguments[1] && isDOMEvent(arguments[1]) )? arguments[1] : null,
				l = arguments.length
			;

			if (DOMEvnt !== null) {
				l--;
				DOMEvnt.preventDefault(true);
				DOMEvnt.stopPropagation(true);
			}

			var argArray = Array.prototype.slice.call(arguments,0,l);

			for ( var i=0, l=argArray.length; i<l; i++ ) {

				var 
					arg = arguments[i],
					eventName = arg.e,
					target = arg.t,
					parentNode = arg.f,
					propagation = arg.p || "*",
					broadcast = !!arg.b,
					isGlobal = ( propagation === "global" )
				;

				if ( !arg.data ) arg.data = {};

				if ( isGlobal ) {

					var nodeList = globals.getElementsByTagName(eventName);

					for ( var j = nodeList.length; j--; ) {
						var 
							shadowNode = nodeList[j],
							targetNode = shadowNode._target_
						;

						if ( !targetNode ) continue;

						if ( document.body.contains(targetNode) ) {
							dispatchEvent( targetNode, arg );
						}
						else
						{
							globals.removeChild(shadowNode);
						}
					}
				}
				else
				{

					if ( !parentNode ) continue;
		
					arg.DOMEvnt = DOMEvnt;

					if ( !broadcast ) dispatchEvent( parentNode, arg );

					if ( propagation == "parent" ) continue;

					var propagationList = ( Array.isArray(propagation) )? propagation : propagation.split(",");
				
					for ( var p=0, pl=propagationList.length; p<pl; p++ ) {

						var pVal = propagationList[p];

						if ( pVal == "childNodes" ) {
							var childNodes = parentNode.childNodes;
							for ( var j = childNodes.length; j--; ) {
								dispatchEvent( childNodes[j], arg );
							}
						}
						else
						{
							var nodeList = parentNode.querySelectorAll(pVal);
							for ( var j = nodeList.length; j--; ) {
								dispatchEvent( nodeList[j], arg );
							}
						}
					}
				}
			}
		} catch(e){ }
	};

	var dispatchEvent = function ( node, event ) {

		var eventName = event.e;
		if ( !node._e_ || !node._e_[eventName] ) return;

		var handlersList = node._e_[eventName];

		for ( var i=0, l=handlersList.length; i<l; i++ ) {
			var hObj = handlersList[i];

			if ( handlers[hObj.h] && handlers[hObj.h] instanceof Function ) 
				try {
					handlers[hObj.h].call( node, event, hObj.p );
				} catch ( e ) { } 
		};
	};

	var dispatchById = function ( nodeID, mixin ) {
		try {
			processDispatchNode( $(nodeID), mixin )();
		} catch ( e ) { }
	};

	var createEObjFromDispatchNode = function ( node ) {

		var 
			eventAttr = node.getAttribute("e"),
			useAttr = node.getAttribute("use")
		;

		if ( !(eventAttr || useAttr ) ) return;

		var 
			propagationAttr = node.getAttribute("p"),
			fromAttr = node.getAttribute("f"),
			parentNode = node.parentNode,
			parentNodeName = parentNode.nodeName.toLowerCase()
		;

		if ( parentNodeName == "exec" || parentNodeName == "handler" ) parentNode = parentNode.parentNode;

		var eventObj = 
			{ 
				e: eventAttr, 
				t: node,
				f: (fromAttr)? getParentNode(node, fromAttr) : parentNode,
				data: JSON.parse("{}")
			};

		if ( propagationAttr ) eventObj.p = propagationAttr;
		if ( useAttr ) eventObj.use = useAttr;

		return eventObj;
	};

	var processDispatchNode = function ( node, mixin ) {

		var eventObj = createEObjFromDispatchNode( node );

		try {
			var useNode = $(eventObj.use);
			if ( useNode ) {
				eventObj = createEObjFromDispatchNode( useNode );
			}
			var 
				dataSrc = ( node.textContent )? node : useNode,
				tmpFragment = document.createDocumentFragment(),
				tmpData = {}
			;

			try {

				iterateTemplate( dataSrc, tmpFragment, {} );
				tmpData = JSON.parse(tmpFragment.textContent.trim());

			} catch ( e ) {}

			eventObj.data = (mixin)? merge( mixin, tmpData ) : tmpData;

		} catch ( e ) { };

		return dispatch.bind( node, eventObj );

	};
	
	var template = function ( event, options ) {
	
		var 
			tplID = options[0],
			mode = ( options[1] )? options[1] : "replace",
			containerNode = event.c,
			broadcast = !!options[2],
			childNodesCache = [],

			tplNode = $tpl(tplID)
		;

		if ( !tplNode ) return;
		
		var tmpFragment = document.createDocumentFragment();

		iterateTemplate(tplNode, tmpFragment, event.data);

		if ( mode == "replace" ) containerNode.innerHTML = "";

		for ( var i=0, l=tmpFragment.childNodes.length; i<l; i++ ) {
			childNodesCache.push( tmpFragment.childNodes[i] );
		};

		containerNode.appendChild( tmpFragment );
		
		processAllNodes(containerNode);

		if ( broadcast ) {

			propagation = options.slice(2).join(",");
			var newE = {
				p: propagation,
				e: event.e,
				data: event.data
			}

			for ( var i=0, l=childNodesCache.length; i<l; i++ ) {
				var childNode = childNodesCache[i];
				if( childNode.nodeType === 1 ) {
					newE.f = childNode;
					z.dispatch( newE );
				}
			}
			
		}

		containerNode._templated_ = true;

	};

	var iterateTemplate = function ( tplNode, container, data ) {

		var tplContent = tplNode.content || tplNode;

		for ( var i=0, l=tplContent.childNodes.length; i<l; i++ ) {

			var childNode = tplContent.childNodes[i];

			var nodeName = childNode.nodeName.toLowerCase();
			
			switch ( nodeName ) {

				case "if":

					var 
						exprAttr = childNode.getAttribute("expr"),
						exprFunc = new Function ( "data", "with(data){ try { return !!(" + exprAttr + ")} catch(e) { return false } }" )
					;

					if (exprFunc(data)) {
						var thenNode = getChildByName.call( childNode, "then" );
						if ( !thenNode ) break;
						iterateTemplate( thenNode, container, data );
					}
					else
					{
						var elseNode = getChildByName.call( childNode, "else" );
						if ( !elseNode ) break;
						iterateTemplate( elseNode, container, data );
					}
					break;

				case "value":
					var 
						defaultVal = childNode.getAttribute("default") || null,
						expr = childNode.textContent,
						exprArr = expr.split("^"),
						retFunc = new Function ( "data", "with(data){ try { return " + exprArr[0] + " } catch (e) { return '' } }" ),
						res = retFunc(data),
						res = (res === "" && defaultVal !== null )? defaultVal : res,
						tmpNode = document.createTextNode(res)
					;
					if ( exprArr.length > 1 ) {
						var 
							retFunc = new Function ( "data", "with(data){ try { return " + exprArr[1] + " } catch (e) { return '' } }" ),
							pluralVal = retFunc(data),
							type = exprArr[2] || 1,
							tmpNode = document.createTextNode( getPluralText( type, res, pluralVal ) )
						;
					};
					container.appendChild( tmpNode );
					break;

				case "include":
					var 
						tplId = childNode.getAttribute("tpl"),
						mode = childNode.getAttribute("mode"),
						tmpFragment = document.createDocumentFragment()
					;

					iterateTemplate( childNode, tmpFragment, data );

					var 
						expr = tmpFragment.textContent.trim(),
						retFunc = new Function ( "data", "with(data){ try { return " + expr + " } catch (e) { return '' } }" ),
						res = retFunc(data)
					;

					z.template ( { c: container, data: res }, [ tplId, mode ] );
					
					break;

				case "tag":

					var 
						cloneNode = childNode.cloneNode(true),
						nameNode = getChildByName.call( cloneNode, "name" ),
						tmpFragment = document.createDocumentFragment()
					;

					if ( !nameNode ) break;

					iterateTemplate( nameNode, tmpFragment, data );
					var tagName = tmpFragment.textContent.trim();
					cloneNode.removeChild( nameNode );

					if ( tagName ) {
						var newNode = document.createElement( tagName );
						iterateTemplate( cloneNode, newNode, data );
		 				container.appendChild( newNode );
					}
					else
					{
						tmpFragment = document.createDocumentFragment();
						iterateTemplate( cloneNode, tmpFragment, data );
						container.appendChild( tmpFragment );
					}
					break;

				case "attr":

					var 
						nameAttr = childNode.getAttribute("name"),
						tmpFragment = document.createDocumentFragment();
					;
					iterateTemplate( childNode, tmpFragment, data );
					container.setAttribute( nameAttr, tmpFragment.textContent.trim() );

					break;

				case "class":
					var cloneNode = childNode.cloneNode();
					iterateTemplate( childNode, cloneNode, data );
					container.classList.add( cloneNode.textContent.trim() );
					break;

				case "foreach":
					var 
						fromAttr = childNode.getAttribute("from"),
						itemAttr = childNode.getAttribute("item"),
						keyAttr = childNode.getAttribute("key")
					;

					if ( !fromAttr || !itemAttr ) break;

					var
						retFunc = new Function ( "data", "with(data){ try { return " + fromAttr + " } catch (e) { return '' } }" ),
						res = retFunc(data)
					;

					if ( Array.isArray(res) ) {
						for ( var j=0, k=res.length; j<k; j++ ) {
							var tmpObj = {};
							tmpObj[itemAttr] = res[j];
							if ( keyAttr ) tmpObj[keyAttr] = j;
							iterateTemplate( childNode, container, tmpObj );
						}
					}
					else if ( res instanceof Object ) {
						for ( var j in res ) {
							if ( ! res.hasOwnProperty( j ) ) continue;
							var tmpObj = {};
							tmpObj[itemAttr] = res[j];
							if ( keyAttr ) tmpObj[keyAttr] = j;
							iterateTemplate( childNode, container, tmpObj );
						}
					}
					break;

				case "capture":
					var 
						captureName = childNode.getAttribute("to"),
						expr = childNode.getAttribute("expr") || true,
						retFunc = new Function ( "data", "with(data){ try { return " + expr + " } catch (e) { return '' } }" ),
						res = retFunc(data),
						captures = container._captures_
					;
					if ( captureName && res ) {
						if ( captures === undefined ) captures = container._captures_ = {};
						if ( !Array.isArray(captures[captureName]) ) captures[captureName] = [];
						
						var
							tmpElement = document.createElement("content");
						;
						iterateTemplate( childNode, tmpElement, data );
						captures[captureName].push( tmpElement.innerHTML.trim() );
					};
					break;

				case "flush":
					var 
						expr = childNode.textContent,
						captureObj = container._captures_ || {},
						retFunc = new Function ( "data", "with(data){ try { return " + expr + " } catch (e) { return '' } }" ),
						res = retFunc(captureObj)
					;
						container.innerHTML += res;

					break;

				case "z:table":
				case "z:caption":
				case "z:colgroup":
				case "z:col":
				case "z:thead":
				case "z:tfoot":
				case "z:tbody":
				case "z:tr":
				case "z:td":
				case "z:th":
					var tmpName = nodeName.substr(2);
					var tmpNode = document.createElement( tmpName );
					cloneAttributes(childNode, tmpNode);
					iterateTemplate( childNode, tmpNode, data );
					container.appendChild( tmpNode );
					break;
					
				default:
					var cloneNode = childNode.cloneNode();
					iterateTemplate( childNode, cloneNode, data );
					container.appendChild( cloneNode );
			}

		}
	};

	var addHandler = function ( handlerName, handlerFunc ) {
		handlers[handlerName] = handlerFunc;
	};

	var getParentNode = function ( node, path ) {

		try {
			var firstChar = path.charAt(0);
			
			switch ( firstChar ) {
				case "#": return $(path.substr(1));
				case ".": 
					var parentNode = node.parentNode;
					var className = path.substr(1);
					while ( parentNode && !parentNode.classList.contains(className) ) parentNode = parentNode.parentNode;
					return parentNode;
				default:
					var nodeName = path.toUpperCase();
					var parentNode = node.parentNode;
					while ( parentNode && parentNode.nodeName != nodeName ) parentNode = parentNode.parentNode;
					return parentNode;
			}

		}
		catch ( e ) { return node.parentNode || null; };
	};

	var getChildByName = function ( nodeName ) {
		for ( var i=0, l=this.childNodes.length; i<l; i++ ) {
			var childNode = this.childNodes[i];
			if ( childNode.nodeName.toLowerCase() == nodeName ) return childNode;
		}
		return null;
	};

	var $ = function ( id ) {
		if (typeof id == "string" ) return document.getElementById( id );
		return id;
	};

	var $tpl = function ( id ) {
		if (typeof id == "string" ) return templates.getElementById( id );
		return id;
	};

	var cloneAttributes = function ( fromNode, toNode ) {
		var attrs = fromNode.attributes;
		for ( var i=0, l=attrs.length; i<l; i++ ) {
			toNode.setAttribute( attrs[i].name, attrs[i].value );
        }
	};

	var registerShadowNode = function ( eventName, target ) {
		var shadowNode = document.createElement( eventName );
		shadowNode._target_ = target;
		globals.appendChild( shadowNode );
	};

	var handlerWithKeyLimits = function ( handler, keys, DOMEvnt ) {
		var 
			keyArr = keys.split(","),
			eType = DOMEvnt.type,
			keyCode = DOMEvnt.keyCode,
			acceptedKeys = []
		;

		if ( !(eType === "keypress" || eType === "keydown" || eType === "keyup" ) ) return;

		acceptedKeys[46] = "DEL";
		acceptedKeys[8] = "BS";
		acceptedKeys[13] = "ENTER";
		acceptedKeys[27] = "ESC";
		acceptedKeys[9] = "TAB";
		acceptedKeys[45] = "INS";
		acceptedKeys[37] = "LA";
		acceptedKeys[38] = "UA";
		acceptedKeys[39] = "RA";
		acceptedKeys[40] = "BA";

		var keyAlias = acceptedKeys[keyCode];

		if ( !keyAlias ) return;

		for ( var i=keyArr.length; i--; ) {
			if ( keyArr[i] === keyAlias ) {
				handler( DOMEvnt );
				return;
			}
		}
	};

	var getPluralText = function ( type, key, value ) {

		if ( !(plurals[type] instanceof Object) ) return "";

		try {
			var 
				pluralValuesByType = plurals[type],
				pluralArr = pluralValuesByType[key],
				pArrLength = pluralArr.length || 0,
				pFunc = pluralFuncs[type],
				requiredLength = pFunc[0],
				pFunc = pFunc[1]
			;


			if ( pArrLength !== requiredLength ) return "";

			return pluralArr[pFunc(value)] || "";

		} catch ( e ) { return "" }
		
	};

	var merge = function ( target, src ) {
		var 
			isArr = Array.isArray(src),
			res = isArr && [] || {}
		;
		if ( isArr ) {
			target = target || [];
			res = res.concat(target);
			for ( var i=0, l=src.length; i<l; i++ ) {
				var e = src[i];
				if (typeof res[i] === 'undefined') {
					res[i] = e;
				} 
				else if (typeof e === 'object') {
					res[i] = merge(target[i], e);
				} 
				else if (target.indexOf(e) === -1) {
					res.push(e);
				}
			};
		} 
		else
		{
			if (target && typeof target === 'object') {
				var keys = Object.keys(target);
				for ( var i=0, l=keys.length, key=keys[i]; i<l; i++, key=keys[i] ) {
					res[key] = target[key];
				}
			}
			var keys = Object.keys(src);
			for ( var i=0, l=keys.length, key=keys[i]; i<l; i++, key=keys[i] ) {
				if (typeof src[key] !== 'object' || !src[key]) {
					res[key] = src[key];
				}
				else 
				{
					if (!target[key]) {
						res[key] = src[key];
					} 
					else 
					{
						res[key] = merge(target[key], src[key]);
					}
				}
			};
		}
		return res;	
	};

	var isDOMEvent = function ( DOMEvnt ) {

		try {
			return ( DOMEvnt instanceof window.Event || DOMEvnt instanceof templates.defaultView.Event );
		} catch ( e ) { return false }

	};

	document.addEventListener("DOMContentLoaded", function(event) { z.init() });

  	var map = {
  		init: init,
		dispatch: dispatch,
		dispatchById: dispatchById,
		addHandler: addHandler,
		template: template
	};
	
	return map;

}());

z.addHandler( "template", function ( e, data ) {
	e.c = this;
	z.template( e, data );
});
z.addHandler( "templateIfMatch", function ( e, data ) {

	var
		property = data[0],
		constant = data[1],
		options = data.splice(2)
	;

	if ( e.data[property] != constant ) return;

	e.c = this;
	z.template( e, options );
	
});
z.addHandler( "templateIfExists", function ( e, data ) {

	var
		property = data[0],
		options = data.slice(1)
	;

	if ( e.data[property] === undefined ) return;

	e.c = this;
	z.template( e, options );

});               
z.addHandler( "templateOnce", function ( e, data ) {

	if ( this._templated_ ) return;
	e.c = this;
	z.template( e, data );
});

z.addHandler( "broadcastEvent", function ( e, data ) {
	var newE = Object.create(e, { f: { value: this }, p: { value: data }, b: { value: true } } );
	newE.data = e.data;
	z.dispatch( newE );
});

z.addHandler( "dispatchEvent", function ( e, data ) {
	var
		nodeID = data[0],
		mode = data[1] || "default",
		mixin = e.data || undefined
	;

	if ( !nodeID ) return;

	if ( mode === "checkEmpty" ) {
		if ( this.textContent.trim() !== "" ) return;
	}

	z.dispatchById( nodeID, mixin );
});