/**
 * @overview JavaScript file for the manage_cluster.js
 * <br>Send request to add or remove osd
 */

var update_time = 30000;	// how long to query all nodes once (in mill second)
var osd_obj_list = [];	// array to store the objects of different node, the index is same as *_id_arr if the node have the same id
var interval_id;	// id of setInterval, use it with clearInterval
var body_tag = document.querySelector('body');

/**
 * Query the CodFS system status first, then adds event listener to the button and
 * sets interval polling on CodFS. Loads when the page manage_cluster.php has finished loading
 * @return {void}
 */
function main()
{
	body_tag.style.cursor = 'wait';
	// query the CodFS node information first
	$.ajax({
		url: 'node_info.php',
		dataType: 'json',
		type: 'POST'
	}).done(function(reply, textStatus, jqXHR){
		var node_info = {monitor: reply['monitor'], mds: reply['mds'], osd: reply['osd']}

		// check for any error response from server
		handle_node_error(reply['ret'], node_info);
		// when there is error, stop update
		if(reply['ret'] != 0)
		{
			display_main_content();
			clearInterval(interval_id);
			return ;
		}

		// adding the monitor and mds information to the tabe
		add_table_record("monitor-table", reply['monitor']);
		add_table_record("mds-table", reply['mds']);

		change_osd_record(reply['osd']);
		display_main_content();
		init_event();

		// set it as auto update
		interval_id = setInterval(query_nodes, update_time);
	}).fail(function(jqXHR, textStatus, errorThrown){
		display_alert_msg("alert-msg", "alert-danger", "Cannot connect to server");
	}).always(function(){
		body_tag.style.cursor = 'default';
	});

}	// end of main()


/**
 * Query the CodFS and displays the result
 * @return {void}
 */
function query_nodes()
{
	$.ajax({
		url: 'node_info.php',
		dataType: 'json',
		type: 'POST'
	}).done(function(reply, textStatus, jqXHR){
		var node_info = {monitor: reply['monitor'], mds: reply['mds'], osd: reply['osd']}

		console.log("Update info");
		// error handle if there is a problem
		if(reply['ret'] != 0)
		{
			handle_node_error(reply['ret'], node_info);
			clearInterval(interval_id);
			return ;
		}

		// update the CodFS
		change_osd_record(reply['osd']);
	}).fail(function(jqXHR, textStatus, errorThrown){
		display_alert_msg("alert-msg", "alert-danger", "Cannot connect to server");
		clearInterval(interval_id);
	});
}	// end of query_node()

/**
 * Displays the main content which is hidden by loading icon
 * @return {void}
 */
function display_main_content()
{
	// hide the loading font and display the main content
	document.querySelector('#loading').style.display = 'none';
	$('#main-content').fadeIn();
}	// end of display_main_content()

/**
 * Attaches the all the event listeners at start, including button, checkbox and remove logo event listeners
 * @return {void}
 */
function init_event()
{
	$('#logout-button').on('click', logout);

	// user presses enter / press submit button to add node
	$('#osd-form').on('submit', function(e) {
		e.preventDefault();
		// remove the starting and ending spaces for processing using trim()
		var ip = document.querySelector('#add-osd-ip').value.trim();
		if(ip == "")
		{
			window.alert("You did not input anything. Please input a valid ip");
			return ;
		}

		if(is_valid_ip(ip))
			add_node(ip, document.querySelector('#add-osd-id').value);
		else
		{
			window.alert('"' + ip + '"' + ' is not a valid ip, re-enter again');
			return ;
		}
	});

	// add event listener on checkbox to select all or unselect all
	document.querySelector('#rm-all').addEventListener('change', function(e){
		// to enable the rm-logo for the selected checkbox
		if(e.currentTarget.checked === true)
			$('#rm-chk-logo').fadeIn();
		else // disable the rm-logo for the selected checkbox, since there is none
			$('#rm-chk-logo').fadeOut();

		// to do select all or unselecte all, base on the select all checkbox is checked or not
		$('.osd-table-checkbox').prop('checked', e.currentTarget.checked);
	});

	// add event listener to remove selected OSD by the checkbox
	document.getElementById('rm-chk-logo').addEventListener('click', function(e){
		// get the dom element which has checked checkbox
		var $selected_osd = $('.osd-table-checkbox:checked');
		// create array for storing ip and id of the osd to be removed
		var id_arr = [], ip_arr = [];

		// prepre array to send to web server
		for(var i = 0, len =  $selected_osd.length; i < len; i++)
		{
			id_arr.push($($selected_osd[i]).parents("tr").find('.comp-id').html());
			ip_arr.push($($selected_osd[i]).parents("tr").find('.osd-ip').html());
			console.log('remove osd ip: ' + ip_arr[i] + ' id: ' + id_arr[i]);
		}

		// call to remove the osd by ajax
		remove_node(ip_arr, id_arr);
	})
}	// end of init_event()

/**
 * Adds event listener(s) for removing the OSD to a specific remove button or all remove buttons,
 * depending on the existence of variable declaration of the button objecta
 * @param {number|string} [node_id] Component id of OSD
 * @return {void}
 */
function add_rm_logo_event(node_id)
{
	var target = "";

	if(typeof node_id !== 'undefined')
		target = "#osd-" + node_id;

	target += ' .rm-logo';
	$(target).on('click', function(e){
		var id = $(e.currentTarget).parents("tr").find('.comp-id').html();
		var ip = $(e.currentTarget).parents("tr").find('.osd-ip').html();
		// to construct array as remove_node accept array
		var id_arr = [id];
		var ip_arr = [ip];

		console.log('remove node from rm-logo ip: ' + ip_arr[0] + ' | id: ' + id_arr[0]);
		remove_node(ip_arr, id_arr);
	});
}	// end of add_rm_logo_event()

/**
 * Adds the record to the table (either Monitor or MDS)
 * @param {string} table_id Specifies the table to be updated, either monitor or mds
 * @param {Object} node_info JSON that specifies the information of the node
 * @return {void}
 */
function add_table_record(table_id, node_info)
{
	var $tbody  = $("#" + table_id + " tbody");
	var str = '<tr>' +
				'<td class="comp-id">' + node_info.id + '</td>' +
				'<td class="node-ip">' + node_info.ip + '</td>' +
				'<td class="node-port">' + node_info.port + '</td></tr>';
	// clean up previous table body
	$tbody.html("");
	$tbody.append(str);
}	// end of add_table_record()

/**
 * Adds one osd record into the table OR updates the existing record
 * @param {Object} osd_info JSON containing the OSD node information
 * @return {void}
 */
function add_osd_table_record(osd_info)
{
	var cap = osd_info.cap;
	var free_space = osd_info.free;

	// check if the osd id is already in the table
	var target_dom = $('#osd-' + osd_info.id);

	// record not found
	if(target_dom.length == 0)
	{
		var $tbody = $("#osd-table tbody");
		var tr_tag = '<tr style="display:none;" id="osd-' + osd_info.id + '" ';
		// no log found
		if(osd_info.cap == -1)
		{
			tr_tag += 'class="warning">';
			cap = '<strong>Error</strong>';
			free_space = '<strong>Error</strong>';
		}
		else if(osd_info.free == -1)	// disconnected
		{
			tr_tag += ' class="danger">';
			cap = '<strong>Disconnected</strong>';
			free_space = '<strong>Disconnected</strong>';
		}
		else
			tr_tag += ">";

		var str = tr_tag + '<td>' + '<input type="checkbox" class="osd-table-checkbox" title="click to remove">' + '</td>' +
					'<td>' + '<i class="fa fa-times-circle rm-logo"></i>' + '</td>' +
					'<td class="comp-id">' + osd_info.id + '</td>' +
					'<td class="osd-ip">' + osd_info.ip + '</td>' +
					'<td>' + osd_info.port + '</td>' +
					'<td>' + cap + '</td>' +
					'<td>' + free_space + '</td></tr>';
		$tbody.append(str);
		// add back the event of checkbox
		$('#osd-' + osd_info.id + ' .osd-table-checkbox').on('change', add_checkbox_event);
		add_rm_logo_event(osd_info.id);
		// display the result
		$('#osd-' + osd_info.id).fadeIn();
	}
	else // already exist, updat the information
	{
		// since the return jquery object is an array, but we only need the first entry
		target_dom = target_dom[0];
		// new capacity, free space and class name of the osd id
		var capacity, class_name="";
		// log file not found
		if(osd_info.cap == -1)
		{
			class_name = "warning";
			capacity = '<strong>Error</strong>';
			free_space = '<strong>Error</strong>';
		}
		else if(osd_info.free == -1)	// disconnected
			 {
				class_name = "danger";
				capacity = '<strong>disconnected</strong>';
				free_space = '<strong>disconnected</strong>';
			 }
			 else
			 {
			 	capacity = cap;
				// the free_space is already defined at the start of the beinging of the function
			 }

		// update the dom info
		target_dom.className = class_name;
		// capacity field
		target_dom.childNodes[5].innerHTML = capacity;
		// free space field
		target_dom.childNodes[6].innerHTML = free_space;
	}
}	// end of add_osd_table_record()

/**
 * Checks if the input IP is in valid IP address format
 * @param {string} ip IP address to be checked
 * @return {boolean} return true if the IP is valid
 */
function is_valid_ip(ip)
{
	// 0.0.0.0 and 255.255.255.255 is not valid ip
	var invalid_ip = ['0.0.0.0', '255.255.255.255'];
	for(var i = 0, len = invalid_ip.length; i < len; i++)
		if(invalid_ip[i] === ip)
			return false;

	// using regexp to match for ip
	if(ip.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/) == null)
		return false;

	var ip_arr = ip.split(".");

	// ip range test
	for(var i = 0; i < 4; i++)
		if(ip_arr[i] < 0 || ip_arr[i] > 255)
			return false;

	return true;
}	// end of is_valid_ip()

/**
 * Requests Web Server to add an OSD
 * @param {string} ip IP of the node to start OSD
 * @param {number} id id of the node to start OSD
 * @param {function} func Function called after adding the OSD
 * @return {void}
 */
function add_node(ip, id, func)
{
	// stop the auto update
	clearInterval(interval_id);
	body_tag.style.cursor = 'wait';
	$.ajax({
		url: 'manage_node.php',
		type: 'POST',
		dataType: 'json',
		data: {ip: ip, id: id, mode: 1}
	}).done(function(reply, textStatus, jqXHR){
		var node = reply['node_info'];

		// case if there is error on starting the process
		if(reply['ret'] != 0)
		{
			var warning = "<strong>Failed to start the osd process</strong><br>Please try again later";
			display_alert_msg('alert-msg', 'alert-danger', warning);
			return ;
		}

		add_osd_table_record(reply['node_info']);
		// empty the input field
		document.getElementById('add-osd-ip').value = "";
		document.getElementById('add-osd-id').value = "";

		// addational function when node has been added successfully
		if(typeof func !== 'undefined')
			func();

	}).fail(function(jqXHR, textStatus, errorThrown){
		display_alert_msg("alert-msg", "alert-danger", "Cannot connect to server");

	}).always(function(){
		//restart the auto update
		interval_id = setInterval(query_nodes, update_time);
		body_tag.style.cursor = 'default';
	});
}

/**
 * Request web server to remove the OSD node specified by
 * @param {string[]} ip IP of the OSD node
 * @param {number[]} id Component ID of the OSD node
 * @return {void}
 */
function remove_node(ip, id)
{
	// stop server query info since we can going to change the CodFS component
	// there is a chance we receive info during chaning CodFS, which result async info
	clearInterval(interval_id);
	var async, json_str;

	var json_str = {mode: -1, ip: ip, id: id};

	// stop the auto update
	clearInterval(interval_id);

	body_tag.style.cursor = 'wait';
	$.ajax({
		url: 'manage_node.php',
		type: 'POST',
		dataType: 'json',
		data: json_str
	}).done(function(reply, textStatus, jqXHR){
		// remove the record from table
		var node_info = reply['node_info'];

		for(var i = 0, len = node_info.length; i < len; i++)
		{
			remove_osd_record(node_info[i].id)
		}

		// wait for 30s for server to update, then query again
		setTimeout(function(){
			interval_id = setInterval(query_nodes, update_time);
		}, 30000)

	}).fail(function(jqXHR, textStatus, errorThrown){
		display_alert_msg("alert-msg", "alert-danger", "Cannot connect to server");

	}).always(function(){
		//restart the auto update
		interval_id = setInterval(query_nodes, update_time);
		body_tag.style.cursor = 'default';
		// hide the #rm-chk-logo after the ajax no matter what
		$('#rm-chk-logo').fadeOut();
	});
}

/**
 * Removes the OSD record from the table based on the component id
 * @param {numner|string} node_id Component id of the osd to be removed from the table
 * @return {void}
 */
function remove_osd_record(node_id)
{
	var $osd_tr = $('#osd-' + node_id);

	$osd_tr.fadeOut('slow', function(){
		$osd_tr.remove();
	});

}

/**
 * Handles error returned after node query
 * @param {number} errno Error number
 * @param {Object} node_info JSON contains node information
 */
function handle_node_error(errno, node_info)
{
	/*
	 * case 1 - 2: Cannot find the process running
	 * case 4: cannot find common.xml
	 * case 6: there is no OSD found in the system
	 * case -1 - -2: cannot find the log file
	 */
	var problem = false;
	var msg, missing, ip;

	switch(errno)
	{
		// no problem
		case 0:
			return ;
		// cannot find the common.xml file, so cannot process anymore and stop the frequent polling
		case 4:
			msg = "Cannot find common.xml<br>Please restart the CodFS system and then reload this page";
			display_alert_msg('alert-msg', 'alert-warning', msg);
			// stop the query since the system need to restart
			clearInterval(interval_id);
			return ;
		case 1:
		case -1:
			missing = "Monitor";
			break;
		case -2:
		case 2:
			missing = "MDS";
			break;
		case 6:
			missing = "OSD";
			break;
	}	// end of switch

		 // stop the update since there is error, to prevent keep prompting error
		 clearInterval(interval_id);
		 // cannot find common.xml
		 if(errno > 0 && errno < 4)	// cannot find log file
		 {
		 	msg = "Cannot find log file of " + missing + " in machine.\n" + "Please check for the problem.";
			display_alert_msg('alert-msg', 'alert-danger' + msg);
		 }
		 else	// cannot find process
		 {
		 	msg = "Cannot find process: " + missing + " in machine.\n" + "Please input a valid IP.";
			if(window.confirm("Do you want to restart the process " + missing + "?") == true)
			{
				var node_type = missing.toLowerCase();
				ip = ask_ip_input(msg);
				// try to kill the process, then start a new one
				add_node(node_type, node_info[node_type]['ip'], query_nodes);
			}
			else
			{
				window.alert("Please try to resolve by hand");
			}
		 }
}	// end of handle_node_error()

/**
 * Asks user to input an IP until the input IP is valid
 * @param {string} msg Message to be display in the window.alert()
 * @returns {string} Valid IP Address
 */
function ask_ip_input(msg)
{
	var ip;
	// asking input IP from client
	do
	{
		ip = window.prompt(msg)
		// empty input or press cancel
		if(ip == "" || ip == null)
		{
			window.alert("You did not input anything. Please input a valid ip");
			continue;
		}
		if(is_valid_ip(ip) == false)
		{
			window.alert('"' + ip + '"' + ' is not a valid ip, re-enter again');
		}
		else
			return ip;	// valid ip is found
	}while(true)

	return ip;
}

/**
 * Displays the node statuses (connected/ disconnected) and the existence of log file
 * for each node. Also updates the storage information.
 * @param {Object[]} osd_arr Array of OSD information
 * @return {void}
 */
function change_osd_record(osd_arr)
{
	// array of osd which has no log file or disconnected
	var no_log_arr = [], dc_arr = [];
	var msg = "";
	var alert_class;

	// to update the new record on the web page
	for(var i = 0, len = osd_arr.length; i < len;  i++)
	{
		// disconnected
		if(osd_arr[i].free == -1)
			dc_arr.push(osd_arr[i].id);
		else if(osd_arr[i].cap == -1)	// OSD with no log
				no_log_arr.push(osd_arr[i].id);

		// add this OSD into the table
		add_osd_table_record(osd_arr[i]);
	}

	var num_dc = dc_arr.length, num_no_log = no_log_arr.length;

	// all OSDs are disconnected
	if(num_dc == osd_arr.length)
	{
		console.log('All OSD had DC-ed');
		msg = "All OSDs are disconnected\nPlease resolve it by hand";
		alert_class = 'alert-danger';
		clearInterval(interval_id);
	}
	else if(num_dc > 0 && num_no_log == 0)	// only disconnected is found
		 {
		 	alert_class = 'alert-danger';
			msg = "The following node(s) has been <strong>disconnected</strong>:<br>id: ";
			for(var i = 0, len =  num_dc-1; i < len; i++)
				msg += "#" + dc_arr[i] + ", ";

			// the last record
			msg += "#" + dc_arr[num_dc-1];
		 }
		 else if(num_dc == 0 && num_no_log > 0)	// only no log is found
		      {
				msg = "The following node(s) <strong>cannot find the log file</strong>:<br>id: ";
				for(var i = 0, len = num_no_log-1; i < len; i++)
					msg += "#" + no_log_arr[i] + ", ";

				// the last record
				msg += "#" + no_log_arr[num_no_log-1];
			  	alert_class = 'alert-warning';
			  }
			  else if(num_dc > 0 && num_no_log > 0)	// some disconnected and some no log is found
			  	   {
						msg = "The following node(s) has been <strong>disconnected</strong>:<br>id: ";
						for(var i = 0, len = num_dc-1; i < len; i++)
							msg += "#" + dc_arr[i] + ", ";

						// the last record
						msg += "#" + dc_arr[num_dc-1];

						msg += "<br><br>The following node(s) <strong>cannot find the log file</strong>:<br>id: ";
						for(var i = 0, len = num_no_log-1; i < len; i++)
							msg += "#" + no_log_arr[i] + ", ";

						// the last record
						msg += "#" + no_log_arr[num_no_log-1];
				   		alert_class = 'alert-danger';
				   }

	// there is warning appear
	if(msg != "")
	{
		display_alert_msg('alert-msg', alert_class, msg);
	}
}

/**
 * Displays the red remove button when the checkbox of any OSD entry is checked
 * @param {event} e Event
 * @return {void}
 */
function add_checkbox_event(e)
{
	// disable the select all or deselect all checkbox
	document.getElementById('rm-all').checked = false;

	// to show the rm-log for selected osd
	if(e.currentTarget.checked == true)
	{
		// allow the logo which can remove the osd to be selected
		$('#rm-chk-logo').fadeIn();
	}
	else if($('.osd-table-checkbox:checked').length == 0)	// test if there is checkbox checked
		 {
		 	// there is no checkbox checked
			$('#rm-chk-logo').fadeOut();
		 }
}

window.onload = main;
