/**
 * @overview Provides functions and objects definition used among JavaScript files
 * <br>This is to store common function which will be share among different js files 
 * @requires jQuery
 */

/**
 * Retrieves the cookie value by name
 * <br>The code from <a href="http://www.w3schools.com/JS/js_cookies.asp">W3 school</a>
 * @param {string} cname cookie name
 * @return {string} Cookie value
 */
function getCookie(cname)
{
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(var i=0; i<ca.length; i++)
	{
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1);
			if (c.indexOf(name) != -1) return c.substring(name.length,c.length);
	}
	return "";
}

/**
 * Calls the web server to expire session and kick back to login page
 * @return {void}
 */
function logout()
{
	var sess = getCookie('sess');
	var user = getCookie('user');
	$.ajax({
		type: 'POST',
		url: 'logout.php',
	}).always(function(){
		window.location = url_without_doc() + 'login.html';
	});
}

/**
 * Plots the storage chart for an osd node and returns the chart
 * @param {string} ele_id id of an html tag which displays the chart
 * @param {number} used_space Used space of the osd node
 * @param {number} free_space Free space of the osd node
 * @return {object} Object reference of the chart
 */
function plot_storage(ele_id, used_space, free_space)
{
	return  Morris.Donut({
		element: ele_id,
		data: [
			{label: "Used", value: used_space},
			{label: "Free", value: free_space}
		],
		formatter: function(y, data){
			return y + " GB";
		}
	});
}

/**
 * Changes the div.alert color and displays message inside
 * @param {string} dom_id ID of the div which contains the alert class
 * @param {string} new_class Class of the alert message
 * @param {string} msg Message to be displayed in the alert block
 * @return {void}
 */ 
function display_alert_msg(dom_id, new_class, msg)
{
	var $div_alert = $("#" + dom_id);
	// remove all color then add the true color
	$div_alert.removeClass("alert-info alert-success alert-warning alert-danger").addClass(new_class);
	$div_alert.html(msg);
	$div_alert.fadeIn();
}
/**
 * Parses the url to extract the domain name and port number 
 * <br>e.g. http://localhost:8080/index.php, the return string will be http://localhost:8080/
 * @return {string} The url with domain only
 */
function url_without_doc()
{
	// get the url path name without the document name
	var last_index = window.location.href.lastIndexOf('/');
	// +1 to include the last '/' as the 2nd argu is len of string
	return  window.location.href.substring(0, last_index + 1);
}

/**
 * Sort function using file name as the sort key
 * @param {Object[]} tr_arr HTML DOM object, array of tr tags to be sorted
 * @param {number} order The sort order, > 0 represents ascending order, else descending order
 * @return {void}
 */
function sort_by_name(tr_arr, order)
{
	tr_arr.sort(function(a, b){
		var a_name = $(a).children('.file-name-hidden').attr('value');
		var b_name = $(b).children('.file-name-hidden').attr('value');

		var ret = cmp_name(a_name, b_name)
		if(order > 0)
			return ret;
		else
			return ret * -1;
	});
}

/**
 * Compare function base on name
 * @param {string} a name
 * @param {string} b name
 * @return {number} the compared result
 */
function cmp_name(a, b)
{
	return a.localeCompare(b);
}

/**
 * Sort function using file size as the sort key
 * @param {Object[]} tr_arr HTML DOM object, array of tr tags to be sorted
 * @param {number} order The sort order, > 0 represents ascending order, else descending order
 * @return {void}
 */
function sort_by_size(tr_arr, order)
{
	tr_arr.sort(function(a, b){
		var a_size = $(a).children('.f_size').attr('value');
		var b_size = $(b).children('.f_size').attr('value');

		var ret = cmp_size(a_size, b_size);
		if(order > 0)
			return ret;
		else
			return ret * -1;
	});
}

/**
 * Compare function base on file size
 * @param {string} a file size
 * @param {string} b file size
 * @return {number} the compared result
 */
function cmp_size(a, b)
{
	return a - b;
}

/**
 * Sort function using file last modified time as the sort key
 * @param {Object[]} tr_arr HTML DOM object, array of tr tag to be sorted
 * @param {number} order The sort order. > 0 represents ascending order, else descending order
 */
function sort_by_lm(tr_arr, order)
{
	tr_arr.sort(function(a, b){
		var a_time = $(a).children('.f_lm_time').attr('value');
		var b_time = $(b).children('.f_lm_time').attr('value');

		var ret = cmp_size(a_time, b_time);

		if(order > 0)
			return ret;
		else
			return ret * -1;
	});
}

/**
 * Appends the dom object into the table '#file-entry-table tbody' according to sort order defined
 * @param {object} dom_object DOM object of the file/directory to be appended into the table
 * @return {void}
 */
function add_to_table(dom_obj)
{
	// the tr node contain file and directory information
	var children = document.querySelector('#file-entry-table tbody').childNodes;
	var start, class_name, sort_func;
	var order = window.sessionStorage.getItem('sort-order');
	var domv_val;

	// to determine inspect the 1st or 2nd node first
	// since all the none HOME directory will have the 1st node be prev directory
	// so we will have to skip the fisrt node
	if(g_curr_rpath == '/')
		start = 0;
	else
		start = 1;

	// to determine which key field we will use in comparison
	switch(window.sessionStorage.getItem('sort-field'))
	{
		case 'name':
			class_name = "file-name-hidden";
			sort_func = cmp_name;
			break;
		case 'size':
			class_name = "f_size";
			sort_func = cmp_size;
			break;
		case 'lm':
			class_name = "f_lm_time";
			sort_func = cmp_size;
			break;
	}

	dom_val = $(dom_obj).children('.' + class_name).attr('value');

	// perform linear search to find possoble hole
	// improvement: use binary search
	for(var len = children.length; start < len; start++)
	{
		var $target = $(children[start]).children('.' + class_name);
		var ret = sort_func(dom_val, $target.attr('value'));

		// reverse the result if the order is reversed
		if(order < 0)
			ret *= -1;

		// attach the dom object before this target becasue it is the 1st found
		if(ret < 0)
		{
			$(children[start]).before(dom_obj);
			return ;
		}
	}
	// the case which is at the end of table
	document.querySelector('#file-entry-table tbody').appendChild(dom_obj);
}

/**
 * Convert the space in file name from ' ' to &nbps;, which is web format
 * @param {string} filename File name to be converted
 * @return {string} File name which ' ' is converted to &nbsp;
 */
function web_filename(filename)
{
	return filename.replace(/ /g, '&nbsp;');
}

/**
 * Convert the number of bytes in MB
 * @param {number} num_byte Number in byte
 * @return {number} The argument in MB
 */
function conv_size(num_byte)
{
	return (num_byte / 1024 / 1024).toFixed(2);
}

/**
 * Enable the button base on the selector
 * @param {string} selector jQuery selector of the button
 * @return {void}
 */
function enable_btn(selector)
{
	$(selector).removeAttr('disabled');
}

/**
 * disable the button based on the selector
 * @param {string} selector jQuery selector of the button
 * @return {void}
 */
function disable_btn(selector)
{
	$(selector).attr('disabled', "disabled");
}

//-------- Object defination --------
/**
 * Object of any CodFS node
 * @class
 * @constructor
 * @property {object} node_info JSON of the node information (id, ip, port)
 */
function CodfsNode(node_info)
{
	this.id = node_info.id;
	this.ip = node_info.ip;
	this.port = node_info.port;
	/*
	 * 0: no problem
	 * 1: disconnected
	 * 2: log not found
	 */
	this.status = 0;	// default is connected and healthy
}

/**
 * Object of a osd node
 * @class
 * @extends CodFSNode
 */
function Osd(osd_obj)
{
	// call for parent constructor
	CodfsNode.call(this, osd_obj);
	this.total_space = osd_obj.cap;
	this.free_space = osd_obj.free;
	this.used_space = this.total_space - this.free_space;
	
	// health check of the osd node found
	if(osd_obj.free == -1)
		this.status = 1;
	if(osd_obj.cap == -1)
		this.status = 2;

	/**
	 * Update the storage of the osd ndoe
	 * @param {number} total_space total capacity of the osd
	 * @param {number} free_space free space of the osd
	 * @return {void}
	 */
	this.update_storage =  function(total_space, free_space){
		this.total_space = total_space
		this.free_space = free_space;
		this.used_space = total_space - free_space;

		// health update of the osd node
		if(osd_obj.free == -1)
			this.status = 1;
		if(osd_obj.cap == -1)
			this.status = 2;
	};


}

/**
 * Object of a mds node
 * @class
 * @extends CodFSNode
 */
function Mds(mds_obj)
{
	// call for parent constructor
	CodfsNode.call(this, mds_obj);
}

/**
 * Object of a monitor node
 * @class
 * @extends CodFSNode
 */
function Monitor(monitor_obj)
{
	// call for parent constructor
	CodfsNode.call(this, monitor_obj);
}

Osd.prototype = Object.create(CodfsNode.prototype);
Osd.prototype.constructor = Osd;
Mds.prototype = Object.create(CodfsNode.prototype);
Mds.prototype.constructor = Mds;
Monitor.prototype = Object.create(CodfsNode.prototype);
Monitor.prototype.constructor = Monitor;

