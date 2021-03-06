"use strict";

var BIL = {};
BIL.CONSTANTS = {};
BIL.RequestModule = {};
BIL.DirectivesFactory = {};
BIL.ConfigurationHandler = {};
BIL.ArticleConfiguration = {};
BIL.nerve = {};"use strict";

BIL.CONSTANTS = {
    CSS: {
        "REPEATABLE_ITEM": ".bil-item"
    },
    URLS: {
        CONFIG: "bil.config.json"
    }
};;"use strict";

BIL.DirectivesFactory = (function(CONSTANTS) {
    var contentConfigName = ".data";
    var PREFIX = ".b-";

    var getRepeatableDirective = function(data, articleName) {
        var repeatableDirective = {};
        var itemTag = CONSTANTS.CSS.REPEATABLE_ITEM;
        repeatableDirective[itemTag] = {};

        var repeatString = 'element<-' + articleName + contentConfigName;
        var requiredFields = data[articleName].options['requiredFields'];
        repeatableDirective[itemTag][repeatString] = {};

        for (var i = 0; i < requiredFields.length; i++) {
            if (!repeatableDirective[itemTag][repeatString]) {
                repeatableDirective[itemTag][repeatString] = {};
            }
            var currentTagName = requiredFields[i];

            repeatableDirective[itemTag][repeatString][PREFIX + currentTagName] = 'element.' + currentTagName;
        }

        return repeatableDirective;
    };

    var getSingleArticleDirective = function(data, articleName) {
        var directive = {};
        var requiredFields = data[articleName].options['requiredFields'];
        for (var i = 0 ; i <requiredFields.length; i++){
            var currentTagName = requiredFields[i];
            directive[PREFIX+currentTagName] = articleName + contentConfigName + '.' + currentTagName;
        }
        return directive;
    };

    return {
        getRepeatableDirective: getRepeatableDirective,
        getSingleArticleDirective: getSingleArticleDirective
    }
})(BIL.CONSTANTS);
;"use strict";

BIL.RequestModule = (function() {
    var REQUEST_TYPES = {
        "getRequest": "GET"
    };
    var REQUEST_FINISHED_RESPONSE_READY = 4;
    var OK = 200;

    var hookSuccessCallback = function(dataRequest, callbackFun) {
        dataRequest.onreadystatechange = function() {
            if (dataRequest.readyState == REQUEST_FINISHED_RESPONSE_READY && dataRequest.status == OK) {
                var data = JSON.parse(dataRequest.responseText);
                callbackFun(data);
            }
        };
    };

    var sendGet = function(url, successCallback) {
        var dataRequest = new XMLHttpRequest();
        hookSuccessCallback(dataRequest, successCallback);
        dataRequest.open(REQUEST_TYPES.getRequest, url, true);
        dataRequest.setRequestHeader("Content-Type", "application/json");
        dataRequest.send();
    };

    return {
        sendGet: sendGet
    }
})();
;"use strict";

BIL.ConfigurationHandler = (function() {
    var PREFIX = "bil-";
    var configuration;

    function appendPrefixToArrayElements(array) {
        for (var i = 0; i < array.length; i++) {
            var currentItem = array[i];
            array[i] = PREFIX + currentItem;
        }
    }

    var setConfData = function(confObj) {
        configuration = confObj;
    };

    function isArray(o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    }

    var getSinglesList = function() {
        var singlesList = configuration["applicationSettings"]["singleArticles"];
        if (isArray(singlesList)) {
            appendPrefixToArrayElements(singlesList);
            return singlesList;
        }
        var singleArrayList = new Array(singlesList);
        appendPrefixToArrayElements(singleArrayList);
        return new Array(singleArrayList);
    };

    var getMultipleArticlesList = function() {
        var multipleArtList = configuration["applicationSettings"]["multipleArticles"];
        if (isArray(multipleArtList)) {
            appendPrefixToArrayElements(multipleArtList);
            return multipleArtList;
        }
        var repeatableArrayList = new Array(multipleArtList);
        appendPrefixToArrayElements(repeatableArrayList);
        return new Array(repeatableArrayList);
    };

    var getContentFolder = function() {
        return configuration["generalSettings"]["contentFolder"];
    };

    return {
        getSinglesList: getSinglesList,
        getMultipleArticlesList: getMultipleArticlesList,
        getContentFolder: getContentFolder,
        setConfData: setConfData
    }
})();
;"use strict";

(function(RequestModule, DirectivesFactory, ConfigurationHandler, CONSTANTS) {

    ////////////////
    //Entry point
    ////////////////
    RequestModule.sendGet(CONSTANTS.URLS.CONFIG, fetchContentData);


    function fetchContentData(configurationData) {
        ConfigurationHandler.setConfData(configurationData);

        var contentFolder = ConfigurationHandler.getContentFolder();
        var singleArticleList = ConfigurationHandler.getSinglesList();
        var multipleArticlesList = ConfigurationHandler.getMultipleArticlesList();

        var curriedSingleArticleRender = function(articleName) {
            return function(dataToRender) {
                renderSingleArticle(dataToRender, articleName)
            }
        };
        var curriedRepeatableRender = function(articleName) {
            return function(dataToRender) {
                renderRepeatableItems(dataToRender, articleName);
            }
        };

        sendRequestForContent(singleArticleList, curriedSingleArticleRender);
        sendRequestForContent(multipleArticlesList, curriedRepeatableRender);

        function sendRequestForContent(list, callback) {
            for (var i = 0; i < list.length; i++) {
                var url = contentFolder + "/" + list[i] + ".json";
                RequestModule.sendGet(url, callback(list[i]));
            }
        }
    }

    function renderSingleArticle(data, articleName) {
        var selector = '.' + articleName;
        var directive = DirectivesFactory.getSingleArticleDirective(data, articleName);
        $p(selector).render(data, directive);
        BIL.nerve.send(articleName, 'rendered', {});
    }

    function renderRepeatableItems(data, articleName) {
        var selector = '.' + articleName;
        var directive = DirectivesFactory.getRepeatableDirective(data, articleName);
        $p(selector).render(data, directive);
        BIL.nerve.send(articleName, 'rendered', {});
    }

})(BIL.RequestModule,
    BIL.DirectivesFactory,
    BIL.ConfigurationHandler,
    BIL.CONSTANTS
);

;/*!
 PURE Unobtrusive Rendering Engine for HTML

 Licensed under the MIT licenses.
 More information at: http://www.opensource.org

 Copyright (c) 2013 Michael Cvilic - BeeBole.com

 Thanks to Rog Peppe for the functional JS jump
 revision: 2.83
 */

var $p = function(){
        var args = arguments,
            sel = args[0],
            ctxt = false;

        if(typeof sel === 'string'){
            ctxt = args[1] || false;
        }else if(sel && !sel[0] && !sel.length){
            sel = [sel];
        }
        return $p.core(sel, ctxt);
    },
    pure = $p;


$p.core = function(sel, ctxt, plugins){
    //get an instance of the plugins
    var templates = [], i, ii,
    // set the signature string that will be replaced at render time
        Sig = '_s' + Math.floor( Math.random() * 1000000 ) + '_',
    // another signature to prepend to attributes and avoid checks: style, height, on[events]...
        attPfx = '_a' + Math.floor( Math.random() * 1000000 ) + '_',
    // rx to parse selectors, e.g. "+tr.foo[class]"
        selRx = /^(\+)?([^\@\+]+)?\@?([^\+]+)?(\+)?$/,
    // set automatically attributes for some TAGS
        autoAttr = {
            IMG:'src',
            INPUT:'value'
        },
    // check if the argument is an array - thanks salty-horse (Ori Avtalion)
        isArray = Array.isArray ?
            function(o) {
                return Array.isArray(o);
            } :
            function(o) {
                return Object.prototype.toString.call(o) === "[object Array]";
            };

    plugins = plugins || getPlugins();

    //search for the template node(s)
    switch(typeof sel){
        case 'string':
            templates = plugins.find(ctxt || document, sel);
            if(templates.length === 0) {
                error('The template "' + sel + '" was not found');
            }
            break;
        case 'undefined':
            error('The root of the template is undefined, check your selector');
            break;
        default:
            templates = sel;
    }

    for( i = 0, ii = templates.length; i < ii; i++){
        plugins[i] = templates[i];
    }
    plugins.length = ii;

    /* * * * * * * * * * * * * * * * * * * * * * * * * *
     core functions
     * * * * * * * * * * * * * * * * * * * * * * * * * */


    // error utility
    function error(e){
        if(typeof console !== 'undefined'){
            console.log(e);
            //debugger;
        }
        throw('pure error: ' + e);
    }

    //return a new instance of plugins
    function getPlugins(){
        var plugins = $p.plugins,
            f = function(){};
        f.prototype = plugins;

        // do not overwrite functions if external definition
        f.prototype.compile    = plugins.compile || compile;
        f.prototype.render     = plugins.render || render;
        f.prototype.autoRender = plugins.autoRender || autoRender;
        f.prototype.find       = plugins.find || find;

        // give the compiler and the error handling to the plugin context
        f.prototype._compiler  = compiler;
        f.prototype._error     = error;

        return new f();
    }

    // returns the outer HTML of a node
    function outerHTML(node){
        // if IE, Chrome take the internal method otherwise build one
        return node.outerHTML || (
            function(n){
                var div = document.createElement('div'), h;
                div.appendChild( n.cloneNode(true) );
                h = div.innerHTML;
                div = null;
                return h;
            }(node));
    }

    // returns the string generator function
    function wrapquote(qfn, f){
        return function(ctxt){
            return qfn( String( f.call(ctxt.item || ctxt.context, ctxt) ) ) ;
        };
    }

    // default find using querySelector when available on the browser
    function find(n, sel){
        if(typeof n === 'string'){
            sel = n;
            n = false;
        }
        return (n||document).querySelectorAll( sel );
    }

    // create a function that concatenates constant string
    // sections (given in parts) and the results of called
    // functions to fill in the gaps between parts (fns).
    // fns[n] fills in the gap between parts[n-1] and parts[n];
    // fns[0] is unused.
    // this is the inner template evaluation loop.
    function concatenator(parts, fns){
        return function(ctxt){
            var strs = [ parts[ 0 ] ],
                n = parts.length,
                fnVal, pVal, attLine, pos, i;
            try{
                for(i = 1; i < n; i++){
                    fnVal = fns[i].call( this, ctxt );
                    pVal = parts[i];

                    // if the value is empty and attribute, remove it
                    if(fnVal === ''){
                        attLine = strs[ strs.length - 1 ];
                        if( ( pos = attLine.search( /[^\s]+=\"?$/ ) ) > -1){
                            strs[ strs.length - 1 ] = attLine.substring( 0, pos );
                            pVal = pVal.substr( 1 );
                        }
                    }

                    strs[ strs.length ] = fnVal;
                    strs[ strs.length ] = pVal;
                }
                return strs.join('');
            }catch(e){
                if(console && console.log){
                    console.log(
                            e.stack ||
                            e.message + ' (' + e.type + ( e['arguments'] ? ', ' + e['arguments'].join('-') : '' ) + '). Use Firefox or Chromium/Chrome to get a full stack of the error. ' );
                }
                return '';
            }
        };
    }

    // parse and check the loop directive
    function parseloopspec(p){
        var m = p.match( /^(\w+)\s*<-\s*(\S+)?$/ );
        if(m === null){
            error('bad loop spec: "' + p + '"');
        }
        if(m[1] === 'item'){
            error('"item<-..." is a reserved word for the current running iteration.\n\nPlease choose another name for your loop.');
        }
        if( !m[2] || m[2].toLowerCase() === 'context' ){ //undefined or space(IE)
            m[2] = function(ctxt){return ctxt.context;};
        }else if( (m[2] && m[2].indexOf('context') === 0 ) ){ //undefined or space(IE)
            m[2] = dataselectfn( m[2].replace(/^context\.?/, '') );
        }
        return {name: m[1], sel: m[2]};
    }

    // parse a data selector and return a function that
    // can traverse the data accordingly, given a context.
    function dataselectfn (sel){
        if( typeof(sel) === 'function' ){
            //handle false values in function directive
            return function ( ctxt ){
                var r = sel.call( ctxt.item || ctxt.context || ctxt, ctxt );
                return !r && r !== 0 ? '' : r;
            };
        }
        //check for a valid js variable name with hyphen(for properties only), $, _ and :
        var m = sel.match(/^[\da-zA-Z\$_\@\#][\w\$:\-\#]*(\.[\w\$:\-\#]*[^\.])*$/),
            found = false, s = sel, parts = [], pfns = [], i = 0, retStr;

        if(m === null){
            // check if literal
            if(/\'|\"/.test( s.charAt(0) )){
                if(/\'|\"/.test( s.charAt(s.length-1) )){
                    retStr = s.substring(1, s.length-1);
                    return function(){ return retStr; };
                }
            }else{
                // check if literal + #{var}
                while((m = s.match(/#\{([^{}]+)\}/)) !== null){
                    found = true;
                    parts[i++] = s.slice(0, m.index);
                    pfns[i] = dataselectfn(m[1]);
                    s = s.slice(m.index + m[0].length, s.length);
                }
            }
            if(!found){ //constant, return it
                return function(){ return sel; };
            }
            parts[i] = s;
            return concatenator(parts, pfns);
        }
        m = sel.split('.');
        return function(ctxt){
            var data = ctxt.context || ctxt,
                v = ctxt[m[0]],
                i = 0,
                n,
                dm;

            if(v && typeof v.item !== 'undefined'){
                i += 1;
                if(m[i] === 'pos'){
                    //allow pos to be kept by string. Tx to Adam Freidin
                    return v.pos;
                }
                data = v.item;
            }
            n = m.length;

            while( i < n ){
                if(!data){break;}
                dm = data[ m[i] ];
                //if it is a function call it
                data = typeof dm === 'function' ? dm.call( data ) : dm;
                i++;
            }

            return (!data && data !== 0) ? '':data;
        };
    }

    // wrap in an object the target node/attr and their properties
    function gettarget(dom, sel, isloop){
        var osel, prepend, selector, attr, append, target = [], m,
            setstr, getstr, quotefn, isStyle, isClass, attName, setfn;
        if( typeof sel === 'string' ){
            osel = sel;
            m = sel.match(selRx);
            if( !m ){
                error( 'bad selector syntax: ' + sel );
            }

            prepend = m[1];
            selector = m[2];
            attr = m[3];
            append = m[4];

            if(selector === '.' || ( !selector && attr ) ){
                target[0] = dom;
            }else{
                target = plugins.find(dom, selector);
            }
            if(!target || target.length === 0){
                return error('The node "' + sel + '" was not found in the template:\n' + outerHTML(dom).replace(/\t/g,'  '));
            }
        }else{
            // autoRender node
            prepend = sel.prepend;
            attr = sel.attr;
            append = sel.append;
            target = [dom];
        }

        if( prepend || append ){
            if( prepend && append ){
                error('append/prepend cannot take place at the same time');
            }else if( isloop ){
                error('no append/prepend/replace modifiers allowed for loop target');
            }else if( append && isloop ){
                error('cannot append with loop (sel: ' + osel + ')');
            }
        }

        if(attr){
            isStyle = (/^style$/i).test(attr);
            isClass = (/^class$/i).test(attr);
            attName = isClass ? 'className' : attr;
            setstr = function(node, s) {
                node.setAttribute(attPfx + attr, s);
                if ( node[attName] && !isStyle) {
                    try{node[attName] = '';}catch(e){} //FF4 gives an error sometimes
                }
                if (node.nodeType === 1) {
                    node.removeAttribute(attr);
                    if(isClass){
                        node.removeAttribute(attName);
                    }
                }
            };
            if (isStyle || isClass) {//IE no quotes special care
                if(isStyle){
                    getstr = function(n){ return n.style.cssText; };
                }else{
                    getstr = function(n){ return n.className;	};
                }
            }else {
                getstr = function(n){ return n.getAttribute(attr); };
            }
            quotefn = function(s){ return s.replace(/\"/g, '&quot;'); };
            if(prepend){
                setfn = function(node, s){ setstr( node, s + getstr( node )); };
            }else if(append){
                setfn = function(node, s){ setstr( node, getstr( node ) + s); };
            }else{
                setfn = function(node, s){ setstr( node, s ); };
            }
        }else{
            if (isloop) {
                setfn = function(node, s) {
                    var pn = node.parentNode;
                    if (pn) {
                        //replace node with s
                        pn.insertBefore(document.createTextNode(s), node.nextSibling);
                        pn.removeChild(node);
                    }else{
                        error('The template root, can\'t be looped.');
                    }
                };
            } else {
                if (prepend) {
                    setfn = function(node, s) { node.insertBefore(document.createTextNode(s), node.firstChild);	};
                } else if (append) {
                    setfn = function(node, s) { node.appendChild(document.createTextNode(s));};
                } else {
                    setfn = function(node, s) {
                        while (node.firstChild) { node.removeChild(node.firstChild); }
                        node.appendChild(document.createTextNode(s));
                    };
                }
            }
            quotefn = function(s) { return s; };
        }
        return { attr: attr, nodes: target, set: setfn, sel: osel, quotefn: quotefn };
    }

    function setsig(target, n){
        var sig = Sig + n + ':', i;
        for(i = 0; i < target.nodes.length; i++){
            // could check for overlapping targets here.
            target.set( target.nodes[i], sig );
        }
    }

    // read de loop data, and pass it to the inner rendering function
    function loopfn(name, dselect, inner, sorter, filter){
        return function(ctxt){
            var a = dselect(ctxt),
                old = ctxt[name],
                temp = { items : a },
                filtered = 0,
                length,
                strs = [],
                buildArg = function(idx, temp, ftr, len){
                    //keep the current loop. Tx to Adam Freidin
                    var save_pos = ctxt.pos,
                        save_item = ctxt.item,
                        save_items = ctxt.items;
                    ctxt.pos = temp.pos = idx;
                    ctxt.item = temp.item = a[ idx ];
                    ctxt.items = a;
                    //if array, set a length property - filtered items
                    if(typeof len !== 'undefined'){ (ctxt.length = len); }
                    //if filter directive
                    if(typeof ftr === 'function' && ftr.call(ctxt.item, ctxt) === false){
                        filtered++;
                        return;
                    }
                    strs.push( inner.call(ctxt.item, ctxt ) );
                    //restore the current loop
                    ctxt.pos = save_pos;
                    ctxt.item = save_item;
                    ctxt.items = save_items;
                },
                prop, i, ii;
            ctxt[name] = temp;
            if( isArray(a) ){
                length = a.length || 0;
                // if sort directive
                if(typeof sorter === 'function'){
                    a.sort(function(a, b){
                        return sorter.call(ctxt, a, b);
                    });
                }
                //loop on array
                for(i = 0, ii = length; i < ii; i++){
                    buildArg(i, temp, filter, length - filtered);
                }
            }else{
                if(a && typeof sorter !== 'undefined'){
                    error('sort is only available on arrays, not objects');
                }
                //loop on collections
                for( prop in a ){
                    if( a.hasOwnProperty( prop ) ){
                        buildArg(prop, temp, filter);
                    }
                }
            }

            if( typeof old !== 'undefined'){
                ctxt[name] = old;
            }else{
                delete ctxt[name];
            }
            return strs.join('');
        };
    }
    // generate the template for a loop node
    function loopgen(dom, sel, loop, fns){
        var already = false, ls, sorter, filter, prop, dsel, spec, itersel, target, nodes, node, inner;
        for(prop in loop){
            if(loop.hasOwnProperty(prop)){
                if(prop === 'sort'){
                    sorter = loop.sort;
                }else if(prop === 'filter'){
                    filter = loop.filter;
                }else if(already){
                    error('cannot have more than one loop on a target');
                }else{
                    ls = prop;
                    already = true;
                }
            }
        }
        if(!ls){
            error('Error in the selector: ' + sel + '\nA directive action must be a string, a function or a loop(<-)');
        }
        dsel = loop[ls];
        // if it's a simple data selector then we default to contents, not replacement.
        if(typeof(dsel) === 'string' || typeof(dsel) === 'function'){
            loop = {};
            loop[ls] = {root: dsel};
            return loopgen(dom, sel, loop, fns);
        }

        spec = parseloopspec(ls);
        itersel = dataselectfn(spec.sel);
        target = gettarget(dom, sel, true);
        nodes = target.nodes;

        for(i = 0; i < nodes.length; i++){
            node = nodes[i];
            inner = compiler(node, dsel);
            fns[fns.length] = wrapquote(target.quotefn, loopfn(spec.name, itersel, inner, sorter, filter));
            target.nodes = [node];		// N.B. side effect on target.
            setsig(target, fns.length - 1);
        }
        return target;
    }

    function getAutoNodes(n, data){
        var ns = n.getElementsByTagName('*'),
            an = [],
            openLoops = {a:[],l:{}},
            cspec,
            isNodeValue,
            i, ii, j, jj, ni, cs, cj;
        //for each node found in the template
        for(i = -1, ii = ns.length; i < ii; i++){
            ni = i > -1 ?ns[i]:n;
            if(ni.nodeType === 1 && ni.className !== ''){
                //when a className is found
                cs = ni.className.split(' ');
                // for each className
                for(j = 0, jj=cs.length;j<jj;j++){
                    cj = cs[j];
                    // check if it is related to a context property
                    cspec = checkClass(cj, ni.tagName);
                    // if so, store the node, plus the type of data
                    if(cspec !== false){
                        isNodeValue = (/nodevalue/i).test(cspec.attr);
                        if(cspec.sel.indexOf('@') > -1 || isNodeValue){
                            ni.className = ni.className.replace('@'+cspec.attr, '');
                            if(isNodeValue){
                                cspec.attr = false;
                            }
                        }
                        an.push({n:ni, cspec:cspec});
                    }
                }
            }
        }

        function checkClass(c, tagName){
            // read the class
            var ca = c.match(selRx),
                attr = ca[3] || autoAttr[tagName],
                cspec = {prepend:!!ca[1], prop:ca[2], attr:attr, append:!!ca[4], sel:c},
                i, ii, loopi, loopil, val;
            // check in existing open loops
            for(i = openLoops.a.length-1; i >= 0; i--){
                loopi = openLoops.a[i];
                loopil = loopi.l[0];
                val = loopil && loopil[cspec.prop];
                if(typeof val !== 'undefined'){
                    cspec.prop = loopi.p + '.' + cspec.prop;
                    if(openLoops.l[cspec.prop] === true){
                        val = val[0];
                    }
                    break;
                }
            }
            // not found check first level of data
            if(typeof val === 'undefined'){
                val = dataselectfn(cspec.prop)(isArray(data) ? data[0] : data);
                // nothing found return
                if(val === ''){
                    return false;
                }
            }
            // set the spec for autoNode
            if(isArray(val)){
                openLoops.a.push( {l:val, p:cspec.prop} );
                openLoops.l[cspec.prop] = true;
                cspec.t = 'loop';
            }else{
                cspec.t = 'str';
            }
            return cspec;
        }

        return an;

    }

    // returns a function that, given a context argument,
    // will render the template defined by dom and directive.
    function compiler(dom, directive, data, ans){
        var fns = [], j, jj, cspec, n, target, nodes, itersel, node, inner, dsel, sels, sel, sl, i, h, parts,  pfns = [], p;
        // autoRendering nodes parsing -> auto-nodes
        ans = ans || (data && getAutoNodes(dom, data));
        if(data){
            // for each auto-nodes
            while(ans.length > 0){
                cspec = ans[0].cspec;
                n = ans[0].n;
                ans.splice(0, 1);
                if(cspec.t === 'str'){
                    // if the target is a value
                    target = gettarget(n, cspec, false);
                    setsig(target, fns.length);
                    fns[fns.length] = wrapquote(target.quotefn, dataselectfn(cspec.prop));
                }else{
                    // if the target is a loop
                    itersel = dataselectfn(cspec.sel);
                    target = gettarget(n, cspec, true);
                    nodes = target.nodes;
                    for(j = 0, jj = nodes.length; j < jj; j++){
                        node = nodes[j];
                        inner = compiler(node, false, data, ans);
                        fns[fns.length] = wrapquote(target.quotefn, loopfn(cspec.sel, itersel, inner));
                        target.nodes = [node];
                        setsig(target, fns.length - 1);
                    }
                }
            }
        }
        // read directives
        for(sel in directive){
            if(directive.hasOwnProperty(sel)){
                i = 0;
                dsel = directive[sel];
                sels = sel.split(/\s*,\s*/); //allow selector separation by quotes
                sl = sels.length;
                do{
                    if(typeof(dsel) === 'function' || typeof(dsel) === 'string'){
                        // set the value for the node/attr
                        sel = sels[i];
                        target = gettarget(dom, sel, false);
                        setsig(target, fns.length);
                        fns[fns.length] = wrapquote(target.quotefn, dataselectfn(dsel));
                    }else{
                        // loop on node
                        loopgen(dom, sel, dsel, fns);
                    }
                }while(++i < sl);
            }
        }
        // convert node to a string
        h = outerHTML(dom);
        // IE adds an unremovable "selected, value" attribute
        // hard replace while waiting for a better solution
        h = h.replace(/<([^>]+)\s(value\=""|selected)\s?([^>]*)>/ig, "<$1 $3>");

        // remove attribute prefix
        h = h.split(attPfx).join('');

        // slice the html string at "Sig"
        parts = h.split( Sig );
        // for each slice add the return string of
        for(i = 1; i < parts.length; i++){
            p = parts[i];
            // part is of the form "fn-number:..." as placed there by setsig.
            pfns[i] = fns[ parseInt(p, 10) ];
            parts[i] = p.substring( p.indexOf(':') + 1 );
        }
        return concatenator(parts, pfns);
    }
    // compile the template with directive
    // if a context is passed, the autoRendering is triggered automatically
    // return a function waiting the data as argument
    function compile(directive, ctxt, template){
        var rfn = compiler( ( template || this[0] ).cloneNode(true), directive, ctxt);
        return function(context){
            return rfn({context:context});
        };
    }
    //compile with the directive as argument
    // run the template function on the context argument
    // return an HTML string
    // should replace the template and return this
    function render(ctxt, directive){
        var fn = typeof directive === 'function' && directive, i, ii;
        for(i = 0, ii = this.length; i < ii; i++){
            this[i] = replaceWith( this[i], (fn || plugins.compile( directive, false, this[i] ))( ctxt, false ));
        }
        return this;
    }

    // compile the template with autoRender
    // run the template function on the context argument
    // return an HTML string
    function autoRender(ctxt, directive){
        var fn = plugins.compile( directive, ctxt, this[0] ), i, ii;
        for(i = 0, ii = this.length; i < ii; i++){
            this[i] = replaceWith( this[i], fn( ctxt, false));
        }
        return this;
    }

    function replaceWith(elm, html) {
        var ne,
            ep = elm.parentNode,
            depth = 0,
            tmp;
        if(!ep){ //if no parents
            ep = document.createElement('DIV');
            ep.appendChild(elm);
        }
        switch (elm.tagName) {
            case 'BODY': //thanks to milan.adamovsky@gmail.com
                ep.removeChild(elm);
                ep.innerHTML += html;
                return ep.getElementsByTagName('BODY')[0];
            case 'TBODY': case 'THEAD': case 'TFOOT':
            html = '<TABLE>' + html + '</TABLE>';
            depth = 1;
            break;
            case 'TR':
                html = '<TABLE><TBODY>' + html + '</TBODY></TABLE>';
                depth = 2;
                break;
            case 'TD': case 'TH':
            html = '<TABLE><TBODY><TR>' + html + '</TR></TBODY></TABLE>';
            depth = 3;
            break;
            case 'OPTGROUP': case 'OPTION':
            html = '<SELECT>' + html + '</SELECT>';
            depth = 1;
            break;
        }
        tmp = document.createElement('SPAN');
        tmp.style.display = 'none';
        document.body.appendChild(tmp);
        tmp.innerHTML = html;
        ne = tmp.firstChild;
        while (depth--) {
            ne = ne.firstChild;
        }
        ep.insertBefore(ne, elm);
        ep.removeChild(elm);
        document.body.removeChild(tmp);
        elm = ne;

        ne = ep = null;
        return elm;
    }

    return plugins;
};

$p.plugins = {};

$p.libs = {
    dojo:function(){
        return function(n, sel){
            return dojo.query(sel, n);
        };
    },
    domassistant:function(){
        DOMAssistant.attach({
            publicMethods : [ 'compile', 'render', 'autoRender'],
            compile:function(directive, ctxt){
                return $p([this]).compile(directive, ctxt);
            },
            render:function(ctxt, directive){
                return $( $p([this]).render(ctxt, directive) )[0];
            },
            autoRender:function(ctxt, directive){
                return $( $p([this]).autoRender(ctxt, directive) )[0];
            }
        });
        return function(n, sel){
            return $(n).cssSelect(sel);
        };
    },
    ext:function(){//Thanks to Greg Steirer
        return function(n, sel){
            return Ext.query(sel, n);
        };
    },
    jquery:function(){
        jQuery.fn.extend({
            directives:function(directive){
                this._pure_d = directive; return this;
            },
            compile:function(directive, ctxt){
                return $p(this).compile(this._pure_d || directive, ctxt);
            },
            render:function(ctxt, directive){
                return jQuery( $p( this ).render( ctxt, this._pure_d || directive ) );
            },
            autoRender:function(ctxt, directive){
                return jQuery( $p( this ).autoRender( ctxt, this._pure_d || directive ) );
            }
        });
        return function(n, sel){
            return jQuery(n).find(sel);
        };
    },
    mootools:function(){
        Element.implement({
            compile:function(directive, ctxt){
                return $p(this).compile(directive, ctxt);
            },
            render:function(ctxt, directive){
                return $p([this]).render(ctxt, directive);
            },
            autoRender:function(ctxt, directive){
                return $p([this]).autoRender(ctxt, directive);
            }
        });
        return function(n, sel){
            return $(n).getElements(sel);
        };
    },
    prototype:function(){
        Element.addMethods({
            compile:function(element, directive, ctxt){
                return $p([element]).compile(directive, ctxt);
            },
            render:function(element, ctxt, directive){
                return $p([element]).render(ctxt, directive);
            },
            autoRender:function(element, ctxt, directive){
                return $p([element]).autoRender(ctxt, directive);
            }
        });
        return function(n, sel){
            n = n === document ? n.body : n;
            return typeof n === 'string' ? $$(n) : $(n).select(sel);
        };
    },
    sizzle:function(){
        return function(n, sel){
            return Sizzle(sel, n);
        };
    },
    sly:function(){
        return function(n, sel){
            return Sly(sel, n);
        };
    },
    yui:function(){ //Thanks to https://github.com/soljin
        if(typeof document.querySelector === 'undefined'){
            YUI().use("node",function(Y){
                $p.plugins.find = function(n, sel){
                    return Y.NodeList.getDOMNodes(Y.one(n).all(sel));
                };
            });
        }
        YUI.add("pure-yui",function(Y){
            Y.Node.prototype.directives = function(directive){
                this._pure_d = directive; return this;
            };
            Y.Node.prototype.compile = function(directive, ctxt){
                return $p([this._node]).compile(this._pure_d || directive, ctxt);
            };
            Y.Node.prototype.render = function(ctxt, directive){
                return Y.one($p([this._node]).render(ctxt, this._pure_d || directive));
            };
            Y.Node.prototype.autoRender = function(ctxt, directive){
                return Y.one($p([this._node]).autoRender(ctxt, this._pure_d || directive));
            };
        },"0.1",{requires:["node"]});

        return true;
    }
};

// get lib specifics if available
(function(){
    var libSel,
        libkey =
            (typeof dojo         !== 'undefined' && 'dojo') ||
            (typeof DOMAssistant !== 'undefined' && 'domassistant') ||
            (typeof Ext          !== 'undefined' && 'ext') ||
            (typeof jQuery       !== 'undefined' && 'jquery') ||
            (typeof MooTools     !== 'undefined' && 'mootools') ||
            (typeof Prototype    !== 'undefined' && 'prototype') ||
            (typeof Sizzle       !== 'undefined' && 'sizzle') ||
            (typeof Sly          !== 'undefined' && 'sly') ||
            (typeof YUI          !== 'undefined' && 'yui');

    //add library methods
    if(libkey){
        libSel = $p.libs[libkey]();
    }

    //if no native selector available
    if( typeof document.querySelector === 'undefined' ){
        //take it from the JS lib
        if( typeof libSel === 'function' ){
            $p.plugins.find = libSel;
            //if nothing throw an error
        }else if( !libSel ){
            throw('you need a JS library with a CSS selector engine');
        }
    }

    //for node.js
    if(typeof exports !== 'undefined'){
        exports.$p = $p;
    }
}());;"use strict";

(function () {

        // issue #1: routes should be object instead of array as per usage below.
        var routes = {};

        function findSubscriber(callReference, array) {
            if (!array)
                return null;

            var i = 0, len = array.length;
            for (; i < len; i++) {
                if (array[i].callee === callReference)
                    return array[i];
            }

            return null;
        }


        BIL.nerve = {

            on: function (channel, route, callback, scope) {
                /// <summary>Listen to a given channel or listen to a channel and route combination</summary>
                /// <param name="channel" type="String">The category of a an event</param>
                /// <param name="route" optional="true" type="String">The sub category of an event</param>
                /// <param name="callback" type="Function">A callback to to handle the event</param>
                /// <param name="scope" type="Function">The scope reference you are calling about</param>

                var c = channel, r = null, cb = null, caller = null;
                if (arguments.length == 1) {
                    throw Error('A channel and a callback must be specified');
                } else if (arguments.length == 2) {
                    if (Object.prototype.toString.call(arguments[1]) == "[object Function]") {
                        cb = arguments[1];
                    }
                } else if (arguments.length == 3 && Object.prototype.toString.call(arguments[2]) == "[object Function]") {
                    // issue #1: arguments[1] was being checked as the funciton, but [1] should be the route.
                    // issue #1: r was not being set and shoudl be the arguments[1] or route parameter.
                    if (Object.prototype.toString.call(arguments[2]) == "[object Function]") {
                        r = arguments[1];
                        cb = arguments[2];
                        caller = arguments[3];
                    } else {
                        throw Error('Last parameter must be a callback function');
                    }
                } else if (arguments.length == 4) {
                    r = route;
                    cb = callback;

                    caller = scope;
                }

                if (!cb) {
                    return;
                }

                if (!routes[channel]) {
                    //--- check on route
                    routes[channel] = [];
                }

                if (!r) {
                    r = 'root';
                }

                if (r && !routes[channel][r]) {
                    routes[channel][r] = [];
                }


                //--- check to make sure we aren't adding ourselves twice
                if (findSubscriber(caller, routes[channel][r]))
                    return;

                routes[channel][r].push({
                    callee: caller,
                    callback: cb
                });

            },

            off: function (channel, route, scope) {
                if (routes[channel]) {
                    var r = 'root', caller = scope;

                    if (route) r = route;

                    if (!routes[channel][r]) return;

                    var i = 0, len = routes[channel][r].length;
                    for (; i < len; i++) {
                        if (routes[channel][r][i].callee === caller)
                            delete routes[channel][r][i];
                    }
                }
            },

            send: function (channel, route, context) {
                /// <summary></summary>
                /// <param name="channel" type="Object"></param>
                /// <param name="route" type="Object"></param>
                /// <param name="context" type="Object"></param>
                var r = 'root', ctx = null;

                if (arguments.length == 2) {
                    ctx = arguments[1];
                } else if (arguments.length == 3) {
                    r = route;
                    ctx = context;
                }

                if (!routes[channel] || !routes[channel][r]) {
                    return;
                }

                var listeners = routes[channel][r], i = 0, len = listeners.length;

                for (; i < len; i++) {

                    (function (ch, rt, idx) {
                        var ref = setTimeout(function () {
                            try {
                                routes[ch][rt][idx].callback(ctx);
                                clearTimeout(ref);
                            } catch (e) {}
                        },0);
                    })(channel, r, i);
                }
            }
        };
    }
)();
