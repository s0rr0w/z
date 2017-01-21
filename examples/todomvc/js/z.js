/*
Z (zet) framework, version 0.8.5
Code is available under the Piblic Domain (Unlicense)
*/

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
		styleNode.appendChild(document.createTextNode(''));// Safari magic

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
		globals.id = "zGlobal";

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
				isGlobal = !!node.hasAttribute("global")
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

			eObj[eventName].push( { h: handler, p: params, global: isGlobal } );

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

			if (node._executed_) continue;
			node._executed_ = true;

			for ( var j=0, k=childNodes.length; j<k; j++ ) {
				var
					childNode = childNodes[j],
					nodeName = childNode.nodeName.toLowerCase()
				;

				switch ( nodeName ) {
					case "dispatch":
						dispatch( getEventObj(childNode) );
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
				eventName = node.getAttribute("on"),
				keys = node.getAttribute("keys"),
				confirmMsg = node.getAttribute("confirm"),
				freezeTime = node.getAttribute("freeze"),
				target = node.getAttribute("target"),
				allowDefault = !!(node.hasAttribute("allowDefault")),
				allowPropagation = !!(node.hasAttribute("allowPropagation")),
				excludingSelection = !!(node.hasAttribute("excludingSelection")),
				parentNode = node.parentNode,
				targetNode = parentNode,
				exeQueue = [],
				alreadyAssigned = !!(node._processed_)
			;

			if (alreadyAssigned) continue;

			if ( target === "window" ) {
				targetNode = window;
			}
			else if ( parentNode.nodeName.toUpperCase() === "WRAPPER" ) {
				targetNode = parentNode.getElementsByTagName("*").item(0);
			};

			for ( var j=0, k=childNodes.length; j<k; j++ ) {
				var
					childNode = childNodes[j],
					nodeName = childNode.nodeName.toLowerCase()
				;

				switch ( nodeName ) {
					case "dispatch":
						exeQueue.push(dispatchWrapper.bind( this, childNode ));
						break;
				}
			}

			if ( exeQueue.length ) {
				var tmpFunc = handlerExecQueue.bind( this, exeQueue );
				if ( keys ) tmpFunc = handlerWithKeyLimits.bind( this, tmpFunc, keys );
				if ( confirmMsg ) tmpFunc = handlerWithConfirm.bind( this, tmpFunc, confirmMsg );
				if ( freezeTime ) tmpFunc = handlerWithFreezeTime.bind( this, tmpFunc, freezeTime );
				if ( allowDefault || allowPropagation ) tmpFunc = handlerWithAllows.bind( this, tmpFunc, allowDefault, allowPropagation );
				if ( excludingSelection ) tmpFunc = handlerWithExcludingSelection.bind( this, tmpFunc );
				targetNode.addEventListener( eventName, tmpFunc, false );
			}

			node._processed_ = true;
		}

	};

	var processWrapperNodes = function ( container ) {

		var eList = container.getElementsByTagName( "wrapper" );

		while ( eList.length ) {
			var
				node = eList.item(0),
				parentNode = node.parentNode
			;

			while ( node.childNodes.length ) {
				parentNode.insertBefore( node.firstChild, node );
			}

			parentNode.removeChild(node);

		}

	};

	var processPluralNodes = function () {

		var eList = templates.querySelectorAll( "plurals" );

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
				var
					zParams = DOMEvnt._z_ || {},
					preventDefault = !( zParams.allowDefault ),
					stopPropagation = !( zParams.allowPropagation)
				;
				if ( preventDefault ) DOMEvnt.preventDefault(true);
				if ( stopPropagation ) DOMEvnt.stopPropagation(true);
			}

			var argArray = Array.prototype.slice.call(arguments,0,l);

			for ( var i=0, l=argArray.length; i<l; i++ ) {

				var
					arg = arguments[i],
					eventName = arg.e,
					target = arg.t || null,
					parentNode = arg.f || document.body,
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
							arg.DOMEvnt = DOMEvnt;
							dispatchEvent( targetNode, arg, true );
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

		var
			eventName = event.e,
			isGlobal = arguments[2] || false
		;

		if ( !node._e_ || !node._e_[eventName] ) return;

		var handlersList = node._e_[eventName];

		for ( var i=0, l=handlersList.length; i<l; i++ ) {
			var hObj = handlersList[i];

			if ( isGlobal ^ hObj.global ) continue;

			if ( handlers[hObj.h] && handlers[hObj.h] instanceof Function )
				try {
					handlers[hObj.h].call( node, event, hObj.p );
				} catch ( e ) { }
		};

	};

	var dispatchById = function ( nodeID, mixin ) {
		try {
			var
				node = findDispatchNode(this, nodeID),
				zEvent = getEventObj(node, mixin)
			;
			dispatch(zEvent);
			return zEvent;
		} catch ( e ) { }
	};

	var dispatchWrapper = function ( node, DOMEvnt ) {
		if ( !node || !document.body.contains(node) ) return;

		var args = [ getEventObj(node) ];
		if ( DOMEvnt ) args.push(DOMEvnt);

		dispatch.apply( this, args );
	};

	var createEObjFromDispatchNode = function ( node ) {

		var
			eventAttr = node.getAttribute("e"),
			useAttr = node.getAttribute("use")
		;

		if ( !(eventAttr || useAttr ) ) return;

		if ( !node.parentNode ) return;

		var
			propagationAttr = node.getAttribute("p"),
			fromAttr = node.getAttribute("f"),
			parentNode = node.parentNode,
			parentNodeName = parentNode.nodeName.toLowerCase(),
			tmpFragment = document.createDocumentFragment(),
			tmpData = "{}"
		;

		if ( parentNodeName == "exec" || parentNodeName == "handler" ) parentNode = parentNode.parentNode;

		var eventObj =
			{
				e: eventAttr,
				t: node,
				f: (fromAttr)? getParentNode(node, fromAttr) : parentNode
			};

		if ( propagationAttr ) eventObj.p = propagationAttr;
		if ( useAttr ) eventObj.use = useAttr;

		try {

			iterateTemplate( node, tmpFragment, {} );
			tmpData = tmpFragment.textContent.trim() || "{}";

		} catch ( e ) {}

		eventObj.data = tmpData;

		return eventObj;
	};

	var findDispatchNode = function ( node, target ) {

		if (!target) return null;

		var
			path = target.split("/"),
			id = (path.length > 1)? path[1] || path[2] : path[0],
			absolutePath = !(path[2])
			parentNode = (path.length > 1)? getParentNode( node, path[0] ) : null
		;
		if (parentNode) {
			if (absolutePath) {
				for (var i=parentNode.childNodes.length; i--;) {
					var
						childNode = parentNode.childNodes.item(i),
						nodeName = childNode.nodeName.toUpperCase() || "",
						nameAttr = childNode.getAttribute && childNode.getAttribute("name") || ""
					;
					if ( nodeName === "DISPATCH" && nameAttr == id ) return childNode;
				}
			}
			else
			{
				return parentNode.querySelector("dispatch[name='" + id + "']");
			}
		}
		else
		{
			return $(id);
		}
	};

	var getEventObj = function ( node, mixin ) {

		var
			eventObj = createEObjFromDispatchNode( node ),
			tmpData = eventObj.data
		;

		try {
			var useNode = findDispatchNode(node, eventObj.use);
			if ( useNode ) eventObj = createEObjFromDispatchNode( useNode );
			if ( tmpData === "{}" && eventObj.data ) tmpData = eventObj.data;

		} catch ( e ) { };

		tmpData = JSON.parse(tmpData);

		if (mixin) extend(mixin, tmpData);

		eventObj.data = tmpData;

		return eventObj;
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

		if ( !tplNode || ( mode === "once" && containerNode._templated_ ) ) return containerNode;

		var tmpFragment = document.createDocumentFragment();

		iterateTemplate(tplNode, tmpFragment, event.data, containerNode);

		if ( ["replace", "once"].indexOf(mode) !== -1 ) containerNode.innerHTML = "";

		for ( var i=0, l=tmpFragment.childNodes.length; i<l; i++ ) {
			childNodesCache.push( tmpFragment.childNodes[i] );
		};

		if ( mode !== "before" ) {
			containerNode.appendChild( tmpFragment );
		}
		else
		{
			containerNode.insertBefore( tmpFragment, containerNode.firstChild );
		}

		containerNode._templated_ = true;

		processAllNodes(containerNode);

		if ( broadcast ) {

			var
				propagation = options.slice(2).join(","),
				newE = {
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

		return containerNode;

	};

	var iterateTemplate = function ( tplNode, container, data ) {

		var
			tplContent = tplNode.content || tplNode,
			domNode = arguments[3] || null
		;

		for ( var i=0, l=tplContent.childNodes.length; i<l; i++ ) {

			var childNode = tplContent.childNodes[i];

			var nodeName = childNode.nodeName.toLowerCase();

			switch ( nodeName ) {

				case "if":

					var
						exprAttr = childNode.getAttribute("expr"),
						captures = domNode && domNode._captures_ || {},
						exprFunc = new Function ( "_data_", "_captures_", "with(_data_){ try { return !!(" + exprAttr + ")} catch(e) { return false } }" )
					;

					if (exprFunc(data, captures)) {
						var thenNode = getChildByName.call( childNode, "then" );
						iterateTemplate( thenNode || childNode, container, data, domNode );
					}
					else
					{
						var elseNode = getChildByName.call( childNode, "else" );
						if ( !elseNode ) break;
						iterateTemplate( elseNode, container, data, domNode );
					}
					break;

				case "value":
					var
						defaultVal = childNode.getAttribute("default") || "",
						expr = childNode.textContent,
						exprArr = expr.split("^"),
						retFunc = new Function ( "_data_", "with(_data_){ try { return " + exprArr[0] + " } catch (e) { return '' } }" ),
						txt = retFunc(data),
						txt = ( txt === undefined || txt === null )? "" : txt,
						txt = ( txt === "" && defaultVal )? defaultVal : txt
					;
					if ( exprArr.length > 1 ) {
						var
							retFunc = new Function ( "_data_", "with(_data_){ try { return " + exprArr[1] + " } catch (e) { return '' } }" ),
							pluralVal = retFunc(data),
							type = exprArr[2] || 1,
							txt = getPluralText( type, txt, pluralVal )
						;
					};
					if (container.nodeName === "TEXTAREA") {
						container.value = txt;
					}
					else
					{
						container.appendChild( document.createTextNode(txt) );
					}
					break;

				case "inner_html":
					var
						defaultVal = childNode.getAttribute("default") || "",
						expr = childNode.textContent,
						retFunc = new Function ( "_data_", "with(_data_){ try { return " + expr + " } catch (e) { return '' } }" ),
						res = retFunc(data),
						res = ( res === undefined || res === null )? "" : res,
						res = ( res === "" && defaultVal )? defaultVal : res
					;
					if ( container.innerHTML !== undefined ) {
						container.innerHTML += res;
					}
					else
					{
						var tmpElement = document.createElement("div");
						tmpElement.innerHTML = res;
						while (tmpElement.childNodes.length) {
							container.appendChild(tmpElement.childNodes.item(0));
						}
					}
					break;

				case "dom":
					var
						expr = childNode.textContent,
						retFunc = new Function ( "_data_", "with(_data_){ try { return " + expr + " } catch (e) { return '' } }" ),
						res = retFunc(data)
					;

					if ( !res ) break;

					while (res.length) {
						container.appendChild(res.item(0));
					}

					break;

				case "val_by":
					var
						defaultVal = childNode.getAttribute("default") || "",
						expr = childNode.textContent,
						retFunc = new Function ( "_data_", "with(_data_){ try { return " + expr + " } catch (e) { return '' } }" ),
						res = retFunc(data),
						retFunc = new Function ( "_data_", "with(_data_){ try { return " + res + " } catch (e) { return '' } }" ),
						res = retFunc(data),
						res = ( res === undefined || res === null )? "" : res,
						res = ( res === "" && defaultVal )? defaultVal : res,
						tmpNode = document.createTextNode(res)
					;
					container.appendChild( tmpNode );
					break;

				case "include":
					var
						tplId = childNode.getAttribute("tpl"),
						tmpFragment = document.createDocumentFragment()
					;

					iterateTemplate( childNode, tmpFragment, data, domNode );

					var
						expr = tmpFragment.textContent.trim(),
						retFunc = new Function ( "_data_", "with(_data_){ try { return " + expr + " } catch (e) { return '' } }" ),
						res = retFunc(data) || data,
						tplNode = $tpl(tplId),
						tmpFragment = document.createDocumentFragment()
					;

					iterateTemplate( tplNode, container, res, domNode );

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
						iterateTemplate( cloneNode, newNode, data, domNode );
						container.appendChild( newNode );
					}
					else
					{
						tmpFragment = document.createDocumentFragment();
						iterateTemplate( cloneNode, tmpFragment, data, domNode );
						container.appendChild( tmpFragment );
					}
					break;

				case "attr":

					var
						nameAttr = childNode.getAttribute("name"),
						tmpFragment = document.createDocumentFragment(),
						targetNode = ( container.nodeName.toUpperCase() === "WRAPPER" )? container.getElementsByTagName("*").item(0) : container,
						targetNode = ( targetNode.nodeType == 11 )? domNode : targetNode
					;

					iterateTemplate( childNode, tmpFragment, data, domNode );
					targetNode.setAttribute( nameAttr, tmpFragment.textContent.trim().replace(/\s+/g," ") );

					break;

				case "class":
					var
						cloneNode = childNode.cloneNode(),
						targetNode = ( container.nodeName.toUpperCase() === "WRAPPER" )? container.getElementsByTagName("*").item(0) : container,
						targetNode = ( targetNode.nodeType == 11 )? domNode : targetNode
					;
					iterateTemplate( childNode, cloneNode, data, domNode );
					targetNode.classList.add( cloneNode.textContent.trim() );
					break;

				case "foreach":
					var
						fromAttr = childNode.getAttribute("from"),
						itemAttr = childNode.getAttribute("item"),
						keyAttr = childNode.getAttribute("key")
					;

					if ( !fromAttr || !itemAttr ) break;

					var
						retFunc = new Function ( "_data_", "with(_data_){ try { return " + fromAttr + " } catch (e) { return '' } }" ),
						res = retFunc(data),
						instanceOf = Object.prototype.toString.call(res).slice(8,-1)
					;

					if ( Array.isArray(res) || instanceOf == "FileList" ) {
						for ( var j=0, k=res.length; j<k; j++ ) {
							var tmpObj = { _parent_: data };
							tmpObj[itemAttr] = res[j];
							if ( keyAttr ) tmpObj[keyAttr] = j;
							iterateTemplate( childNode, container, tmpObj, domNode );
						}
					}
					else if ( res instanceof Object ) {
						for ( var j in res ) {
							if ( ! res.hasOwnProperty( j ) ) continue;
							var tmpObj = { _parent_: data };
							tmpObj[itemAttr] = res[j];
							if ( keyAttr ) tmpObj[keyAttr] = j;
							iterateTemplate( childNode, container, tmpObj, domNode );
						}
					}
					break;

				case "capture":
					var
						captureName = childNode.getAttribute("to"),
						initName = childNode.getAttribute("init"),
						expr = childNode.getAttribute("expr") || true,
						captures = domNode && domNode._captures_,
						retFunc = new Function ( "_data_", "_captures_", "with(_data_){ try { return " + expr + " } catch (e) { return '' } }" ),
						res = retFunc(data, captures || {})
					;
					if ( captureName && res ) {
						if ( captures === undefined ) captures = domNode._captures_ = {};
						if ( !Array.isArray(captures[captureName]) ) captures[captureName] = [];

						var
							tmpElement = document.createElement("content");
						;
						iterateTemplate( childNode, tmpElement, data, domNode );
						captures[captureName].push( tmpElement.innerHTML.trim() );
					};
					if ( initName && captures !== undefined ) captures[initName] = [];
					break;

				case "flush":
					var
						expr = childNode.textContent,
						captureObj = domNode && domNode._captures_ || {},
						retFunc = new Function ( "_data_", "with(_data_){ try { return " + expr + " } catch (e) { return '' } }" ),
						res = retFunc(captureObj)
					;

					if ( container.innerHTML ) {
						container.innerHTML += res;
					}
					else
					{
						var tmpElement = document.createElement("div");
						tmpElement.innerHTML = res;
						for ( var j=0, k=tmpElement.childNodes.length; j<k; j++ ) {
							container.appendChild(tmpElement.childNodes.item(j));
						}
					}

					break;

				case "datetime":
					var
						expr = childNode.getAttribute("use"),
						utc = childNode.hasAttribute("utc"),
						retFunc = new Function ( "_data_", "with(_data_){ try { return " + expr + " } catch (e) { return null } }" ),
						res = retFunc(data),
						now = new Date(),
						dt = new Date(),
						dtObj = null,
						setHours = (utc)? "setUTCHours": "setHours",
						setDate = (utc)? "setUTCDate": "setDate",
						getFullYear = (utc)? "getUTCFullYear" : "getFullYear",
						getMonth = (utc)? "getUTCMonth" : "getMonth",
						getDate = (utc)? "getUTCDate" : "getDate",
						getHours = (utc)? "getUTCHours" : "getHours",
						getMinutes = (utc)? "getUTCMinutes" : "getMinutes",
						getSeconds = (utc)? "getUTCSeconds" : "getSeconds",
						getDay = (utc)? "getUTCDay" : "getDay"
					;
					if ( res !== null && res !== undefined ) {
						try {
							 dt = new Date( res );
						}
						catch (e) {}

						var
							daysDiff = Math.floor(Math.abs((dt - now) / (1000 * 3600 * 24))),
							tds = now[setHours](0,0,0,0).valueOf(),
							ys = now[setDate](now[getDate]()-1).valueOf(),
							tms = now[setDate](now[getDate]()+2).valueOf(),
							tme = now[setDate](now[getDate]()+1).valueOf(),

							dtv = dt.valueOf(),
							rel = "past",
							rel = (dtv >= ys && dtv < tds)? "yesterday" : rel,
							rel = (dtv >= tds && dtv < tms)? "today" : rel,
							rel = (dtv >= tms && dtv < tme)? "tomorrow" : rel,
							rel = ( dtv >= tme )? "future" : rel,

							dtObj =
								{
									raw: dt,
									y: dt[getFullYear](),
									m: dt[getMonth](),
									d: dt[getDate](),
									H: dt[getHours](),
									M: dt[getMinutes](),
									S: dt[getSeconds](),
									wd: dt[getDay](),
								    daysDiff: daysDiff,
								    rel: rel,
								    utc: utc
								}
						;
					}

					iterateTemplate( childNode, container, { dt: dtObj }, domNode );

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
				case "z:select":
				case "z:option":
				case "z:textarea":
					var tmpName = nodeName.substr(2);
					var tmpNode = document.createElement( tmpName );
					cloneAttributes(childNode, tmpNode);
					iterateTemplate( childNode, tmpNode, data, tmpNode );
					container.appendChild( tmpNode );
					break;

				default:
					var cloneNode = childNode.cloneNode();
					iterateTemplate( childNode, cloneNode, data, cloneNode );
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
					if ( !className ) return node;
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

	var handlerExecQueue = function ( exeQueue, DOMEvnt ) {
		for ( var i=0, l=exeQueue.length; i<l; i++ ) {
			exeQueue[i]( DOMEvnt );
		}
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
		acceptedKeys[40] = "DA";

		var keyAlias = acceptedKeys[keyCode];

		if ( !keyAlias ) return;

		for ( var i=keyArr.length; i--; ) {
			if ( keyArr[i] === keyAlias ) {
				handler( DOMEvnt );
				return;
			}
		}
	};
	var handlerWithConfirm = function ( handler, confirmMsg, DOMEvnt ) {
		if ( confirm(confirmMsg) ) {
			handler( DOMEvnt );
		}
		else
		{
			DOMEvnt.preventDefault(true);
			DOMEvnt.stopPropagation(true);
		};
	};
	var handlerWithFreezeTime = function ( handler, freezeTime, DOMEvnt ) {
		var
			targetNode = DOMEvnt.target,
			eventType = DOMEvnt.target,
			freezeObj = targetNode._freeze_,
			currentTime = new Date(),
			currentTime = currentTime.valueOf()
		;

		if ( !freezeObj ) freezeObj = targetNode._freeze_ = {};
		var lastActionTime = freezeObj[eventType] || 0;

		if ( (currentTime - lastActionTime)/1000 > freezeTime ) {
			freezeObj[eventType] = currentTime;
			handler( DOMEvnt );
		}
		else
		{
			DOMEvnt.preventDefault(true);
			DOMEvnt.stopPropagation(true);
		}
	};
	var handlerWithAllows = function ( handler, allowDefault, allowPropagation, DOMEvnt ) {
		DOMEvnt._z_ = {
			allowDefault: allowDefault,
			allowPropagation: allowPropagation
		}
		handler( DOMEvnt );
	};
	var handlerWithExcludingSelection = function ( handler, DOMEvnt ) {
		if ( window.getSelection().toString() === "" ) {
			handler( DOMEvnt );
		}
		else
		{
			DOMEvnt.preventDefault(true);
			DOMEvnt.stopPropagation(true);
		};
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

	var extend = function ( from, to ) {

		if (from == null || typeof from != "object") return from;
		if (from.constructor != Object && from.constructor != Array) return from;
		if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function || from.constructor == String || from.constructor == Number || from.constructor == Boolean) return new from.constructor(from);

		to = to || new from.constructor();

		for (var name in from) {
			to[name] = (typeof to[name] == "undefined") ? extend(from[name], null) : to[name];
		}

		return to;
	}

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
		template: template,
		getParentNode: getParentNode
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
		options = data.slice(2)
	;

	if ( e.data[property] != constant ) return;

	e.c = this;
	z.template( e, options );

});
z.addHandler( "templateIfAttrMatch", function ( e, data ) {

	var
		property = data[0],
		tmpPath = property.split("."),
		attrName = tmpPath.pop(),
		value = this.getAttribute(attrName),
		exprFunc = new Function ( "_data_", "with(_data_){ try { return " + property + "} catch(e) { return false } }" ),
		options = data.slice(1)
	;

	if ( exprFunc(e.data) != value ) return;

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
z.addHandler( "templateScopeIfExists", function ( e, data ) {
	var
		property = data[0],
		options = data.slice(1),
		exprFunc = new Function ( "_data_", "with(_data_){ try { return " + property + "} catch(e) { return undefined } }" ),
		targetObj = exprFunc (e.data),
		propName = property.split(".").pop(),
		eventClone = Object.create(e),
		localDataObj
	;

	if ( targetObj === undefined ) return;

	if ( targetObj instanceof Array ) {
		localDataObj = targetObj.slice();
	}
	else
	{
		localDataObj = JSON.parse(JSON.stringify(targetObj));
	}

	eventClone.c = this;
	eventClone.data = {};
	eventClone.data[propName] = localDataObj;

	z.template( eventClone, options );
});

z.addHandler( "templateOnce", function ( e, data ) {
	e.c = this;
	data[1] = "once";
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
		mixin = undefined
	;

	if ( !nodeID ) return;

	if ( mode === "checkEmpty" && this.textContent.trim() !== "" ) { return; }

	if ( mode === "mixin" ) {
		if ( data[2] ) {
			mixin = {};
			mixin[data[2]] = e.data;
		}
		else
		{
			mixin = e.data;
		}
	}

	z.dispatchById.call( this, nodeID, mixin );
});
