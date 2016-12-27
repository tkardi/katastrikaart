/* WMS GetFeatureInfo requests. */

L.FeatureInfo = L.Class.extend({
	options:{
		service:"wms",
		version:"1.1.1",
		request:"GetFeatureInfo",
		fieldmap: {
			"maakond":"Maakond",
			"omavalits":"Omavalitsus",
			"asustusyks":"Asustusüksus",
			"asukoht":"Lähiaadress",
			"tunnus":"Tunnus",
			"registr_kp":"Registreerimise aeg",
			"muudatus":"Muudatuse registreerimise aeg",
			"so1":"Sihtotstarve 1", 
			"so2":"Sihtotstarve 2",
			"so3":"Sihtotstarve 3",
			"pindala":"Pindala",
			"haritavmaa":"Haritav maa",
			"rohumaa": "Looduslik rohumaa",
			"metsamaa": "Metsamaa",
			"ouemaa": "Õuemaa",
			"ehit_maa": "Ehitistealune maa",
			"muumaa": "Muu maa",
			"veealunema": "s.h veealune maa",
			"reg_osa": "Registriosa",
			"kinnistusj": "Kinnistuspiirkond / jaoskond",
			"moodist_kp": "Mõõdistamise aeg",
			"mootja_nim": "Mõõdistaja",
			"kuju_liik": "Mõõdistamisviis"
				}
	},
	initialize: function (url, options) { // (String, Object)
		this._url = url;
		for (var option in options) {
			this.options[option] = options[option];
		}
	},
	
	_parseParams: function(params) { // (Object)
		/** Parses input object to HTTP GET querystring.
		* Adapted from http://stackoverflow.com/a/6566471
		*/
		var str = "";
		for (var key in params) {
			if (str != "") {
				str += "&";
			}
			str += key + "=" + params[key];
		}
		return str;
	},
	getFeatureInfo: function (params, skiplist, formatFunc) { //(Object, Array)
		/** Makes a XMLHttpRequest to this._url in order to retrive 
		* featureInfo XML for query specified in params object. skiplist
		* is an Array of column headers that WILL NOT not be returned.
		*/
		var xmlDoc;
		for (var _param in this.options) {
			params[_param] = this.options[_param];
		}
		var parent = this;
		$.ajax({
			type: 'GET',
			url: this._url,
			data: params,
			dataType: "xml",
		})
			.done(function(data){
				var xml = data.results[0];
				var x2js = new X2JS();
				parent.content = parent.featureInfoJsonToTables(x2js.xml_str2json( xml )['html']['body']['msgmloutput'], []);
				formatFunc(parent);
			});
		return this;
	},
	
	featureInfoJsonToTables: function(o, skiplist) {
		/** Converts identify json to a HTML table to be 
		* shown on the map.
		*/
		var obj = {},
			fir = o;
		if (o != {}) {
			for (var i in o) {
				if (i.charAt(0) != '_') {
					var fi = o[i],
						layername = fi.name,
						feature = fi.topoyksus_6569_feature,
						rows = '',
						bbox;
					for (var _attribute in feature) {
						var _fieldName = _attribute,
							_fieldValue = feature[_attribute],
							_attrName = this.options.fieldmap[_fieldName],
							row = '';
						if (typeof _fieldValue === 'string' && _attrName !== undefined) {
							if (skiplist.indexOf(_fieldName.toLowerCase()) == -1) {
								row += L.Util.template(
									'<tr><th>{header}</th><td>{value}</td></tr>',  {
										'header':_attrName,
										'value':_fieldValue
									}
								);
							}
						}
						rows += row;
					}
					this.bbox = feature.boundedby;
					console.log(this.bbox);
					obj[layername] = L.Util.template(
						'<table>{rows}</table>', {
							'rows':rows}
					);
				}
			}
		} else {
			obj['Viga'] = '<label>Ei leidnud ühtegi nähtust</label>'
		}
		return obj;
	},
	
	featureInfoXmlToJson: function (xml) {
		/** Converts featureInfo XML in to json.
		* Adapted from http://davidwalsh.name/convert-xml-json
		*/
		// Create the return object
		var obj = {};
		if (xml.nodeType == 1) { // element
			// do attributes
			if (xml.attributes.length > 0) {
			obj["@attributes"] = {};
				for (var j = 0; j < xml.attributes.length; j++) {
					var attribute = xml.attributes.item(j);
					obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
				}
			}
		} else if (xml.nodeType == 3) { // text
			obj = xml.nodeValue;
		}
		// do children
		if (xml.hasChildNodes()) {
			for(var i = 0; i < xml.childNodes.length; i++) {
				var item = xml.childNodes.item(i);
				var nodeName = item.nodeName;
				if (typeof(obj[nodeName]) == "undefined") {
					obj[nodeName] = this.featureInfoXmlToJson(item);
				} else {
					if (typeof(obj[nodeName].push) == "undefined") {
						var old = obj[nodeName];
						obj[nodeName] = [];
						obj[nodeName].push(old);
					}
					obj[nodeName].push(this.featureInfoXmlToJson(item));
				}
			}
		}
		return obj;
	}	
});

L.featureInfo = function (options) {
	return new L.FeatureInfo(options);
}