/**
 * @overview Provides functions to display content in dashboard.php
 */
var time_interval = 30000;	// how long to update the dashboard once in milliseconds
var osd_list = new Node_list();
var osd_total_space, osd_total_free;
var overall_storage_chart = null; 	// chart for total storage
var body_tag = document.querySelector("body");
var interval_var = null;

/**
 * Registers event and sets polling web server at fixed interval, called when the DOM finishes loading
 * @return {void}
 */
function main()
{
	document.querySelector('#logout-button').addEventListener('click', logout);

	// 1st time ajax to query web server about CodFS status
	body_tag.style.cursor = "wait";
	$.ajax({
		url: 'node_info.php',
		dataType: 'json',
		type: 'POST'
	}).done(function(reply, textStatus, jqXHR){
		// error handleing after querying the nodes
		handle_err(reply['ret'])
		if(reply['ret'] != 0)
		{
			// display the content, if not only loading is seen and no warning is shown
			$("#loading").css("display", "none");
			$("#main-content").fadeIn();
			// hide the overall storage chart since there is nothing to display
			document.getElementById('overall-storage-panel').style.display = 'none';
			remove_polling(interval_var);
			return ;
		}

		//------- Object setup -----------
		/*
		 * current only support 1 MDS and 1 Monitor
		 * so the following code has not special use
		 */
		var monitor = new Monitor(reply['monitor']);
		var mds = new Mds(reply['mds']);

		for(var i in reply['osd'])
		{
			var temp = reply['osd'][i];
			var osd_node = new Osd_chart(temp);
			osd_list.add(osd_node);
		}
		//------- End of Object setup --------

		change_monitor_record(reply['monitor']);
		change_mds_record(reply['mds']);
		change_osd_record();

		// hided the loading font and display the content
		$("#loading").css("display", "none");
		$("#main-content").fadeIn();

		// display the donut chart, can only plot after the #main-content is displayed
		plot_overall_storage(osd_list);
		plot_osd();
	}).fail(function(jqXHR, textStatus, errorThrown){
		display_alert_msg('alert-msg', 'alert-danger', 'Failed to connect to server');
		// hide the overall storage chart since there is nothing to display
		document.getElementById('overall-storage-panel').style.display = 'none';
		remove_polling(interval_var);
	}).always(function(){
		// reset the cursor
		body_tag.style.cursor = "default";
	});

	interval_var = setInterval(update_nodes_info, time_interval);
}

/**
 * Query CodFS status and handle updates
 * @return {void}
 */
function update_nodes_info()
{
	$.ajax({
		url: 'node_info.php',
		dataType: 'json',
		type: 'POST'
	}).done(function(reply, textStatus, jqXHR){
		handle_err(reply['ret']);
		// stop polling when error occured
		if(reply['ret'] != 0)
		{
			remove_polling(interval_var);
			return ;
		}

		$("#alert-msg").css("display", "none");
		var monitor = reply['monitor'];
		var mds = reply['mds'];
		var osd = reply['osd'];

		//------ update osd -----------
		for(var i in reply['osd'])
		{
			var temp = reply['osd'][i];
			var osd_ele = osd_list.find(temp['id']);

			if(osd_ele != null)	// osd node in the list
			{
				osd_ele.update_storage(temp['cap'], temp['free']);
			}
			else	// not in record
			{
				var temp_node = new Osd_chart(temp);
				osd_list.add(temp_node);
			}
		}
		//------ End of update osd ---------

		// update on the osd table record
		change_osd_record();

		// update the Donut Chart data for the over-all storage part
		plot_overall_storage(osd_list);
		// to update echo OSD donut chart
		plot_osd();

	}).fail(function(jqXHR, textStatus, errorThrown){
		// hide the overall storage chart since there is nothing to display
		document.getElementById('overall-storage-panel').style.display = 'none';
		remove_polling(interval_var);
	});
}

/**
 * Adds the monitor record received from server into the table
 * @param {Object} monitor JSON of the monitor node
 * @return {void}
 */
function change_monitor_record(monitor)
{
	var $tbody = $("#monitor-table tbody");
	var record;

	// clean up previous record
	$tbody.html("");
		record = "<tr><td>" + 1 + "</td><td>" +
				monitor['id'] + "</td><td>" +
				monitor['ip'] + "</td><td>" +
				monitor['port'] + "</td><td>" +
				"</td></tr>";
		$tbody.append(record);
}

/**
 * Adds the mds record received from server into the table
 * @param {Object} mds JSON of the mds node
 * @return {void}
 */
function change_mds_record(mds)
{
	var $tbody = $("#mds-table tbody");
	var record;

	// clean up previous record
	$tbody.html("");
	record = "<tr><td>" + 1 + "</td><td>" +
				mds['id'] + "</td><td>" +
				mds['ip'] + "</td><td>" +
				mds['port'] + "</td><td>" +
				"</td></tr>";
	$tbody.append(record);
}

/**
 * Changes/adds all the osd nodes into the table and displays warning if any
 * @return {void}
 */
function change_osd_record()
{
	var $tbody = $('#osd-table tbody');
	var record;	// record to be appeneded
	var dc = ""	// disconnected OSD
	var no_log = "";	// record which osd has no log
	var num_dc = 0;	//number of disconnected node
//-------------------- Add the osd record into table ------------------
	// clean up previous record
	$tbody.html("");
	for(var i = 0; i < osd_list.length(); i++)
	{
		// Osd object
		var osd = osd_list.list[i];
		var tr_tag = '<tr>';
		var capacity = osd.total_space;
		var free_space = osd.free_space;
		// cannot find log file
		if(osd.status == 2)
		{
			tr_tag = '<tr class="warning">';
			capacity = '<strong>Error</strong>';
			free_space = '<strong>Error</strong>';
			no_log += "#" + (i+1) + " ";
		}
		else if(osd.status == 1)	// disconnected
		{
			tr_tag = '<tr class="danger">';
			capacity = '<strong>Disconnected</strong>';
			free_space = '<strong>Disconnected</strong>';
			dc += "#" + (i+1) + " ";
			num_dc++;
		}

		record = tr_tag  + '<td>' + (i+1) + "</td><td>" +
				osd.id + "</td><td>" +
				osd.ip + "</td><td>" +
				osd.port + "</td><td>" +
				capacity + "</td><td>" +
				free_space + "</td>" +
				"</tr>";
		$tbody.append(record);
	}	// end of for

//-------------------- End of adding the osd record into table ------------------

//-------------------- Display alert message if any error in osd ------------------
	var msg, alert_class;
	// all the node are disconnected
	if(num_dc == osd.length)
	{
		msg = "All the nodes are <strong>DISCONNECTED</strong>.<br>Please start some nodes."
		alert_class = "alert-danger";
	}
	else if(dc == "" && no_log == "")	// nodes with no problem
			return ;
		 else if(dc == "")	// some nodes has no log file only
			  {
				msg = "The following node: <br>" + "<strong>" + no_log  + "</strong>" +
					  "<br>have no log.<br>"  + "Please restart the process";
				alert_class = "alert-warning";
		 	  }
			  else if(no_log == "")	// some nodes are dc-ed only
			  	   {
					  msg = "The following node: <br>" + "<strong>" + dc  + "</strong>" +
					  		"<br>have no OSD process running.<br>"  + "Please restart the process";
				 	  alert_class = "alert-danger";
			  	   }
				   else	// some are dc and some are no log
				   {
					  msg = "The following node: <br>" + "<strong>" + dc  + "</strong>" +
					  		"<br>have no OSD process running.<br>"  +
							"The following node: <br>" + "<strong>" + no_log  + "</strong>" +
							"<br>have no log.<br>"  + "Please restart the process";
				 	  alert_class = "alert-danger";
				   }

	display_alert_msg("alert-msg", alert_class, msg);
//-------------------- End of display alert message if any error in osd ------------------
}

/**
 * Plots each OSD chart
 * @return {void}
 */
function plot_osd()
{
	var $osd_info = $("#osd-info");
	for(var i = 0, len = osd_list.length(); i < len; i++)
	{
		// to skip the disconnected or no log OSD
		if(osd_list.list[i].status != 0)
			continue ;

		var osd_id = osd_list.list[i]['id'];
		var $osd_graph = $osd_info.find("#osd-" + osd_id);
		// check for array empty by checking the length
		if($osd_graph.length < 1)	// first appear, draw it in the page
		{
			var ele = '<div class="col-lg-4">' +
					  '<div class="panel panel-info">' +
					  '<div class="panel-heading" style="font-size: 22px">' +
					  'OSD ' + osd_id + '</div>' +
					  '<div class="panel-body">' +
					  '<div class="chart-body" id="osd-' + osd_id + '"></div>' +
					  '</div>' + '</div> <!-- end of .panel -->' + '</div>	<!-- End of .col-lg -->';

			$osd_info.append(ele);
			osd_list.list[i].plot("osd-" + osd_id);
		}
		else
			osd_list.list[i].update_chart();
	}
}

/**
 * Handles error when server returns any non-0 error number
  // case 4: cannot find the common.xml
  // case 6: cannot find OSD record in database
  // case 1 to 2: Cannot find the process running
  // case -1 to -2: cannot find the log file of the process
 * @param {number} errno Error number returned from server
 * @return {void}
 */
function handle_err(errno)
{
	var alert_type;
	var msg, missing;

	// finding which component is missing
	switch(errno)
	{
		case 0:	// no problem
			return ;

		// missing in xml file
		case 4:
			missing = "common config xml file";
			break;
		// missing Monitor
		case -1:
		case 1:
			missing = "Monitor";
			break;
		// mssing MDS
		case 2:
		case 5:
			missing = "MDS";
			break;
		// Missing OSD
		case 6:
			missing = "OSD";
			break;
	}	// end of switch

	// cannot find log file
	if(errno < 0)
	{
		alert_type = 'alert-warning';
		msg = "Cannot find the log file of <strong>" + missing + "</strong>.<br>Please re-run the process.";
	}
	else if(errno > 0 && errno < 4)	// cannot find the process
		 {
			alert_type = 'alert-danger';
			msg = "Cannot find the process <strong>" + missing + "</strong>.<br>Please START the process.";
		 }
		 else	// cannot find record in db or in xml
		 {
			alert_type = 'alert-danger';
			msg = "Cannot find the record <strong>" + missing + "</strong>.<br>Please START it in manage cluster page.";
		 }

	display_alert_msg('alert-msg', alert_type, msg);
}


window.onload = main;

//------ Object defination ------
/**
 * Contains Osd node information as well as chart of the osd storage
 * @class
 * @constructor
 * @extends Osd
 */
function Osd_chart(osd_info)
{
	Osd.call(this, osd_info);
	var chart = null;	// hold the donut char object
	var dom_id;	// id where insert the donut chart, set by plot()

	// call to plot the graph
	/**
	 * Plots the storage graph of the osd
	 * @param {string} loc ID of the div which displays the graph
	 * @return {void}
	 */
	this.plot = function(loc){
		// the osd is disconnected or cannot find log
		if(this.cap == -1 || this.free == -1)
			return null;

		dom_id = loc;
		chart = plot_storage(dom_id, this.used_space, this.free_space);
	};

	/**
	 * Updates the storage graph of the osd
	 * @return {void}
	 */
	this.update_chart = function(){
		// the osd is disconnected or cannot find log
		if(this.cap == -1 || this.free == -1)
			return ;

		chart.setData([
			{label: "Used", value: this.used_space},
			{label: "Free", value: this.free_space}
		]);
	};
}

Osd_chart.prototype = Object.create(Osd.prototype);
Osd_chart.prototype.constructor = Osd_chart;

/**
 * A list where it stores the object of Osd_chart
 * @class
 * @constructor
 */
function Node_list()
{
	// array to store the component id of the node, the id_arr index
	// is the same as this.list, hence use it to find the index in this.list
	var id_arr = [];
	this.list = [];

	// adding an element
	this.add = function(node_info){
		id_arr.push(node_info.id);
		this.list.push(node_info);
	};

	/**
	 * Finds the osd object with component id given
	 * @param {number} id component id of the osd
	 * @return {object} the element in the array specified by id
	 */
	this.find = function(id){
		var index = id_arr.indexOf(id);
		if(index > -1)
			return this.list[index];
		else
			return null;
	}

	/**
	 * Finds the length of the list
	 * @return {number} The length of the list
	 */
	this.length = function(){
		return id_arr.length;
	}
}
//----------- end of object definition --------------

/**
 * Plots/ updates the chart about overall storage
 * @param {Object} osd_list Node_list object which contains Osd_chart object
 * @return {void}
 */
function plot_overall_storage(osd_list)
{
	var used_space = free_space = 0;

	// sum up the used_space and free_space for the overall storage
	for(var i = 0, len = osd_list.length(); i < len; i++)
	{
		// the non 0 cases are disconnected osd or no log file found
		if(osd_list.list[i].status == 0)
		{
			used_space += osd_list.list[i].used_space;
			free_space += osd_list.list[i].free_space;
		}
	}	// end of for

	// the chart is first create
	if(overall_storage_chart == null)
		overall_storage_chart = plot_storage('overall-storage', used_space, free_space);
	else	// update the chart
	{
		// to prevent there is no osd available
		if(used_space == 0 && free_space == 0)
			overall_storage_chart = null;
		else
			overall_storage_chart.setData([
				{label: "Used", value: used_space},
				{label: "Free", value: free_space}
			]);
	}
}

/**
 * Removes the setInterval() set
 * @param {Object} interval_id Value returned from setInterval()
 * @return {void}
 */
function remove_polling(interval_id)
{
	if(interval_id !== undefined && interval_id !== null)
		clearInterval(interval_id);
}

